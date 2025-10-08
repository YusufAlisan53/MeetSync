using Application.Features.Rooms.Constants;
using Application.Features.Rooms.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.Rooms.Constants.RoomsOperationClaims;

namespace Application.Features.Rooms.Commands.Update;

public class UpdateRoomCommand : IRequest<UpdatedRoomResponse>
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required int Capacity { get; set; }
    public required string LocationInfo { get; set; }
    public required string Details { get; set; }

    public string[] Roles => [Admin, Write, RoomsOperationClaims.Update];

    public class UpdateRoomCommandHandler : IRequestHandler<UpdateRoomCommand, UpdatedRoomResponse>
    {
        private readonly IMapper _mapper;
        private readonly IRoomRepository _roomRepository;
        private readonly RoomBusinessRules _roomBusinessRules;

        public UpdateRoomCommandHandler(IMapper mapper, IRoomRepository roomRepository,
                                         RoomBusinessRules roomBusinessRules)
        {
            _mapper = mapper;
            _roomRepository = roomRepository;
            _roomBusinessRules = roomBusinessRules;
        }

        public async Task<UpdatedRoomResponse> Handle(UpdateRoomCommand request, CancellationToken cancellationToken)
        {
            Room? room = await _roomRepository.GetAsync(predicate: r => r.Id == request.Id, cancellationToken: cancellationToken);
            await _roomBusinessRules.RoomShouldExistWhenSelected(room);
            room = _mapper.Map(request, room);

            await _roomRepository.UpdateAsync(room!);

            UpdatedRoomResponse response = _mapper.Map<UpdatedRoomResponse>(room);
            return response;
        }
    }
}