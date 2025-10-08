namespace Domain.Entities;

public class User : NArchitecture.Core.Security.Entities.User<Guid>
{
    public string NameSurname { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string CustomRole { get; set; } = string.Empty;
    public bool IsAdmin { get; set; } = false;
    public virtual ICollection<UserOperationClaim> UserOperationClaims { get; set; } = default!;
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = default!;
    public virtual ICollection<OtpAuthenticator> OtpAuthenticators { get; set; } = default!;
    public virtual ICollection<EmailAuthenticator> EmailAuthenticators { get; set; } = default!;
    public virtual ICollection<MeetingUser> MeetingUsers { get; set; } = default!;
}
