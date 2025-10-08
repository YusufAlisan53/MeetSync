using Application.Features.MeetingUsers.Constants;
using Application.Features.MeetingUsers.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.MeetingUsers.Constants.MeetingUsersOperationClaims;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using NArchitecture.Core.Security.Constants;

namespace Application.Features.MeetingUsers.Commands.Create;

public class CreateMeetingUserCommand : IRequest<CreatedMeetingUserResponse>, ISecuredRequest
{

    public required Guid UserId { get; set; }
    public required Guid MeetingId { get; set; }

    public string[] Roles => [GeneralOperationClaims.Admin, Admin, Write, MeetingUsersOperationClaims.Create, "User", "System.Manager", "System.User"];

    public class CreateMeetingUserCommandHandler : IRequestHandler<CreateMeetingUserCommand, CreatedMeetingUserResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingUserRepository _meetingUserRepository;
        private readonly IMeetingRepository _meetingRepository;
        private readonly MeetingUserBusinessRules _meetingUserBusinessRules;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateMeetingUserCommandHandler(IMapper mapper, IMeetingUserRepository meetingUserRepository,
                                         IMeetingRepository meetingRepository,
                                         MeetingUserBusinessRules meetingUserBusinessRules,
                                         IHttpContextAccessor httpContextAccessor)
        {
            _mapper = mapper;
            _meetingUserRepository = meetingUserRepository;
            _meetingRepository = meetingRepository;
            _meetingUserBusinessRules = meetingUserBusinessRules;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<CreatedMeetingUserResponse> Handle(CreateMeetingUserCommand request, CancellationToken cancellationToken)
        {
            MeetingUser meetingUser = _mapper.Map<MeetingUser>(request);

            await _meetingUserRepository.AddAsync(meetingUser);

            CreatedMeetingUserResponse response = _mapper.Map<CreatedMeetingUserResponse>(meetingUser);
            return response;
        }
    }
}