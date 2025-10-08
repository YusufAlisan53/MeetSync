using NArchitecture.Core.Application.Dtos;

namespace Application.Features.Users.Queries.GetList;

public class GetListUserListItemDto : IDto
{
    public Guid Id { get; set; }
    public string NameSurname { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public bool IsAdmin { get; set; }

    public GetListUserListItemDto()
    {
        NameSurname = string.Empty;
        UserName = string.Empty;
        Email = string.Empty;
    }

    public GetListUserListItemDto(Guid id, string nameSurname, string userName, string email, bool isAdmin)
    {
        Id = id;
        NameSurname = nameSurname;
        UserName = userName;
        Email = email;
        IsAdmin = isAdmin;
    }
}
