using NArchitecture.Core.Application.Responses;

namespace Application.Features.MeetingUsers.Commands.Update;

public class UpdatedMeetingUserResponse : IResponse
{
    public Guid Id { get; set; }
}