using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;
using NArchitecture.Core.Application.Requests;
using NArchitecture.Core.Application.Responses;
using NArchitecture.Core.Persistence.Paging;

namespace Application.Features.OperationClaims.Queries.GetListForSelection;

public class GetListOperationClaimForSelectionQuery : IRequest<GetListResponse<GetListOperationClaimForSelectionListItemDto>>
{
    public PageRequest PageRequest { get; set; }

    public GetListOperationClaimForSelectionQuery()
    {
        PageRequest = new PageRequest { PageIndex = 0, PageSize = 100 };
    }

    public GetListOperationClaimForSelectionQuery(PageRequest pageRequest)
    {
        PageRequest = pageRequest;
    }

    public class GetListOperationClaimForSelectionQueryHandler
        : IRequestHandler<GetListOperationClaimForSelectionQuery, GetListResponse<GetListOperationClaimForSelectionListItemDto>>
    {
        private readonly IOperationClaimRepository _operationClaimRepository;
        private readonly IMapper _mapper;

        public GetListOperationClaimForSelectionQueryHandler(IOperationClaimRepository operationClaimRepository, IMapper mapper)
        {
            _operationClaimRepository = operationClaimRepository;
            _mapper = mapper;
        }

        public async Task<GetListResponse<GetListOperationClaimForSelectionListItemDto>> Handle(
            GetListOperationClaimForSelectionQuery request,
            CancellationToken cancellationToken
        )
        {
            IPaginate<OperationClaim> operationClaims = await _operationClaimRepository.GetListAsync(
                index: request.PageRequest.PageIndex,
                size: request.PageRequest.PageSize,
                enableTracking: false,
                cancellationToken: cancellationToken
            );

            GetListResponse<GetListOperationClaimForSelectionListItemDto> response = _mapper.Map<
                GetListResponse<GetListOperationClaimForSelectionListItemDto>
            >(operationClaims);
            return response;
        }
    }
}
