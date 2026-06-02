'use client';

import { useState } from 'react';
import { ProductionScheduleSchema, ProductionScheduleInput } from '@/lib/harness.types';
import { AlertBox } from './shared/AlertBox';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface ProductionScheduleFormProps {
  onSubmit: (data: ProductionScheduleInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: ProductionScheduleInput;
  facilityId?: string;
}

export function ProductionScheduleForm({
  onSubmit,
  isLoading = false,
  initialData,
  facilityId,
}: ProductionScheduleFormProps) {
  const [formData, setFormData] = useState<Partial<ProductionScheduleInput>>(
    initialData || {
      facility_id: facilityId || '',
      asset_ids: [],
      scheduled_date: '',
      shift: 'A',
      target_quantity: 0,
      planned_downtime_minutes: 0,
      notes: '',
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('quantity') || name.includes('downtime') ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAssetChange = (assetId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      asset_ids: checked
        ? [...(prev.asset_ids || []), assetId]
        : (prev.asset_ids || []).filter((id) => id !== assetId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const validated = ProductionScheduleSchema.parse(formData);
      await onSubmit(validated);
      setSubmitSuccess(true);
      setFormData({
        facility_id: facilityId || '',
        asset_ids: [],
        scheduled_date: '',
        shift: 'A',
        target_quantity: 0,
        planned_downtime_minutes: 0,
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
        setSubmitError('생산일정 생성에 실패했습니다');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="생산일정을 저장 중입니다..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitSuccess && (
        <AlertBox
          type="success"
          title="성공"
          message="생산일정이 생성되었습니다"
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
        {/* 시설 ID */}
        <div>
          <label htmlFor="facility_id" className="block text-sm font-medium text-gray-900">
            시설 ID <span className="text-red-600">*</span>
          </label>
          <input
            id="facility_id"
            name="facility_id"
            type="text"
            value={formData.facility_id || ''}
            onChange={handleChange}
            disabled={!!facilityId}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="facility-id-input"
          />
          {errors.facility_id && <p className="mt-1 text-sm text-red-600">{errors.facility_id}</p>}
        </div>

        {/* 근무반 */}
        <div>
          <label htmlFor="shift" className="block text-sm font-medium text-gray-900">
            근무반 <span className="text-red-600">*</span>
          </label>
          <select
            id="shift"
            name="shift"
            value={formData.shift || 'A'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="shift-input"
          >
            <option value="A">A반 (06:00 - 14:00)</option>
            <option value="B">B반 (14:00 - 22:00)</option>
            <option value="C">C반 (22:00 - 06:00)</option>
          </select>
          {errors.shift && <p className="mt-1 text-sm text-red-600">{errors.shift}</p>}
        </div>

        {/* 생산일 */}
        <div>
          <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-900">
            생산일 <span className="text-red-600">*</span>
          </label>
          <input
            id="scheduled_date"
            name="scheduled_date"
            type="date"
            value={formData.scheduled_date || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="scheduled-date-input"
          />
          {errors.scheduled_date && <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>}
        </div>

        {/* 생산 수량 */}
        <div>
          <label htmlFor="target_quantity" className="block text-sm font-medium text-gray-900">
            생산 수량 <span className="text-red-600">*</span>
          </label>
          <input
            id="target_quantity"
            name="target_quantity"
            type="number"
            value={formData.target_quantity || 0}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="target-quantity-input"
          />
          {errors.target_quantity && <p className="mt-1 text-sm text-red-600">{errors.target_quantity}</p>}
        </div>

        {/* 계획된 가동중단시간 */}
        <div>
          <label htmlFor="planned_downtime_minutes" className="block text-sm font-medium text-gray-900">
            계획된 가동중단시간 (분) <span className="text-red-600">*</span>
          </label>
          <input
            id="planned_downtime_minutes"
            name="planned_downtime_minutes"
            type="number"
            value={formData.planned_downtime_minutes || 0}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-testid="planned-downtime-input"
          />
          {errors.planned_downtime_minutes && (
            <p className="mt-1 text-sm text-red-600">{errors.planned_downtime_minutes}</p>
          )}
        </div>
      </div>

      {/* 자산 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-900">
          해당 자산 <span className="text-red-600">*</span>
        </label>
        <div className="mt-2 space-y-2">
          {['ASSET-001', 'ASSET-002', 'ASSET-003', 'ASSET-004'].map((assetId) => (
            <label key={assetId} className="flex items-center">
              <input
                type="checkbox"
                checked={(formData.asset_ids || []).includes(assetId)}
                onChange={(e) => handleAssetChange(assetId, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                data-testid="asset-checkbox"
                data-asset-id={assetId}
              />
              <span className="ml-2 text-sm text-gray-700">{assetId}</span>
            </label>
          ))}
        </div>
        {errors.asset_ids && <p className="mt-1 text-sm text-red-600">{errors.asset_ids}</p>}
      </div>

      {/* 비고 */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
          비고
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="추가 사항을 입력해주세요"
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
          {isLoading ? '저장 중...' : '생산일정 생성'}
        </button>
      </div>
    </form>
  );
}
