using FluentValidation;

namespace Application.Features.Meetings.Commands.Create;

public class CreateMeetingCommandValidator : AbstractValidator<CreateMeetingCommand>
{
    public CreateMeetingCommandValidator()
    {
        RuleFor(c => c.Subject).NotEmpty();
        RuleFor(c => c.Content).NotEmpty();
        RuleFor(c => c.StartDate).NotEmpty();
        RuleFor(c => c.Duration).NotEmpty();
    }
}