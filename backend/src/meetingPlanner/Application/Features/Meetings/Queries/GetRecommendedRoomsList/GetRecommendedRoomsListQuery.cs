using Application.Features.Meetings.Constants;
using Application.Features.Meetings.Rules;
using AutoMapper;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;
using System.Security.Cryptography;
using Application.Services.Repositories;
using Domain.Entities;
using NArchitecture.Core.Persistence.Paging;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Ocsp;

namespace Application.Features.Meetings.Queries.GetRecommendedRoomsList;

public class GetRecommendedRoomsListQuery : IRequest<GetRecommendedRoomsListResponse>, ISecuredRequest
{
    public required List<Guid> RequiredUserIdList { get; set; }
    public required List<Guid> OptionalUserIdList { get; set; }
    public required TimeSpan Duration { get; set; }

    public GetRecommendedRoomsListQuery(List<Guid> requiredUserIdList, List<Guid> optionalUserIdList, TimeSpan duration)
    {
        RequiredUserIdList = requiredUserIdList;
        OptionalUserIdList = optionalUserIdList;
        Duration = duration;
    }

    public GetRecommendedRoomsListQuery()
    {
        RequiredUserIdList = new List<Guid>();
        OptionalUserIdList = new List<Guid>();
        Duration = TimeSpan.FromMinutes(30);
    }

    public string[] Roles => ["User", Admin, Read, MeetingsOperationClaims.GetRecommendedRoomsList, "System.Manager", "System.User"];

    public class GetRecommendedRoomsListQueryHandler : IRequestHandler<GetRecommendedRoomsListQuery, GetRecommendedRoomsListResponse>
    {
        private readonly IMapper _mapper;
        private readonly MeetingBusinessRules _meetingBusinessRules;
        private readonly IMeetingRepository _meetingsRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly IUserRepository _userRepository;

        public GetRecommendedRoomsListQueryHandler(IMapper mapper, MeetingBusinessRules meetingBusinessRules, IMeetingRepository meetingsRepository, IRoomRepository roomRepository, IUserRepository userRepository)
        {
            _mapper = mapper;
            _meetingBusinessRules = meetingBusinessRules;
            _meetingsRepository = meetingsRepository;
            _roomRepository = roomRepository;
            _userRepository = userRepository;
        }

        public async Task<GetRecommendedRoomsListResponse> Handle(GetRecommendedRoomsListQuery request, CancellationToken cancellationToken)
        {
            GetRecommendedRoomsListResponse response = new()
            {
                RecommendedRooms = new List<RecommendedDto>()
            };

            DateTime now = DateTime.Now;
            int totalUserCount = request.RequiredUserIdList.Count + request.OptionalUserIdList.Count;

            IPaginate<Room> rooms = await _roomRepository.GetListAsync(
                predicate: r => r.Capacity >= totalUserCount,
                cancellationToken: cancellationToken,
                size: 1000
            );

            if (rooms.Count == 0)
            {
                return response;
            }

            // 15 dk periyotlarla toplantı uygunluk kontrolü
            // önce 'now'ı en yakın 15 dakikaya yuvarla (yukarı doğru) ve saniye/milisaniyeyi sıfırla
            int remainder = now.Minute % 15;
            int minutesToAdd = (15 - remainder) % 15; // remainder==0 ise 0 ekler
            now = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute, 0, now.Kind).AddMinutes(minutesToAdd);

            for (int i = 0; i < 160; i++)
            {
                // her döngü 15 dk ilerler
                DateTime slotStart = now.AddMinutes(i * 15);
                DateTime slotEnd = slotStart.Add(request.Duration);

                // Eğer toplantı bitiş saati 16:30'u geçiyorsa bir sonraki hafta içi günün 08:00'ına atla
                if (slotEnd.TimeOfDay > new TimeSpan(16, 30, 0))
                {
                    DateTime nextWeekday = slotStart.AddDays(1);
                    
                    // Hafta sonu günlerini atla
                    while (nextWeekday.DayOfWeek == DayOfWeek.Saturday || nextWeekday.DayOfWeek == DayOfWeek.Sunday)
                    {
                        nextWeekday = nextWeekday.AddDays(1);
                    }
                    
                    // Saat 08:00'a ayarla
                    slotStart = new DateTime(nextWeekday.Year, nextWeekday.Month, nextWeekday.Day, 8, 0, 0, nextWeekday.Kind);
                    slotEnd = slotStart.Add(request.Duration);
                    
                    // now'ı yeni slotStart'a güncelle ve i'yi sıfırla ki bir sonraki iterasyonda doğru hesaplama yapılsın
                    now = slotStart;
                    i = -1; // for döngüsü i++ yapacağı için -1 yapıyoruz
                    continue;
                }

                bool isAnyRequiredUserNotAvailable = false;

                foreach (Guid requiredUserId in request.RequiredUserIdList)
                {
                    bool isRequiredUserNotAvailable = await _meetingsRepository.AnyAsync(
                        predicate: m =>
                        m.Users.Any(mu => mu.UserId == requiredUserId) && m.StartDate.Date == slotStart.Date &&
                        (m.StartDate <= slotStart && (m.StartDate + m.Duration) > slotStart ||
                        m.StartDate > slotStart && slotEnd > m.StartDate),
                        include: q => q.Include(m => m.Users),
                        cancellationToken: cancellationToken
                    );

                    if (isRequiredUserNotAvailable)
                    {
                        isAnyRequiredUserNotAvailable = true;
                        break;
                    }
                }

                if (isAnyRequiredUserNotAvailable)
                    continue;


                // Oda müsait, şimdi kullanıcıları kontrol et
                int availableOptionalUserCount = 0;

                foreach (Guid optionalUserId in request.OptionalUserIdList)
                {
                    bool isOptionalUserNotAvailable = await _meetingsRepository.AnyAsync(
                        predicate: m =>
                        m.Users.Any(mu => mu.UserId == optionalUserId) && m.StartDate.Date == slotStart.Date &&
                        (m.StartDate <= slotStart && (m.StartDate + m.Duration) > slotStart ||
                        m.StartDate > slotStart && slotEnd > m.StartDate),
                        include: q => q.Include(m => m.Users),
                        cancellationToken: cancellationToken
                    );
                    if (!isOptionalUserNotAvailable)
                        availableOptionalUserCount++;
                }

                foreach (Room room in rooms.Items)
                {
                    bool isRoomNotAvailable = await _meetingsRepository.AnyAsync(
                        predicate: m => m.RoomId == room.Id &&
                        m.StartDate.Date == slotStart.Date &&
                        ((m.StartDate < slotStart && (m.StartDate + m.Duration) > slotStart) ||
                        (m.StartDate > slotStart && slotStart + request.Duration > m.StartDate)),
                        cancellationToken: cancellationToken
                    );
                    if (isRoomNotAvailable)
                        continue;

                    RecommendedDto recommendedDto = new()
                    {
                        RoomId = room.Id,
                        RoomName = room.Name,
                        RoomCapacity = room.Capacity,
                        RecommendedStartDateTime = slotStart,
                        AvailableOptionalUserCount = availableOptionalUserCount
                    };

                    response.RecommendedRooms.Add(recommendedDto);

                    if(response.RecommendedRooms.Count >= 6)
                        return response;
                }
            }
            return response;
        }
    }
}
