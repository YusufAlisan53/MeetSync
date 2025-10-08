using FluentValidation;

namespace Application.Features.Meetings.Commands.Update;

public class UpdateMeetingCommandValidator : AbstractValidator<UpdateMeetingCommand>
{
    public UpdateMeetingCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.Subject).NotEmpty();
        RuleFor(c => c.Content).NotEmpty();
        RuleFor(c => c.StartDate).NotEmpty();
        RuleFor(c => c.Duration).NotEmpty();
    }
}