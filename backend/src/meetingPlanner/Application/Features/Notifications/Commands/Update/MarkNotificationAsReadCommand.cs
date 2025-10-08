using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;

namespace Application.Features.Notifications.Commands.Update;

public class MarkNotificationAsReadCommand : IRequest<MarkNotificationAsReadResponse>
{
    public Guid Id { get; set; }
}

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, MarkNotificationAsReadResponse>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IMapper _mapper;

    public MarkNotificationAsReadCommandHandler(INotificationRepository notificationRepository, IMapper mapper)
    {
        _notificationRepository = notificationRepository;
        _mapper = mapper;
    }

    public async Task<MarkNotificationAsReadResponse> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        Notification? notification = await _notificationRepository.GetAsync(
            predicate: n => n.Id == request.Id && n.DeletedDate == null,
            cancellationToken: cancellationToken
        );

        if (notification == null)
            throw new Exception("Notification not found");

        notification.IsRead = true;
        notification.UpdatedDate = DateTime.UtcNow;

        await _notificationRepository.UpdateAsync(notification);

        MarkNotificationAsReadResponse response = _mapper.Map<MarkNotificationAsReadResponse>(notification);
        return response;
    }
}

public class MarkNotificationAsReadResponse
{
    public Guid Id { get; set; }
    public bool IsRead { get; set; }
}

public class MarkNotificationAsReadMappingProfile : Profile
{
    public MarkNotificationAsReadMappingProfile()
    {
        CreateMap<Notification, MarkNotificationAsReadResponse>();
    }
}
