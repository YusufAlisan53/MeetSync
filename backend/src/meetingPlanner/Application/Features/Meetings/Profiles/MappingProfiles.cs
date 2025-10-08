using Application.Features.Meetings.Commands.Create;
using Application.Features.Meetings.Commands.Delete;
using Application.Features.Meetings.Commands.Update;
using Application.Features.Meetings.Queries.GetById;
using Application.Features.Meetings.Queries.GetList;
using Application.Features.Meetings.Queries.GetUserMeetingsFromAuth;
using AutoMapper;
using NArchitecture.Core.Application.Responses;
using Domain.Entities;
using NArchitecture.Core.Persistence.Paging;

namespace Application.Features.Meetings.Profiles;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<CreateMeetingCommand, Meeting>();
        CreateMap<Meeting, CreatedMeetingResponse>()
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room != null ? src.Room.Name : null));

        CreateMap<UpdateMeetingCommand, Meeting>();
        CreateMap<Meeting, UpdatedMeetingResponse>()
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room != null ? src.Room.Name : null));

        CreateMap<DeleteMeetingCommand, Meeting>();
        CreateMap<Meeting, DeletedMeetingResponse>();

        CreateMap<Meeting, GetByIdMeetingResponse>()
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room != null ? src.Room.Name : null));

        CreateMap<MeetingUser, MeetingUserDto>();

        CreateMap<Meeting, GetListMeetingListItemDto>()
            .ForMember(dest => dest.CreatedByUserName, opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.NameSurname : null))
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room != null ? src.Room.Name : null));

        CreateMap<IPaginate<Meeting>, GetListResponse<GetListMeetingListItemDto>>();

        // Mappings for GetUserMeetingsFromAuth query DTOs
        CreateMap<MeetingUser, GetUserMeetingsMeetingUserDto>()
            .ForMember(dest => dest.UserNameSurname, opt => opt.MapFrom(src => src.User != null ? src.User.NameSurname : string.Empty))
            .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty));

        CreateMap<Meeting, GetUserMeetingsFromAuthListItemDto>()
            .ForMember(dest => dest.CreatedByUserName, opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.NameSurname : null))
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room != null ? src.Room.Name : null))
            .ForMember(dest => dest.Users, opt => opt.MapFrom(src => src.Users));

        CreateMap<IPaginate<Meeting>, GetListResponse<GetUserMeetingsFromAuthListItemDto>>();
    }
}