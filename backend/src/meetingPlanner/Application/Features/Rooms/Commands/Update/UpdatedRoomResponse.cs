using NArchitecture.Core.Application.Responses;

namespace Application.Features.Rooms.Commands.Update;

public class UpdatedRoomResponse : IResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public int Capacity { get; set; }
    public string LocationInfo { get; set; }
    public string Details { get; set; }
}