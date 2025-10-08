import React, { useState, useEffect, useRef } from 'react';
import { meetingApiService, type Room } from '../../services/meetingApiService';
import ReactSelect from './ReactSelect';

interface RoomSelectorWithAvailabilityProps {
  rooms: Room[];
  selectedRoomId: string;
  onRoomChange: (roomId: string) => void;
  startDate: string;
  duration: string;
  isInfoMode?: boolean;
  excludeMeetingId?: string;
}

export const RoomSelectorWithAvailability: React.FC<RoomSelectorWithAvailabilityProps> = ({
  rooms,
  selectedRoomId,
  onRoomChange,
  startDate,
  duration,
  isInfoMode = false,
  excludeMeetingId
}) => {
  const [roomAvailability, setRoomAvailability] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (startDate && duration && rooms.length > 0) {
      checkAllRoomsAvailability();
    }
    
    // Cleanup function to cancel previous requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startDate, duration, rooms, excludeMeetingId]);

  const checkAllRoomsAvailability = async () => {
    if (!startDate || !duration) return;
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setChecking(true);
      const availability: Record<string, boolean> = {};
      
      // Validate and format parameters
      if (!startDate.includes('T')) {
        console.warn('Invalid startDate format, expected ISO string with time');
        return;
      }
      
      // Sequential room checks to avoid overwhelming the server
      for (const room of rooms) {
        try {
          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          
          const isAvailable = await meetingApiService.checkRoomAvailability(
            room.id,
            startDate,
            duration,
            excludeMeetingId
          );
          availability[room.id] = isAvailable;
        } catch (error) {
          console.warn(`Failed to check availability for room ${room.id}:`, error);
          // Set room as available on error to avoid blocking user
          availability[room.id] = true;
        }
      }
      
      // Only update state if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setRoomAvailability(availability);
      }
    } catch (error) {
      console.error('Error checking room availability:', error);
      // Hata durumunda tüm odaları uygun olarak işaretle
      if (!abortControllerRef.current?.signal.aborted) {
        const availability: Record<string, boolean> = {};
        rooms.forEach(room => {
          availability[room.id] = true;
        });
        setRoomAvailability(availability);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setChecking(false);
      }
    }
  };

  const getAvailabilityStatus = (roomId: string) => {
    if (checking) return 'checking';
    if (roomAvailability[roomId] === undefined) return 'unknown';
    return roomAvailability[roomId] ? 'available' : 'unavailable';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 dark:text-green-400';
      case 'unavailable':
        return 'text-red-600 dark:text-red-400';
      case 'checking':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'unavailable':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'checking':
        return (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'unavailable':
        return 'Müsait Değil';
      case 'checking':
        return 'Kontrol Ediliyor...';
      default:
        return '';
    }
  };

  if (isInfoMode) {
    const selectedRoom = rooms.find(room => room.id === selectedRoomId);
    return (
      <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 flex items-center justify-between">
        <span>
          {selectedRoom ? `${selectedRoom.name} (Kapasite: ${selectedRoom.capacity})` : 'Oda seçilmedi'}
        </span>
        {selectedRoom && (
          <div className={`flex items-center gap-1 text-xs ${getStatusColor(getAvailabilityStatus(selectedRoom.id))}`}>
            {getStatusIcon(getAvailabilityStatus(selectedRoom.id))}
            <span>{getStatusText(getAvailabilityStatus(selectedRoom.id))}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ReactSelect
        options={rooms.map((room) => {
          const status = getAvailabilityStatus(room.id);
          const isUnavailable = status === 'unavailable';
          
          return {
            value: room.id,
            label: `${room.name} (Kapasite: ${room.capacity})${isUnavailable ? ' - Müsait Değil' : ''}`,
            isDisabled: isUnavailable,
            statusIcon: getStatusIcon(status),
            statusText: getStatusText(status),
            statusColor: getStatusColor(status)
          };
        })}
        value={rooms.find(room => room.id === selectedRoomId) ? {
          value: selectedRoomId,
          label: (() => {
            const room = rooms.find(r => r.id === selectedRoomId);
            const status = getAvailabilityStatus(selectedRoomId);
            const isUnavailable = status === 'unavailable';
            return room ? `${room.name} (Kapasite: ${room.capacity})${isUnavailable ? ' - Müsait Değil' : ''}` : '';
          })(),
          statusIcon: getStatusIcon(getAvailabilityStatus(selectedRoomId)),
          statusText: getStatusText(getAvailabilityStatus(selectedRoomId)),
          statusColor: getStatusColor(getAvailabilityStatus(selectedRoomId))
        } : null}
        onChange={(option) => onRoomChange(option?.value || '')}
        placeholder="Oda seçiniz"
        isLoading={checking}
      />

      {/* Room Status Indicators */}
      {(startDate && duration) && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 dark:text-gray-400">Oda Durumları:</div>
          <div className="flex flex-wrap gap-2">
            {rooms.slice(0, 4).map((room) => {
              const status = getAvailabilityStatus(room.id);
              return (
                <div
                  key={room.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                    status === 'available'
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                      : status === 'unavailable'
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                      : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {getStatusIcon(status)}
                  <span className="truncate max-w-20">{room.name}</span>
                </div>
              );
            })}
            {rooms.length > 4 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                +{rooms.length - 4} daha
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Room Warning */}
      {selectedRoomId && getAvailabilityStatus(selectedRoomId) === 'unavailable' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-red-800 dark:text-red-200">Seçilen oda müsait değil</p>
            <p className="text-red-600 dark:text-red-400">Bu zaman diliminde başka bir toplantı var. Lütfen farklı bir oda seçin.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomSelectorWithAvailability;
