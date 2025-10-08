using FluentValidation;

namespace Application.Features.Rooms.Commands.Update;

public class UpdateRoomCommandValidator : AbstractValidator<UpdateRoomCommand>
{
    public UpdateRoomCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Capacity).NotEmpty();
        RuleFor(c => c.LocationInfo).NotEmpty();
        RuleFor(c => c.Details).NotEmpty();
    }
}