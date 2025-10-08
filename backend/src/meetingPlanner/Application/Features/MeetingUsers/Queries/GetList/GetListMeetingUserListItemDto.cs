using Domain.Entities;
using NArchitecture.Core.Application.Dtos;

namespace Application.Features.MeetingUsers.Queries.GetList;

public class GetListMeetingUserListItemDto : IDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid MeetingId { get; set; }
    public MeetingUserStatus Status { get; set; }
    public DateTime? ResponseDate { get; set; }
    public DateTime CreatedDate { get; set; }
    
    // User information
    public string UserName { get; set; } = string.Empty;
    public string UserNameSurname { get; set; } = string.Empty;
}