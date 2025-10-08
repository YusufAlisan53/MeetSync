using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;

namespace Application.Features.Notifications.Commands.Create;

public class CreateNotificationCommand : IRequest<CreatedNotificationResponse>
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int Type { get; set; } // NotificationType enum değeri
    public Guid? RelatedMeetingId { get; set; }
}

public class CreateNotificationCommandHandler : IRequestHandler<CreateNotificationCommand, CreatedNotificationResponse>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IMapper _mapper;

    public CreateNotificationCommandHandler(INotificationRepository notificationRepository, IMapper mapper)
    {
        _notificationRepository = notificationRepository;
        _mapper = mapper;
    }

    public async Task<CreatedNotificationResponse> Handle(CreateNotificationCommand request, CancellationToken cancellationToken)
    {
        Notification notification = _mapper.Map<Notification>(request);
        notification.Id = Guid.NewGuid();
        notification.CreatedDate = DateTime.UtcNow;

        await _notificationRepository.AddAsync(notification);

        CreatedNotificationResponse response = _mapper.Map<CreatedNotificationResponse>(notification);
        return response;
    }
}

public class CreatedNotificationResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedDate { get; set; }
    public Guid? RelatedMeetingId { get; set; }
}

public class CreateNotificationMappingProfile : Profile
{
    public CreateNotificationMappingProfile()
    {
        CreateMap<CreateNotificationCommand, Notification>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => (NotificationType)src.Type));
        CreateMap<Notification, CreatedNotificationResponse>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => (int)src.Type));
    }
}
