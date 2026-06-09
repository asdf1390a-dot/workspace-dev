'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Filter, RefreshCw } from 'lucide-react';

interface PerformanceMetric {
  member_id: string;
  name?: string;
  technical_competency: number;
  task_achievement: number;
  communication: number;
  learning_speed: number;
  reliability: number;
  completion_rate?: number;
  last_activity_date?: string;
  status?: 'active' | 'warning' | 'inactive';
}

interface MetricsCard {
  label: string;
  value: number | string;
  trend: number;
  trendLabel: string;
}

function MetricCard({ label, value, trend, trendLabel }: MetricsCard) {
  const isTrendPositive = trend >= 0;
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <p className="text-xs text-slate-600 mb-2">{label}</p>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <div className={`flex items-center gap-1 text-sm ${isTrendPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isTrendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trendLabel}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const percentage = (score / 100) * 100;
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 70) return 'bg-blue-500';
    if (s >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{Math.round(score)}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [metricsCards, setMetricsCards] = useState<MetricsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [sortBy, setSortBy] = useState<'reliability' | 'technical_competency' | 'task_achievement'>('reliability');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch team metrics
        const metricsRes = await fetch(`/api/team/performance/metrics?period=${period}&weeks=4`);
        const metricsData = await metricsRes.json();
        if (metricsData.metrics) {
          setMetricsCards([
            {
              label: '평균 신뢰도',
              value: metricsData.metrics.averageTrustScore || 85,
              trend: metricsData.trends?.trustScoreTrend || 5,
              trendLabel: `${metricsData.trends?.trustScoreTrend || 5}% (주)`,
            },
            {
              label: '활성 프로젝트',
              value: metricsData.metrics.activeProjects || 8,
              trend: metricsData.trends?.projectsTrend || 2,
              trendLabel: `${metricsData.trends?.projectsTrend || 2}개 (주)`,
            },
            {
              label: '완료율 평균',
              value: `${metricsData.metrics.averageCompletionRate || 72}%`,
              trend: metricsData.trends?.completionTrend || -3,
              trendLabel: `${metricsData.trends?.completionTrend || -3}% (주)`,
            },
            {
              label: '위험 지표',
              value: metricsData.metrics.riskIndicators || 2,
              trend: metricsData.trends?.riskTrend || -1,
              trendLabel: `${metricsData.trends?.riskTrend || -1}건 (주)`,
            },
          ]);
        }

        // Fetch member metrics
        const res = await fetch(`/api/team/performance/members?sort=${sortBy}&order=desc`);
        const result = await res.json();
        setMetrics(result.data || []);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy, period]);

  const calculateOverallScore = (metric: PerformanceMetric) => {
    const scores = [
      metric.technical_competency,
      metric.task_achievement,
      metric.communication,
      metric.learning_speed,
      metric.reliability,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            팀 성능 대시보드
          </h1>
          <p className="text-slate-600 mt-1">실시간 팀원 성능 메트릭 및 트렌드 분석</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="새로고침"
        >
          <RefreshCw className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-3">
        <label className="text-sm font-medium text-slate-700">기간:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="week">최근 1주</option>
          <option value="month">최근 4주</option>
          <option value="quarter">최근 분기</option>
        </select>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-200 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsCards.map((card, idx) => (
            <MetricCard key={idx} {...card} />
          ))}
        </div>
      )}

      {/* Sort and Filter */}
      <div className="flex gap-3 items-center">
        <Filter className="w-5 h-5 text-slate-600" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="reliability">신뢰도 순</option>
          <option value="technical_competency">기술역량 순</option>
          <option value="task_achievement">달성률 순</option>
        </select>
      </div>

      {/* Team Member Performance */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-slate-500">로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metrics.map((metric, idx) => (
            <Link key={idx} href={`/team/members/${metric.member_id}`}>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{metric.name || `Member ${metric.member_id}`}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {metric.status === 'warning' ? '⚠️ 주의' : metric.status === 'inactive' ? '⭕ 비활성' : '✅ 활성'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(calculateOverallScore(metric))}
                    </div>
                    <div className="text-xs text-slate-500">/100</div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <ScoreBar score={metric.technical_competency} label="기술역량" />
                  <ScoreBar score={metric.task_achievement} label="달성률" />
                  <ScoreBar score={metric.communication} label="의사소통" />
                  <ScoreBar score={metric.learning_speed} label="학습속도" />
                  <ScoreBar score={metric.reliability} label="신뢰도" />
                </div>

                {metric.completion_rate && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-900">완료율</span>
                      <span className="text-lg font-bold text-green-600">{Math.round(metric.completion_rate)}%</span>
                    </div>
                  </div>
                )}

                {metric.last_activity_date && (
                  <p className="text-xs text-slate-500 mt-3">마지막 활동: {new Date(metric.last_activity_date).toLocaleDateString('ko-KR')}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && metrics.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-slate-500">성능 메트릭 데이터 없음</p>
        </div>
      )}
    </div>
  );
}
