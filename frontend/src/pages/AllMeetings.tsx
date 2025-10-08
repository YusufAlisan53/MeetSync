import { useState, useEffect } from "react";
import { meetingApiService, type Meeting, type Room } from "../services/meetingApiService";
import { meetingUserApiService } from "../services/meetingUserApiService";
import { useAuth } from "../hooks/useAuth";
import PageMeta from "../components/common/PageMeta";

const AllMeetings: React.FC = () => {
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (currentUserId) {
      loadAllUserMeetings();
      loadRooms();
    }
  }, [currentUserId]);

  const loadAllUserMeetings = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Loading all meetings for user: ${currentUserId}`);
      
      // Kullanıcının katılımcı olduğu toplantıları yükle
      const participatedMeetings = await meetingUserApiService.getUserParticipatedMeetings(currentUserId);
      
      console.log(`✅ Loaded ${participatedMeetings.length} meetings for user`);
      setAllMeetings(participatedMeetings);

    } catch (err: any) {
      console.error('Error loading user meetings:', err);
      
      // Server error durumunda daha kullanıcı dostu mesaj
      if (err.response?.status === 500) {
        setError('Sunucu geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
      } else {
        setError('Toplantılar yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration: string) => {
    const parts = duration.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    
    if (hours > 0) {
      return `${hours} saat ${minutes} dakika`;
    }
    return `${minutes} dakika`;
  };

  const getRoomName = (meeting: Meeting) => {
    if (meeting.roomName) {
      return meeting.roomName;
    }
    
    if (!meeting.roomId) return 'Oda seçilmedi';
    const room = rooms.find(r => r.id === meeting.roomId);
    return room ? `${room.name} (Kapasite: ${room.capacity})` : 'Oda bulunamadı';
  };

  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const startDate = new Date(meeting.startDate);
    const endDate = new Date(startDate.getTime() + (parseInt(meeting.duration.split(':')[0]) * 60 + parseInt(meeting.duration.split(':')[1])) * 60000);

    if (endDate < now) return 'past';
    if (startDate <= now && endDate >= now) return 'current';
    return 'future';
  };

  const getParticipationIcon = (meeting: Meeting) => {
    const status = getMeetingStatus(meeting);
    if (status !== 'past') return null;

    // getUserParticipatedMeetings sadece kullanıcının katıldığı toplantıları getiriyor
    // Bu nedenle her toplantı için "Katıldı" durumu varsayabiliriz
    return (
      <span className="inline-flex items-center text-green-600 dark:text-green-400" title="Katıldınız">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  };

  const getStatusBadge = (meeting: Meeting) => {
    const status = getMeetingStatus(meeting);
    
    switch (status) {
      case 'current':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span>
            Canlı
          </span>
        );
      case 'future':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Gelecek
          </span>
        );
      case 'past':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            Tamamlandı
          </span>
        );
      default:
        return null;
    }
  };

  const handleShowMeetingDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetails(true);
  };

  const closeMeetingDetails = () => {
    setSelectedMeeting(null);
    setShowMeetingDetails(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta 
        title="Tüm Toplantılarım | Toplantı Takip Paneli" 
        description="Geçmiş, mevcut ve gelecek tüm toplantılarınızı görüntüleyin"
      />
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Tüm Toplantılarım
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Geçmiş, mevcut ve gelecek tüm toplantılarınızı görüntüleyin
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && allMeetings.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v14m0-14h6m-6 0l6 14m0-14v14" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Toplantı bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Henüz hiç toplantınız bulunmuyor.
              </p>
            </div>
          )}

          {!loading && allMeetings.length > 0 && (
            <div className="space-y-4">
              {allMeetings.map((meeting) => {
                const status = getMeetingStatus(meeting);
                const borderColor = status === 'current' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' :
                                  status === 'future' ? 'border-blue-200 dark:border-blue-700' :
                                  'border-gray-200 dark:border-gray-700';

                return (
                  <div key={meeting.id} className={`rounded-lg border ${borderColor} p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {meeting.subject}
                          </h3>
                          {getStatusBadge(meeting)}
                          {getParticipationIcon(meeting)}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {meeting.content}
                        </p>
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v14m0-14h6m-6 0l6 14m0-14v14" />
                            </svg>
                            {formatDate(meeting.startDate)}
                          </div>
                          <div className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(meeting.duration)}
                          </div>
                          <div className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {getRoomName(meeting)}
                          </div>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button
                          onClick={() => handleShowMeetingDetails(meeting)}
                          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Detaylar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Meeting Details Modal */}
        {showMeetingDetails && selectedMeeting && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeMeetingDetails}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 dark:bg-gray-800">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Toplantı Detayları
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Konu</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeeting.subject}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">İçerik</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeeting.content}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tarih & Saat</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedMeeting.startDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Süre</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDuration(selectedMeeting.duration)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oda</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{getRoomName(selectedMeeting)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durum</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedMeeting.isApproved ? 'Onaylandı' : 'Onay Bekliyor'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Katılım Durumu</label>
                        <div className="mt-1 flex items-center">
                          <span className="inline-flex items-center text-green-600 dark:text-green-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            Katıldınız
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closeMeetingDetails}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AllMeetings;
