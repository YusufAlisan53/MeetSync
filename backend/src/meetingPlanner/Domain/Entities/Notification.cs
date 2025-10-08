using NArchitecture.Core.Persistence.Repositories;

namespace Domain.Entities;

public class Notification : Entity<Guid>
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedDate { get; set; }
    public Guid? RelatedMeetingId { get; set; } // İlgili toplantı ID'si (opsiyonel)
    
    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Meeting? RelatedMeeting { get; set; }

    public Notification()
    {
        Id = Guid.NewGuid();
        CreatedDate = DateTime.UtcNow;
    }

    public Notification(Guid userId, string title, string message, NotificationType type, Guid? relatedMeetingId = null) : this()
    {
        UserId = userId;
        Title = title;
        Message = message;
        Type = type;
        RelatedMeetingId = relatedMeetingId;
    }
}

public enum NotificationType
{
    General = 0,
    MeetingInvitation = 1,
    MeetingApproved = 2,
    MeetingRejected = 3,
    MeetingCancelled = 4,
    MeetingUpdated = 5
}
