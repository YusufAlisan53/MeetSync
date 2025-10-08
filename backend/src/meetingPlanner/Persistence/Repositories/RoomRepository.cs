using Application.Services.Repositories;
using Domain.Entities;
using NArchitecture.Core.Persistence.Repositories;
using Persistence.Contexts;

namespace Persistence.Repositories;

public class RoomRepository : EfRepositoryBase<Room, Guid, BaseDbContext>, IRoomRepository
{
    public RoomRepository(BaseDbContext context) : base(context)
    {
    }
}