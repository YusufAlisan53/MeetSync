using FluentValidation;

namespace Application.Features.Rooms.Commands.Create;

public class CreateRoomCommandValidator : AbstractValidator<CreateRoomCommand>
{
    public CreateRoomCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Capacity).NotEmpty();
        RuleFor(c => c.LocationInfo).NotEmpty();
        RuleFor(c => c.Details).NotEmpty();
    }
}