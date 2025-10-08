using Application.Features.MeetingUsers.Rules;
using Application.Services.Repositories;
using NArchitecture.Core.Persistence.Paging;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Application.Services.MeetingUsers;

public class MeetingUserManager : IMeetingUserService
{
    private readonly IMeetingUserRepository _meetingUserRepository;
    private readonly MeetingUserBusinessRules _meetingUserBusinessRules;

    public MeetingUserManager(IMeetingUserRepository meetingUserRepository, MeetingUserBusinessRules meetingUserBusinessRules)
    {
        _meetingUserRepository = meetingUserRepository;
        _meetingUserBusinessRules = meetingUserBusinessRules;
    }

    public async Task<MeetingUser?> GetAsync(
        Expression<Func<MeetingUser, bool>> predicate,
        Func<IQueryable<MeetingUser>, IIncludableQueryable<MeetingUser, object>>? include = null,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    )
    {
        MeetingUser? meetingUser = await _meetingUserRepository.GetAsync(predicate, include, withDeleted, enableTracking, cancellationToken);
        return meetingUser;
    }

    public async Task<IPaginate<MeetingUser>?> GetListAsync(
        Expression<Func<MeetingUser, bool>>? predicate = null,
        Func<IQueryable<MeetingUser>, IOrderedQueryable<MeetingUser>>? orderBy = null,
        Func<IQueryable<MeetingUser>, IIncludableQueryable<MeetingUser, object>>? include = null,
        int index = 0,
        int size = 10,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    )
    {
        IPaginate<MeetingUser> meetingUserList = await _meetingUserRepository.GetListAsync(
            predicate,
            orderBy,
            include,
            index,
            size,
            withDeleted,
            enableTracking,
            cancellationToken
        );
        return meetingUserList;
    }

    public async Task<MeetingUser> AddAsync(MeetingUser meetingUser)
    {
        MeetingUser addedMeetingUser = await _meetingUserRepository.AddAsync(meetingUser);

        return addedMeetingUser;
    }

    public async Task<MeetingUser> UpdateAsync(MeetingUser meetingUser)
    {
        MeetingUser updatedMeetingUser = await _meetingUserRepository.UpdateAsync(meetingUser);

        return updatedMeetingUser;
    }

    public async Task<MeetingUser> DeleteAsync(MeetingUser meetingUser, bool permanent = false)
    {
        MeetingUser deletedMeetingUser = await _meetingUserRepository.DeleteAsync(meetingUser);

        return deletedMeetingUser;
    }
}
