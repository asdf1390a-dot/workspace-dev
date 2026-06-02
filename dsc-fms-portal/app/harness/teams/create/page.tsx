'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamAssignmentForm } from '@/components/harness/TeamAssignmentForm';
import { TeamAssignmentInput } from '@/lib/harness.types';

export default function CreateTeam() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: TeamAssignmentInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/harness/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팀 생성에 실패했습니다');
      }

      const result = await response.json();
      router.push(`/harness/teams?success=${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">새 팀 생성</h1>
        <p className="mt-1 text-gray-600">유지보수, 생산, 검사, 품질 팀을 생성하세요.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <TeamAssignmentForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </div>
    </div>
  );
}
