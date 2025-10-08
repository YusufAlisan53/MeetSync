using Application.Features.Meetings.Constants;
using Application.Features.Meetings.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using NArchitecture.Core.Application.Pipelines.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;

namespace Application.Features.Meetings.Queries.GetById;

public class GetByIdMeetingQuery : IRequest<GetByIdMeetingResponse>, ISecuredRequest
{
    public Guid Id { get; set; }

    public string[] Roles => [Admin, Read, "System.Manager", "System.User"];

    public class GetByIdMeetingQueryHandler : IRequestHandler<GetByIdMeetingQuery, GetByIdMeetingResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingRepository _meetingRepository;
        private readonly MeetingBusinessRules _meetingBusinessRules;

        public GetByIdMeetingQueryHandler(IMapper mapper, IMeetingRepository meetingRepository, MeetingBusinessRules meetingBusinessRules)
        {
            _mapper = mapper;
            _meetingRepository = meetingRepository;
            _meetingBusinessRules = meetingBusinessRules;
        }

        public async Task<GetByIdMeetingResponse> Handle(GetByIdMeetingQuery request, CancellationToken cancellationToken)
        {
            Meeting? meeting = await _meetingRepository.GetAsync(
                predicate: m => m.Id == request.Id, 
                include: m => m.Include(x => x.Room!),
                cancellationToken: cancellationToken);
            await _meetingBusinessRules.MeetingShouldExistWhenSelected(meeting);

            GetByIdMeetingResponse response = _mapper.Map<GetByIdMeetingResponse>(meeting);
            return response;
        }
    }
}