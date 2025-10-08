using Application.Features.Meetings.Rules;
using Application.Services.Repositories;
using NArchitecture.Core.Persistence.Paging;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace Application.Services.Meetings;

public class MeetingManager : IMeetingService
{
    private readonly IMeetingRepository _meetingRepository;
    private readonly MeetingBusinessRules _meetingBusinessRules;

    public MeetingManager(IMeetingRepository meetingRepository, MeetingBusinessRules meetingBusinessRules)
    {
        _meetingRepository = meetingRepository;
        _meetingBusinessRules = meetingBusinessRules;
    }

    public async Task<Meeting?> GetAsync(
        Expression<Func<Meeting, bool>> predicate,
        Func<IQueryable<Meeting>, IIncludableQueryable<Meeting, object>>? include = null,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    )
    {
        Meeting? meeting = await _meetingRepository.GetAsync(predicate, include, withDeleted, enableTracking, cancellationToken);
        return meeting;
    }

    public async Task<IPaginate<Meeting>?> GetListAsync(
        Expression<Func<Meeting, bool>>? predicate = null,
        Func<IQueryable<Meeting>, IOrderedQueryable<Meeting>>? orderBy = null,
        Func<IQueryable<Meeting>, IIncludableQueryable<Meeting, object>>? include = null,
        int index = 0,
        int size = 10,
        bool withDeleted = false,
        bool enableTracking = true,
        CancellationToken cancellationToken = default
    )
    {
        IPaginate<Meeting> meetingList = await _meetingRepository.GetListAsync(
            predicate,
            orderBy,
            include,
            index,
            size,
            withDeleted,
            enableTracking,
            cancellationToken
        );
        return meetingList;
    }

    public async Task<Meeting> AddAsync(Meeting meeting)
    {
        Meeting addedMeeting = await _meetingRepository.AddAsync(meeting);

        return addedMeeting;
    }

    public async Task<Meeting> UpdateAsync(Meeting meeting)
    {
        Meeting updatedMeeting = await _meetingRepository.UpdateAsync(meeting);

        return updatedMeeting;
    }

    public async Task<Meeting> DeleteAsync(Meeting meeting, bool permanent = false)
    {
        Meeting deletedMeeting = await _meetingRepository.DeleteAsync(meeting);

        return deletedMeeting;
    }
}
