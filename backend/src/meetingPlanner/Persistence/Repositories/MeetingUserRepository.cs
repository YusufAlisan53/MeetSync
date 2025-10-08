using Application.Services.Repositories;
using Domain.Entities;
using NArchitecture.Core.Persistence.Repositories;
using Persistence.Contexts;

namespace Persistence.Repositories;

public class MeetingUserRepository : EfRepositoryBase<MeetingUser, Guid, BaseDbContext>, IMeetingUserRepository
{
    public MeetingUserRepository(BaseDbContext context) : base(context)
    {
    }
}