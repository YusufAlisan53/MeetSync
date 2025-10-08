using Application.Features.MeetingUsers.Constants;
using Application.Features.MeetingUsers.Constants;
using Application.Features.MeetingUsers.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.MeetingUsers.Constants.MeetingUsersOperationClaims;

namespace Application.Features.MeetingUsers.Commands.Delete;

public class DeleteMeetingUserCommand : IRequest<DeletedMeetingUserResponse>, ISecuredRequest
{
    public Guid Id { get; set; }

    public string[] Roles => [Admin, Write, MeetingUsersOperationClaims.Delete, "System.Manager", "System.User"];

    public class DeleteMeetingUserCommandHandler : IRequestHandler<DeleteMeetingUserCommand, DeletedMeetingUserResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly MeetingUserBusinessRules _meetingUserBusinessRules;

        public DeleteMeetingUserCommandHandler(IMapper mapper, IMeetingUserRepository meetingUserRepository,
                                         MeetingUserBusinessRules meetingUserBusinessRules)
        {
            _mapper = mapper;
            _meetingUserRepository = meetingUserRepository;
            _meetingUserBusinessRules = meetingUserBusinessRules;
        }

        public async Task<DeletedMeetingUserResponse> Handle(DeleteMeetingUserCommand request, CancellationToken cancellationToken)
        {
            MeetingUser? meetingUser = await _meetingUserRepository.GetAsync(predicate: mu => mu.Id == request.Id, cancellationToken: cancellationToken);
            await _meetingUserBusinessRules.MeetingUserShouldExistWhenSelected(meetingUser);

            await _meetingUserRepository.DeleteAsync(meetingUser!);

            DeletedMeetingUserResponse response = _mapper.Map<DeletedMeetingUserResponse>(meetingUser);
            return response;
        }
    }
}