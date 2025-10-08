import { useState, useEffect } from "react";
import { PlusIcon, BoxCubeIcon, PencilIcon, TrashBinIcon } from "../icons";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/ui/ToastProvider";
import { roomApiService, type Room, type CreateRoomRequest, type UpdateRoomRequest } from "../services/roomApiService";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";

const RoomManagement: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isOpen, openModal, closeModal } = useModal();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<CreateRoomRequest>({
    name: "",
    capacity: 1,
    locationInfo: "",
    details: ""
  });

  // Admin ve System.Manager kontrolü
  const canManageRooms = user?.isAdmin || 
    user?.roles?.includes('Admin') || 
    user?.roles?.includes('Users.Admin') ||
    user?.roles?.includes('System.Manager');

  useEffect(() => {
    if (canManageRooms) {
      fetchRooms();
    }
  }, [canManageRooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // Backend'in beklediği pagination parametreleri
      const response = await roomApiService.getRooms({
        PageIndex: 0,
        PageSize: 100
      } as any);
      
      // BaseApiService artık doğru format'ı döndürüyor
      if (Array.isArray(response)) {
        // Odaları kapasite'ye göre artan sırada sırala
        const sortedRooms = response.sort((a, b) => a.capacity - b.capacity);
        setRooms(sortedRooms);
      } else {
        console.warn('Expected array but got:', response);
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      addToast({
        title: 'Hata',
        message: 'Odalar yüklenirken hata oluştu',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.locationInfo.trim()) {
      addToast({
        title: 'Hata',
        message: 'Oda adı ve konum zorunludur',
        type: 'error'
      });
      return;
    }

    if (formData.capacity < 1) {
      addToast({
        title: 'Hata',
        message: 'Kapasite en az 1 olmalıdır',
        type: 'error'
      });
      return;
    }

    try {
      if (editingRoom) {
        // Update existing room
        const updateData: UpdateRoomRequest = {
          ...formData,
          id: editingRoom.id
        };
        
        await roomApiService.updateRoom(updateData);
        addToast({
          title: 'Başarılı',
          message: 'Oda başarıyla güncellendi',
          type: 'success'
        });
      } else {
        // Create new room
        await roomApiService.createRoom(formData);
        addToast({
          title: 'Başarılı',
          message: 'Oda başarıyla oluşturuldu',
          type: 'success'
        });
      }
      
      fetchRooms();
      resetForm();
    } catch (error: any) {
      console.error('Error saving room:', error);
      
      let errorMessage = editingRoom ? 'Oda güncellenirken hata oluştu' : 'Oda oluşturulurken hata oluştu';
      
      // Backend hatalarını kontrol et
      if (error?.name === 'NotImplementedError') {
        errorMessage = 'Oda güncelleme özelliği henüz backend\'de tamamlanmamış. Lütfen geliştirici ile iletişime geçin.';
      } else if (error?.response?.data?.includes?.('NotImplementedException')) {
        errorMessage = 'Oda güncelleme özelliği henüz backend\'de tamamlanmamış. Lütfen geliştirici ile iletişime geçin.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Girilen bilgiler geçersiz. Lütfen kontrol edin.';
      }
      
      addToast({
        title: 'Hata',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      locationInfo: room.locationInfo,
      details: room.details || ""
    });
    openModal();
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    if (!window.confirm(`"${roomName}" odasını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await roomApiService.deleteRoom(roomId);
      addToast({
        title: 'Başarılı',
        message: 'Oda başarıyla silindi',
        type: 'success'
      });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      addToast({
        title: 'Hata',
        message: 'Oda silinirken hata oluştu',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: 1,
      locationInfo: "",
      details: ""
    });
    setEditingRoom(null);
    closeModal();
  };

  if (!canManageRooms) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BoxCubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Oda Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Toplantı odalarını yönetin ve düzenleyin
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Yeni Oda Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Oda Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Konum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kapasite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <BoxCubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Henüz oda bulunmuyor. İlk odayı eklemek için "Yeni Oda Ekle" butonunu kullanın.
                      </p>
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {room.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {room.locationInfo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {room.capacity} kişi
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {room.details || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(room)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Düzenle"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(room.id, room.name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Sil"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="w-[95vw] max-w-[500px] max-h-[90vh] p-4 lg:p-6 xl:p-10"
      >
        <div className="flex flex-col overflow-y-auto custom-scrollbar max-h-[80vh]">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingRoom ? 'Oda Düzenle' : 'Yeni Oda Ekle'}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Toplantı odalarını yönetin ve düzenleyin.
            </p>
          </div>
          
          <div className="mt-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Oda Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800"
                    placeholder="Örn: Toplantı Odası A"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Konum *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.locationInfo}
                    onChange={(e) => setFormData({ ...formData, locationInfo: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800"
                    placeholder="Örn: 1. Kat, A Blok"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Kapasite *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    rows={3}
                    className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800"
                    placeholder="Oda hakkında ek bilgiler..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                >
                  {editingRoom ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomManagement;
