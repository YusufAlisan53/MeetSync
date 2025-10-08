using Application.Features.MeetingUsers.Constants;
using Application.Features.MeetingUsers.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.MeetingUsers.Constants.MeetingUsersOperationClaims;

namespace Application.Features.MeetingUsers.Commands.UpdateStatus;

public class UpdateMeetingUserStatusCommand : IRequest<UpdatedMeetingUserStatusResponse>, ISecuredRequest
{
    public Guid Id { get; set; }
    public MeetingUserStatus Status { get; set; }

    public string[] Roles => [Admin, Write, MeetingUsersOperationClaims.Update, "System.Manager", "System.User"];

    public class UpdateMeetingUserStatusCommandHandler : IRequestHandler<UpdateMeetingUserStatusCommand, UpdatedMeetingUserStatusResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly MeetingUserBusinessRules _meetingUserBusinessRules;

        public UpdateMeetingUserStatusCommandHandler(IMapper mapper, IMeetingUserRepository meetingUserRepository,
                                         MeetingUserBusinessRules meetingUserBusinessRules)
        {
            _mapper = mapper;
            _meetingUserRepository = meetingUserRepository;
            _meetingUserBusinessRules = meetingUserBusinessRules;
        }

        public async Task<UpdatedMeetingUserStatusResponse> Handle(UpdateMeetingUserStatusCommand request, CancellationToken cancellationToken)
        {
            MeetingUser? meetingUser = await _meetingUserRepository.GetAsync(predicate: mu => mu.Id == request.Id, cancellationToken: cancellationToken);
            await _meetingUserBusinessRules.MeetingUserShouldExistWhenSelected(meetingUser);
            
            meetingUser!.Status = request.Status;
            meetingUser.ResponseDate = DateTime.UtcNow;

            await _meetingUserRepository.UpdateAsync(meetingUser);

            UpdatedMeetingUserStatusResponse response = _mapper.Map<UpdatedMeetingUserStatusResponse>(meetingUser);
            return response;
        }
    }
}
