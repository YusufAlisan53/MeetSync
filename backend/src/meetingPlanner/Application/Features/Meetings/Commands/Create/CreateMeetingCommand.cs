using Application.Features.Meetings.Constants;
using Application.Features.Meetings.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NArchitecture.Core.Application.Pipelines.Authorization;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;

namespace Application.Features.Meetings.Commands.Create;

public class CreateMeetingCommand : IRequest<CreatedMeetingResponse>, ISecuredRequest
{
    public required string Subject { get; set; }
    public required string Content { get; set; }
    public required Guid RoomId { get; set; }
    public required DateTime StartDate { get; set; }
    public required TimeSpan Duration { get; set; }
    public Guid? CreatedByUserId { get; set; } // Oluşturan kullanıcı ID'si

    public string[] Roles => [Admin, MeetingsOperationClaims.CreateRequest, "System.Manager", "System.User"];

    public class CreateMeetingCommandHandler : IRequestHandler<CreateMeetingCommand, CreatedMeetingResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingRepository _meetingRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly MeetingBusinessRules _meetingBusinessRules;

        public CreateMeetingCommandHandler(IMapper mapper, IMeetingRepository meetingRepository,
                                         MeetingBusinessRules meetingBusinessRules, IRoomRepository roomRepository)
        {
            _mapper = mapper;
            _meetingRepository = meetingRepository;
            _meetingBusinessRules = meetingBusinessRules;
            _roomRepository = roomRepository;
        }

        public async Task<CreatedMeetingResponse> Handle(CreateMeetingCommand request, CancellationToken cancellationToken)
        {
            Meeting meeting = _mapper.Map<Meeting>(request);

            // Gelen UTC tarihini Türkiye saatine çevir
            if (meeting.StartDate.Kind == DateTimeKind.Utc)
            {
                // UTC'den Türkiye saatine çevir (+3 saat)
                meeting.StartDate = meeting.StartDate.AddHours(3);
                meeting.StartDate = DateTime.SpecifyKind(meeting.StartDate, DateTimeKind.Unspecified);
            }
            else if (meeting.StartDate.Kind == DateTimeKind.Unspecified)
            {
                // Unspecified olan tarihleri local time olarak kabul et
                meeting.StartDate = DateTime.SpecifyKind(meeting.StartDate, DateTimeKind.Local);
            }

            Room? room = await _roomRepository.GetAsync(x => x.Id == request.RoomId);

            // Business rule ile kontrol et
            await _meetingBusinessRules.RoomShouldExistsWhenSelected(room);
            await _meetingBusinessRules.RoomShouldBeAvailableForMeeting(request.RoomId, request.StartDate, request.Duration);

            // RoomId'yi set et
            meeting.RoomId = request.RoomId;

            // Approval sistemini ayarla
            meeting.IsApproved = false; // Varsayılan olarak onaylanmamış
            meeting.CreatedByUserId = request.CreatedByUserId;
            meeting.ApprovedByUserId = null;
            meeting.ApprovedDate = null;

            await _meetingRepository.AddAsync(meeting);

            // Response için Room bilgisini include et
            var createdMeeting = await _meetingRepository.GetAsync(
                predicate: m => m.Id == meeting.Id,
                include: m => m.Include(x => x.Room!),
                cancellationToken: cancellationToken);

            CreatedMeetingResponse response = _mapper.Map<CreatedMeetingResponse>(createdMeeting);
            return response;
        }
    }
}