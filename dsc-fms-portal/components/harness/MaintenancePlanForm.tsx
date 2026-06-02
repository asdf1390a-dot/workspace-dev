'use client';

import { useState } from 'react';
import { MaintenancePlanSchema, MaintenancePlanInput } from '@/lib/harness.types';
import { AlertBox } from './shared/AlertBox';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface MaintenancePlanFormProps {
  onSubmit: (data: MaintenancePlanInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: MaintenancePlanInput;
}

export function MaintenancePlanForm({ onSubmit, isLoading = false, initialData }: MaintenancePlanFormProps) {
  const [formData, setFormData] = useState<Partial<MaintenancePlanInput>>(
    initialData || {
      asset_id: '',
      maintenance_type: 'preventive',
      scheduled_start: '',
      scheduled_end: '',
      duration_minutes: 0,
      maintenance_team_id: '',
      priority: 'medium',
      required_downtime: false,
      impact_scope: 'single',
      notes: '',
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
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : name.includes('duration') ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const validated = MaintenancePlanSchema.parse(formData);
      await onSubmit(validated);
      setSubmitSuccess(true);
      setFormData({
        asset_id: '',
        maintenance_type: 'preventive',
        scheduled_start: '',
        scheduled_end: '',
        duration_minutes: 0,
        maintenance_team_id: '',
        priority: 'medium',
        required_downtime: false,
        impact_scope: 'single',
        notes: '',
      });
    } catch (error) {
      if (error instanceof Error) {
        const validation = JSON.parse(error.message);
        if (validation.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(validation.fieldErrors).forEach(([key, value]: [string, any]) => {
            fieldErrors[key] = value[0] || '입력 오류';
          });
          setErrors(fieldErrors);
        }
      } else {
        setSubmitError('유지보수 계획 생성에 실패했습니다');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="유지보수 계획을 저장 중입니다..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitSuccess && (
        <AlertBox
          type="success"
          title="성공"
          message="유지보수 계획이 생성되었습니다"
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
        {/* 자산 ID */}
        <div>
          <label htmlFor="asset_id" className="block text-sm font-medium text-gray-900">
            자산 ID <span className="text-red-600">*</span>
          </label>
          <select
            id="asset_id"
            name="asset_id"
            value={formData.asset_id || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="asset-id-input"
          >
            <option value="">자산을 선택해주세요</option>
            <option value="ASSET-001">ASSET-001</option>
            <option value="ASSET-002">ASSET-002</option>
            <option value="ASSET-003">ASSET-003</option>
            <option value="ASSET-004">ASSET-004</option>
          </select>
          {errors.asset_id && <p className="mt-1 text-sm text-red-600">{errors.asset_id}</p>}
        </div>

        {/* 유지보수 유형 */}
        <div>
          <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-900">
            유지보수 유형 <span className="text-red-600">*</span>
          </label>
          <select
            id="maintenance_type"
            name="maintenance_type"
            value={formData.maintenance_type || 'preventive'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="maintenance-type"
          >
            <option value="preventive">정기 유지보수</option>
            <option value="corrective">비상 유지보수</option>
            <option value="predictive">예측 유지보수</option>
          </select>
        </div>

        {/* 시작 시간 */}
        <div>
          <label htmlFor="scheduled_start" className="block text-sm font-medium text-gray-900">
            시작 시간 <span className="text-red-600">*</span>
          </label>
          <input
            id="scheduled_start"
            name="scheduled_start"
            type="datetime-local"
            value={formData.scheduled_start || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="start-date-input"
          />
          {errors.scheduled_start && <p className="mt-1 text-sm text-red-600">{errors.scheduled_start}</p>}
        </div>

        {/* 종료 시간 */}
        <div>
          <label htmlFor="scheduled_end" className="block text-sm font-medium text-gray-900">
            종료 시간 <span className="text-red-600">*</span>
          </label>
          <input
            id="scheduled_end"
            name="scheduled_end"
            type="datetime-local"
            value={formData.scheduled_end || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="end-date-input"
          />
          {errors.scheduled_end && <p className="mt-1 text-sm text-red-600">{errors.scheduled_end}</p>}
        </div>

        {/* 소요 시간 */}
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-900">
            소요 시간 (분) <span className="text-red-600">*</span>
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            value={formData.duration_minutes || 0}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="duration-input"
          />
          {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>}
        </div>

        {/* 보전팀 ID */}
        <div>
          <label htmlFor="maintenance_team_id" className="block text-sm font-medium text-gray-900">
            보전팀 ID <span className="text-red-600">*</span>
          </label>
          <input
            id="maintenance_team_id"
            name="maintenance_team_id"
            type="text"
            value={formData.maintenance_team_id || ''}
            onChange={handleChange}
            placeholder="팀 ID를 입력해주세요"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="team-id-input"
          />
          {errors.maintenance_team_id && <p className="mt-1 text-sm text-red-600">{errors.maintenance_team_id}</p>}
        </div>

        {/* 우선순위 */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-900">
            우선순위 <span className="text-red-600">*</span>
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority || 'medium'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="priority"
          >
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {/* 영향 범위 */}
        <div>
          <label htmlFor="impact_scope" className="block text-sm font-medium text-gray-900">
            영향 범위 <span className="text-red-600">*</span>
          </label>
          <select
            id="impact_scope"
            name="impact_scope"
            value={formData.impact_scope || 'single'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="impact-scope"
          >
            <option value="single">단일 자산</option>
            <option value="area">지역</option>
            <option value="facility">전체 시설</option>
          </select>
        </div>
      </div>

      {/* 자산 정지 필요 */}
      <div className="flex items-center">
        <input
          id="required_downtime"
          name="required_downtime"
          type="checkbox"
          checked={formData.required_downtime || false}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300"
          data-testid="required-downtime"
        />
        <label htmlFor="required_downtime" className="ml-2 text-sm text-gray-700">
          자산 정지 필요
        </label>
      </div>

      {/* 비고 */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
          작업 내용
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="유지보수 작업 내용을 입력해주세요"
        />
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          data-testid="submit-btn"
        >
          {isLoading ? '저장 중...' : '유지보수 계획 생성'}
        </button>
      </div>
    </form>
  );
}
