using FluentValidation;

namespace Application.Features.MeetingUsers.Commands.Update;

public class UpdateMeetingUserCommandValidator : AbstractValidator<UpdateMeetingUserCommand>
{
    public UpdateMeetingUserCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
    }
}