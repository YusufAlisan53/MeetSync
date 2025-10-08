using Application.Features.Auth.Dtos;
using Application.Features.Auth.Rules;
using Application.Services.AuthService;
using Application.Services.Repositories;
using Domain.Entities;
using MediatR;
using NArchitecture.Core.Application.Dtos;
using NArchitecture.Core.Application.Pipelines.Authorization;
using NArchitecture.Core.Security.Hashing;
using NArchitecture.Core.Security.JWT;
using static Application.Features.Users.Constants.UsersOperationClaims;

namespace Application.Features.Auth.Commands.Register;

public class RegisterCommand : IRequest<RegisteredResponse>
{
    public CustomUserForRegisterDto UserForRegisterDto { get; set; }
    public string IpAddress { get; set; }

    public RegisterCommand()
    {
        UserForRegisterDto = null!;
        IpAddress = string.Empty;
    }

    public RegisterCommand(CustomUserForRegisterDto userForRegisterDto, string ipAddress)
    {
        UserForRegisterDto = userForRegisterDto;
        IpAddress = ipAddress;
    }

    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisteredResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IAuthService _authService;
        private readonly AuthBusinessRules _authBusinessRules;
        private readonly IOperationClaimRepository _operationClaimRepository;
        private readonly IUserOperationClaimRepository _userOperationClaimRepository;

        public RegisterCommandHandler(
            IUserRepository userRepository,
            IAuthService authService,
            AuthBusinessRules authBusinessRules,
            IOperationClaimRepository operationClaimRepository,
            IUserOperationClaimRepository userOperationClaimRepository
        )
        {
            _userRepository = userRepository;
            _authService = authService;
            _authBusinessRules = authBusinessRules;
            _operationClaimRepository = operationClaimRepository;
            _userOperationClaimRepository = userOperationClaimRepository;
        }

        public async Task<RegisteredResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            await _authBusinessRules.UserEmailShouldBeNotExists(request.UserForRegisterDto.Email);

            HashingHelper.CreatePasswordHash(
                request.UserForRegisterDto.Password,
                passwordHash: out byte[] passwordHash,
                passwordSalt: out byte[] passwordSalt
            );
            User newUser =
                new()
                {
                    Email = request.UserForRegisterDto.Email,
                    NameSurname = request.UserForRegisterDto.NameSurname,
                    UserName = request.UserForRegisterDto.UserName,
                    CustomRole = request.UserForRegisterDto.CustomRole,
                    PasswordHash = passwordHash,
                    PasswordSalt = passwordSalt,
                };
            User createdUser = await _userRepository.AddAsync(newUser);

            // Eğer admin olarak kaydedilecekse admin yetkisi ata
            if (request.UserForRegisterDto.IsAdmin)
            {
                var adminClaim = await _operationClaimRepository.GetAsync(oc => oc.Name == "Admin");
                
                if (adminClaim != null)
                {
                    var userOperationClaim = new UserOperationClaim
                    {
                        UserId = createdUser.Id,
                        OperationClaimId = adminClaim.Id
                    };
                    await _userOperationClaimRepository.AddAsync(userOperationClaim);
                }
            }
            
            // Seçilen operation claim'leri kullanıcıya ata
            if (request.UserForRegisterDto.OperationClaims != null && request.UserForRegisterDto.OperationClaims.Count > 0)
            {
                foreach (var operationClaimId in request.UserForRegisterDto.OperationClaims)
                {
                    var userOperationClaim = new UserOperationClaim
                    {
                        UserId = createdUser.Id,
                        OperationClaimId = operationClaimId
                    };
                    await _userOperationClaimRepository.AddAsync(userOperationClaim);
                }
            }

            AccessToken createdAccessToken = await _authService.CreateAccessToken(createdUser);

            Domain.Entities.RefreshToken createdRefreshToken = await _authService.CreateRefreshToken(
                createdUser,
                request.IpAddress
            );
            Domain.Entities.RefreshToken addedRefreshToken = await _authService.AddRefreshToken(createdRefreshToken);

            RegisteredResponse registeredResponse = new() { AccessToken = createdAccessToken, RefreshToken = addedRefreshToken };
            return registeredResponse;
        }
    }
}
