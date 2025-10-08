using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Persistence.Paging;

namespace Application.Features.Notifications.Queries.GetList;

public class GetListNotificationQuery : IRequest<GetListResponse<GetListNotificationListItemDto>>
{
    public Guid UserId { get; set; }
    public PageRequest PageRequest { get; set; }

    public GetListNotificationQuery()
    {
        PageRequest = new PageRequest { PageIndex = 0, PageSize = 10 };
    }

    public GetListNotificationQuery(Guid userId, PageRequest pageRequest)
    {
        UserId = userId;
        PageRequest = pageRequest;
    }
}

public class GetListNotificationQueryHandler : IRequestHandler<GetListNotificationQuery, GetListResponse<GetListNotificationListItemDto>>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IMapper _mapper;

    public GetListNotificationQueryHandler(INotificationRepository notificationRepository, IMapper mapper)
    {
        _notificationRepository = notificationRepository;
        _mapper = mapper;
    }

    public async Task<GetListResponse<GetListNotificationListItemDto>> Handle(GetListNotificationQuery request, CancellationToken cancellationToken)
    {
        IPaginate<Notification> notifications = await _notificationRepository.GetListAsync(
            predicate: n => n.UserId == request.UserId && n.DeletedDate == null,
            orderBy: q => q.OrderByDescending(n => n.CreatedDate),
            include: n => n.Include(x => x.RelatedMeeting),
            index: request.PageRequest.PageIndex,
            size: request.PageRequest.PageSize,
            cancellationToken: cancellationToken
        );

        GetListResponse<GetListNotificationListItemDto> response = _mapper.Map<GetListResponse<GetListNotificationListItemDto>>(notifications);
        return response;
    }
}

public class GetListNotificationListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedDate { get; set; }
    public Guid? RelatedMeetingId { get; set; }
    public string? RelatedMeetingSubject { get; set; }
}

public class GetListNotificationMappingProfile : Profile
{
    public GetListNotificationMappingProfile()
    {
        CreateMap<Notification, GetListNotificationListItemDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => (int)src.Type))
            .ForMember(dest => dest.RelatedMeetingSubject, opt => opt.MapFrom(src => src.RelatedMeeting != null ? src.RelatedMeeting.Subject : null));
        CreateMap<Paginate<Notification>, GetListResponse<GetListNotificationListItemDto>>();
    }
}
