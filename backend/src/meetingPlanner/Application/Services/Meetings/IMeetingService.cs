using NArchitecture.Core.Persistence.Paging;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Application.Services.Meetings;

public interface IMeetingService
{
    Task<Meeting?> GetAsync(
        Expression<Func<Meeting, bool>> predicate,
        Func<IQueryable<Meeting>, IIncludableQueryable<Meeting, object>>? include = null,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    );
    Task<IPaginate<Meeting>?> GetListAsync(
        Expression<Func<Meeting, bool>>? predicate = null,
        Func<IQueryable<Meeting>, IOrderedQueryable<Meeting>>? orderBy = null,
        Func<IQueryable<Meeting>, IIncludableQueryable<Meeting, object>>? include = null,
        int index = 0,
        int size = 10,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    );
    Task<Meeting> AddAsync(Meeting meeting);
    Task<Meeting> UpdateAsync(Meeting meeting);
    Task<Meeting> DeleteAsync(Meeting meeting, bool permanent = false);
}
