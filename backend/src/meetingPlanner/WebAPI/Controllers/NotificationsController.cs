using Application.Features.Notifications.Commands.Create;
using Application.Features.Notifications.Commands.Update;
using Application.Features.Notifications.Queries.GetList;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;

namespace WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NotificationsController : BaseController
{
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<GetListResponse<GetListNotificationListItemDto>>> GetUserNotifications(
        [FromRoute] Guid userId, 
        [FromQuery] PageRequest pageRequest)
    {
        GetListNotificationQuery query = new() { UserId = userId, PageRequest = pageRequest };
        GetListResponse<GetListNotificationListItemDto> response = await Mediator.Send(query);
        return Ok(response);
    }

    [HttpGet("unread-count/{userId}")]
    public async Task<ActionResult<int>> GetUnreadCount([FromRoute] Guid userId)
    {
        GetListNotificationQuery query = new() { UserId = userId, PageRequest = new PageRequest { PageIndex = 0, PageSize = 1000 } };
        GetListResponse<GetListNotificationListItemDto> response = await Mediator.Send(query);
        
        int unreadCount = response.Items.Count(n => !n.IsRead);
        return Ok(unreadCount);
    }

    [HttpPost("meeting-invitation")]
    public async Task<ActionResult> SendMeetingInvitation([FromBody] MeetingInvitationRequest request)
    {
        // Her davet edilen kullanıcı için bildirim oluştur
        foreach (var userId in request.UserIds)
        {
            CreateNotificationCommand command = new()
            {
                UserId = userId,
                Title = "Yeni Toplantı Davetiyesi",
                Message = "Size yeni bir toplantı davetiyesi gönderildi.",
                Type = (int)NotificationType.MeetingInvitation,
                RelatedMeetingId = request.MeetingId
            };
            await Mediator.Send(command);
        }

        return Ok(new { message = "Meeting invitation notifications sent successfully" });
    }

    [HttpPost("meeting-status")]
    public async Task<ActionResult> SendMeetingStatusNotification([FromBody] MeetingStatusRequest request)
    {
        string title;
        string message;
        NotificationType type;

        if (request.Status.ToLower() == "approved")
        {
            title = "Toplantı Onaylandı";
            message = "Toplantınız onaylandı.";
            type = NotificationType.MeetingApproved;
        }
        else if (request.Status.ToLower() == "rejected")
        {
            title = "Toplantı Reddedildi";
            message = "Toplantınız reddedildi.";
            type = NotificationType.MeetingRejected;
        }
        else
        {
            return BadRequest("Invalid status");
        }

        // Aynı meeting için aynı status'ta bildirim var mı kontrol et
        GetListNotificationQuery checkQuery = new() 
        { 
            UserId = request.UserId, 
            PageRequest = new PageRequest { PageIndex = 0, PageSize = 100 } 
        };
        var existingNotifications = await Mediator.Send(checkQuery);
        
        bool alreadyExists = existingNotifications.Items.Any(n => 
            n.RelatedMeetingId == request.MeetingId && 
            n.Type == (int)type
        );

        if (alreadyExists)
        {
            return Ok(new { message = "Notification already exists for this meeting status" });
        }

        CreateNotificationCommand command = new()
        {
            UserId = request.UserId,
            Title = title,
            Message = message,
            Type = (int)type,
            RelatedMeetingId = request.MeetingId
        };

        await Mediator.Send(command);
        return Ok(new { message = "Meeting status notification sent successfully" });
    }

    [HttpPost]
    public async Task<ActionResult<CreatedNotificationResponse>> CreateNotification([FromBody] CreateNotificationRequest request)
    {
        CreateNotificationCommand command = new()
        {
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            RelatedMeetingId = request.RelatedMeetingId
        };

        CreatedNotificationResponse response = await Mediator.Send(command);
        return Ok(response);
    }

    [HttpPut("{id}/mark-read")]
    public async Task<ActionResult<MarkNotificationAsReadResponse>> MarkAsRead([FromRoute] Guid id)
    {
        MarkNotificationAsReadCommand command = new() { Id = id };
        MarkNotificationAsReadResponse response = await Mediator.Send(command);
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public ActionResult DeleteNotification([FromRoute] Guid id)
    {
        // Soft delete - sadece DeletedDate'i set et
        // Bu endpoint ihtiyaç duyulursa implement edilebilir
        return Ok(new { message = "Notification deleted successfully" });
    }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public bool IsRead { get; set; }
}

public class MeetingInvitationRequest
{
    public Guid MeetingId { get; set; }
    public List<Guid> UserIds { get; set; } = new();
}

public class MeetingStatusRequest
{
    public Guid MeetingId { get; set; }
    public string Status { get; set; } = string.Empty; // "approved", "rejected"
    public Guid UserId { get; set; }
}

public class CreateNotificationRequest
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int Type { get; set; } // NotificationType enum değeri
    public Guid? RelatedMeetingId { get; set; }
}
