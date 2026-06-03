'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const eventSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  description: z.string().optional(),
  event_date: z.string().min(1, '날짜는 필수입니다'),
  event_time: z.string().optional(),
  event_type: z.string().min(1, '이벤트 종류는 필수입니다'),
  location: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  travelId: string;
  initialData?: Partial<EventFormData>;
  onSuccess: () => void;
}

const eventTypes = [
  'Arrival',
  'Departure',
  'Activity',
  'Meal',
  'Meeting',
  'Accommodation',
  'Other'
];

export default function EventModal({
  open,
  onOpenChange,
  eventId,
  travelId,
  initialData,
  onSuccess,
}: EventModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      event_type: '',
      location: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(initialData || {
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        event_type: '',
        location: '',
      });
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: EventFormData) => {
    try {
      const token = localStorage.getItem('access_token');
      const method = eventId ? 'PUT' : 'POST';
      const url = eventId
        ? `/api/travels/${travelId}/events/${eventId}`
        : `/api/travels/${travelId}/events`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('일정 저장에 실패했습니다');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Event save error:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg z-50 w-[90%] max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold">
              {eventId ? '일정 수정' : '새 일정 추가'}
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="예: 공항 도착"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이벤트 종류 *
              </label>
              <select
                {...register('event_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.event_type && (
                <p className="text-red-600 text-sm mt-1">{errors.event_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜 *
              </label>
              <input
                {...register('event_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.event_date && (
                <p className="text-red-600 text-sm mt-1">{errors.event_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시간
              </label>
              <input
                {...register('event_time')}
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                장소
              </label>
              <input
                {...register('location')}
                type="text"
                placeholder="예: 공항 터미널 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                {...register('description')}
                placeholder="추가 정보 입력..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
