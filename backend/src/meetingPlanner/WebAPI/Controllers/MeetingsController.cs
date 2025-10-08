using Application.Features.Meetings.Commands.Approve;
using Application.Features.Meetings.Commands.Create;
using Application.Features.Meetings.Commands.Delete;
using Application.Features.Meetings.Commands.Reject;
using Application.Features.Meetings.Commands.Update;
using Application.Features.Meetings.Queries.GetById;
using Application.Features.Meetings.Queries.GetList;
using Application.Features.Meetings.Queries.GetPendingList;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using Microsoft.AspNetCore.Mvc;
using Application.Features.Meetings.Queries.GetUserMeetingsFromAuth;
using Application.Features.Meetings.Queries.GetRecommendedRoomsList;

namespace WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MeetingsController : BaseController
{
    [HttpPost]
    public async Task<ActionResult<CreatedMeetingResponse>> Add([FromBody] CreateMeetingCommand command)
    {
        // Token'dan user ID'sini al
        var userIdClaim = HttpContext.User.FindFirst("UserId");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            command.CreatedByUserId = userId;
        }

        CreatedMeetingResponse response = await Mediator.Send(command);

        return CreatedAtAction(nameof(GetById), new { response.Id }, response);
    }

    [HttpPut]
    public async Task<ActionResult<UpdatedMeetingResponse>> Update([FromBody] UpdateMeetingCommand command)
    {
        UpdatedMeetingResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<DeletedMeetingResponse>> Delete([FromRoute] Guid id)
    {
        DeleteMeetingCommand command = new() { Id = id };

        DeletedMeetingResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GetByIdMeetingResponse>> GetById([FromRoute] Guid id)
    {
        GetByIdMeetingQuery query = new() { Id = id };

        GetByIdMeetingResponse response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<GetListResponse<GetListMeetingListItemDto>>> GetList([FromQuery] PageRequest pageRequest)
    {
        GetListMeetingQuery query = new() { PageRequest = pageRequest };

        GetListResponse<GetListMeetingListItemDto> response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpGet("pending")]
    public async Task<ActionResult<GetListResponse<GetListMeetingListItemDto>>> GetPendingList([FromQuery] PageRequest pageRequest)
    {
        GetPendingMeetingQuery query = new() { PageRequest = pageRequest };

        GetListResponse<GetListMeetingListItemDto> response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpPost("approve/{id}")]
    public async Task<ActionResult> ApproveMeeting([FromRoute] Guid id)
    {
        // Token'dan admin user ID'sini al
        var userIdClaim = HttpContext.User.FindFirst("UserId");
        Guid? adminUserId = null;
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            adminUserId = userId;
        }

        ApproveMeetingCommand command = new() 
        { 
            MeetingId = id,
            ApprovedByUserId = adminUserId
        };

        await Mediator.Send(command);

        return Ok(new { message = "Meeting approved successfully" });
    }

    [HttpPost("reject/{id}")]
    public async Task<ActionResult> RejectMeeting([FromRoute] Guid id)
    {
        // Token'dan admin user ID'sini al
        var userIdClaim = HttpContext.User.FindFirst("UserId");
        Guid? adminUserId = null;
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            adminUserId = userId;
        }

        RejectMeetingCommand command = new() 
        { 
            MeetingId = id,
            RejectedByUserId = adminUserId
        };

        await Mediator.Send(command);

        return Ok(new { message = "Meeting rejected successfully" });
    }

    [HttpGet("debug")]
    public async Task<ActionResult> Debug()
    {
        try
        {
            // Tüm meetings'i ve pending meetings'i kontrol et
            var allMeetings = await Mediator.Send(new GetListMeetingQuery { PageRequest = new PageRequest { PageIndex = 0, PageSize = 100 } });
            var pendingMeetings = await Mediator.Send(new GetPendingMeetingQuery { PageRequest = new PageRequest { PageIndex = 0, PageSize = 100 } });
            
            return Ok(new { 
                totalMeetings = allMeetings.Count,
                pendingMeetings = pendingMeetings.Count,
                allMeetingsData = allMeetings.Items?.Take(3).Select(m => new {
                    m.Id,
                    m.Subject,
                    m.IsApproved,
                    m.CreatedByUserId,
                    m.CreatedByUserName,
                    m.RoomName
                }),
                pendingMeetingsData = pendingMeetings.Items?.Take(3).Select(m => new {
                    m.Id,
                    m.Subject,
                    m.IsApproved,
                    m.CreatedByUserId,
                    m.CreatedByUserName,
                    m.RoomName
                }),
                message = "Debug endpoint working!" 
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPost("check-availability")]
    public async Task<ActionResult> CheckRoomAvailability([FromBody] CheckRoomAvailabilityRequest request)
    {
        try
        {
            // Business rules'dan room availability kontrolü yap
            var meetingBusinessRules = HttpContext.RequestServices.GetRequiredService<Application.Features.Meetings.Rules.MeetingBusinessRules>();
            
            if (request.MeetingId.HasValue)
            {
                // Update durumu için
                await meetingBusinessRules.RoomShouldBeAvailableForMeetingUpdate(
                    request.MeetingId.Value, 
                    request.RoomId, 
                    request.StartDate, 
                    request.Duration);
            }
            else
            {
                // Create durumu için
                await meetingBusinessRules.RoomShouldBeAvailableForMeeting(
                    request.RoomId, 
                    request.StartDate, 
                    request.Duration);
            }

            return Ok(new { isAvailable = true, message = "Room is available" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { isAvailable = false, message = ex.Message });
        }
    }
    
    [HttpGet("GetUserMeetingsFromAuth")]
    public async Task<ActionResult<GetListResponse<GetUserMeetingsFromAuthListItemDto>>> GetUserMeetingsFromAuth([FromQuery] PageRequest pageRequest)
    {
        GetUserMeetingsFromAuthQuery getUserMeetingsFromAuthQuery = new() { PageRequest = pageRequest, Id = getUserIdFromRequest() };
        GetListResponse<GetUserMeetingsFromAuthListItemDto> response = await Mediator.Send(getUserMeetingsFromAuthQuery);
        return Ok(response);
    }

    [HttpGet("room/{roomId}")]
    public async Task<ActionResult<GetListResponse<GetListMeetingListItemDto>>> GetRoomMeetings(
        [FromRoute] Guid roomId, 
        [FromQuery] DateTime? startDate, 
        [FromQuery] DateTime? endDate,
        [FromQuery] PageRequest pageRequest)
    {
        GetListMeetingQuery query = new() { PageRequest = pageRequest };
        GetListResponse<GetListMeetingListItemDto> response = await Mediator.Send(query);
        
        // Filter by room and date range if provided
        var filteredItems = response.Items.Where(m => m.RoomId == roomId);
        
        if (startDate.HasValue)
        {
            filteredItems = filteredItems.Where(m => m.StartDate >= startDate.Value);
        }
        
        if (endDate.HasValue)
        {
            filteredItems = filteredItems.Where(m => m.StartDate <= endDate.Value);
        }
        
        var filteredResponse = new GetListResponse<GetListMeetingListItemDto>
        {
            Items = filteredItems.ToList(),
            Count = filteredItems.Count(),
            HasNext = false,
            HasPrevious = false,
            Index = 0,
            Pages = 1,
            Size = filteredItems.Count()
        };
        
        return Ok(filteredResponse);
    }
    
    [HttpGet("GetRecommendedRoomsList")]
    public async Task<ActionResult<GetRecommendedRoomsListResponse>> GetRecommendedRoomsList([FromQuery] GetRecommendedRoomsListQuery getRecommendedRoomsListQuery)
    {
        GetRecommendedRoomsListResponse response = await Mediator.Send(getRecommendedRoomsListQuery);
        return Ok(response);
    }
}

public class CheckRoomAvailabilityRequest
{
    public Guid RoomId { get; set; }
    public DateTime StartDate { get; set; }
    public TimeSpan Duration { get; set; }
    public Guid? MeetingId { get; set; } // Update için opsiyonel
}
