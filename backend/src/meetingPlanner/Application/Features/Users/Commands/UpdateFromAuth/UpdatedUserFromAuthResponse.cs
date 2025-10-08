using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Security.JWT;

namespace Application.Features.Users.Commands.UpdateFromAuth;

public class UpdatedUserFromAuthResponse : IResponse
{
    public Guid Id { get; set; }
    public string NameSurname { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public AccessToken AccessToken { get; set; }

    public UpdatedUserFromAuthResponse()
    {
        NameSurname = string.Empty;
        UserName = string.Empty;
        Email = string.Empty;
        AccessToken = null!;
    }

    public UpdatedUserFromAuthResponse(Guid id, string nameSurname, string userName, string email, AccessToken accessToken)
    {
        Id = id;
        NameSurname = nameSurname;
        UserName = userName;
        Email = email;
        AccessToken = accessToken;
    }
}
