using NArchitecture.Core.Application.Responses;

namespace Application.Features.MeetingUsers.Commands.Delete;

public class DeletedMeetingUserResponse : IResponse
{
    public Guid Id { get; set; }
}