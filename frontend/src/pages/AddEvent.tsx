import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { TimeIcon, CalenderIcon } from "../icons";
import { meetingApiService, type CreateMeetingCommand, type Room } from "../services/meetingApiService";
import { meetingUserApiService, type CreateMeetingUserCommand } from "../services/meetingUserApiService";
import { notificationApiService } from "../services/notificationApiService";
import ReactSelect from "../components/ui/ReactSelect";
import RoomAvailabilityCalendar from "../components/ui/RoomAvailabilityCalendar";
import type { User } from "../types/api";

// Tarih önerisi tipi
interface DateSuggestion {
  date: string;
  time: string;
  roomId: string;
  roomName: string;
  availableRequiredCount: number;
  availableOptionalCount: number;
}

const AddEvent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State from navigation
  const { selectedDate, startDate } = location.state || {};

  const [eventTitle, setEventTitle] = useState("");
  const [eventContent, setEventContent] = useState("");
  const [eventRoomId, setEventRoomId] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventDuration, setEventDuration] = useState("01:00");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [requiredParticipants, setRequiredParticipants] = useState<string[]>([]);
  const [optionalParticipants, setOptionalParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DateSuggestion | null>(null);
  const [showRoomCalendar, setShowRoomCalendar] = useState(false);
  const [selectedRoomForCalendar, setSelectedRoomForCalendar] = useState<Room | null>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRooms();
    loadUsers();
    
    // Set default date based on navigation state or today
    if (selectedDate) {
      setEventStartDate(selectedDate);
    } else if (startDate) {
      setEventStartDate(startDate.toISOString().split('T')[0]);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setEventStartDate(today);
    }
    
    // Set default time
    setEventStartTime("09:00");
  }, [selectedDate, startDate]);

  useEffect(() => {
    if (participantSearch.trim() === "") {
      setFilteredUsers([]);
    } else {
      const filtered = users.filter(user =>
        user.nameSurname.toLowerCase().includes(participantSearch.toLowerCase()) &&
        !requiredParticipants.includes(user.id) &&
        !optionalParticipants.includes(user.id)
      );
      setFilteredUsers(filtered);
    }
  }, [participantSearch, users, requiredParticipants, optionalParticipants]);

  // Otomatik tarih önerilerini hesapla
  useEffect(() => {
    if (requiredParticipants.length > 0 && !isManualMode) {
      generateDateSuggestions();
    }
  }, [requiredParticipants, optionalParticipants, eventDuration, isManualMode]);

  const generateDateSuggestions = async () => {
    // ✅ Gerçek API'den oda önerileri al
    try {
      setLoading(true);
      setError(null);
      
      // Duration'ı TimeSpan formatına çevir
      const [hours, minutes] = eventDuration.split(':').map(Number);
      const durationTimeSpan = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      // Backend'den oda önerilerini al
      const response = await meetingApiService.getRecommendedRooms({
        requiredUserIdList: requiredParticipants,
        optionalUserIdList: optionalParticipants,
        duration: durationTimeSpan
      });

      console.log('🔍 Backend response:', response);

      // Backend'den gelen önerileri frontend formatına çevir
      const suggestions: DateSuggestion[] = response.recommendedRooms.map(room => {
        const startDateTime = new Date(room.recommendedStartDateTime);
        return {
          date: startDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
          time: startDateTime.toTimeString().slice(0, 5), // HH:MM format
          roomId: room.roomId,
          roomName: room.roomName,
          availableRequiredCount: requiredParticipants.length, // Tüm required user'lar müsait (backend kontrolü yaptı)
          availableOptionalCount: room.availableOptionalUserCount
        };
      });
      
      console.log('✅ Generated suggestions from backend:', suggestions);
      setDateSuggestions(suggestions.slice(0, 6)); // İlk 6 öneriyi göster
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Oda önerileri alınamadı. Manuel modda devam edebilirsiniz.');
      setDateSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await meetingApiService.getRooms();
      setRooms(response || []);
    } catch (err: any) {
      console.error('Error loading rooms:', err);
      setError('Odalar yüklenemedi');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await meetingUserApiService.getUsers();
      setUsers(response || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Kullanıcılar yüklenemedi');
    }
  };

  const handleAddRequiredParticipant = (userId: string) => {
    if (!requiredParticipants.includes(userId) && !optionalParticipants.includes(userId)) {
      setRequiredParticipants([...requiredParticipants, userId]);
      setParticipantSearch("");
      setFilteredUsers([]);
    }
  };

  const handleAddOptionalParticipant = (userId: string) => {
    if (!requiredParticipants.includes(userId) && !optionalParticipants.includes(userId)) {
      setOptionalParticipants([...optionalParticipants, userId]);
      setParticipantSearch("");
      setFilteredUsers([]);
    }
  };

  const handleRemoveRequiredParticipant = (userId: string) => {
    setRequiredParticipants(requiredParticipants.filter((id: string) => id !== userId));
  };

  const handleRemoveOptionalParticipant = (userId: string) => {
    setOptionalParticipants(optionalParticipants.filter((id: string) => id !== userId));
  };

  const getParticipantDetails = (participantIds: string[]) => {
    return participantIds.map(participantId =>
      users.find(user => user.id === participantId)
    ).filter(Boolean) as User[];
  };

  const handleSelectSuggestion = (suggestion: DateSuggestion) => {
    setSelectedSuggestion(suggestion);
    setEventStartDate(suggestion.date);
    setEventStartTime(suggestion.time);
    setEventRoomId(suggestion.roomId); // Odayı da otomatik seç
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) {
      setError("Toplantı başlığı gereklidir");
      return;
    }

    // Manuel modda oda seçimi gerekli, otomatik modda öneri seçimi gerekli
    if (isManualMode && !eventRoomId) {
      setError("Oda seçimi gereklidir");
      return;
    }

    if (!isManualMode && !selectedSuggestion) {
      setError("Lütfen bir tarih önerisi seçin");
      return;
    }

    if (!eventStartDate || !eventStartTime) {
      setError("Başlangıç tarihi ve saati gereklidir");
      return;
    }

    setLoading(true);
    setError(null);
    
    let createRequest: CreateMeetingCommand | null = null;

    try {
      // Duration'ı dakikaya çevir
      const [hours, minutes] = eventDuration.split(':').map(Number);
      const durationTimeSpan = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Start datetime'ı oluştur
      const startDateTime = new Date(`${eventStartDate}T${eventStartTime}:00`);

      // Kullanılacak room ID'yi belirle (otomatik modda seçilen öneriden, manuel modda seçilen odadan)
      const rawRoomId = isManualMode ? eventRoomId : selectedSuggestion?.roomId;
      
      // GUID formatını kontrol et
      const isValidGuid = (id: string) => {
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return guidRegex.test(id);
      };
      
      const finalRoomId = rawRoomId && isValidGuid(rawRoomId) ? rawRoomId : null;
      
      // Debug log
      console.log('🔍 Room ID validation:', {
        rawRoomId,
        isValid: rawRoomId ? isValidGuid(rawRoomId) : false,
        finalRoomId,
        selectedSuggestion,
        isManualMode
      });
      
      // Kullanılacak room name'i belirle
      const finalRoomName = isManualMode 
        ? rooms.find(room => room.id === finalRoomId)?.name 
        : selectedSuggestion?.roomName;

      // ✅ Room seçimi kontrolü
      if (isManualMode && !finalRoomId) {
        setError('Manuel modda oda seçimi zorunludur. Lütfen bir oda seçin.');
        setLoading(false);
        return;
      }
      
      if (!isManualMode && !selectedSuggestion) {
        setError('Otomatik modda önce oda önerisi alın ve bir seçenek seçin.');
        setLoading(false);
        return;
      }
      
      if (!isManualMode && !finalRoomId) {
        console.error('❌ Invalid room ID in automatic mode:', {
          selectedSuggestion,
          rawRoomId,
          isValidGuid: rawRoomId ? isValidGuid(rawRoomId) : false
        });
        setError('Seçilen oda önerisinde geçerli bir oda ID\'si bulunamadı. Lütfen başka bir öneri seçin veya manuel mod kullanın.');
        setLoading(false);
        return;
      }

      // ✅ ZORUNLU ROOM AVAILABILITY KONTROLÜ (manuel modda)
      if (isManualMode && finalRoomId) {
        console.log('🔍 Checking room availability before creating meeting:', {
          roomId: finalRoomId,
          startDate: startDateTime.toISOString(),
          duration: durationTimeSpan
        });

        const isRoomAvailable = await meetingApiService.checkRoomAvailability(
          finalRoomId,
          startDateTime.toISOString(),
          durationTimeSpan
        );

        if (!isRoomAvailable) {
          const selectedRoom = rooms.find(room => room.id === finalRoomId);
          setError(`Bu oda (${selectedRoom?.name || 'Seçilen oda'}) seçilen saatte müsait değil! Aynı saatte başka bir toplantı var. Lütfen farklı bir saat veya oda seçin.`);
          return; // Meeting oluşturmayı durdur
        }
      }

      console.log('✅ Room is available, proceeding with meeting creation');

      // Meeting oluştur
      createRequest = {
        command: {
          subject: eventTitle,
          content: eventContent,
          roomId: finalRoomId || null,
          roomName: finalRoomName || null,
          startDate: startDateTime.toISOString(),
          duration: durationTimeSpan,
        },
        // Backward compatibility için direkt fields de ekle
        subject: eventTitle,
        content: eventContent,
        roomId: finalRoomId || null,
        roomName: finalRoomName || null,
        startDate: startDateTime.toISOString(),
        duration: durationTimeSpan,
      };

      console.log('🚀 Creating meeting with request:', {
        ...createRequest,
        mode: isManualMode ? 'MANUAL' : 'AUTOMATIC',
        finalRoomId,
        finalRoomName,
        selectedSuggestion
      });

      // Request detaylarını da logla
      console.log('📝 Request details:', {
        finalRoomId,
        finalRoomIdType: typeof finalRoomId,
        finalRoomName,
        selectedSuggestion,
        isManualMode
      });

      const meeting = await meetingApiService.createMeeting(createRequest);
      const meetingId = meeting.id;

      // ✅ Meeting başarıyla oluşturuldu, response'da roomId ve roomName olmalı
      console.log('Created meeting:', meeting);
      console.log('Room ID:', meeting.roomId);
      console.log('Room Name:', meeting.roomName);

      // Katılımcıları ekle (hem gerekli hem isteğe bağlı)
      const allParticipants = [...requiredParticipants, ...optionalParticipants];
      if (allParticipants.length > 0) {
        const userCommands = allParticipants.map(userId => {
          const command: CreateMeetingUserCommand = {
            meetingId: meetingId,
            userId: userId
          };
          return meetingUserApiService.addParticipant(command);
        });

        await Promise.all(userCommands);

        // Notification gönder
        try {
          await notificationApiService.sendMeetingInvitationNotifications(meetingId, allParticipants);
        } catch (notificationError) {
          console.warn('Bildirimler gönderilemedi:', notificationError);
        }
      }

      // Success - navigate back to calendar
      navigate('/calendar');
    } catch (err: any) {
      console.error('Error creating meeting:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        request: createRequest
      });
      
      // ✅ Room çakışma hatasını özel olarak yakala
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        console.error('400 Error details:', errorData);
        
        const errorMessage = errorData?.message || errorData?.title || err.message;
        if (errorMessage.toLowerCase().includes('room') || errorMessage.toLowerCase().includes('available')) {
          setError('Bu oda seçilen saatte müsait değil. Lütfen başka bir oda veya saat seçin.');
        } else {
          // Validation errors için detay göster
          if (errorData?.errors) {
            const validationErrors = Object.entries(errorData.errors)
              .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('\n');
            setError(`Doğrulama hatası:\n${validationErrors}`);
          } else {
            setError(errorMessage || 'Toplantı oluştururken bir hata oluştu');
          }
        }
      } else {
        setError(err.message || 'Toplantı oluşturulamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/calendar');
  };

  const handleRoomSelection = (roomId: string) => {
    setEventRoomId(roomId);
    
    // Oda seçildiğinde calendar modal'ını aç
    if (roomId) {
      const selectedRoom = rooms.find(room => room.id === roomId);
      if (selectedRoom) {
        setSelectedRoomForCalendar(selectedRoom);
        setShowRoomCalendar(true);
      }
    }
  };

  const handleTimeSlotSelection = (startDate: string, endDate: string) => {
    // Seçilen zaman dilimini form'a uygula
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Tarih ve saati ayarla
    setEventStartDate(start.toISOString().split('T')[0]);
    setEventStartTime(start.toTimeString().slice(0, 5));
    
    // Süreyi hesapla
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    setEventDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    
    setShowRoomCalendar(false);
  };

  return (
    <>
      <PageMeta title="Toplantı Ekle" description="Yeni toplantı oluşturun" />
      <div className="mx-auto max-w-7xl">
        <div className="rounded-sm border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {/* Header */}
          <div className="border-b border-gray-300 px-6 py-4 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-black dark:text-white">
                Yeni Toplantı Ekle
              </h2>
              <div className="flex items-center space-x-3">
                {/* Manuel/Otomatik Seçim Toggle */}
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setIsManualMode(false)}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                      !isManualMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Otomatik Seçim
                  </button>
                  <button
                    onClick={() => setIsManualMode(true)}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-lg border-l border-gray-300 dark:border-gray-600 ${
                      isManualMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Manuel Seçim
                  </button>
                </div>
                <button
                  onClick={handleCancel}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Sol Taraf - Toplantı Bilgileri */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Toplantı Bilgileri
                </h3>

                {/* Title */}
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Toplantı Başlığı *
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Toplantı başlığını girin"
                    className="w-full rounded border-[1.5px] border-gray-300 bg-transparent px-5 py-3 font-medium outline-none transition focus:border-blue-500 active:border-blue-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:text-white dark:placeholder:text-gray-400 dark:disabled:bg-gray-700"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Açıklama
                  </label>
                  <textarea
                    value={eventContent}
                    onChange={(e) => setEventContent(e.target.value)}
                    placeholder="Toplantı açıklamasını girin"
                    rows={4}
                    className="w-full rounded border-[1.5px] border-gray-300 bg-transparent px-5 py-3 font-medium outline-none transition focus:border-blue-500 active:border-blue-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:text-white dark:placeholder:text-gray-400 dark:disabled:bg-gray-700"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Süre *
                  </label>
                  <input
                    type="time"
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    className="w-full rounded border-[1.5px] border-gray-300 bg-transparent px-5 py-3 font-medium outline-none transition focus:border-blue-500 active:border-blue-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:text-white dark:disabled:bg-gray-700"
                  />
                </div>

                {/* Manuel Mod - Oda Seçimi */}
                {isManualMode && (
                  <>
                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">
                        Oda *
                      </label>
                      <ReactSelect
                        options={rooms.map((room) => ({
                          value: room.id,
                          label: `${room.name} (Kapasite: ${room.capacity})`
                        }))}
                        value={rooms.find(room => room.id === eventRoomId) ? {
                          value: eventRoomId,
                          label: (() => {
                            const room = rooms.find(r => r.id === eventRoomId);
                            return room ? `${room.name} (Kapasite: ${room.capacity})` : '';
                          })()
                        } : null}
                        onChange={(option) => handleRoomSelection(option?.value || '')}
                        placeholder="Oda seçin"
                      />
                      {eventRoomId && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/10 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              <p className="font-medium">Oda seçildi! Müsaitlik takvimi açıldı.</p>
                              <p className="text-xs mt-1">Takvimden uygun zaman dilimini seçebilirsiniz. Kırmızı alanlar dolu, boş yerlerden seçim yapabilirsiniz.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                          Tarih *
                        </label>
                        <div className="relative">
                          <input
                            ref={dateInputRef}
                            type="date"
                            value={eventStartDate}
                            onChange={(e) => setEventStartDate(e.target.value)}
                            className="w-full rounded border-[1.5px] border-gray-300 bg-transparent px-5 py-3 font-medium outline-none transition focus:border-blue-500 active:border-blue-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:text-white dark:disabled:bg-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => dateInputRef.current?.showPicker()}
                            className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <CalenderIcon />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                          Saat *
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={eventStartTime}
                            onChange={(e) => setEventStartTime(e.target.value)}
                            className="w-full rounded border-[1.5px] border-gray-300 bg-transparent px-5 py-3 font-medium outline-none transition focus:border-blue-500 active:border-blue-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:text-white dark:disabled:bg-gray-700"
                          />
                          <button
                            type="button"
                            className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <TimeIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sağ Taraf - Katılımcı Seçimi */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Katılımcı Seçimi
                </h3>

                {/* Katılımcı Arama */}
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Katılımcı Ara
                  </label>
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Katılımcı aramak için isim yazın..."
                    className="w-full rounded border-[1.5px] border-gray-300 bg-transparent px-5 py-3 font-medium outline-none transition focus:border-blue-500 active:border-blue-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:text-white dark:placeholder:text-gray-400 dark:disabled:bg-gray-700"
                  />
                </div>

                {/* Arama Sonuçları */}
                {filteredUsers.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="border-b border-gray-300 px-4 py-3 last:border-b-0 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-black dark:text-white">
                              {user.nameSurname}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAddRequiredParticipant(user.id)}
                              className="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600 transition-colors"
                            >
                              Gerekli
                            </button>
                            <button
                              onClick={() => handleAddOptionalParticipant(user.id)}
                              className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 transition-colors"
                            >
                              İsteğe Bağlı
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gerekli Katılımcılar */}
                {requiredParticipants.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
                      Gerekli Katılımcılar ({requiredParticipants.length})
                    </h4>
                    <div className="space-y-2">
                      {getParticipantDetails(requiredParticipants).map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between rounded bg-red-50 px-3 py-2 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        >
                          <div>
                            <div className="text-sm font-medium text-black dark:text-white">
                              {participant.nameSurname}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {participant.email}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveRequiredParticipant(participant.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* İsteğe Bağlı Katılımcılar */}
                {optionalParticipants.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                      İsteğe Bağlı Katılımcılar ({optionalParticipants.length})
                    </h4>
                    <div className="space-y-2">
                      {getParticipantDetails(optionalParticipants).map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between rounded bg-blue-50 px-3 py-2 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        >
                          <div>
                            <div className="text-sm font-medium text-black dark:text-white">
                              {participant.nameSurname}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {participant.email}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveOptionalParticipant(participant.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Otomatik Tarih Önerileri */}
                {!isManualMode && requiredParticipants.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-green-600 dark:text-green-400">
                      Önerilen Tarihler
                    </h4>
                    <div className="space-y-2">
                      {dateSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`cursor-pointer rounded border-2 p-3 transition-colors ${
                            selectedSuggestion === suggestion
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                              : 'border-gray-200 bg-gray-50 hover:border-green-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-green-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-black dark:text-white">
                                {new Date(suggestion.date).toLocaleDateString('tr-TR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Saat: {suggestion.time} - {suggestion.roomName}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Gerekli: {suggestion.availableRequiredCount}/{requiredParticipants.length}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                İsteğe Bağlı: {suggestion.availableOptionalCount}/{optionalParticipants.length}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-4 border-t border-gray-300 pt-6 dark:border-gray-600">
              <button
                type="button"
                onClick={handleCancel}
                className="flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={loading || (!isManualMode && !selectedSuggestion)}
                className="flex justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                  "Toplantı Oluştur"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Availability Calendar Modal */}
      <RoomAvailabilityCalendar
        isOpen={showRoomCalendar}
        onClose={() => setShowRoomCalendar(false)}
        room={selectedRoomForCalendar}
        onTimeSlotSelect={handleTimeSlotSelection}
      />
    </>
  );
};

export default AddEvent;
