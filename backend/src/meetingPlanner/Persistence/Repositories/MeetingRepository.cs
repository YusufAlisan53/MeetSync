using Application.Services.Repositories;
using Domain.Entities;
using NArchitecture.Core.Persistence.Repositories;
using Persistence.Contexts;

namespace Persistence.Repositories;

public class MeetingRepository : EfRepositoryBase<Meeting, Guid, BaseDbContext>, IMeetingRepository
{
    public MeetingRepository(BaseDbContext context) : base(context)
    {
    }
}