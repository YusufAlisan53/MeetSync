using NArchitecture.Core.Application.Responses;

namespace Application.Features.Meetings.Queries.GetRecommendedRoomsList;

public class GetRecommendedRoomsListResponse : IResponse
{
    public List<RecommendedDto> RecommendedRooms { get; set; } = new List<RecommendedDto>();
}

public class RecommendedDto
{
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = null!;
    public int RoomCapacity { get; set; }
    public DateTime RecommendedStartDateTime { get; set; }
    public int AvailableOptionalUserCount { get; set; }
}