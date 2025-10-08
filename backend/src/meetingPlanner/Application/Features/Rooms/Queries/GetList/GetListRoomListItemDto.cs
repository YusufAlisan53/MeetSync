using NArchitecture.Core.Application.Dtos;

namespace Application.Features.Rooms.Queries.GetList;

public class GetListRoomListItemDto : IDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string LocationInfo { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    // ✅ YENİ: Oda müsaitlik bilgisi
    public bool IsCurrentlyAvailable { get; set; } = true; // Varsayılan olarak müsait
    public int ActiveMeetingsCount { get; set; } = 0; // Şu anda devam eden toplantı sayısı
    public string? NextMeetingInfo { get; set; } // Bir sonraki toplantı bilgisi
}