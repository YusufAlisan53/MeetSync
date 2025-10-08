using Application.Features.MeetingUsers.Commands.Create;
using Application.Features.MeetingUsers.Commands.Delete;
using Application.Features.MeetingUsers.Commands.Update;
using Application.Features.MeetingUsers.Commands.UpdateStatus;
using Application.Features.MeetingUsers.Queries.GetById;
using Application.Features.MeetingUsers.Queries.GetList;
using Application.Features.MeetingUsers.Queries.GetPendingApprovals;
using AutoMapper;
using NArchitecture.Core.Application.Responses;
using Domain.Entities;
using NArchitecture.Core.Persistence.Paging;

namespace Application.Features.MeetingUsers.Profiles;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<CreateMeetingUserCommand, MeetingUser>();
        CreateMap<MeetingUser, CreatedMeetingUserResponse>();

        CreateMap<UpdateMeetingUserCommand, MeetingUser>();
        CreateMap<MeetingUser, UpdatedMeetingUserResponse>();

        CreateMap<MeetingUser, UpdatedMeetingUserStatusResponse>();

        CreateMap<DeleteMeetingUserCommand, MeetingUser>();
        CreateMap<MeetingUser, DeletedMeetingUserResponse>();

        CreateMap<MeetingUser, GetByIdMeetingUserResponse>();

        CreateMap<MeetingUser, GetListMeetingUserListItemDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : string.Empty))
            .ForMember(dest => dest.UserNameSurname, opt => opt.MapFrom(src => src.User != null ? src.User.NameSurname : string.Empty));
        CreateMap<IPaginate<MeetingUser>, GetListResponse<GetListMeetingUserListItemDto>>();

        CreateMap<MeetingUser, PendingApprovalListItemDto>()
            .ForMember(dest => dest.MeetingSubject, opt => opt.MapFrom(src => src.Meeting.Subject))
            .ForMember(dest => dest.MeetingContent, opt => opt.MapFrom(src => src.Meeting.Content))
            .ForMember(dest => dest.MeetingStartDate, opt => opt.MapFrom(src => src.Meeting.StartDate))
            .ForMember(dest => dest.MeetingDuration, opt => opt.MapFrom(src => src.Meeting.Duration))
            .ForMember(dest => dest.MeetingCreatedByName, opt => opt.MapFrom(src => src.Meeting.CreatedByUser != null ? src.Meeting.CreatedByUser.NameSurname : string.Empty))
            .ForMember(dest => dest.MeetingRoomName, opt => opt.MapFrom(src => src.Meeting.Room != null ? src.Meeting.Room.Name : null));
        
        CreateMap<IPaginate<MeetingUser>, GetListResponse<PendingApprovalListItemDto>>();
    }
}