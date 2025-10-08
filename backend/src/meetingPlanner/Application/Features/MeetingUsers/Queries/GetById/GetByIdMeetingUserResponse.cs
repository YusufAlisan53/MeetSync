using NArchitecture.Core.Application.Responses;

namespace Application.Features.MeetingUsers.Queries.GetById;

public class GetByIdMeetingUserResponse : IResponse
{
    public Guid Id { get; set; }
}