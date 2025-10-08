using Domain.Entities;
using NArchitecture.Core.Application.Dtos;

namespace Application.Features.MeetingUsers.Queries.GetPendingApprovals;

public class PendingApprovalListItemDto : IDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid MeetingId { get; set; }
    public MeetingUserStatus Status { get; set; }
    public DateTime? ResponseDate { get; set; }
    public DateTime CreatedDate { get; set; }
    
    // Meeting details
    public string MeetingSubject { get; set; } = string.Empty;
    public string MeetingContent { get; set; } = string.Empty;
    public DateTime MeetingStartDate { get; set; }
    public TimeSpan MeetingDuration { get; set; }
    public string MeetingCreatedByName { get; set; } = string.Empty;
    public string? MeetingRoomName { get; set; }
}
