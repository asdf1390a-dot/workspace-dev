'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Trash2 } from 'lucide-react';

const memberSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  role: z.enum(['member', 'coordinator', 'admin']),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface TravelMember {
  id: string;
  email: string;
  role: 'member' | 'coordinator' | 'admin';
  joined_at: string;
}

interface MemberManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travelId: string;
  members: TravelMember[];
  onSuccess: () => void;
}

export default function MemberManagementModal({
  open,
  onOpenChange,
  travelId,
  members,
  onSuccess,
}: MemberManagementModalProps) {
  const [localMembers, setLocalMembers] = useState<TravelMember[]>(members);
  const [isAdding, setIsAdding] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  useEffect(() => {
    if (open) {
      reset({ email: '', role: 'member' });
      setIsAdding(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: MemberFormData) => {
    setSubmitError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/travels/${travelId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('멤버 추가에 실패했습니다');
      }

      const result = await response.json();
      setLocalMembers([...localMembers, result.data]);
      reset({ email: '', role: 'member' });
      setIsAdding(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '멤버 추가 실패했습니다';
      setSubmitError(message);
      console.error('Member add error:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('이 멤버를 제거하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/travels/${travelId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('멤버 제거에 실패했습니다');
      }

      setLocalMembers(localMembers.filter(m => m.id !== memberId));
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : '멤버 제거 실패했습니다';
      setSubmitError(message);
      console.error('Member remove error:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'coordinator':
        return '조직자';
      case 'member':
      default:
        return '멤버';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg z-50 w-[90%] max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold">
              멤버 관리
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </Dialog.Close>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* 멤버 목록 */}
          <div className="mb-6 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {localMembers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">멤버가 없습니다</p>
              ) : (
                localMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{member.email}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(member.role)}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 멤버 추가 */}
          {isAdding && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  역할 *
                </label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">멤버</option>
                  <option value="coordinator">조직자</option>
                  <option value="admin">관리자</option>
                </select>
                {errors.role && (
                  <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          )}

          {/* 푸터 */}
          <div className="flex gap-3">
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 멤버 추가
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
