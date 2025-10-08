using NArchitecture.Core.Persistence.Paging;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Application.Services.MeetingUsers;

public interface IMeetingUserService
{
    Task<MeetingUser?> GetAsync(
        Expression<Func<MeetingUser, bool>> predicate,
        Func<IQueryable<MeetingUser>, IIncludableQueryable<MeetingUser, object>>? include = null,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    );
    Task<IPaginate<MeetingUser>?> GetListAsync(
        Expression<Func<MeetingUser, bool>>? predicate = null,
        Func<IQueryable<MeetingUser>, IOrderedQueryable<MeetingUser>>? orderBy = null,
        Func<IQueryable<MeetingUser>, IIncludableQueryable<MeetingUser, object>>? include = null,
        int index = 0,
        int size = 10,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    );
    Task<MeetingUser> AddAsync(MeetingUser meetingUser);
    Task<MeetingUser> UpdateAsync(MeetingUser meetingUser);
    Task<MeetingUser> DeleteAsync(MeetingUser meetingUser, bool permanent = false);
}
