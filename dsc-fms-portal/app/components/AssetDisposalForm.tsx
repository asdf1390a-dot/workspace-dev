'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface AssetDisposalFormProps {
  assetId: string;
  onDisposalComplete?: (disposalRecord: any) => void;
}

export default function AssetDisposalForm({ assetId, onDisposalComplete }: AssetDisposalFormProps) {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [certificateUrl, setCertificateUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reasons = ['수명만료', '손상', '판매', '기증', '기타'];
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!reason) {
      setError('폐기 사유를 선택해주세요.');
      return;
    }

    if (new Date(date) > new Date(today)) {
      setError('폐기 날짜는 오늘 이전이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/assets/${assetId}/dispose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposal_reason: reason,
          disposal_date: date,
          disposal_certificate_url: certificateUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '폐기 등록 실패');
      }

      const disposalData = await response.json();
      setSuccess(true);
      setReason('');
      setDate(today);
      setCertificateUrl('');
      onDisposalComplete?.(disposalData);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white">
      <h3 className="text-lg font-bold">자산 폐기 등록</h3>

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-2 bg-green-100 text-green-700 rounded">폐기가 등록되었습니다.</div>}

      <div>
        <label className="block text-sm font-medium mb-1">폐기 사유 *</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        >
          <option value="">선택하세요</option>
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">폐기 날짜 *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={today}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">폐기 증명서 URL (선택)</label>
        <input
          type="url"
          value={certificateUrl}
          onChange={(e) => setCertificateUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '처리 중...' : '폐기 등록'}
      </button>
    </form>
  );
}
