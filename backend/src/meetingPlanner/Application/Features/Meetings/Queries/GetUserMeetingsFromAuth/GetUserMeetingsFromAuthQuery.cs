using Application.Features.Meetings.Constants;
using Application.Features.Meetings.Rules;
using AutoMapper;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Persistence.Paging;
using NArchitecture.Core.Application.Responses;
using Domain.Entities;
using Application.Services.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Meetings.Queries.GetUserMeetingsFromAuth;

public class GetUserMeetingsFromAuthQuery : IRequest<GetListResponse<GetUserMeetingsFromAuthListItemDto>>
{
    public required Guid Id { get; set; }
    public required PageRequest PageRequest { get; set; }

    public GetUserMeetingsFromAuthQuery(PageRequest pageRequest)
    {
        PageRequest = pageRequest;
    }

    public GetUserMeetingsFromAuthQuery()
    {
        PageRequest = new PageRequest { PageSize = 10, PageIndex = 0 };
    }

    public string[] Roles => [Admin, Read, MeetingsOperationClaims.GetUserMeetingsFromAuth];

    public class GetUserMeetingsFromAuthQueryHandler : IRequestHandler<GetUserMeetingsFromAuthQuery, GetListResponse<GetUserMeetingsFromAuthListItemDto>>
    {
        private readonly IMapper _mapper;
        private readonly MeetingBusinessRules _meetingBusinessRules;
        private readonly IMeetingRepository _meetingRepository;
        
        public GetUserMeetingsFromAuthQueryHandler(IMapper mapper, MeetingBusinessRules meetingBusinessRules, IMeetingRepository meetingRepository)
        {
            _meetingRepository = meetingRepository;
            _mapper = mapper;
            _meetingBusinessRules = meetingBusinessRules;
        }

        public async Task<GetListResponse<GetUserMeetingsFromAuthListItemDto>> Handle(GetUserMeetingsFromAuthQuery request, CancellationToken cancellationToken)
        {

            IPaginate<Meeting> meetings = await _meetingRepository.GetListAsync(
                predicate: m => m.Users.Any(mu => mu.UserId == request.Id) && m.DeletedDate == null,
                index: request.PageRequest.PageIndex,
                size: request.PageRequest.PageSize,
                include: m => m.Include(x => x.Users).ThenInclude(mu => mu.User!)
                              .Include(x => x.Room!)
                              .Include(x => x.CreatedByUser!),
                cancellationToken: cancellationToken
            );

            GetListResponse<GetUserMeetingsFromAuthListItemDto> response = _mapper.Map<GetListResponse<GetUserMeetingsFromAuthListItemDto>>(meetings);
            return response;
        }
    }
}
