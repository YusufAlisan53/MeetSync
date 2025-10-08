using Application.Features.Meetings.Constants;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Persistence.Paging;
using MediatR;
using NArchitecture.Core.Application.Pipelines.Authorization;
using NArchitecture.Core.Security.Extensions;
using Microsoft.AspNetCore.Http;

namespace Application.Features.Meetings.Queries.GetList;

public class GetListMeetingQuery : IRequest<GetListResponse<GetListMeetingListItemDto>>, ISecuredRequest
{
    public required PageRequest PageRequest { get; set; }

    public string[] Roles => new[] {MeetingsOperationClaims.Admin, MeetingsOperationClaims.Read, "System.Manager", "System.User" };

    public class GetListMeetingQueryHandler : IRequestHandler<GetListMeetingQuery, GetListResponse<GetListMeetingListItemDto>>
    {
        private readonly IMeetingRepository _meetingRepository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GetListMeetingQueryHandler(IMeetingRepository meetingRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _meetingRepository = meetingRepository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<GetListResponse<GetListMeetingListItemDto>> Handle(GetListMeetingQuery request, CancellationToken cancellationToken)
        {
            // Kullanıcının rollerini al
            var userRoles = _httpContextAccessor.HttpContext?.User.GetRoleClaims() ?? new List<string>();
            bool isAdmin = userRoles.Contains("Meetings.Admin") || userRoles.Contains("Meetings.Read");

            IPaginate<Meeting> meetings;
            
            if (isAdmin)
            {
                // Admin kullanıcılar tüm onaylanmış meetingleri görebilir (silinmemiş olanlar)
                meetings = await _meetingRepository.GetListAsync(
                    predicate: m => m.IsApproved && m.DeletedDate == null,
                    index: request.PageRequest.PageIndex,
                    size: request.PageRequest.PageSize,
                    include: m => m.Include(x => x.Users).ThenInclude(mu => mu.User!)
                                  .Include(x => x.Room!)
                                  .Include(x => x.CreatedByUser!),
                    cancellationToken: cancellationToken
                );
            }
            else
            {
                // Normal kullanıcılar sadece kendi katılımcısı oldukları meetingleri görebilir (silinmemiş olanlar)
                var userIdClaim = _httpContextAccessor.HttpContext?.User.GetIdClaim();
                if (userIdClaim == null)
                {
                    return new GetListResponse<GetListMeetingListItemDto>
                    {
                        Items = new List<GetListMeetingListItemDto>(),
                        Count = 0,
                        HasNext = false,
                        HasPrevious = false,
                        Index = request.PageRequest.PageIndex,
                        Pages = 0,
                        Size = request.PageRequest.PageSize
                    };
                }

                var userId = Guid.Parse(userIdClaim);
                meetings = await _meetingRepository.GetListAsync(
                    predicate: m => m.IsApproved && m.DeletedDate == null && m.Users.Any(mu => mu.UserId == userId),
                    index: request.PageRequest.PageIndex,
                    size: request.PageRequest.PageSize,
                    include: m => m.Include(x => x.Users).ThenInclude(mu => mu.User!)
                                  .Include(x => x.Room!)
                                  .Include(x => x.CreatedByUser!),
                    cancellationToken: cancellationToken
                );
            }

            GetListResponse<GetListMeetingListItemDto> response = _mapper.Map<GetListResponse<GetListMeetingListItemDto>>(meetings);

            return response;
        }
    }
}