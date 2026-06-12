'use client';

import { useState, useEffect } from 'react';

interface EditPatternData {
  analysis_period: string;
  edit_velocity: {
    edits_per_day_avg: number;
    peak_edit_day: string;
    peak_edit_hour: string;
  };
  field_volatility: Record<
    string,
    {
      change_frequency: number;
      common_transitions: string[];
      stability_score: number;
    }
  >;
}

interface EditPatternAnalyticsProps {
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

const dayNames: Record<string, string> = {
  Sunday: '일',
  Monday: '월',
  Tuesday: '화',
  Wednesday: '수',
  Thursday: '목',
  Friday: '금',
  Saturday: '토',
};

export default function EditPatternAnalytics({ timeRange = 'month' }: EditPatternAnalyticsProps) {
  const [data, setData] = useState<EditPatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/edit-patterns?time_range=${timeRange}`);
        if (!response.ok) throw new Error('편집 패턴 데이터 로드 실패');

        const patternData = await response.json();
        setData(patternData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, [timeRange]);

  if (loading) return <div className="p-4 text-center text-gray-500">로딩 중...</div>;

  if (error) return <div className="p-4 text-red-500">오류: {error}</div>;

  if (!data) return <div className="p-4 text-gray-500">데이터를 불러올 수 없습니다.</div>;

  const fields = Object.entries(data.field_volatility);
  const maxFrequency = Math.max(...fields.map(([, v]) => v.change_frequency), 1);

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold">편집 패턴 분석</h2>
        <p className="text-gray-600 text-sm">분석 기간: {data.analysis_period}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">일일 평균 편집</p>
          <p className="text-3xl font-bold">{data.edit_velocity.edits_per_day_avg.toFixed(1)}</p>
        </div>
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">편집 가장 많은 요일</p>
          <p className="text-2xl font-bold">
            {dayNames[data.edit_velocity.peak_edit_day] || data.edit_velocity.peak_edit_day}
          </p>
        </div>
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">편집 가장 많은 시간</p>
          <p className="text-2xl font-bold">{data.edit_velocity.peak_edit_hour}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <h3 className="font-bold mb-4">필드별 변경 빈도</h3>
        <div className="space-y-4">
          {fields.map(([field, stats]) => (
            <div key={field} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-semibold">{field}</p>
                  <p className="text-sm text-gray-600">{stats.change_frequency}회 변경</p>
                </div>
                <p className="text-sm font-medium">
                  안정도: {(stats.stability_score * 100).toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded h-6">
                <div
                  className="bg-blue-500 h-6 rounded transition-all"
                  style={{ width: `${(stats.change_frequency / maxFrequency) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <h3 className="font-bold mb-4">주요 변경 추이</h3>
        <div className="space-y-4">
          {fields.map(([field, stats]) => (
            <div key={field} className="border-l-4 border-blue-500 pl-3">
              <p className="font-semibold text-sm mb-2">{field}</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {stats.common_transitions.map((transition, idx) => (
                  <li key={idx}>• {transition}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <h3 className="font-bold mb-2 text-blue-900">통찰력</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            ✓ 가장 자주 변경되는 필드: {fields[0]?.[0]} ({fields[0]?.[1].change_frequency || 0}회)
          </li>
          <li>
            ✓ 가장 안정적인 필드:{' '}
            {fields.reduce((a, b) => (a[1].stability_score > b[1].stability_score ? a : b))[0]}
          </li>
          <li>✓ 피크 편집 시간: {data.edit_velocity.peak_edit_hour}</li>
          <li>✓ 평균 일일 편집: {data.edit_velocity.edits_per_day_avg.toFixed(1)}회</li>
        </ul>
      </div>
    </div>
  );
}
