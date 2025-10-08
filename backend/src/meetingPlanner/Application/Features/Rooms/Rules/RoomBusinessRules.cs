using Application.Features.Rooms.Constants;
using Application.Services.Repositories;
using NArchitecture.Core.Application.Rules;
using NArchitecture.Core.CrossCuttingConcerns.Exception.Types;
using NArchitecture.Core.Localization.Abstraction;
using Domain.Entities;

namespace Application.Features.Rooms.Rules;

public class RoomBusinessRules : BaseBusinessRules
{
    private readonly IRoomRepository _roomRepository;
    private readonly ILocalizationService _localizationService;

    public RoomBusinessRules(IRoomRepository roomRepository, ILocalizationService localizationService)
    {
        _roomRepository = roomRepository;
        _localizationService = localizationService;
    }

    private async Task throwBusinessException(string messageKey)
    {
        string message = await _localizationService.GetLocalizedAsync(messageKey, RoomsBusinessMessages.SectionName);
        throw new BusinessException(message);
    }

    public async Task RoomShouldExistWhenSelected(Room? room)
    {
        if (room == null)
            await throwBusinessException(RoomsBusinessMessages.RoomNotExists);
    }

    public async Task RoomIdShouldExistWhenSelected(Guid id, CancellationToken cancellationToken)
    {
        Room? room = await _roomRepository.GetAsync(
            predicate: r => r.Id == id,
            enableTracking: false,
            cancellationToken: cancellationToken
        );
        await RoomShouldExistWhenSelected(room);
    }

    public async Task RoomNameMustBeUnique(Room room)
    {
        bool result = await _roomRepository.AnyAsync(r => r.Name == room.Name);

        if(result)
        {
            await throwBusinessException(RoomsBusinessMessages.RoomNameMustBeUnique);
        }
    }

    public async Task RoomNameMustBeUniqueWhenUpdating(Room room)
    {
        bool result = await _roomRepository.AnyAsync(r => r.Name == room.Name && r.Id != room.Id);

        if(result)
        {
            await throwBusinessException(RoomsBusinessMessages.RoomNameMustBeUnique);
        }
    }

}