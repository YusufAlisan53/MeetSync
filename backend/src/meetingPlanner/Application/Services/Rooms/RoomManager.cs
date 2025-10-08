using Application.Features.Rooms.Rules;
using Application.Services.Repositories;
using NArchitecture.Core.Persistence.Paging;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Application.Services.Rooms;

public class RoomManager : IRoomService
{
    private readonly IRoomRepository _roomRepository;
    private readonly RoomBusinessRules _roomBusinessRules;

    public RoomManager(IRoomRepository roomRepository, RoomBusinessRules roomBusinessRules)
    {
        _roomRepository = roomRepository;
        _roomBusinessRules = roomBusinessRules;
    }

    public async Task<Room?> GetAsync(
        Expression<Func<Room, bool>> predicate,
        Func<IQueryable<Room>, IIncludableQueryable<Room, object>>? include = null,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    )
    {
        Room? room = await _roomRepository.GetAsync(predicate, include, withDeleted, enableTracking, cancellationToken);
        return room;
    }

    public async Task<IPaginate<Room>?> GetListAsync(
        Expression<Func<Room, bool>>? predicate = null,
        Func<IQueryable<Room>, IOrderedQueryable<Room>>? orderBy = null,
        Func<IQueryable<Room>, IIncludableQueryable<Room, object>>? include = null,
        int index = 0,
        int size = 10,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    )
    {
        IPaginate<Room> roomList = await _roomRepository.GetListAsync(
            predicate,
            orderBy,
            include,
            index,
            size,
            withDeleted,
            enableTracking,
            cancellationToken
        );
        return roomList;
    }

    public async Task<Room> AddAsync(Room room)
    {
        Room addedRoom = await _roomRepository.AddAsync(room);

        return addedRoom;
    }

    public async Task<Room> UpdateAsync(Room room)
    {
        Room updatedRoom = await _roomRepository.UpdateAsync(room);

        return updatedRoom;
    }

    public async Task<Room> DeleteAsync(Room room, bool permanent = false)
    {
        Room deletedRoom = await _roomRepository.DeleteAsync(room);

        return deletedRoom;
    }
}
