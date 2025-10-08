using Application.Features.Rooms.Constants;
using Application.Features.Rooms.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.Rooms.Constants.RoomsOperationClaims;

namespace Application.Features.Rooms.Commands.Delete;

public class DeleteRoomCommand : IRequest<DeletedRoomResponse>
{
    public Guid Id { get; set; }

    public string[] Roles => [Admin, Write, RoomsOperationClaims.Delete];

    public class DeleteRoomCommandHandler : IRequestHandler<DeleteRoomCommand, DeletedRoomResponse>
    {
        private readonly IMapper _mapper;
        private readonly IRoomRepository _roomRepository;
        private readonly RoomBusinessRules _roomBusinessRules;

        public DeleteRoomCommandHandler(IMapper mapper, IRoomRepository roomRepository,
                                         RoomBusinessRules roomBusinessRules)
        {
            _mapper = mapper;
            _roomRepository = roomRepository;
            _roomBusinessRules = roomBusinessRules;
        }

        public async Task<DeletedRoomResponse> Handle(DeleteRoomCommand request, CancellationToken cancellationToken)
        {
            Room? room = await _roomRepository.GetAsync(predicate: r => r.Id == request.Id, cancellationToken: cancellationToken);
            await _roomBusinessRules.RoomShouldExistWhenSelected(room);

            await _roomRepository.DeleteAsync(room!);

            DeletedRoomResponse response = _mapper.Map<DeletedRoomResponse>(room);
            return response;
        }
    }
}