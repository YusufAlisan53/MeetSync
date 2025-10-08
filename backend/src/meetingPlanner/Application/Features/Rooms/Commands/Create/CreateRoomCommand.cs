using Application.Features.Rooms.Constants;
using Application.Features.Rooms.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.Rooms.Constants.RoomsOperationClaims;

namespace Application.Features.Rooms.Commands.Create;

public class CreateRoomCommand : IRequest<CreatedRoomResponse>
{
    public required string Name { get; set; }
    public required int Capacity { get; set; }
    public required string LocationInfo { get; set; }
    public required string Details { get; set; }

    public string[] Roles => [Admin, Write, RoomsOperationClaims.Create];

    public class CreateRoomCommandHandler : IRequestHandler<CreateRoomCommand, CreatedRoomResponse>
    {
        private readonly IMapper _mapper;
        private readonly IRoomRepository _roomRepository;
        private readonly RoomBusinessRules _roomBusinessRules;

        public CreateRoomCommandHandler(IMapper mapper, IRoomRepository roomRepository,
                                         RoomBusinessRules roomBusinessRules)
        {
            _mapper = mapper;
            _roomRepository = roomRepository;
            _roomBusinessRules = roomBusinessRules;
        }

        public async Task<CreatedRoomResponse> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
        {
            Room room = _mapper.Map<Room>(request);

            await _roomBusinessRules.RoomNameMustBeUnique(room);

            await _roomRepository.AddAsync(room);

            CreatedRoomResponse response = _mapper.Map<CreatedRoomResponse>(room);
            return response;
        }
    }
}