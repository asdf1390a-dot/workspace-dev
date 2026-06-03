'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const travelSchema = z.object({
  name: z.string().min(1, '여행명은 필수입니다'),
  location: z.string().min(1, '목적지는 필수입니다'),
  start_date: z.string().min(1, '출발일은 필수입니다'),
  end_date: z.string().min(1, '귀가일은 필수입니다'),
  budget: z.coerce.number().min(0, '예산은 0 이상이어야 합니다').optional(),
  purpose: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']),
});

type TravelFormData = z.infer<typeof travelSchema>;

interface TravelEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travelId: string;
  initialData?: Partial<TravelFormData>;
  onSuccess: () => void;
}

export default function TravelEditModal({
  open,
  onOpenChange,
  travelId,
  initialData,
  onSuccess,
}: TravelEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TravelFormData>({
    resolver: zodResolver(travelSchema),
    defaultValues: initialData || {
      name: '',
      location: '',
      start_date: '',
      end_date: '',
      budget: 0,
      purpose: '',
      status: 'upcoming',
    },
  });

  useEffect(() => {
    if (open) {
      reset(initialData || {
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        budget: 0,
        purpose: '',
        status: 'upcoming',
      });
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: TravelFormData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/travels/${travelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('여행 정보 저장에 실패했습니다');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Travel edit error:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg z-50 w-[90%] max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold">
              여행 정보 수정
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                여행명 *
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="예: 2024 인도 여행"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                목적지 *
              </label>
              <input
                {...register('location')}
                type="text"
                placeholder="예: 델리, 뭄바이"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출발일 *
              </label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.start_date && (
                <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                귀가일 *
              </label>
              <input
                {...register('end_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.end_date && (
                <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예산 (₹)
              </label>
              <input
                {...register('budget')}
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.budget && (
                <p className="text-red-600 text-sm mt-1">{errors.budget.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="upcoming">대기 중</option>
                <option value="ongoing">진행 중</option>
                <option value="completed">완료</option>
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                여행 목적
              </label>
              <textarea
                {...register('purpose')}
                placeholder="여행 목적 및 주요 활동 입력..."
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
