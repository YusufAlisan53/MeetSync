using NArchitecture.Core.Application.Responses;

namespace Application.Features.Meetings.Commands.Delete;

public class DeletedMeetingResponse : IResponse
{
    public Guid Id { get; set; }
}