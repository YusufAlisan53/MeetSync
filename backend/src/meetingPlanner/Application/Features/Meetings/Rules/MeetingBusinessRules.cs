using Application.Features.Meetings.Constants;
using Application.Services.Repositories;
using NArchitecture.Core.Application.Rules;
using NArchitecture.Core.CrossCuttingConcerns.Exception.Types;
using NArchitecture.Core.Localization.Abstraction;
using Domain.Entities;

namespace Application.Features.Meetings.Rules;

public class MeetingBusinessRules : BaseBusinessRules
{
    private readonly IMeetingRepository _meetingRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ILocalizationService _localizationService;

    public MeetingBusinessRules(IMeetingRepository meetingRepository, IRoomRepository roomRepository, ILocalizationService localizationService)
    {
        _meetingRepository = meetingRepository;
        _roomRepository = roomRepository;
        _localizationService = localizationService;
    }

    private async Task throwBusinessException(string messageKey)
    {
        string message = await _localizationService.GetLocalizedAsync(messageKey, MeetingsBusinessMessages.SectionName);
        throw new BusinessException(message);
    }

    public async Task MeetingShouldExistWhenSelected(Meeting? meeting)
    {
        if (meeting == null)
            await throwBusinessException(MeetingsBusinessMessages.MeetingNotExists);
    }

    public async Task MeetingIdShouldExistWhenSelected(Guid id, CancellationToken cancellationToken)
    {
        Meeting? meeting = await _meetingRepository.GetAsync(
            predicate: m => m.Id == id,
            enableTracking: false,
            cancellationToken: cancellationToken
        );
        await MeetingShouldExistWhenSelected(meeting);
    }

    public async Task RoomShouldExistsWhenSelected(Room? room)
    {
        if (room == null)
            await throwBusinessException(MeetingsBusinessMessages.RoomNotFound);
    }

    public async Task RoomShouldBeAvailableForMeeting(Guid roomId, DateTime startDate, TimeSpan duration)
    {
        // Çakışan toplantıları kontrol et
        DateTime endDate = startDate.Add(duration);
        DateTime now = DateTime.Now;
        
        Console.WriteLine($"🔍 Room availability check: Room={roomId}, StartDate={startDate}, EndDate={endDate}, Now={now}");
        
        // ✅ GÜNCELLENMIŞ LOGIC: Onaylanmış VE bekleyen toplantıları kontrol et
        var roomMeetings = await _meetingRepository.GetListAsync(
            predicate: m => m.RoomId == roomId && 
                           m.DeletedDate == null 
                           // ✅ İsApproved kontrolünü kaldırdık: hem onaylı hem bekleyen toplantılar dahil
        );

        Console.WriteLine($"🔍 Found {roomMeetings.Items.Count} total meetings (approved + pending) for room {roomId}");

        // Memory'de tarih çakışması kontrolü
        var conflictingMeetings = roomMeetings.Items.Where(m =>
        {
            // Null ve zero duration kontrolü
            if (m.Duration == TimeSpan.Zero)
            {
                Console.WriteLine($"⚠️ Meeting {m.Id} has zero duration, skipping");
                return false;
            }
                
            var meetingEndTime = m.StartDate.Add(m.Duration);
            
            Console.WriteLine($"🔍 Checking meeting {m.Id}: Start={m.StartDate}, End={meetingEndTime}, Subject='{m.Subject}', IsApproved={m.IsApproved}");
            
            // ✅ DOĞRU ZAMAN ÇAKIŞMA KONTROLÜ
            bool hasConflict = !(endDate <= m.StartDate || startDate >= meetingEndTime);
            
            Console.WriteLine($"🔍 Conflict check result for meeting {m.Id}: {hasConflict}");
            Console.WriteLine($"   New meeting: {startDate} - {endDate}");
            Console.WriteLine($"   Existing meeting: {m.StartDate} - {meetingEndTime}");
            
            return hasConflict;
        });

        var conflictList = conflictingMeetings.ToList();
        Console.WriteLine($"🔍 Total conflicting meetings: {conflictList.Count}");

        if (conflictList.Any())
        {
            foreach (var conflict in conflictList)
            {
                Console.WriteLine($"❌ CONFLICT: Meeting '{conflict.Subject}' ({conflict.Id}) from {conflict.StartDate} to {conflict.StartDate.Add(conflict.Duration)} [IsApproved: {conflict.IsApproved}]");
            }
            await throwBusinessException(MeetingsBusinessMessages.RoomNotAvailable);
        }
        else
        {
            Console.WriteLine($"✅ No conflicts found, room {roomId} is available");
        }
    }

    public async Task RoomShouldBeAvailableForMeetingUpdate(Guid meetingId, Guid roomId, DateTime startDate, TimeSpan duration)
    {
        // Çakışan toplantıları kontrol et (güncellenen toplantı hariç)
        DateTime endDate = startDate.Add(duration);
        DateTime now = DateTime.Now;
        
        Console.WriteLine($"🔍 Room availability check for UPDATE: Room={roomId}, StartDate={startDate}, EndDate={endDate}, Now={now}, ExcludeMeetingId={meetingId}");
        
        // ✅ GÜNCELLENMIŞ LOGIC: Onaylanmış VE bekleyen toplantıları kontrol et (güncellenen meeting hariç)
        var roomMeetings = await _meetingRepository.GetListAsync(
            predicate: m => m.RoomId == roomId && 
                           m.DeletedDate == null && 
                           m.Id != meetingId
                           // ✅ İsApproved kontrolünü kaldırdık: hem onaylı hem bekleyen toplantılar dahil
        );

        Console.WriteLine($"🔍 Found {roomMeetings.Items.Count} total meetings (approved + pending) for room {roomId} (excluding meeting {meetingId})");

        // Memory'de tarih çakışması kontrolü
        var conflictingMeetings = roomMeetings.Items.Where(m =>
        {
            // Null ve zero duration kontrolü
            if (m.Duration == TimeSpan.Zero)
            {
                Console.WriteLine($"⚠️ Meeting {m.Id} has zero duration, skipping");
                return false;
            }
                
            var meetingEndTime = m.StartDate.Add(m.Duration);
            
            Console.WriteLine($"🔍 Checking meeting {m.Id}: Start={m.StartDate}, End={meetingEndTime}, Subject='{m.Subject}', IsApproved={m.IsApproved}");
            
            // ✅ DOĞRU ZAMAN ÇAKIŞMA KONTROLÜ
            bool hasConflict = !(endDate <= m.StartDate || startDate >= meetingEndTime);
            
            Console.WriteLine($"🔍 UPDATE Conflict check result for meeting {m.Id}: {hasConflict}");
            Console.WriteLine($"   Updated meeting: {startDate} - {endDate}");
            Console.WriteLine($"   Existing meeting: {m.StartDate} - {meetingEndTime}");
            
            return hasConflict;
        });

        var conflictList = conflictingMeetings.ToList();
        Console.WriteLine($"🔍 Total conflicting meetings for UPDATE: {conflictList.Count}");

        if (conflictList.Any())
        {
            foreach (var conflict in conflictList)
            {
                Console.WriteLine($"❌ UPDATE CONFLICT: Meeting '{conflict.Subject}' ({conflict.Id}) from {conflict.StartDate} to {conflict.StartDate.Add(conflict.Duration)} [IsApproved: {conflict.IsApproved}]");
            }
            await throwBusinessException(MeetingsBusinessMessages.RoomNotAvailable);
        }
        else
        {
            Console.WriteLine($"✅ No conflicts found for UPDATE, room {roomId} is available");
        }
    }
}