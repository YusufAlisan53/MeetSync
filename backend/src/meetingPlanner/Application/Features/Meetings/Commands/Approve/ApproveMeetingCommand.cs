using Application.Features.Meetings.Constants;
using Application.Services.Repositories;
using Domain.Entities;
using MediatR;
using NArchitecture.Core.Application.Pipelines.Authorization;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;

namespace Application.Features.Meetings.Commands.Approve;

public class ApproveMeetingCommand : IRequest<Unit>, ISecuredRequest
{
    public required Guid MeetingId { get; set; }
    public Guid? ApprovedByUserId { get; set; }

    public string[] Roles => [Admin, MeetingsOperationClaims.Approve, "System.Manager"]; // Sadece adminler onaylayabilir

    public class ApproveMeetingCommandHandler : IRequestHandler<ApproveMeetingCommand, Unit>
    {
        private readonly IMeetingRepository _meetingRepository;

        public ApproveMeetingCommandHandler(IMeetingRepository meetingRepository)
        {
            _meetingRepository = meetingRepository;
        }

        public async Task<Unit> Handle(ApproveMeetingCommand request, CancellationToken cancellationToken)
        {
            Meeting? meeting = await _meetingRepository.GetAsync(m => m.Id == request.MeetingId);
            
            if (meeting == null)
                throw new InvalidOperationException("Meeting not found");

            // Meeting'i onayla
            meeting.IsApproved = true;
            meeting.ApprovedByUserId = request.ApprovedByUserId;
            meeting.ApprovedDate = DateTime.UtcNow;

            await _meetingRepository.UpdateAsync(meeting);

            return Unit.Value;
        }
    }
}
