using Application.Features.Meetings.Queries.GetList;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Persistence.Paging;
using MediatR;
using NArchitecture.Core.Application.Pipelines.Authorization;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Application.Features.Meetings.Queries.GetPendingList;

public class GetPendingMeetingQuery : IRequest<GetListResponse<GetListMeetingListItemDto>>, ISecuredRequest
{
    public required PageRequest PageRequest { get; set; }
    
    public string[] Roles => [Admin, Read, Create, Update, Delete,"System.Manager","System.User"]; // Normal kullanıcılar da erişebilir

    public class GetPendingMeetingQueryHandler : IRequestHandler<GetPendingMeetingQuery, GetListResponse<GetListMeetingListItemDto>>
    {
        private readonly IMeetingRepository _meetingRepository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GetPendingMeetingQueryHandler(IMeetingRepository meetingRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _meetingRepository = meetingRepository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<GetListResponse<GetListMeetingListItemDto>> Handle(GetPendingMeetingQuery request, CancellationToken cancellationToken)
        {
            // Kullanıcının token'ından ID'sini al
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("UserId");
            var userRoles = _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role)?.Select(c => c.Value).ToList() ?? new List<string>();
            
            Guid? currentUserId = null;
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                currentUserId = userId;
            }

            // Admin veya Read yetkisi varsa tüm pending meetingleri görebilir
            bool isAdmin = userRoles.Contains("Meetings.Admin") || userRoles.Contains("Meetings.Read");

            IPaginate<Meeting> meetings;
            
            if (isAdmin)
            {
                // Admin kullanıcılar tüm pending meetingleri görebilir (silinmemiş olanlar)
                meetings = await _meetingRepository.GetListAsync(
                    predicate: m => !m.IsApproved && m.DeletedDate == null,
                    index: request.PageRequest.PageIndex,
                    size: request.PageRequest.PageSize,
                    include: m => m.Include(x => x.Room!)
                                  .Include(x => x.Users!)
                                  .ThenInclude(mu => mu.User!)
                                  .Include(x => x.CreatedByUser!),
                    cancellationToken: cancellationToken
                );
            }
            else if (currentUserId.HasValue)
            {
                // Normal kullanıcılar sadece katılımcı oldukları pending meetingleri görebilir (silinmemiş olanlar)
                meetings = await _meetingRepository.GetListAsync(
                    predicate: m => !m.IsApproved && m.DeletedDate == null && m.Users!.Any(mu => mu.UserId == currentUserId.Value),
                    index: request.PageRequest.PageIndex,
                    size: request.PageRequest.PageSize,
                    include: m => m.Include(x => x.Room!)
                                  .Include(x => x.Users!)
                                  .ThenInclude(mu => mu.User!)
                                  .Include(x => x.CreatedByUser!),
                    cancellationToken: cancellationToken
                );
            }
            else
            {
                // Kullanıcı ID'si bulunamadı, boş sonuç döndür
                meetings = await _meetingRepository.GetListAsync(
                    predicate: m => false, // Hiçbir meeting dönmesin
                    index: request.PageRequest.PageIndex,
                    size: request.PageRequest.PageSize,
                    cancellationToken: cancellationToken
                );
            }

            GetListResponse<GetListMeetingListItemDto> response = _mapper.Map<GetListResponse<GetListMeetingListItemDto>>(meetings);

            return response;
        }
    }
}
