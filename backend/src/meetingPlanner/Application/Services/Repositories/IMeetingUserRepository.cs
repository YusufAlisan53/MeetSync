using Domain.Entities;
using NArchitecture.Core.Persistence.Repositories;

namespace Application.Services.Repositories;

public interface IMeetingUserRepository : IAsyncRepository<MeetingUser, Guid>, IRepository<MeetingUser, Guid>
{
}