import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { TimeIcon, CalenderIcon } from "../icons";
import { meetingApiService, type UpdateMeetingCommand, type Room, type CreateMeetingCommand, type AlternativeSlot, type Meeting } from "../services/meetingApiService";
import { meetingUserApiService, type MeetingUser, MeetingUserStatus, type CreateMeetingUserCommand } from "../services/meetingUserApiService";
import { notificationApiService } from "../services/notificationApiService";
import type { User } from "../types/api";
import { useAuth } from "../hooks/useAuth";
import RoomSelectorWithAvailability from "../components/ui/RoomSelectorWithAvailability";
import RoomConflictModal from "../components/ui/RoomConflictModal";
import { useToast } from "../components/ui/ToastProvider";

interface CalendarEvent extends EventInput {
  extendedProps: {
    meetingId?: string; // Backend meeting ID'si
    content?: string;
    roomId?: string | null; // Backend'de nullable olabilir
    createdByUserId?: string; // Toplantıyı oluşturan kullanıcının ID'si
  };
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventContent, setEventContent] = useState("");
  const [eventRoomId, setEventRoomId] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventDuration, setEventDuration] = useState("01:00"); // saat:dakika formatında
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [myMeetings, setMyMeetings] = useState<Meeting[]>([]); // Kullanıcının kendi toplantıları
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const { user: currentUser } = useAuth();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [meetingParticipants, setMeetingParticipants] = useState<MeetingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoMode, setIsInfoMode] = useState(false); // Info modalı mı edit modalı mı
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    roomId: string;
    roomName: string;
    startDate: string;
    duration: string;
  } | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { showRoomConflictToast, showMeetingSuccessToast, showMeetingErrorToast } = useToast();
  // const { user: currentUser } = useAuth();

  // Permission helper functions
  const isManagerOrAdmin = (): boolean => {
    if (!currentUser) return false;
    
    // Debug: Tüm rolleri detaylı olarak logla
    console.log('🔍 DETAILED ROLES CHECK:', {
      allRoles: currentUser.roles,
      hasAdmin: currentUser.roles?.includes('Admin'),
      hasUsersAdmin: currentUser.roles?.includes('Users.Admin'),
      hasMeetingsAdmin: currentUser.roles?.includes('Meetings.Admin'),
      hasMeetingsRead: currentUser.roles?.includes('Meetings.Read'),
      hasSystemManager: currentUser.roles?.includes('System.Manager'),
      isAdmin: currentUser.isAdmin
    });
    
    // Sadece gerçekten manager/admin rollerine bak
    const hasManagerRole = currentUser.isAdmin || 
           currentUser.roles?.includes('Admin') || 
           currentUser.roles?.includes('Users.Admin') ||
           currentUser.roles?.includes('Meetings.Admin') ||
           currentUser.roles?.includes('System.Manager') ||
           false;
    
    console.log('🔍 isManagerOrAdmin check:', {
      hasManagerRole,
      userRoles: currentUser.roles,
      isAdmin: currentUser.isAdmin
    });
    
    return hasManagerRole;
  };

  const isSystemUser = (): boolean => {
    if (!currentUser) return false;
    return currentUser.roles?.includes('System.User') || false;
  };

  // Kullanıcının bir toplantıyı düzenleyip düzenleyemeyeceğini kontrol eder
  const canEditMeeting = (): boolean => {
    if (!currentUser || !selectedEvent?.extendedProps?.meetingId) {
      console.log('❌ canEditMeeting: No user or meeting');
      return false;
    }
    
    // System.Manager ve admin'ler tüm toplantıları düzenleyebilir
    if (isManagerOrAdmin()) {
      console.log('✅ canEditMeeting: User is manager/admin');
      return true;
    }
    
    // Normal kullanıcılar sadece kendi oluşturdukları toplantıları düzenleyebilir
    const meetingCreatorId = selectedEvent.extendedProps.createdByUserId;
    const meetingId = selectedEvent.extendedProps.meetingId;
    
    console.log('🔍 canEditMeeting detailed check:', {
      meetingId,
      meetingCreatorId,
      currentUserId: currentUser.id,
      isCreator: meetingCreatorId === currentUser.id,
      meetingCreatorIdType: typeof meetingCreatorId,
      currentUserIdType: typeof currentUser.id
    });
    
    // İlk önce createdByUserId ile kontrol et - SADECE eşleşme varsa true döndür
    if (meetingCreatorId && meetingCreatorId === currentUser.id) {
      console.log('✅ canEditMeeting: User is the creator (via createdByUserId)');
      return true;
    }
    
    // Eğer createdByUserId eksikse, kullanıcının oluşturduğu toplantıları kontrol et
    if (!meetingCreatorId && myMeetings.length > 0) {
      const isMyMeeting = myMeetings.some((meeting: Meeting) => meeting.id === meetingId);
      
      console.log('🔍 canEditMeeting fallback check:', {
        meetingId,
        isMyMeeting,
        createdMeetingsCount: myMeetings.length,
        note: 'Checking only meetings created by user, not participated'
      });
      
      if (isMyMeeting) {
        console.log('✅ canEditMeeting: User is the creator (via myMeetings)');
        return true;
      }
    }
    
    // Katılımcı olduğu ama oluşturmadığı toplantılar için false döndür
    if (meetingCreatorId && meetingCreatorId !== currentUser.id) {
      console.log('❌ canEditMeeting: User is participant but not creator');
      return false;
    }
    
    console.log('❌ canEditMeeting: Access denied');
    return false;
  };

  // Kullanıcının bir toplantıyı silip silemeyeceğini kontrol eder
  const   canDeleteMeeting = (): boolean => {
    if (!currentUser || !selectedEvent?.extendedProps?.meetingId) {
      console.log('❌ canDeleteMeeting: No user or meeting');
      return false;
    }
    
    // System.Manager ve admin'ler tüm toplantıları silebilir
    if (isManagerOrAdmin()) {
      console.log('✅ canDeleteMeeting: User is manager/admin');
      return true;
    }
    
    // Normal kullanıcılar sadece kendi oluşturdukları toplantıları silebilir
    const meetingCreatorId = selectedEvent.extendedProps.createdByUserId;
    const meetingId = selectedEvent.extendedProps.meetingId;
    
    console.log('🔍 canDeleteMeeting detailed check:', {
      meetingId,
      meetingCreatorId,
      currentUserId: currentUser.id,
      isCreator: meetingCreatorId === currentUser.id,
      meetingCreatorIdType: typeof meetingCreatorId,
      currentUserIdType: typeof currentUser.id
    });
    
    // İlk önce createdByUserId ile kontrol et - SADECE eşleşme varsa true döndür
    if (meetingCreatorId && meetingCreatorId === currentUser.id) {
      console.log('✅ canDeleteMeeting: User is the creator (via createdByUserId)');
      return true;
    }
    
    // Eğer createdByUserId eksikse, kullanıcının oluşturduğu toplantıları kontrol et
    if (!meetingCreatorId && myMeetings.length > 0) {
      const isMyMeeting = myMeetings.some((meeting: Meeting) => meeting.id === meetingId);
      
      console.log('🔍 canDeleteMeeting fallback check:', {
        meetingId,
        isMyMeeting,
        createdMeetingsCount: myMeetings.length,
        note: 'Checking only meetings created by user, not participated'
      });
      
      if (isMyMeeting) {
        console.log('✅ canDeleteMeeting: User is the creator (via myMeetings)');
        return true;
      }
    }
    
    // Katılımcı olduğu ama oluşturmadığı toplantılar için false döndür
    if (meetingCreatorId && meetingCreatorId !== currentUser.id) {
      console.log('❌ canDeleteMeeting: User is participant but not creator');
      return false;
    }
    
    console.log('❌ canDeleteMeeting: Access denied');
    return false;
  };

  useEffect(() => {
    loadMeetings();
    loadRooms();
    loadUsers();
  }, []);

  useEffect(() => {
    if (participantSearch.trim() === "") {
      setFilteredUsers([]);
    } else {
      const search = participantSearch.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.nameSurname.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        )
      );
    }
  }, [participantSearch, users]);

  const loadUsers = async () => {
    try {
      const usersData = await meetingUserApiService.getUsers();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const loadRooms = async () => {
    try {
      const roomsData = await meetingApiService.getRooms();
      setRooms(roomsData);
    } catch (err: any) {
      console.error('Error loading rooms:', err);
    }
  };

  const loadMeetings = async () => {
    console.log('🔍 DEBUG: loadMeetings başladı');
    console.log('🔍 DEBUG: currentUser:', currentUser);
    console.log('🔍 DEBUG: currentUser?.roles:', currentUser?.roles);
    
    try {
      setLoading(true);
      setError(null);
      
      // Debug için user ve rolleri logla
      console.log('Current User:', currentUser);
      console.log('User Roles:', currentUser?.roles);
      console.log('Is Manager or Admin:', isManagerOrAdmin());
      console.log('Is System User:', isSystemUser());
      
      let meetings: Meeting[] = [];
      
      // İlk olarak System.User rolü kontrolü yap (öncelik System.User'da)
      if (isSystemUser() && !currentUser?.roles?.includes('System.Manager')) {
        // Sadece System.User rolü olanlar (System.Manager rolü olmayanlar) kendi toplantılarını görebilir
        console.log('Loading my meetings for System.User (not Manager)');
        meetings = await meetingApiService.getMyMeetings();
      } else if (isManagerOrAdmin()) {
        // System.Manager ve Admin kullanıcılar tüm onaylanmış toplantıları görebilir
        console.log('Loading all meetings for Manager/Admin');
        meetings = await meetingApiService.getMeetings();
      } else {
        // Diğer tüm kullanıcılar sadece kendi toplantılarını görebilir
        console.log('Loading my meetings for other users');
        meetings = await meetingApiService.getMyMeetings();
      }
      
      // Kullanıcının kendi toplantılarını ayrıca sakla (yetki kontrolü için)
      const userMeetings = await meetingApiService.getMyMeetings();
      // Sadece kullanıcının oluşturduğu toplantıları filtrele (katılımcı olduğu toplantılar değil)
      const createdByUser = userMeetings.filter(meeting => meeting.createdByUserId === currentUser?.id);
      setMyMeetings(createdByUser);
      console.log('🔍 User created meetings loaded:', {
        totalUserMeetings: userMeetings.length,
        createdByUser: createdByUser.length,
        currentUserId: currentUser?.id
      });
      
      // Backend meeting'lerini Calendar event formatına çevir (sadece onaylı olanlar)
      const approvedMeetings = meetings.filter(meeting => meeting.isApproved);
      const calendarEvents: CalendarEvent[] = approvedMeetings.map(meeting => {
        const startDate = new Date(meeting.startDate);
        const durationMinutes = meetingApiService.timeSpanToMinutes(meeting.duration);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        // Debug: createdByUserId kontrolü
        console.log('🔍 Meeting creator info:', {
          meetingId: meeting.id,
          subject: meeting.subject,
          createdByUserId: meeting.createdByUserId,
          currentUserId: currentUser?.id
        });

        return {
          id: meeting.id,
          title: meeting.subject,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          extendedProps: {
            meetingId: meeting.id,
            content: meeting.content,
            roomId: meeting.roomId,
            createdByUserId: meeting.createdByUserId // Yetki kontrolü için ekledik
          }
        };
      });

      setEvents(calendarEvents);
    } catch (err: any) {
      console.error('Error loading meetings:', err);
      setError('Toplantılar yüklenemedi');
      // Hata durumunda boş array set et
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    navigate('/add-event');
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    navigate('/add-event', { 
      state: { 
        selectedDate: selectInfo.startStr,
        startDate: selectInfo.start,
        endDate: selectInfo.end 
      } 
    });
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventContent(event.extendedProps.content || "");
    setEventRoomId(event.extendedProps.roomId || "");
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    // Event'ten saat bilgisini çıkar
    setEventStartTime(event.start?.toTimeString().slice(0, 5) || "09:00");
    // Duration'ı hesapla (eğer end varsa)
    if (event.end && event.start) {
      const durationMs = event.end.getTime() - event.start.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      setEventDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    } else {
      setEventDuration("01:00");
    }
    
    // Debug: Yetki kontrolü bilgileri
    console.log('🔍 Event click - Permission check:', {
      eventId: event.id,
      meetingId: event.extendedProps.meetingId,
      createdByUserId: event.extendedProps.createdByUserId,
      currentUserId: currentUser?.id,
      currentUserRoles: currentUser?.roles,
      isManagerOrAdmin: isManagerOrAdmin(),
      canEditMeeting: currentUser && event.extendedProps.meetingId ? 
        (isManagerOrAdmin() || event.extendedProps.createdByUserId === currentUser.id) : false,
      canDeleteMeeting: currentUser && event.extendedProps.meetingId ? 
        (isManagerOrAdmin() || event.extendedProps.createdByUserId === currentUser.id) : false
    });
    
    // Eğer meetingId varsa katılımcıları yükle
    if (event.extendedProps.meetingId) {
      await loadMeetingParticipants(event.extendedProps.meetingId);
    }
    
    setIsInfoMode(true); // Info modunda aç
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start date ve time'ı birleştir
      const startDateTime = new Date(`${eventStartDate}T${eventStartTime}`);
      
      // Duration'ı time formatından dakikaya çevir (HH:MM -> minutes)
      const [durationHours, durationMinutes] = eventDuration.split(':').map(Number);
      const totalDurationMinutes = durationHours * 60 + durationMinutes;
      const durationTimeSpan = meetingApiService.minutesToTimeSpan(totalDurationMinutes);
      
      // Room availability kontrolü - 🔥 BACKEND GÜNCELLEMESI TEST
      if (eventRoomId && eventStartDate && eventStartTime && eventDuration) {
        console.log('🔍 BACKEND GÜNCELLEMESI - Room availability check başlatılıyor:', {
          roomId: eventRoomId,
          startDate: startDateTime.toISOString(),
          duration: durationTimeSpan,
          excludeMeetingId: selectedEvent?.extendedProps.meetingId,
          isEditMode: !!selectedEvent,
          testScenario: 'Bu kontrol artık geçmiş/silinmiş toplantıları dikkate almıyor'
        });

        const isAvailable = await meetingApiService.checkRoomAvailability(
          eventRoomId,
          startDateTime.toISOString(),
          durationTimeSpan,
          selectedEvent?.extendedProps.meetingId
        );

        console.log('✅ BACKEND GÜNCELLEMESI - Room availability sonuç:', {
          isAvailable,
          roomId: eventRoomId,
          expectedBehavior: isAvailable 
            ? '✅ Başarılı! Geçmiş/silinmiş/bitmiş toplantılar artık engel olmuyor'
            : '❌ Gerçek çakışma var (bu doğru davranış)',
          improvement: 'Sadece gelecekteki aktif toplantılar çakışma yaratıyor'
        });

        if (!isAvailable) {
          const selectedRoom = rooms.find(room => room.id === eventRoomId);
          const roomName = selectedRoom?.name || 'Bilinmeyen Oda';
          
          console.log('❌ ROOM CONFLICT DETECTED! Gerçek çakışma var:', {
            roomName,
            conflictType: 'Aynı saatte aktif toplantı mevcut',
            note: 'Bu artık sadece gerçek çakışmalarda görülecek!'
          });
          
          // Hata mesajını göster
          setError(`Bu oda (${roomName}) seçilen saatte müsait değil! Aynı saatte başka bir toplantı var. Lütfen farklı bir saat veya oda seçin.`);
          
          // Conflict modal verilerini ayarla
          setConflictData({
            roomId: eventRoomId,
            roomName: roomName,
            startDate: startDateTime.toISOString(),
            duration: durationTimeSpan
          });
          
          setShowConflictModal(true);
          showRoomConflictToast(selectedRoom?.name || 'Seçilen oda');
          return; // İşlemi durdur
        }
      }
      
      if (selectedEvent && selectedEvent.extendedProps.meetingId) {
        // Update existing meeting
        const updateRequest: UpdateMeetingCommand = {
          id: selectedEvent.extendedProps.meetingId,
          subject: eventTitle,
          content: eventContent,
          roomId: eventRoomId,
          startDate: startDateTime.toISOString(),
          duration: durationTimeSpan
        };

        const updatedMeeting = await meetingApiService.updateMeeting(updateRequest);
        
        // ✅ Meeting başarıyla güncellendi, response'da roomId ve roomName olmalı
        console.log('Updated meeting:', updatedMeeting);
        console.log('Room ID:', updatedMeeting.roomId);
        console.log('Room Name:', updatedMeeting.roomName);
        
        // Local state'i güncelle
        const endDateTime = new Date(startDateTime.getTime() + totalDurationMinutes * 60 * 1000);
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  title: eventTitle,
                  start: startDateTime.toISOString(),
                  end: endDateTime.toISOString(),
                  extendedProps: { 
                    ...event.extendedProps, // Mevcut props'ları koru (createdByUserId dahil)
                    calendar: updatedMeeting.isApproved ? "Success" : "Warning",
                    meetingId: updatedMeeting.id,
                    content: eventContent,
                    roomId: eventRoomId
                  },
                }
              : event
          )
        );
      } else {
        // Create new meeting
        const createRequest: CreateMeetingCommand = {
          subject: eventTitle,
          content: eventContent,
          roomId: eventRoomId,
          startDate: startDateTime.toISOString(),
          duration: durationTimeSpan
        };

        const newMeeting = await meetingApiService.createMeeting(createRequest);
        
        // ✅ Meeting başarıyla oluşturuldu, response'da roomId ve roomName olmalı
        console.log('Created meeting:', newMeeting);
        console.log('Room ID:', newMeeting.roomId);
        console.log('Room Name:', newMeeting.roomName);
        
        // Katılımcıları ekle (eğer seçildiyse)
        if (selectedParticipants.length > 0) {
          await addParticipants(newMeeting.id);
        }
        
        // Local state'e ekle
        const endDateTime = new Date(startDateTime.getTime() + totalDurationMinutes * 60 * 1000);
        const newEvent: CalendarEvent = {
          id: newMeeting.id,
          title: eventTitle,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          extendedProps: { 
            meetingId: newMeeting.id,
            content: newMeeting.content,
            roomId: newMeeting.roomId,
            createdByUserId: currentUser?.id // Yeni toplantıyı oluşturan kullanıcı
          },
        };
        setEvents((prevEvents) => [...prevEvents, newEvent]);
        
        showMeetingSuccessToast();
      }
      
      closeModal();
      resetModalFields();
    } catch (err: any) {
      console.error('Error saving meeting:', err);
      
      // Backend'den gelen spesifik room conflict hatası
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message;
        
        // ✅ Room çakışma hatalarını özel olarak yakala
        if (errorMessage.toLowerCase().includes('room') && errorMessage.toLowerCase().includes('available')) {
          const selectedRoom = rooms.find(room => room.id === eventRoomId);
          showRoomConflictToast(selectedRoom?.name || 'Seçilen oda');
          setError('Bu oda seçilen saatte müsait değil. Lütfen başka bir oda veya saat seçin.');
        } else {
          setError(errorMessage || 'Toplantı kaydedilirken bir hata oluştu');
          showMeetingErrorToast(errorMessage);
        }
      } else {
        const errorMessage = err.response?.data?.detail || 'Toplantı kaydedilirken bir hata oluştu';
        setError(errorMessage);
        showMeetingErrorToast(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !selectedEvent.extendedProps.meetingId) {
      setError('Silinecek toplantı seçilmedi');
      return;
    }

    // Kullanıcıdan onay al
    if (!window.confirm('Bu toplantıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Backend'den meeting'i sil
      await meetingApiService.deleteMeeting(selectedEvent.extendedProps.meetingId);
      
      // Event'i local state'den kaldır
      setEvents((prevEvents) => 
        prevEvents.filter(event => event.id !== selectedEvent.id)
      );
      
      showMeetingSuccessToast();
      closeModal();
      resetModalFields();
    } catch (err: any) {
      console.error('Error deleting meeting:', err);
      
      // Backend error türüne göre mesaj ver
      if (err.response?.status === 500) {
        setError('Toplantı silinemedi: Backend hatası oluştu');
        showMeetingErrorToast();
      } else if (err.response?.status === 404) {
        setError('Toplantı bulunamadı veya zaten silinmiş');
        showMeetingErrorToast();
      } else {
        setError('Toplantı silinemedi: Bilinmeyen hata');
        showMeetingErrorToast();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventContent("");
    setEventRoomId("");
    setEventStartDate("");
    setEventStartTime("");
    setEventDuration("01:00");
    setSelectedParticipants([]);
    setMeetingParticipants([]);
    setSelectedEvent(null);
    setIsInfoMode(false);
  };

  const handleConflictResolve = (suggestion: AlternativeSlot) => {
    // Önerilen alternatifi uygula
    setEventRoomId(suggestion.roomId);
    
    const suggestionDate = new Date(suggestion.startDate);
    setEventStartDate(suggestionDate.toISOString().split('T')[0]);
    setEventStartTime(suggestionDate.toTimeString().split(' ')[0].substring(0, 5));
    
    // Duration'ı güncelle
    const durationMinutes = meetingApiService.timeSpanToMinutes(suggestion.duration);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    setEventDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    
    setShowConflictModal(false);
    setConflictData(null);
  };

  const loadMeetingParticipants = async (meetingId: string) => {
    try {
      console.log(`🔍 Loading participants for meeting: ${meetingId}`);
      const participants = await meetingUserApiService.getMeetingParticipants(meetingId);
      console.log(`📋 Loaded ${participants.length} participants:`, participants);
      
      setMeetingParticipants(participants);
      
      // Seçili katılımcıları güncelle (edit mode için)
      if (!isInfoMode) {
        const participantIds = participants.map((p: MeetingUser) => p.userId);
        setSelectedParticipants(participantIds);
      }
    } catch (err: any) {
      console.error('❌ Error loading meeting participants:', err);
      
      // Backend error ise kullanıcıya bildir
      if (err.message?.includes('Backend error')) {
        showMeetingErrorToast();
      } else {
        showMeetingErrorToast();
      }
      
      setMeetingParticipants([]);
    }
  };

  const handleParticipantSelect = (userId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const addParticipants = async (meetingId: string) => {
    try {
      setLoading(true);
      
      for (const userId of selectedParticipants) {
        const command: CreateMeetingUserCommand = {
          userId,
          meetingId
        };
        await meetingUserApiService.addParticipant(command);
      }
      
      // Katılımcılara bildirim gönder
      if (selectedParticipants.length > 0) {
        try {
          await notificationApiService.sendMeetingInvitationNotifications(meetingId, selectedParticipants);
          console.log('Meeting invitation notifications sent successfully');
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          // Bildirim hatası toplantı oluşturma işlemini durdurmaz
        }
      }
      
      // Katılımcıları yeniden yükle
      await loadMeetingParticipants(meetingId);
      setSelectedParticipants([]);
    } catch (err: any) {
      console.error('Error adding participants:', err);
      setError('Katılımcılar eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Takvim | Toplantı Takip Paneli"
        description="Toplantı takvimi ve yönetim sayfası"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={trLocale}
          firstDay={1}
          fixedWeekCount={false}
          showNonCurrentDates={false}
          height="600px"
          dayMaxEvents={2}
          moreLinkClick="popover"
          eventMaxStack={2}
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          customButtons={{
            addEventButton: {
              text: "Toplantı Ekle +",
              click: handleAddEvent,
            },
          }}
        />
      </div>
      
      <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="w-[95vw] max-w-[700px] max-h-[90vh] p-4 lg:p-6 xl:p-10"
        >
          <div className="flex flex-col overflow-y-auto custom-scrollbar max-h-[80vh]">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {isInfoMode ? "Toplantı Detayları" : (selectedEvent ? "Toplantıyı Düzenle" : "Toplantı Ekle")}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toplantılarınızı planlayın ve düzenleyin. Tüm detayları takip edin.
              </p>
              {error && (
                <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
            <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Toplantı Başlığı
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    readOnly={isInfoMode}
                    className={`dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isInfoMode 
                        ? 'cursor-default bg-gray-50 dark:bg-gray-800' 
                        : 'focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800'
                    }`}
                  />
                </div>
                
                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Toplantı Açıklaması
                  </label>
                  <textarea
                    id="event-content"
                    value={eventContent}
                    onChange={(e) => setEventContent(e.target.value)}
                    readOnly={isInfoMode}
                    rows={3}
                    placeholder="Toplantı açıklamasını girin..."
                    className={`dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isInfoMode 
                        ? 'cursor-default bg-gray-50 dark:bg-gray-800 resize-none' 
                        : 'focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800'
                    }`}
                  />
                </div>

                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Toplantı Odası
                  </label>
                  <RoomSelectorWithAvailability
                    rooms={rooms}
                    selectedRoomId={eventRoomId}
                    onRoomChange={setEventRoomId}
                    startDate={eventStartDate && eventStartTime ? `${eventStartDate}T${eventStartTime}` : ''}
                    duration={eventDuration ? meetingApiService.minutesToTimeSpan((eventDuration.split(':').map(Number)[0] * 60) + eventDuration.split(':').map(Number)[1]) : ''}
                    isInfoMode={isInfoMode}
                    excludeMeetingId={selectedEvent?.extendedProps.meetingId}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Başlangıç Tarihi
                </label>
                <div className="relative">
                  <input
                    ref={dateInputRef}
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    readOnly={isInfoMode}
                    className={`dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-12 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isInfoMode 
                        ? 'cursor-default bg-gray-50 dark:bg-gray-800' 
                        : 'focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800'
                    }`}
                  />
                  {!isInfoMode && (
                    <button
                      type="button"
                      onClick={() => dateInputRef.current?.showPicker()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <CalenderIcon className="size-6" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Başlangıç Saati
                </label>
                <div className="relative">
                  <input
                    id="event-start-time"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    readOnly={isInfoMode}
                    className={`dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isInfoMode 
                        ? 'cursor-default bg-gray-50 dark:bg-gray-800' 
                        : 'focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800'
                    }`}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon className="size-6" />
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Süre
                </label>
                <div className="relative">
                  <input
                    id="event-duration"
                    type="time"
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    readOnly={isInfoMode}
                    className={`dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isInfoMode 
                        ? 'cursor-default bg-gray-50 dark:bg-gray-800' 
                        : 'focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800'
                    }`}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon className="size-6" />
                  </span>
                </div>
              </div>

              {/* Participants Section */}
              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Toplantı Katılımcıları
                </label>
                
                {isInfoMode ? (
                  // Info mode: Show existing participants with their status
                  <div className="space-y-3">
                    {meetingParticipants.length > 0 ? (
                      meetingParticipants.map((participant) => {
                        const user = users.find(u => u.id === participant.userId);
                        
                        if (!user) {
                          console.warn(`⚠️ User not found for participant:`, participant);
                          return (
                            <div key={participant.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  ?
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                    Kullanıcı Bulunamadı
                                  </p>
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    ID: {participant.userId}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Hata
                              </span>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user.nameSurname.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.nameSurname}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              participant.status === MeetingUserStatus.Approved 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : participant.status === MeetingUserStatus.Rejected
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {meetingUserApiService.getStatusLabel(participant.status)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Henüz katılımcı eklenmedi
                      </p>
                    )}
                  </div>
                ) : (
                  // Edit mode: Search and select participants
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="İsim, soyisim veya e-posta ile ara..."
                      value={participantSearch}
                      onChange={e => setParticipantSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && filteredUsers.length > 0) {
                          const first = filteredUsers[0];
                          if (!selectedParticipants.includes(first.id)) {
                            handleParticipantSelect(first.id);
                            setParticipantSearch("");
                          }
                        }
                      }}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                    {participantSearch.trim() !== "" && (
                      <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        {filteredUsers.length === 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">Kullanıcı bulunamadı</div>
                        )}
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded ${selectedParticipants.includes(user.id) ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                            onClick={() => {
                              if (!selectedParticipants.includes(user.id)) {
                                handleParticipantSelect(user.id);
                                setParticipantSearch("");
                              }
                            }}
                          >
                            <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {user.nameSurname.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.nameSurname}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </div>
                            {selectedParticipants.includes(user.id) && (
                              <span className="ml-auto text-xs text-brand-600 dark:text-brand-400">Eklendi</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedParticipants.length > 0 && (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Eklenen Katılımcılar</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedParticipants.map(id => {
                            const user = users.find(u => u.id === id);
                            if (!user) return null;
                            return (
                              <div key={id} className="flex items-center px-2 py-1 bg-brand-50 dark:bg-brand-900/20 rounded text-xs text-brand-700 dark:text-brand-300">
                                <span className="font-semibold mr-1">{user.nameSurname}</span>
                                <span className="text-gray-400 dark:text-gray-500">({user.email})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                disabled={loading}
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto disabled:opacity-50"
              >
                Kapat
              </button>
              {isInfoMode && selectedEvent && (
                <>
                  {(() => {
                    const canEdit = canEditMeeting();
                    const canDelete = canDeleteMeeting();
                    console.log('🔍 Modal render - Button visibility:', {
                      isInfoMode,
                      hasSelectedEvent: !!selectedEvent,
                      canEdit,
                      canDelete,
                      currentUserRoles: currentUser?.roles,
                      isManager: isManagerOrAdmin()
                    });
                    
                    return (
                      <>
                        {canEdit && (
                          <button
                            onClick={() => setIsInfoMode(false)}
                            type="button"
                            disabled={loading}
                            className="flex w-full justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 sm:w-auto disabled:opacity-50"
                          >
                            Düzenle
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={handleDeleteEvent}
                            type="button"
                            disabled={loading}
                            className="flex w-full justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 sm:w-auto disabled:opacity-50"
                          >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Siliniyor...
                            </>
                          ) : (
                            "Sil"
                          )}
                        </button>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
              {!isInfoMode && (
                <button
                  onClick={handleAddOrUpdateEvent}
                  type="button"
                  disabled={loading}
                  className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </>
                  ) : (
                    selectedEvent ? "Değişiklikleri Kaydet" : "Toplantı Ekle"
                  )}
                </button>
              )}
            </div>
          </div>
        </Modal>

        {/* Room Conflict Modal */}
        {conflictData && (
          <RoomConflictModal
            isOpen={showConflictModal}
            onClose={() => {
              setShowConflictModal(false);
              setConflictData(null);
            }}
            onResolve={handleConflictResolve}
            conflictData={conflictData}
          />
        )}
    </>
  );
};

export default Calendar;
