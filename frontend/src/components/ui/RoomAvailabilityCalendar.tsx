import React, { useState, useEffect } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg } from "@fullcalendar/core";
import { Modal } from './modal';
import { meetingApiService, type Room, type Meeting } from '../../services/meetingApiService';

interface RoomAvailabilityCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onTimeSlotSelect: (startDate: string, endDate: string) => void;
}

interface RoomEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  classNames: string[];
}

export const RoomAvailabilityCalendar: React.FC<RoomAvailabilityCalendarProps> = ({
  isOpen,
  onClose,
  room,
  onTimeSlotSelect
}) => {
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (isOpen && room) {
      loadRoomSchedule();
    }
  }, [isOpen, room]);

  const loadRoomSchedule = async () => {
    if (!room) return;
    
    try {
      setLoading(true);
      
      // Son 1 ay ve gelecek 2 ay için veri çek
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
      
      const meetings = await meetingApiService.getRoomMeetings(
        room.id, 
        startDate.toISOString(), 
        endDate.toISOString()
      );
      
      // Toplantıları calendar event'lerine çevir
      const roomEvents: RoomEvent[] = meetings.map((meeting: any, index: number) => ({
        id: meeting.id || `meeting-${index}`,
        title: `Dolu - ${meeting.subject || meeting.title || 'Toplantı'}`,
        start: meeting.startDate,
        end: meeting.endDate || (() => {
          // endDate yoksa duration'dan hesapla
          const startTime = new Date(meeting.startDate);
          const durationMinutes = meetingApiService.timeSpanToMinutes(meeting.duration || '01:00:00');
          return new Date(startTime.getTime() + durationMinutes * 60 * 1000).toISOString();
        })(),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        classNames: ['occupied-slot'],
        display: 'block'
      }));
      
      setEvents(roomEvents);
    } catch (error) {
      console.error('Error loading room schedule:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const { start, end } = selectInfo;
    
    // Geçmiş tarihleri engelle
    const now = new Date();
    if (start < now) {
      alert('Geçmiş tarihler için rezervasyon yapılamaz.');
      return;
    }
    
    // Çakışma kontrolü
    const hasConflict = events.some(event => {
      const eventStart = new Date(event.start as string);
      const eventEnd = new Date(event.end as string);
      
      return (start < eventEnd && end > eventStart);
    });
    
    if (hasConflict) {
      alert('Seçilen zaman aralığında oda müsait değil.');
      return;
    }
    
    setSelectedSlot({
      start: start.toISOString(),
      end: end.toISOString()
    });
  };

  const handleConfirmSelection = () => {
    if (selectedSlot && room) {
      onTimeSlotSelect(selectedSlot.start, selectedSlot.end);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedSlot(null);
    onClose();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl mx-4">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Oda Müsaitlik Takvimi
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {room?.name} - Kapasite: {room?.capacity} kişi
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/10 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Nasıl kullanılır:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Kırmızı alanlar dolu zaman dilimlerini gösterir</li>
                <li>Boş alanlardan istediğiniz zaman dilimini seçin</li>
                <li>Fare ile sürükleyerek zaman aralığı belirleyin</li>
                <li>Geçmiş tarihler seçilemez</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-6" style={{ height: '500px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-gray-500">Takvim yükleniyor...</span>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              height="100%"
              locale="tr"
              events={events}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
              selectAllow={(selectInfo) => {
                // Geçmiş tarihleri engelle
                const now = new Date();
                return selectInfo.start >= now;
              }}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5], // Pazartesi-Cuma
                startTime: '08:00',
                endTime: '18:00',
              }}
              slotMinTime="06:00"
              slotMaxTime="22:00"
              slotDuration="00:30"
              snapDuration="00:15"
              selectOverlap={false}
              eventOverlap={false}
              allDaySlot={false}
              nowIndicator={true}
              eventDisplay="block"
              eventTextColor="#ffffff"
              selectConstraint={{
                start: new Date().toISOString()
              }}
            />
          )}
        </div>

        {/* Selected Slot Info */}
        {selectedSlot && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/10 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-green-800 dark:text-green-200">
                Zaman Dilimi Seçildi
              </span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p><strong>Başlangıç:</strong> {formatDateTime(selectedSlot.start)}</p>
              <p><strong>Bitiş:</strong> {formatDateTime(selectedSlot.end)}</p>
              <p><strong>Süre:</strong> {Math.round((new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / (1000 * 60))} dakika</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedSlot}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              selectedSlot
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Seçimi Onayla
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoomAvailabilityCalendar;
