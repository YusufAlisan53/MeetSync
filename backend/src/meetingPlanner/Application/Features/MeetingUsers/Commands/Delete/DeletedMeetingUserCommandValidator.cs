using FluentValidation;

namespace Application.Features.MeetingUsers.Commands.Delete;

public class DeleteMeetingUserCommandValidator : AbstractValidator<DeleteMeetingUserCommand>
{
    public DeleteMeetingUserCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
    }
}