using Application.Features.Rooms.Commands.Create;
using Application.Features.Rooms.Commands.Delete;
using Application.Features.Rooms.Commands.Update;
using Application.Features.Rooms.Queries.GetById;
using Application.Features.Rooms.Queries.GetList;
using AutoMapper;
using NArchitecture.Core.Application.Responses;
using Domain.Entities;
using NArchitecture.Core.Persistence.Paging;

namespace Application.Features.Rooms.Profiles;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<CreateRoomCommand, Room>();
        CreateMap<Room, CreatedRoomResponse>();

        CreateMap<UpdateRoomCommand, Room>();
        CreateMap<Room, UpdatedRoomResponse>();

        CreateMap<DeleteRoomCommand, Room>();
        CreateMap<Room, DeletedRoomResponse>();

        CreateMap<Room, GetByIdRoomResponse>();

        CreateMap<Room, GetListRoomListItemDto>();
        CreateMap<IPaginate<Room>, GetListResponse<GetListRoomListItemDto>>();

    // DTO'dan DTO'ya mapping (Paginate<GetListRoomListItemDto> -> GetListResponse<GetListRoomListItemDto>)
    CreateMap<Paginate<GetListRoomListItemDto>, GetListResponse<GetListRoomListItemDto>>().ReverseMap();
    }
}