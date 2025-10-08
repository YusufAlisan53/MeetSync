using NArchitecture.Core.Persistence.Paging;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Application.Services.Rooms;

public interface IRoomService
{
    Task<Room?> GetAsync(
        Expression<Func<Room, bool>> predicate,
        Func<IQueryable<Room>, IIncludableQueryable<Room, object>>? include = null,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    );
    Task<IPaginate<Room>?> GetListAsync(
        Expression<Func<Room, bool>>? predicate = null,
        Func<IQueryable<Room>, IOrderedQueryable<Room>>? orderBy = null,
        Func<IQueryable<Room>, IIncludableQueryable<Room, object>>? include = null,
        int index = 0,
        int size = 10,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    );
    Task<Room> AddAsync(Room room);
    Task<Room> UpdateAsync(Room room);
    Task<Room> DeleteAsync(Room room, bool permanent = false);
}
