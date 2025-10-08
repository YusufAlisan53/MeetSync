using FluentValidation;

namespace Application.Features.MeetingUsers.Commands.Create;

public class CreateMeetingUserCommandValidator : AbstractValidator<CreateMeetingUserCommand>
{
    public CreateMeetingUserCommandValidator()
    {
    }
}