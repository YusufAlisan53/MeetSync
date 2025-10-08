using NArchitecture.Core.Application.Dtos;

namespace Application.Features.Auth.Dtos;

public class CustomUserForRegisterDto : IDto
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string NameSurname { get; set; }
    public string UserName { get; set; }
    public string CustomRole { get; set; } = string.Empty; // Özel rol adı
    public bool IsAdmin { get; set; } = false; // Admin olup olmadığı
    public List<int> OperationClaims { get; set; } = new(); // Seçilen operation claim ID'leri

    public CustomUserForRegisterDto()
    {
        Email = string.Empty;
        Password = string.Empty;
        NameSurname = string.Empty;
        UserName = string.Empty;
        CustomRole = string.Empty;
        IsAdmin = false;
        OperationClaims = new List<int>();
    }

    public CustomUserForRegisterDto(string email, string password, string nameSurname, string userName, string customRole = "", bool isAdmin = false, List<int>? operationClaims = null)
    {
        Email = email;
        Password = password;
        NameSurname = nameSurname;
        UserName = userName;
        CustomRole = customRole;
        IsAdmin = isAdmin;
        OperationClaims = operationClaims ?? new List<int>();
    }
}
