import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import meetingApiService, { Meeting } from "../services/meetingApiService";
import { meetingUserApiService, type MeetingUser, MeetingUserStatus } from "../services/meetingUserApiService";
import type { User } from "../types/api";
import PageMeta from "../components/common/PageMeta";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";

interface MeetingWithDetails extends Meeting {
  roomName?: string;
  isPast?: boolean;
  userIds?: string[]; // Backend'den gelecek katılımcı ID'leri
}

type TabType = 'all' | 'approved' | 'pending' | 'rejected';

const AllEvents = () => {
  const { user } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [meetingParticipants, setMeetingParticipants] = useState<MeetingUser[]>([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const response = await meetingApiService.getMyMeetings();
        
        // Toplantıları geçmiş/gelecek olarak işaretle
        const meetingsWithDetails = response.map((meeting: Meeting) => {
          const now = new Date();
          const startDate = new Date(meeting.startDate);
          const isPast = startDate < now;
          
          return {
            ...meeting,
            isPast
          } as MeetingWithDetails;
        });

        // Tarihe göre sırala (en yeni üstte)
        meetingsWithDetails.sort((a: MeetingWithDetails, b: MeetingWithDetails) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        setMeetings(meetingsWithDetails);
      } catch (err) {
        console.error('Toplantılar yüklenirken hata:', err);
        setError('Toplantılar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    const loadUsers = async () => {
      try {
        const usersData = await meetingUserApiService.getUsers();
        setUsers(usersData);
      } catch (err: any) {
        console.error('Error loading users:', err);
      }
    };

    fetchMeetings();
    loadUsers();
  }, [user?.id]);

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

  const getDuration = (duration: string) => {
    // Duration format: "HH:MM:SS" veya TimeSpan formatı
    const parts = duration.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      
      if (hours > 0) {
        return `${hours} saat ${minutes} dakika`;
      }
      return `${minutes} dakika`;
    }
    return duration;
  };

  const getStatusBadge = (meeting: MeetingWithDetails) => {
    if (meeting.isPast) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Geçmiş
        </span>
      );
    }
    
    if (meeting.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Onaylandı
        </span>
      );
    }
    
    if (meeting.isApproved === false) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Reddedildi
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Onay Bekliyor
      </span>
    );
  };

  const getFilteredMeetings = () => {
    switch (activeTab) {
      case 'approved':
        return meetings.filter(meeting => meeting.isApproved === true);
      case 'pending':
        return meetings.filter(meeting => meeting.isApproved === null || meeting.isApproved === undefined);
      case 'rejected':
        return meetings.filter(meeting => meeting.isApproved === false);
      default:
        return meetings;
    }
  };

  const getTabCounts = () => {
    const approved = meetings.filter(m => m.isApproved === true).length;
    const pending = meetings.filter(m => m.isApproved === null || m.isApproved === undefined).length;
    const rejected = meetings.filter(m => m.isApproved === false).length;
    
    return { approved, pending, rejected };
  };

  const loadMeetingParticipants = async (meetingId: string) => {
    try {
      console.log(`🔍 Loading participants for meeting: ${meetingId}`);
      const participants = await meetingUserApiService.getMeetingParticipants(meetingId);
      console.log(`📋 Loaded ${participants.length} participants:`, participants);
      
      setMeetingParticipants(participants);
    } catch (err: any) {
      console.error('❌ Error loading meeting participants:', err);
      setMeetingParticipants([]);
    }
  };

  const openDetailsModal = async (meeting: MeetingWithDetails) => {
    setSelectedMeeting(meeting);
    
    // Eğer meetingId varsa katılımcıları yükle
    if (meeting.id) {
      await loadMeetingParticipants(meeting.id);
    }
    
    openModal();
  };

  const closeDetailsModal = () => {
    setSelectedMeeting(null);
    setMeetingParticipants([]);
    closeModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Tüm Toplantılarım | Toplantı Takip Paneli"
        description="Geçmiş ve gelecek tüm toplantılarınızı görüntüleyin"
      />
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Tüm Toplantılarım
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Geçmiş ve gelecek tüm toplantılarınızı onay durumlarına göre görüntüleyebilirsiniz.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Tümü', count: null },
                { key: 'approved', label: 'Onaylanan', count: getTabCounts().approved },
                { key: 'pending', label: 'Bekleyen', count: getTabCounts().pending },
                { key: 'rejected', label: 'Reddedilen', count: getTabCounts().rejected }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      activeTab === tab.key
                        ? 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {getFilteredMeetings().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {activeTab === 'all' 
                ? 'Henüz hiç toplantınız bulunmuyor.'
                : activeTab === 'approved'
                ? 'Henüz onaylanmış toplantınız bulunmuyor.'
                : activeTab === 'pending'
                ? 'Onay bekleyen toplantınız bulunmuyor.'
                : 'Reddedilen toplantınız bulunmuyor.'
              }
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredMeetings().map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetailsModal(meeting)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {meeting.subject}
                      </h3>
                      {getStatusBadge(meeting)}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Tarih:</span>
                        <span>{formatDate(meeting.startDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Süre:</span>
                        <span>{getDuration(meeting.duration)}</span>
                      </div>
                      
                      {meeting.roomName && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">Oda:</span>
                          <span>{meeting.roomName}</span>
                        </div>
                      )}
                    </div>
                    
                    {meeting.content && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {meeting.content}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <button className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                      Detayları Gör →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detay Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeDetailsModal}
        className="w-[95vw] max-w-[700px] max-h-[90vh] p-4 lg:p-6 xl:p-10"
      >
        {selectedMeeting && (
          <div className="flex flex-col overflow-y-auto custom-scrollbar max-h-[80vh]">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                Toplantı Detayları
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toplantı bilgilerinizi detaylı olarak görüntüleyin.
              </p>
            </div>
            
            <div className="mt-8">
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Konu
                  </label>
                  <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
                    {selectedMeeting.subject}
                  </div>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Tarih ve Saat
                  </label>
                  <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
                    {formatDate(selectedMeeting.startDate)}
                  </div>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Süre
                  </label>
                  <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
                    {getDuration(selectedMeeting.duration)}
                  </div>
                </div>
                
                {selectedMeeting.roomName && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Toplantı Odası
                    </label>
                    <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
                      {selectedMeeting.roomName}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Durum
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedMeeting)}
                  </div>
                </div>
                
                {selectedMeeting.content && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Açıklama
                    </label>
                    <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 whitespace-pre-wrap min-h-[80px]">
                      {selectedMeeting.content}
                    </div>
                  </div>
                )}

                {/* Participants Section */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Toplantı Katılımcıları
                  </label>
                  
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
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeDetailsModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AllEvents;
