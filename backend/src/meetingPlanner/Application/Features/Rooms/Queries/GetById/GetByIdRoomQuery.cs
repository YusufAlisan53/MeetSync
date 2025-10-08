using Application.Features.Rooms.Constants;
using Application.Features.Rooms.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using static Application.Features.Rooms.Constants.RoomsOperationClaims;

namespace Application.Features.Rooms.Queries.GetById;

public class GetByIdRoomQuery : IRequest<GetByIdRoomResponse>
{
    public Guid Id { get; set; }

    public string[] Roles => [Admin, Read];

    public class GetByIdRoomQueryHandler : IRequestHandler<GetByIdRoomQuery, GetByIdRoomResponse>
    {
        private readonly IMapper _mapper;
        private readonly IRoomRepository _roomRepository;
        private readonly RoomBusinessRules _roomBusinessRules;

        public GetByIdRoomQueryHandler(IMapper mapper, IRoomRepository roomRepository, RoomBusinessRules roomBusinessRules)
        {
            _mapper = mapper;
            _roomRepository = roomRepository;
            _roomBusinessRules = roomBusinessRules;
        }

        public async Task<GetByIdRoomResponse> Handle(GetByIdRoomQuery request, CancellationToken cancellationToken)
        {
            Room? room = await _roomRepository.GetAsync(predicate: r => r.Id == request.Id, cancellationToken: cancellationToken);
            await _roomBusinessRules.RoomShouldExistWhenSelected(room);

            GetByIdRoomResponse response = _mapper.Map<GetByIdRoomResponse>(room);
            return response;
        }
    }
}