using Application.Features.Rooms.Constants;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Persistence.Paging;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Drawing;

namespace Application.Features.Rooms.Queries.GetList;

public class GetListRoomQuery : IRequest<GetListResponse<GetListRoomListItemDto>>
{
    public PageRequest PageRequest { get; set; } = null!;

    public GetListRoomQuery(PageRequest pageRequest)
    {
        PageRequest = pageRequest;
    }

    public GetListRoomQuery()
    {
        PageRequest = new PageRequest { PageSize = 10, PageIndex = 0 };
    }


    public class GetListRoomQueryHandler : IRequestHandler<GetListRoomQuery, GetListResponse<GetListRoomListItemDto>>
    {
        private readonly IRoomRepository _roomRepository;
        private readonly IMeetingRepository _meetingRepository;
        private readonly IMapper _mapper;

        public GetListRoomQueryHandler(IRoomRepository roomRepository, IMeetingRepository meetingRepository, IMapper mapper)
        {
            _roomRepository = roomRepository;
            _meetingRepository = meetingRepository;
            _mapper = mapper;
        }

        public async Task<GetListResponse<GetListRoomListItemDto>> Handle(GetListRoomQuery request, CancellationToken cancellationToken)
        {
            IPaginate<Room> rooms = await _roomRepository.GetListAsync(
                include: r => r.Include(x => x.Meetings.Where(m => m.DeletedDate == null && m.IsApproved)),
                index: request.PageRequest.PageIndex,
                size: request.PageRequest.PageSize,
                cancellationToken: cancellationToken
            );

            // ✅ Room müsaitlik bilgilerini hesapla
            var roomDtos = new List<GetListRoomListItemDto>();
            var now = DateTime.Now;

            foreach (var room in rooms.Items)
            {
                var roomDto = _mapper.Map<GetListRoomListItemDto>(room);

                // Şu anda devam eden toplantıları bul
                var activeMeetings = room.Meetings.Where(m =>
                    m.StartDate <= now &&
                    m.StartDate.Add(m.Duration) > now
                ).ToList();

                // Gelecekteki toplantıları bul
                var futureMeetings = room.Meetings.Where(m =>
                    m.StartDate > now
                ).OrderBy(m => m.StartDate).ToList();

                // Müsaitlik durumunu belirle
                roomDto.IsCurrentlyAvailable = !activeMeetings.Any();
                roomDto.ActiveMeetingsCount = activeMeetings.Count;

                // Bir sonraki toplantı bilgisi
                var nextMeeting = futureMeetings.FirstOrDefault();
                if (nextMeeting != null)
                {
                    roomDto.NextMeetingInfo = $"{nextMeeting.StartDate:dd.MM.yyyy HH:mm} - {nextMeeting.Subject}";
                }

                roomDtos.Add(roomDto);
            }

            // Paginated response oluştur
            var paginatedResult = new Paginate<GetListRoomListItemDto>
            {
                Items = roomDtos,
                Index = rooms.Index,
                Size = rooms.Size,
                Count = rooms.Count,
                Pages = rooms.Pages
            };

            GetListResponse<GetListRoomListItemDto> response = _mapper.Map<GetListResponse<GetListRoomListItemDto>>(paginatedResult);
            return response;
        }
    }
}