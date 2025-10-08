using Application.Features.MeetingUsers.Constants;
using Application.Services.Repositories;
using NArchitecture.Core.Application.Rules;
using NArchitecture.Core.CrossCuttingConcerns.Exception.Types;
using NArchitecture.Core.Localization.Abstraction;
using Domain.Entities;

namespace Application.Features.MeetingUsers.Rules;

public class MeetingUserBusinessRules : BaseBusinessRules
{
    private readonly IMeetingUserRepository _meetingUserRepository;
    private readonly ILocalizationService _localizationService;

    public MeetingUserBusinessRules(IMeetingUserRepository meetingUserRepository, ILocalizationService localizationService)
    {
        _meetingUserRepository = meetingUserRepository;
        _localizationService = localizationService;
    }

    private async Task throwBusinessException(string messageKey)
    {
        string message = await _localizationService.GetLocalizedAsync(messageKey, MeetingUsersBusinessMessages.SectionName);
        throw new BusinessException(message);
    }

    public async Task MeetingUserShouldExistWhenSelected(MeetingUser? meetingUser)
    {
        if (meetingUser == null)
            await throwBusinessException(MeetingUsersBusinessMessages.MeetingUserNotExists);
    }

    public async Task MeetingUserIdShouldExistWhenSelected(Guid id, CancellationToken cancellationToken)
    {
        MeetingUser? meetingUser = await _meetingUserRepository.GetAsync(
            predicate: mu => mu.Id == id,
            enableTracking: false,
            cancellationToken: cancellationToken
        );
        await MeetingUserShouldExistWhenSelected(meetingUser);
    }
}