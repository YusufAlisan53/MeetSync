using NArchitecture.Core.Application.Responses;

namespace Application.Features.Meetings.Queries.GetById;

public class GetByIdMeetingResponse : IResponse
{
    public Guid Id { get; set; }
    public string? Subject { get; set; }
    public string? Content { get; set; }
    public DateTime StartDate { get; set; }
    public TimeSpan Duration { get; set; }
    public Guid? RoomId { get; set; }
    public string? RoomName { get; set; }
}