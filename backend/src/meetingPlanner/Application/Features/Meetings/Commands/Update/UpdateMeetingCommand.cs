using Application.Features.Meetings.Constants;
using Application.Features.Meetings.Rules;
using Application.Services.Repositories;
using AutoMapper;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NArchitecture.Core.Application.Pipelines.Authorization;
using static Application.Features.Meetings.Constants.MeetingsOperationClaims;

namespace Application.Features.Meetings.Commands.Update;

public class UpdateMeetingCommand : IRequest<UpdatedMeetingResponse>, ISecuredRequest
{
    public Guid Id { get; set; }
    public required string Subject { get; set; }
    public required string Content { get; set; }
    public required Guid RoomId { get; set; }
    public required DateTime StartDate { get; set; }
    public required TimeSpan Duration { get; set; }

    public string[] Roles => new[] { Admin, MeetingsOperationClaims.Update, "System.Manager", "System.User" };

    public class UpdateMeetingCommandHandler : IRequestHandler<UpdateMeetingCommand, UpdatedMeetingResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMeetingRepository _meetingRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly MeetingBusinessRules _meetingBusinessRules;

        public UpdateMeetingCommandHandler(IMapper mapper, IMeetingRepository meetingRepository,
                                         MeetingBusinessRules meetingBusinessRules, IRoomRepository roomRepository)
        {
            _mapper = mapper;
            _meetingRepository = meetingRepository;
            _roomRepository = roomRepository;
            _meetingBusinessRules = meetingBusinessRules;
        }

        public async Task<UpdatedMeetingResponse> Handle(UpdateMeetingCommand request, CancellationToken cancellationToken)
        {
            Console.WriteLine($"🔄 UPDATE MEETING STARTED - ID: {request.Id}");
            Console.WriteLine($"🔄 Update request details: Subject='{request.Subject}', RoomId={request.RoomId}, StartDate={request.StartDate}, Duration={request.Duration}");

            Meeting? meeting = await _meetingRepository.GetAsync(predicate: m => m.Id == request.Id, cancellationToken: cancellationToken);
            Console.WriteLine($"🔄 Found meeting: {meeting?.Subject} (ID: {meeting?.Id})");
            
            await _meetingBusinessRules.MeetingShouldExistWhenSelected(meeting);

            // Room kontrolü
            Room? room = await _roomRepository.GetAsync(x => x.Id == request.RoomId);
            Console.WriteLine($"🔄 Found room: {room?.Name} (ID: {room?.Id})");
            
            await _meetingBusinessRules.RoomShouldExistsWhenSelected(room);
            
            Console.WriteLine($"🔄 Starting room availability check for update...");
            // Room çakışma kontrolü (güncellenen toplantı hariç)
            await _meetingBusinessRules.RoomShouldBeAvailableForMeetingUpdate(
                request.Id, request.RoomId, request.StartDate, request.Duration);
            Console.WriteLine($"✅ Room availability check passed for update");

            meeting = _mapper.Map(request, meeting);
            
            // RoomId'yi set et
            if (meeting != null)
            {
                meeting.RoomId = request.RoomId;
                Console.WriteLine($"🔄 Updated meeting room ID to: {meeting.RoomId}");
            }

            await _meetingRepository.UpdateAsync(meeting!);
            Console.WriteLine($"✅ Meeting updated in database");

            // Response için Room bilgisini include et
            var updatedMeeting = await _meetingRepository.GetAsync(
                predicate: m => m.Id == meeting!.Id,
                include: m => m.Include(x => x.Room!),
                cancellationToken: cancellationToken);

            UpdatedMeetingResponse response = _mapper.Map<UpdatedMeetingResponse>(updatedMeeting);
            Console.WriteLine($"✅ UPDATE MEETING COMPLETED - ID: {response.Id}, RoomName: {response.RoomName}");
            
            return response;
        }
    }
}