using Application.Features.MeetingUsers.Constants;
using Application.Features.MeetingUsers.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.MeetingUsers.Constants.MeetingUsersOperationClaims;

namespace Application.Features.MeetingUsers.Commands.Update;

public class UpdateMeetingUserCommand : IRequest<UpdatedMeetingUserResponse>, ISecuredRequest
{
    public Guid Id { get; set; }

    public string[] Roles => [Admin, Write, MeetingUsersOperationClaims.Update, "System.Manager", "System.User"];

    public class UpdateMeetingUserCommandHandler : IRequestHandler<UpdateMeetingUserCommand, UpdatedMeetingUserResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly MeetingUserBusinessRules _meetingUserBusinessRules;

        public UpdateMeetingUserCommandHandler(IMapper mapper, IMeetingUserRepository meetingUserRepository,
                                         MeetingUserBusinessRules meetingUserBusinessRules)
        {
            _mapper = mapper;
            _meetingUserRepository = meetingUserRepository;
            _meetingUserBusinessRules = meetingUserBusinessRules;
        }

        public async Task<UpdatedMeetingUserResponse> Handle(UpdateMeetingUserCommand request, CancellationToken cancellationToken)
        {
            MeetingUser? meetingUser = await _meetingUserRepository.GetAsync(predicate: mu => mu.Id == request.Id, cancellationToken: cancellationToken);
            await _meetingUserBusinessRules.MeetingUserShouldExistWhenSelected(meetingUser);
            meetingUser = _mapper.Map(request, meetingUser);

            await _meetingUserRepository.UpdateAsync(meetingUser!);

            UpdatedMeetingUserResponse response = _mapper.Map<UpdatedMeetingUserResponse>(meetingUser);
            return response;
        }
    }
}