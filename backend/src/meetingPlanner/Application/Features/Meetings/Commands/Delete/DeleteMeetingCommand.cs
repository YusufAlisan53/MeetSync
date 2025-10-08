using Application.Features.Meetings.Constants;
using Application.Features.Meetings.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;
using NArchitecture.Core.Application.Pipelines.Authorization;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;

namespace Application.Features.Meetings.Commands.Delete;

public class DeleteMeetingCommand : IRequest<DeletedMeetingResponse>, ISecuredRequest
{
    public Guid Id { get; set; }

    public string[] Roles => new[] { Admin, MeetingsOperationClaims.Delete, "System.Manager" };

    public class DeleteMeetingCommandHandler : IRequestHandler<DeleteMeetingCommand, DeletedMeetingResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingRepository _meetingRepository;
        private readonly MeetingBusinessRules _meetingBusinessRules;

        public DeleteMeetingCommandHandler(IMapper mapper, IMeetingRepository meetingRepository,
                                         MeetingBusinessRules meetingBusinessRules)
        {
            _mapper = mapper;
            _meetingRepository = meetingRepository;
            _meetingBusinessRules = meetingBusinessRules;
        }

        public async Task<DeletedMeetingResponse> Handle(DeleteMeetingCommand request, CancellationToken cancellationToken)
        {
            Meeting? meeting = await _meetingRepository.GetAsync(predicate: m => m.Id == request.Id, cancellationToken: cancellationToken);
            await _meetingBusinessRules.MeetingShouldExistWhenSelected(meeting);

            await _meetingRepository.DeleteAsync(meeting!);

            DeletedMeetingResponse response = _mapper.Map<DeletedMeetingResponse>(meeting);
            return response;
        }
    }
}