using Domain.Entities;
using NArchitecture.Core.Application.Responses;

namespace Application.Features.MeetingUsers.Commands.UpdateStatus;

public class UpdatedMeetingUserStatusResponse : IResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid MeetingId { get; set; }
    public MeetingUserStatus Status { get; set; }
    public DateTime? ResponseDate { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
