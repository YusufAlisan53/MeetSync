using Application.Features.Meetings.Constants;
using Application.Services.Repositories;
using Domain.Entities;
using MediatR;
using NArchitecture.Core.Application.Pipelines.Authorization;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;

namespace Application.Features.Meetings.Commands.Reject;

public class RejectMeetingCommand : IRequest<Unit>, ISecuredRequest
{
    public required Guid MeetingId { get; set; }
    public Guid? RejectedByUserId { get; set; }

    public string[] Roles => [Admin, MeetingsOperationClaims.Reject, "System.Manager"]; // Sadece adminler reddedebilir

    public class RejectMeetingCommandHandler : IRequestHandler<RejectMeetingCommand, Unit>
    {
        private readonly IMeetingRepository _meetingRepository;

        public RejectMeetingCommandHandler(IMeetingRepository meetingRepository)
        {
            _meetingRepository = meetingRepository;
        }

        public async Task<Unit> Handle(RejectMeetingCommand request, CancellationToken cancellationToken)
        {
            Meeting? meeting = await _meetingRepository.GetAsync(m => m.Id == request.MeetingId);
            
            if (meeting == null)
                throw new InvalidOperationException("Meeting not found");

            // Meeting'i reddet - IsApproved false kalır ama reddedildi olarak işaretle
            meeting.IsApproved = false;
            meeting.ApprovedByUserId = null;
            meeting.ApprovedDate = null;
            
            // Gelecekte reject bilgisi için alanlar eklenebilir
            // meeting.IsRejected = true;
            // meeting.RejectedByUserId = request.RejectedByUserId;
            // meeting.RejectedDate = DateTime.UtcNow;

            await _meetingRepository.UpdateAsync(meeting);

            return Unit.Value;
        }
    }
}
