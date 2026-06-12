'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface AuditReportGeneratorProps {
  portfolioId?: string;
  defaultReportType?: 'change_log' | 'disposal' | 'anomaly';
}

export default function AuditReportGenerator({
  portfolioId,
  defaultReportType = 'change_log',
}: AuditReportGeneratorProps) {
  const [reportType, setReportType] = useState(defaultReportType);
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [email, setEmail] = useState('');
  const [reportFormat, setReportFormat] = useState<'json' | 'csv' | 'pdf'>('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const reportTypes = [
    { value: 'change_log', label: '변경 이력' },
    { value: 'disposal', label: '폐기 보고서' },
    { value: 'anomaly', label: '이상 탐지' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('시작 날짜가 종료 날짜보다 클 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setProgress(20);

      const response = await fetch('/api/audit-reports/export-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          format: reportFormat,
          reportType,
        }),
      });

      setProgress(50);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '보고서 생성 실패');
      }

      setProgress(80);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.${reportFormat}`;
      a.click();

      setProgress(100);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-4 p-4 border rounded bg-white">
      <h3 className="text-lg font-bold">감사 보고서 생성</h3>

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-2 bg-green-100 text-green-700 rounded">보고서가 다운로드되었습니다.</div>}

      <div>
        <label className="block text-sm font-medium mb-1">보고서 유형</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as any)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        >
          {reportTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">시작 날짜</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">종료 날짜</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">다운로드 형식</label>
        <select
          value={reportFormat}
          onChange={(e) => setReportFormat(e.target.value as any)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">받는 이메일 (선택)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
      </div>

      {loading && progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>처리 중...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div className="bg-blue-500 h-2 rounded" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '생성 중...' : '보고서 생성'}
      </button>
    </form>
  );
}
