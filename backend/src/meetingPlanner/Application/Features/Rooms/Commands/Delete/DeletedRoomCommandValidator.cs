using FluentValidation;

namespace Application.Features.Rooms.Commands.Delete;

public class DeleteRoomCommandValidator : AbstractValidator<DeleteRoomCommand>
{
    public DeleteRoomCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
    }
}