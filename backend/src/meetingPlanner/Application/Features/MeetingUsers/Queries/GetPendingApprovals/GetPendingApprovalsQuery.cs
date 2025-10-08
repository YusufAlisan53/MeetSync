using Application.Features.MeetingUsers.Constants;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Persistence.Paging;
using MediatR;
using static Application.Features.MeetingUsers.Constants.MeetingUsersOperationClaims;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Application.Features.MeetingUsers.Queries.GetPendingApprovals;

public class GetPendingApprovalsQuery : IRequest<GetListResponse<PendingApprovalListItemDto>>
{
    public required PageRequest PageRequest { get; set; }
    public Guid UserId { get; set; }

    public string[] Roles => [Admin, Read, Create, Update, Delete]; // Normal kullanıcılar da erişebilir

    public class GetPendingApprovalsQueryHandler : IRequestHandler<GetPendingApprovalsQuery, GetListResponse<PendingApprovalListItemDto>>
    {
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GetPendingApprovalsQueryHandler(IMeetingUserRepository meetingUserRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _meetingUserRepository = meetingUserRepository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<GetListResponse<PendingApprovalListItemDto>> Handle(GetPendingApprovalsQuery request, CancellationToken cancellationToken)
        {
            // Kullanıcının token'ından ID'sini al
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("UserId");
            var userRoles = _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role)?.Select(c => c.Value).ToList() ?? new List<string>();
            
            Guid? currentUserId = null;
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                currentUserId = userId;
            }

            // Admin veya Read yetkisi varsa istenen kullanıcının pending approval'larını görebilir
            bool isAdmin = userRoles.Contains("MeetingUsers.Admin") || userRoles.Contains("MeetingUsers.Read");

            Guid targetUserId = request.UserId;
            
            // Normal kullanıcılar sadece kendi pending approval'larını görebilir
            if (!isAdmin && currentUserId.HasValue && currentUserId.Value != targetUserId)
            {
                targetUserId = currentUserId.Value; // Sadece kendi pending approval'larını döndür
            }

            IPaginate<MeetingUser> meetingUsers = await _meetingUserRepository.GetListAsync(
                predicate: mu => mu.UserId == targetUserId && mu.Status == MeetingUserStatus.Pending,
                include: i => i.Include(mu => mu.Meeting!)
                               .ThenInclude(m => m.CreatedByUser!)
                             .Include(mu => mu.Meeting!)
                               .ThenInclude(m => m.Room!),
                index: request.PageRequest.PageIndex,
                size: request.PageRequest.PageSize,
                cancellationToken: cancellationToken
            );

            // Debug için log ekleyelim
            Console.WriteLine($"🔍 PendingApprovals for userId: {targetUserId} (requested: {request.UserId}, current: {currentUserId}, isAdmin: {isAdmin})");
            foreach (var mu in meetingUsers.Items)
            {
                Console.WriteLine($"Meeting: {mu.Meeting?.Subject}, CreatedBy: {mu.Meeting?.CreatedByUser?.NameSurname ?? "NULL"}");
            }

            GetListResponse<PendingApprovalListItemDto> response = _mapper.Map<GetListResponse<PendingApprovalListItemDto>>(meetingUsers);
            return response;
        }
    }
}
