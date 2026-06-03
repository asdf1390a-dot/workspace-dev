'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const costSchema = z.object({
  item_name: z.string().min(1, '항목명은 필수입니다'),
  category: z.string().min(1, '카테고리는 필수입니다'),
  amount: z.coerce.number().min(0, '금액은 0 이상이어야 합니다'),
  split_type: z.enum(['individual', 'equal', 'custom']),
  notes: z.string().optional(),
});

type CostFormData = z.infer<typeof costSchema>;

interface CostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costId?: string;
  travelId: string;
  initialData?: Partial<CostFormData>;
  onSuccess: () => void;
}

const categories = [
  'Transportation',
  'Accommodation',
  'Meals',
  'Activities',
  'Shopping',
  'Other'
];

export default function CostModal({
  open,
  onOpenChange,
  costId,
  travelId,
  initialData,
  onSuccess,
}: CostModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: initialData || {
      item_name: '',
      category: '',
      amount: 0,
      split_type: 'individual',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(initialData || {
        item_name: '',
        category: '',
        amount: 0,
        split_type: 'individual',
        notes: '',
      });
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: CostFormData) => {
    try {
      const token = localStorage.getItem('access_token');
      const method = costId ? 'PUT' : 'POST';
      const url = costId
        ? `/api/travels/${travelId}/costs/${costId}`
        : `/api/travels/${travelId}/costs`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('비용 저장에 실패했습니다');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Cost save error:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg z-50 w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold">
              {costId ? '비용 수정' : '새 비용 추가'}
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                항목명 *
              </label>
              <input
                {...register('item_name')}
                type="text"
                placeholder="예: 항공권"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.item_name && (
                <p className="text-red-600 text-sm mt-1">{errors.item_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금액 (₹) *
              </label>
              <input
                {...register('amount')}
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                분담 방식
              </label>
              <select
                {...register('split_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">개인 부담</option>
                <option value="equal">균등 분담</option>
                <option value="custom">사용자 정의</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <textarea
                {...register('notes')}
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
