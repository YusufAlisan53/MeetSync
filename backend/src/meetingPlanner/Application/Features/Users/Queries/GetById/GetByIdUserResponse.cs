using NArchitecture.Core.Application.Responses;

namespace Application.Features.Users.Queries.GetById;

public class GetByIdUserResponse : IResponse
{
    public Guid Id { get; set; }
    public string NameSurname { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public bool IsAdmin { get; set; }

    public GetByIdUserResponse()
    {
        NameSurname = string.Empty;
        UserName = string.Empty;
        Email = string.Empty;
    }

    public GetByIdUserResponse(Guid id, string nameSurname, string userName, string email, bool isAdmin)
    {
        Id = id;
        NameSurname = nameSurname;
        UserName = userName;
        Email = email;
        IsAdmin = isAdmin;
    }
}
