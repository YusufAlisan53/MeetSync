using NArchitecture.Core.Application.Responses;

namespace Application.Features.Users.Commands.Create;

public class CreatedUserResponse : IResponse
{
    public Guid Id { get; set; }
    public string UserName { get; set; }
    public string NameSurname { get; set; }
    public string Email { get; set; }
    public bool IsAdmin { get; set; }

    public CreatedUserResponse()
    {
        UserName = string.Empty;
        NameSurname = string.Empty;
        Email = string.Empty;
    }

    public CreatedUserResponse(Guid id, string nameSurname, string userName, string email, bool isAdmin)
    {
        Id = id;
        NameSurname = nameSurname;
        UserName = userName;
        Email = email;
        IsAdmin = isAdmin;
    }
}
