using Application.Features.MeetingUsers.Commands.Create;
using Application.Features.MeetingUsers.Commands.Delete;
using Application.Features.MeetingUsers.Commands.Update;
using Application.Features.MeetingUsers.Commands.UpdateStatus;
using Application.Features.MeetingUsers.Queries.GetById;
using Application.Features.MeetingUsers.Queries.GetList;
using Application.Features.MeetingUsers.Queries.GetPendingApprovals;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MeetingUsersController : BaseController
{
    [HttpPost]
    public async Task<ActionResult<CreatedMeetingUserResponse>> Add([FromBody] CreateMeetingUserCommand command)
    {
        CreatedMeetingUserResponse response = await Mediator.Send(command);

        return CreatedAtAction(nameof(GetById), new { response.Id }, response);
    }

    [HttpPut]
    public async Task<ActionResult<UpdatedMeetingUserResponse>> Update([FromBody] UpdateMeetingUserCommand command)
    {
        UpdatedMeetingUserResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpPut("status")]
    public async Task<ActionResult<UpdatedMeetingUserStatusResponse>> UpdateStatus([FromBody] UpdateMeetingUserStatusCommand command)
    {
        UpdatedMeetingUserStatusResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<DeletedMeetingUserResponse>> Delete([FromRoute] Guid id)
    {
        DeleteMeetingUserCommand command = new() { Id = id };

        DeletedMeetingUserResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GetByIdMeetingUserResponse>> GetById([FromRoute] Guid id)
    {
        GetByIdMeetingUserQuery query = new() { Id = id };

        GetByIdMeetingUserResponse response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<GetListResponse<GetListMeetingUserListItemDto>>> GetList([FromQuery] PageRequest pageRequest)
    {
        GetListMeetingUserQuery query = new() { PageRequest = pageRequest };

        GetListResponse<GetListMeetingUserListItemDto> response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpGet("meeting/{meetingId}")]
    public async Task<ActionResult<GetListResponse<GetListMeetingUserListItemDto>>> GetByMeetingId(
        [FromRoute] Guid meetingId, 
        [FromQuery] PageRequest pageRequest)
    {
        GetListMeetingUserQuery query = new() { 
            PageRequest = pageRequest,
            MeetingId = meetingId 
        };

        GetListResponse<GetListMeetingUserListItemDto> response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpGet("pending-approvals/{userId}")]
    public async Task<ActionResult<GetListResponse<PendingApprovalListItemDto>>> GetPendingApprovals(
        [FromRoute] Guid userId, 
        [FromQuery] PageRequest pageRequest)
    {
        GetPendingApprovalsQuery query = new() { UserId = userId, PageRequest = pageRequest };

        GetListResponse<PendingApprovalListItemDto> response = await Mediator.Send(query);

        return Ok(response);
    }
}