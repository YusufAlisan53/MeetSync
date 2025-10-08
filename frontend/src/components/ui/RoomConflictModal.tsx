import React, { useState, useEffect } from 'react';
import { Modal } from './modal';
import { meetingApiService, type AlternativeSlot } from '../../services/meetingApiService';
import { CalenderIcon, TimeIcon } from '../../icons';

interface RoomConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (suggestion: AlternativeSlot) => void;
  conflictData: {
    roomId: string;
    roomName: string;
    startDate: string;
    duration: string;
  };
}

export const RoomConflictModal: React.FC<RoomConflictModalProps> = ({
  isOpen,
  onClose,
  onResolve,
  conflictData
}) => {
  const [suggestions, setSuggestions] = useState<AlternativeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && conflictData) {
      loadAlternatives();
    }
  }, [isOpen, conflictData]);

  const loadAlternatives = async () => {
    try {
      setLoading(true);
      const alternatives = await meetingApiService.getAlternativeSlots(
        conflictData.roomId,
        conflictData.startDate,
        conflictData.duration
      );
      setSuggestions(alternatives);
    } catch (error) {
      console.error('Error loading alternatives:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/20">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Oda Çakışması Tespit Edildi
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seçilen oda bu zaman diliminde müsait değil
            </p>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <CalenderIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Çakışan Rezervasyon
            </span>
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            <p><strong>Oda:</strong> {conflictData.roomName}</p>
            <p><strong>Tarih/Saat:</strong> {formatTime(conflictData.startDate)}</p>
            <p><strong>Süre:</strong> {formatDuration(conflictData.duration)}</p>
          </div>
        </div>

        {/* Alternative Suggestions */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Alternatif Öneriler
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-gray-500">Alternatifler yükleniyor...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.084-2.291M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu zaman dilimi için alternatif bulunamadı
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => onResolve(suggestion)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {suggestion.type === 'time' ? (
                          <TimeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {suggestion.type === 'time' ? 'Farklı Saat' : 'Farklı Oda'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>Oda:</strong> {suggestion.roomName}</p>
                        <p><strong>Zaman:</strong> {formatTime(suggestion.startDate)}</p>
                        <p><strong>Süre:</strong> {formatDuration(suggestion.duration)}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {suggestion.suggestion}
                      </p>
                    </div>
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            İptal Et
          </button>
          <button
            onClick={onClose}
            className="flex justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Yine de Devam Et
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoomConflictModal;
