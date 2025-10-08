using NArchitecture.Core.Application.Responses;

namespace Application.Features.MeetingUsers.Commands.Create;

public class CreatedMeetingUserResponse : IResponse
{
    public Guid Id { get; set; }
}