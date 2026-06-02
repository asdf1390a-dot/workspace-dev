'use client';

import { useState } from 'react';
import { TeamAssignmentSchema, TeamAssignmentInput } from '@/lib/harness.types';
import { AlertBox } from './shared/AlertBox';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface TeamAssignmentFormProps {
  onSubmit: (data: TeamAssignmentInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: TeamAssignmentInput;
}

export function TeamAssignmentForm({ onSubmit, isLoading = false, initialData }: TeamAssignmentFormProps) {
  const [formData, setFormData] = useState<Partial<TeamAssignmentInput>>(
    initialData || {
      team_id: '',
      team_name: '',
      team_type: 'maintenance',
      facility_id: '',
      member_count: 1,
      leader_id: '',
      status: 'active',
      specialization: '',
      assigned_assets: [],
      max_capacity: 8,
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : ['member_count', 'max_capacity'].includes(name)
            ? Number(value)
            : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const assets = e.target.value
      .split('\n')
      .map((a) => a.trim())
      .filter((a) => a);
    setFormData((prev) => ({
      ...prev,
      assigned_assets: assets,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const validated = TeamAssignmentSchema.parse(formData);
      await onSubmit(validated);
      setSubmitSuccess(true);
      setFormData({
        team_id: '',
        team_name: '',
        team_type: 'maintenance',
        facility_id: '',
        member_count: 1,
        leader_id: '',
        status: 'active',
        specialization: '',
        assigned_assets: [],
        max_capacity: 8,
      });
    } catch (error) {
      if (error instanceof Error) {
        try {
          const validation = JSON.parse(error.message);
          if (validation.fieldErrors) {
            const fieldErrors: Record<string, string> = {};
            Object.entries(validation.fieldErrors).forEach(([key, value]: [string, any]) => {
              fieldErrors[key] = value[0] || '입력 오류';
            });
            setErrors(fieldErrors);
          }
        } catch {
          setSubmitError(error.message || '팀 생성에 실패했습니다');
        }
      } else {
        setSubmitError('팀 생성에 실패했습니다');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="팀을 저장 중입니다..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitSuccess && (
        <AlertBox
          type="success"
          title="성공"
          message="팀이 생성되었습니다"
          onClose={() => setSubmitSuccess(false)}
        />
      )}

      {submitError && (
        <AlertBox
          type="error"
          title="오류"
          message={submitError}
          onClose={() => setSubmitError(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* 팀 ID */}
        <div>
          <label htmlFor="team_id" className="block text-sm font-medium text-gray-900">
            팀 ID <span className="text-red-600">*</span>
          </label>
          <input
            id="team_id"
            name="team_id"
            type="text"
            value={formData.team_id || ''}
            onChange={handleChange}
            placeholder="팀 고유 ID를 입력해주세요"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.team_id && <p className="mt-1 text-sm text-red-600">{errors.team_id}</p>}
        </div>

        {/* 팀 이름 */}
        <div>
          <label htmlFor="team_name" className="block text-sm font-medium text-gray-900">
            팀 이름 <span className="text-red-600">*</span>
          </label>
          <input
            id="team_name"
            name="team_name"
            type="text"
            value={formData.team_name || ''}
            onChange={handleChange}
            placeholder="팀 이름을 입력해주세요"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.team_name && <p className="mt-1 text-sm text-red-600">{errors.team_name}</p>}
        </div>

        {/* 팀 유형 */}
        <div>
          <label htmlFor="team_type" className="block text-sm font-medium text-gray-900">
            팀 유형 <span className="text-red-600">*</span>
          </label>
          <select
            id="team_type"
            name="team_type"
            value={formData.team_type || 'maintenance'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="maintenance">유지보수팀</option>
            <option value="production">생산팀</option>
            <option value="inspection">검사팀</option>
            <option value="quality">품질팀</option>
          </select>
        </div>

        {/* 시설 ID */}
        <div>
          <label htmlFor="facility_id" className="block text-sm font-medium text-gray-900">
            시설 ID <span className="text-red-600">*</span>
          </label>
          <select
            id="facility_id"
            name="facility_id"
            value={formData.facility_id || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">시설을 선택해주세요</option>
            <option value="FAC-001">FAC-001 (Mannur Plant)</option>
            <option value="FAC-002">FAC-002 (Regional Hub)</option>
            <option value="FAC-003">FAC-003 (Service Center)</option>
          </select>
          {errors.facility_id && <p className="mt-1 text-sm text-red-600">{errors.facility_id}</p>}
        </div>

        {/* 팀원 수 */}
        <div>
          <label htmlFor="member_count" className="block text-sm font-medium text-gray-900">
            팀원 수 <span className="text-red-600">*</span>
          </label>
          <input
            id="member_count"
            name="member_count"
            type="number"
            value={formData.member_count || 1}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.member_count && <p className="mt-1 text-sm text-red-600">{errors.member_count}</p>}
        </div>

        {/* 최대 용량 */}
        <div>
          <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-900">
            최대 용량 (시간/주) <span className="text-red-600">*</span>
          </label>
          <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            value={formData.max_capacity || 8}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.max_capacity && <p className="mt-1 text-sm text-red-600">{errors.max_capacity}</p>}
        </div>

        {/* 팀 리더 ID */}
        <div>
          <label htmlFor="leader_id" className="block text-sm font-medium text-gray-900">
            팀 리더 ID <span className="text-red-600">*</span>
          </label>
          <input
            id="leader_id"
            name="leader_id"
            type="text"
            value={formData.leader_id || ''}
            onChange={handleChange}
            placeholder="리더 ID를 입력해주세요"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.leader_id && <p className="mt-1 text-sm text-red-600">{errors.leader_id}</p>}
        </div>

        {/* 상태 */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-900">
            상태 <span className="text-red-600">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || 'active'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="active">활동중</option>
            <option value="inactive">비활동</option>
            <option value="on_break">휴식중</option>
          </select>
        </div>

        {/* 전문분야 */}
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-900">
            전문분야
          </label>
          <input
            id="specialization"
            name="specialization"
            type="text"
            value={formData.specialization || ''}
            onChange={handleChange}
            placeholder="예: 전기, 기계, 유압"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* 담당 자산 */}
      <div>
        <label htmlFor="assigned_assets" className="block text-sm font-medium text-gray-900">
          담당 자산 (한 줄에 하나씩)
        </label>
        <textarea
          id="assigned_assets"
          value={(formData.assigned_assets || []).join('\n')}
          onChange={handleAssetChange}
          rows={4}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="ASSET-001&#10;ASSET-002&#10;ASSET-003"
        />
        <p className="mt-1 text-xs text-gray-500">각 자산 ID를 별도 줄에 입력해주세요</p>
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '저장 중...' : '팀 생성'}
        </button>
      </div>
    </form>
  );
}
