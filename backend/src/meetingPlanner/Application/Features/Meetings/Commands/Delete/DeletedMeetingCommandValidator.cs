using FluentValidation;

namespace Application.Features.Meetings.Commands.Delete;

public class DeleteMeetingCommandValidator : AbstractValidator<DeleteMeetingCommand>
{
    public DeleteMeetingCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
    }
}