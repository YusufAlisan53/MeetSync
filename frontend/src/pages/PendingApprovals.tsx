import { useState, useEffect } from "react";
import { meetingApiService, type Meeting, type Room } from "../services/meetingApiService";
import { meetingUserApiService, type PendingApproval, MeetingUserStatus } from "../services/meetingUserApiService";
import { notificationApiService } from "../services/notificationApiService";
import { useAuth } from "../hooks/useAuth";
import PageMeta from "../components/common/PageMeta";

const PendingApprovals: React.FC = () => {
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingApproval[]>([]);
  const [myMeetingsWithStatus, setMyMeetingsWithStatus] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'invitations' | 'my-meetings'>('meetings');
  
  const { user: currentUser, isAuthenticated } = useAuth();
  const currentUserId = currentUser?.id;

  // System.Manager veya Admin mi kontrol et
  const isManagerOrAdmin = currentUser?.roles?.includes('System.Manager') || 
                          currentUser?.roles?.includes('admin') || 
                          currentUser?.role === 'admin';

  // System.User mi kontrol et
  const isSystemUser = currentUser?.roles?.includes('System.User') || 
                      currentUser?.role === 'user';

  // Auth durumunu kontrol et
  useEffect(() => {
    if (!isAuthenticated) {
      setError('Oturum açılmamış. Lütfen giriş yapın.');
      return;
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Token bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    // Yetkisiz erişim kontrolü
    if (!isManagerOrAdmin && !isSystemUser) {
      setError('Bu sayfaya erişim için yetkiniz bulunmuyor.');
      return;
    }
    
    console.log('🔐 Auth Status:', {
      isAuthenticated,
      currentUser,
      token: token ? 'Present' : 'Missing',
      isManagerOrAdmin,
      isSystemUser
    });
  }, [isAuthenticated, currentUser, isManagerOrAdmin, isSystemUser]);

  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      loadRooms();
      loadPendingInvitations();
      
      // Role'e göre farklı initial tab ayarla
      if (isManagerOrAdmin) {
        loadPendingMeetings();
        setActiveTab('meetings');
      } else if (isSystemUser) {
        loadMyMeetingsWithStatus();
        setActiveTab('my-meetings');
      }
    }
  }, [isAuthenticated, currentUserId, isManagerOrAdmin, isSystemUser]);

  const loadMyMeetingsWithStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const meetings = await meetingApiService.getMyMeetingsWithStatus();
      setMyMeetingsWithStatus(meetings);
    } catch (err: any) {
      console.error('Error loading my meetings with status:', err);
      if (err?.response?.status === 404) {
        console.error(`
🚨 BACKEND EKSİK ENDPOINT:
GetUserMeetingsWithStatusFromAuth endpoint'i backend'de eksik.
Lütfen backend'de şu endpoint'i implement et:

GET /api/Meetings/GetUserMeetingsWithStatusFromAuth
- Kullanıcının kendi oluşturduğu toplantıları döndürmeli
- Onay durumu (isApproved, status, approvedByUserName) bilgileri dahil
- Format: Meeting[] veya {items: Meeting[]}

Şu anda normal GetUserMeetingsFromAuth endpoint'i kullanılıyor (fallback).
        `);
      }
      if (err?.response?.status === 500) {
        setError('Backend sunucusunda hata oluştu. Sistem yöneticisi ile iletişime geçin.');
      } else {
        setError('Toplantılarım yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    if (!currentUserId) return;
    try {
      const invitations = await meetingUserApiService.getPendingApprovals(currentUserId);
      setPendingInvitations(invitations);
    } catch (err: any) {
      console.error('Error loading pending invitations:', err);
      if (err?.response?.status === 500) {
        setError('Backend sunucusunda hata oluştu. Sistem yöneticisi ile iletişime geçin.');
      } else {
        setError('Davetiyeler yüklenirken bir hata oluştu.');
      }
    }
  };

  const loadPendingMeetings = async () => {
    // Sadece System.Manager ve Admin'ler pending meeting'leri görebilir
    if (!isManagerOrAdmin) {
      console.log('User not authorized to view pending meetings');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const meetings = await meetingApiService.getPendingMeetings();
      setPendingMeetings(meetings);
    } catch (err: any) {
      console.error('Error loading pending meetings:', err);
      if (err?.response?.status === 500) {
        setError('Backend sunucusunda hata oluştu. Sistem yöneticisi ile iletişime geçin.');
      } else {
        setError('Bekleyen toplantılar yüklenemedi');
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

  const handleApprove = async (meetingId: string) => {
    // Sadece System.Manager ve Admin'ler onay verebilir
    if (!isManagerOrAdmin) {
      setError('Bu işlem için yetkiniz bulunmuyor.');
      return;
    }

    try {
      setLoading(true);
      await meetingApiService.approveMeeting(meetingId);
      
      // Meeting'i pending listesinden kaldır
      setPendingMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
      
      // Bildirim gönder
      try {
        await notificationApiService.sendMeetingStatusNotification(meetingId, 'approved');
        console.log('Meeting approval notification sent successfully');
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error approving meeting:', err);
      setError('Toplantı onaylanamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (meetingId: string) => {
    // Sadece System.Manager ve Admin'ler red edebilir
    if (!isManagerOrAdmin) {
      setError('Bu işlem için yetkiniz bulunmuyor.');
      return;
    }

    try {
      setLoading(true);
      await meetingApiService.rejectMeeting(meetingId);
      
      // Meeting'i pending listesinden kaldır
      setPendingMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
      
      // Bildirim gönder
      try {
        await notificationApiService.sendMeetingStatusNotification(meetingId, 'rejected');
        console.log('Meeting rejection notification sent successfully');
      } catch (notificationError) {
        console.error('Error sending rejection notification:', notificationError);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error rejecting meeting:', err);
      setError('Toplantı reddedilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Davetiye onay/red fonksiyonları
  const handleApproveInvitation = async (meetingUserId: string) => {
    try {
      setLoading(true);
      await meetingUserApiService.updateStatus({
        id: meetingUserId,
        status: MeetingUserStatus.Approved
      });
      // Davetiyeyi listeden kaldır
      setPendingInvitations(prev => prev.filter(invitation => invitation.id !== meetingUserId));
      setError(null);
    } catch (err: any) {
      console.error('Error approving invitation:', err);
      setError('Davetiye onaylanamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvitation = async (meetingUserId: string) => {
    try {
      setLoading(true);
      await meetingUserApiService.updateStatus({
        id: meetingUserId,
        status: MeetingUserStatus.Rejected
      });
      // Davetiyeyi listeden kaldır
      setPendingInvitations(prev => prev.filter(invitation => invitation.id !== meetingUserId));
      setError(null);
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      setError('Davetiye reddedilemedi');
    } finally {
      setLoading(false);
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
    // ✅ Yeni format: Backend'den direkt roomName geliyorsa onu kullan
    if (meeting.roomName) {
      return meeting.roomName;
    }
    
    // ✅ Fallback: roomId ile room listesinden bul
    if (!meeting.roomId) return 'Oda seçilmedi';
    const room = rooms.find(r => r.id === meeting.roomId);
    return room ? `${room.name} (Kapasite: ${room.capacity})` : 'Oda bulunamadı';
  };

  // Toplantı durumu için badge komponenti
  const getStatusBadge = (meeting: Meeting) => {
    const status = meeting.status || (meeting.isApproved ? 'approved' : 'pending');
    
    switch (status) {
      case 'approved':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <svg className="mr-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Onaylandı
            {meeting.approvedByUserName && (
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                ({meeting.approvedByUserName})
              </span>
            )}
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <svg className="mr-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Reddedildi
            {meeting.approvedByUserName && (
              <span className="ml-1 text-xs text-red-600 dark:text-red-400">
                ({meeting.approvedByUserName})
              </span>
            )}
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <svg className="mr-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Onay Bekliyor
          </div>
        );
    }
  };

  return (
    <>
      <PageMeta
        title={`${isManagerOrAdmin ? 'Bekleyen Onaylar' : 'Toplantılarım'} | Toplantı Takip Paneli`}
        description={isManagerOrAdmin 
          ? "Yöneticiler için toplantı onay yönetimi sayfası"
          : "Kullanıcıların kendi toplantıları ve onay durumları sayfası"
        }
      />
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {isManagerOrAdmin ? 'Onaylar' : 'Toplantılarım'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isManagerOrAdmin 
              ? 'Toplantı onayları ve davetiye yanıtlarını yönetin'
              : 'Oluşturduğunuz toplantıların onay durumlarını ve davetiyelerinizi görüntüleyin'
            }
          </p>
          
          {/* Tab Navigation */}
          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {/* System.Manager ve Admin için Toplantı Onayları tab'ı */}
              {isManagerOrAdmin && (
                <button
                  onClick={() => setActiveTab('meetings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'meetings'
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Toplantı Onayları ({pendingMeetings.length})
                </button>
              )}
              
              {/* System.User için Toplantılarım tab'ı */}
              {isSystemUser && (
                <button
                  onClick={() => setActiveTab('my-meetings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-meetings'
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Toplantılarım ({myMeetingsWithStatus.length})
                </button>
              )}
              
              {/* Herkes için Davetiyelerim tab'ı */}
              <button
                onClick={() => setActiveTab('invitations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invitations'
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Davetiyelerim ({pendingInvitations.length})
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <div className="flex items-start">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10A8 8 0 11-2 2a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium">Hata</h3>
                  <p className="mt-1 text-sm">{error}</p>
                  {(error.includes('Token') || error.includes('Oturum')) && (
                    <div className="mt-2">
                      <a 
                        href="/signin" 
                        className="text-sm font-medium text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 underline"
                      >
                        Giriş sayfasına git →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Yükleniyor...</span>
            </div>
          )}

          {/* Toplantı Onayları Tab - Sadece System.Manager ve Admin için */}
          {activeTab === 'meetings' && isManagerOrAdmin && (
            <>
              {!loading && pendingMeetings.length === 0 && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Onay bekleyen toplantı yok</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tüm toplantılar onaylandı veya henüz yeni toplantı talebi yok.
                  </p>
                </div>
              )}

              {!loading && pendingMeetings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Toplantı Bilgileri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Tarih & Saat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Süre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Oda
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-transparent">
                      {pendingMeetings.map((meeting) => (
                        <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {meeting.subject}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {meeting.content}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {formatDate(meeting.startDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {formatDuration(meeting.duration)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {getRoomName(meeting)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {isManagerOrAdmin ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(meeting.id)}
                                  disabled={loading}
                                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                                >
                                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Onayla
                                </button>
                                <button
                                  onClick={() => handleReject(meeting.id)}
                                  disabled={loading}
                                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                                >
                                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Reddet
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Onay bekleniyor...
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Toplantılarım Tab - Sadece System.User için */}
          {activeTab === 'my-meetings' && (
            <>
              {!loading && myMeetingsWithStatus.length === 0 && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v14m0-14h6m-6 0l6 14m0-14v14" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Henüz toplantı oluşturmadınız</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Oluşturduğunuz toplantıların onay durumları burada görünecek.
                  </p>
                </div>
              )}

              {!loading && myMeetingsWithStatus.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Toplantı Bilgileri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Tarih & Saat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Süre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Oda
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Onay Durumu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-transparent">
                      {myMeetingsWithStatus.map((meeting) => (
                        <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {meeting.subject}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {meeting.content}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {formatDate(meeting.startDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {formatDuration(meeting.duration)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {getRoomName(meeting)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(meeting)}
                            {meeting.approvedDate && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Onay tarihi: {formatDate(meeting.approvedDate)}
                              </div>
                            )}
                            {meeting.rejectedDate && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Red tarihi: {formatDate(meeting.rejectedDate)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Davetiyelerim Tab */}
          {activeTab === 'invitations' && (
            <>
              {!loading && pendingInvitations.length === 0 && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Bekleyen davetiye yok</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Şu anda yanıtlanmayı bekleyen toplantı davetiyeniz bulunmuyor.
                  </p>
                </div>
              )}

              {!loading && pendingInvitations.length > 0 && (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {invitation.meetingSubject}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {invitation.meetingContent}
                          </p>
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v14m0-14h6m-6 0l6 14m0-14v14" />
                              </svg>
                              {formatDate(invitation.meetingStartDate)}
                            </div>
                            <div className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDuration(invitation.meetingDuration)}
                            </div>
                            <div className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {invitation.meetingRoomName || 'Oda belirtilmedi'}
                            </div>
                            <div className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Davet eden: {invitation.meetingCreatedByName}
                            </div>
                          </div>
                        </div>
                        <div className="ml-6 flex space-x-2">
                          <button
                            onClick={() => handleApproveInvitation(invitation.id)}
                            disabled={loading}
                            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Katılacağım
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(invitation.id)}
                            disabled={loading}
                            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Katılamam
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PendingApprovals;
