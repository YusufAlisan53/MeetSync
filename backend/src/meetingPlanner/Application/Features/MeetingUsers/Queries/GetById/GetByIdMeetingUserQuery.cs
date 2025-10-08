using Application.Features.MeetingUsers.Constants;
using Application.Features.MeetingUsers.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.MeetingUsers.Constants.MeetingUsersOperationClaims;

namespace Application.Features.MeetingUsers.Queries.GetById;

public class GetByIdMeetingUserQuery : IRequest<GetByIdMeetingUserResponse>
{
    public Guid Id { get; set; }

    public string[] Roles => [Admin, Read];

    public class GetByIdMeetingUserQueryHandler : IRequestHandler<GetByIdMeetingUserQuery, GetByIdMeetingUserResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly MeetingUserBusinessRules _meetingUserBusinessRules;

        public GetByIdMeetingUserQueryHandler(IMapper mapper, IMeetingUserRepository meetingUserRepository, MeetingUserBusinessRules meetingUserBusinessRules)
        {
            _mapper = mapper;
            _meetingUserRepository = meetingUserRepository;
            _meetingUserBusinessRules = meetingUserBusinessRules;
        }

        public async Task<GetByIdMeetingUserResponse> Handle(GetByIdMeetingUserQuery request, CancellationToken cancellationToken)
        {
            MeetingUser? meetingUser = await _meetingUserRepository.GetAsync(predicate: mu => mu.Id == request.Id, cancellationToken: cancellationToken);
            await _meetingUserBusinessRules.MeetingUserShouldExistWhenSelected(meetingUser);

            GetByIdMeetingUserResponse response = _mapper.Map<GetByIdMeetingUserResponse>(meetingUser);
            return response;
        }
    }
}