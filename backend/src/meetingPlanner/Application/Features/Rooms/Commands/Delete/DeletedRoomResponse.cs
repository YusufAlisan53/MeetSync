using NArchitecture.Core.Application.Responses;

namespace Application.Features.Rooms.Commands.Delete;

public class DeletedRoomResponse : IResponse
{
    public Guid Id { get; set; }
}