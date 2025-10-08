using NArchitecture.Core.Application.Dtos;

namespace Application.Features.OperationClaims.Queries.GetListForSelection;

public class GetListOperationClaimForSelectionListItemDto : IDto
{
    public int Id { get; set; }
    public string Name { get; set; }

    public GetListOperationClaimForSelectionListItemDto()
    {
        Name = string.Empty;
    }

    public GetListOperationClaimForSelectionListItemDto(int id, string name)
    {
        Id = id;
        Name = name;
    }
}
