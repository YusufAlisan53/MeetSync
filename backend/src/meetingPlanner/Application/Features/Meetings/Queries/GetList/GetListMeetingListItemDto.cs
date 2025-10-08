using NArchitecture.Core.Application.Dtos;

namespace Application.Features.Meetings.Queries.GetList;

public class GetListMeetingListItemDto : IDto
{
    public Guid Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public IList<MeetingUserDto> Users { get; set; } = default!;
    public DateTime StartDate { get; set; }
    public TimeSpan Duration { get; set; }
    public bool IsApproved { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public Guid? RoomId { get; set; }
    public string? RoomName { get; set; }
}