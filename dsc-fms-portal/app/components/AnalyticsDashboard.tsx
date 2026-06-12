'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface AnalyticsData {
  total_disposals: number;
  monthly_trends: Array<{ month: string; disposals: number }>;
  reason_distribution: Array<{ reason: string; count: number; percentage: string }>;
}

interface AnalyticsDashboardProps {
  portfolioId?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export default function AnalyticsDashboard({
  portfolioId,
  timeRange = 'month',
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(timeRange);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/asset-disposals-trends?months=12`);
        if (!response.ok) throw new Error('분석 데이터 로드 실패');

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod]);

  if (loading) return <div className="p-4 text-center text-gray-500">로딩 중...</div>;

  if (error) return <div className="p-4 text-red-500">오류: {error}</div>;

  const maxDisposals = Math.max(...(data?.monthly_trends.map((t) => t.disposals) || [1]));

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">자산 분석 대시보드</h2>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-sm ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period === 'week' && '주간'}
              {period === 'month' && '월간'}
              {period === 'quarter' && '분기'}
              {period === 'year' && '연간'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">총 폐기</p>
          <p className="text-3xl font-bold">{data?.total_disposals || 0}</p>
        </div>
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">월평균</p>
          <p className="text-3xl font-bold">
            {Math.round((data?.total_disposals || 0) / (data?.monthly_trends.length || 1))}
          </p>
        </div>
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">주요 사유</p>
          <p className="text-lg font-bold">
            {data?.reason_distribution[0]?.reason || '-'}
          </p>
        </div>
        <div className="bg-white p-4 rounded border">
          <p className="text-gray-600 text-sm">분석 기간</p>
          <p className="text-lg font-bold">{format(new Date(), 'yyyy-MM')}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <h3 className="font-bold mb-4">월별 폐기 추세</h3>
        <div className="space-y-2">
          {data?.monthly_trends.map((trend) => (
            <div key={trend.month} className="flex items-center gap-3">
              <span className="w-20 text-sm">{trend.month}</span>
              <div className="flex-1 bg-gray-200 rounded h-6 relative">
                <div
                  className="bg-blue-500 h-6 rounded"
                  style={{ width: `${(trend.disposals / maxDisposals) * 100}%` }}
                ></div>
              </div>
              <span className="w-12 text-right font-semibold">{trend.disposals}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <h3 className="font-bold mb-4">폐기 사유별 분포</h3>
        <div className="space-y-3">
          {data?.reason_distribution.map((item) => (
            <div key={item.reason} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{item.reason}</p>
                <p className="text-sm text-gray-600">{item.count}건</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-40 bg-gray-200 rounded h-4">
                  <div
                    className="bg-green-500 h-4 rounded"
                    style={{ width: `${parseFloat(item.percentage)}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-bold mb-3">폐기 유형</h3>
          <div className="space-y-2 text-sm">
            <p>✓ 수명만료: 자연적 수명 종료</p>
            <p>✓ 손상: 수리 불가능한 손상</p>
            <p>✓ 판매: 매각 또는 거래</p>
            <p>✓ 기증: 무상 이양</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-bold mb-3">통계 요약</h3>
          <div className="space-y-2 text-sm">
            <p>분석 기간: {selectedPeriod}</p>
            <p>총 레코드: {data?.monthly_trends.length || 0}개월</p>
            <p>마지막 업데이트: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
            <p>신뢰도: 95%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
