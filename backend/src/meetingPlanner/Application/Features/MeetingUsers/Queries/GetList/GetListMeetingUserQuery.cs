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

namespace Application.Features.MeetingUsers.Queries.GetList;

public class GetListMeetingUserQuery : IRequest<GetListResponse<GetListMeetingUserListItemDto>>
{
    public required PageRequest PageRequest { get; set; }
    public Guid? MeetingId { get; set; } // Specific meeting filter

    public string[] Roles => [Admin, Read, "User"];

    public class GetListMeetingUserQueryHandler : IRequestHandler<GetListMeetingUserQuery, GetListResponse<GetListMeetingUserListItemDto>>
    {
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly IMapper _mapper;

        public GetListMeetingUserQueryHandler(IMeetingUserRepository meetingUserRepository, IMapper mapper)
        {
            _meetingUserRepository = meetingUserRepository;
            _mapper = mapper;
        }

        public async Task<GetListResponse<GetListMeetingUserListItemDto>> Handle(GetListMeetingUserQuery request, CancellationToken cancellationToken)
        {
            IPaginate<MeetingUser> meetingUsers = await _meetingUserRepository.GetListAsync(
                predicate: request.MeetingId.HasValue ? mu => mu.MeetingId == request.MeetingId.Value : null,
                include: i => i.Include(mu => mu.User), // User bilgilerini include et
                index: request.PageRequest.PageIndex,
                size: request.PageRequest.PageSize, 
                cancellationToken: cancellationToken
            );

            GetListResponse<GetListMeetingUserListItemDto> response = _mapper.Map<GetListResponse<GetListMeetingUserListItemDto>>(meetingUsers);
            return response;
        }
    }
}