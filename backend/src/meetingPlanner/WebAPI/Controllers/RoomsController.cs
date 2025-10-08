using Application.Features.Rooms.Commands.Create;
using Application.Features.Rooms.Commands.Delete;
using Application.Features.Rooms.Commands.Update;
using Application.Features.Rooms.Queries.GetById;
using Application.Features.Rooms.Queries.GetList;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RoomsController : BaseController
{
    [HttpPost]
    public async Task<ActionResult<CreatedRoomResponse>> Add([FromBody] CreateRoomCommand command)
    {
        CreatedRoomResponse response = await Mediator.Send(command);

        return CreatedAtAction(nameof(GetById), new { response.Id }, response);
    }

    [HttpPut]
    public async Task<ActionResult<UpdatedRoomResponse>> Update([FromBody] UpdateRoomCommand command)
    {
        UpdatedRoomResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<DeletedRoomResponse>> Delete([FromRoute] Guid id)
    {
        DeleteRoomCommand command = new() { Id = id };

        DeletedRoomResponse response = await Mediator.Send(command);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GetByIdRoomResponse>> GetById([FromRoute] Guid id)
    {
        GetByIdRoomQuery query = new() { Id = id };

        GetByIdRoomResponse response = await Mediator.Send(query);

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<GetListResponse<GetListRoomListItemDto>>> GetList([FromQuery] PageRequest pageRequest)
    {
        GetListRoomQuery query = new() { PageRequest = pageRequest };

        GetListResponse<GetListRoomListItemDto> response = await Mediator.Send(query);

        return Ok(response);
    }
}