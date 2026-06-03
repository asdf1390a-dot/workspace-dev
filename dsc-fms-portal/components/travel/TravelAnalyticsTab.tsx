'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Cost {
  id: string;
  item_name: string;
  category: string;
  amount: number;
  created_at: string;
}

interface TravelAnalyticsTabProps {
  costs: Cost[];
  budget?: number;
  startDate?: string;
  endDate?: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TravelAnalyticsTab({
  costs,
  budget = 0,
  startDate,
  endDate,
}: TravelAnalyticsTabProps) {
  const analytics = useMemo(() => {
    const categoryBreakdown: { [key: string]: number } = {};
    const dailyCosts: { [key: string]: number } = {};
    let totalCost = 0;

    costs.forEach(cost => {
      totalCost += cost.amount;

      const category = cost.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + cost.amount;

      const date = new Date(cost.created_at).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + cost.amount;
    });

    const categoryData = Object.entries(categoryBreakdown)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: ((value / totalCost) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value);

    const timelineData = Object.entries(dailyCosts)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        amount: Math.round(amount),
      }));

    const remaining = Math.max(0, budget - totalCost);
    const utilization = budget > 0 ? Math.round((totalCost / budget) * 100) : 0;

    return {
      categoryData,
      timelineData,
      totalCost: Math.round(totalCost),
      remaining,
      utilization,
      costCount: costs.length,
    };
  }, [costs, budget]);

  return (
    <div className="space-y-8">
      {/* 예산 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">전체 지출</p>
          <p className="text-3xl font-bold text-gray-900">₹{analytics.totalCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">{analytics.costCount}개 항목</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">남은 예산</p>
          <p className={`text-3xl font-bold ${analytics.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{analytics.remaining.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">예산: ₹{budget.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">예산 사용률</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-blue-600">{analytics.utilization}%</p>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    analytics.utilization <= 80
                      ? 'bg-green-500'
                      : analytics.utilization <= 95
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(analytics.utilization, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 카테고리별 지출 분석 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">카테고리별 지출</h3>
          {analytics.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload }) => `${payload.name} ${payload.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">지출 데이터가 없습니다</p>
          )}
        </div>

        {/* 카테고리별 상세 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">카테고리별 상세</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analytics.categoryData.length > 0 ? (
              analytics.categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{item.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{item.percentage}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">카테고리 데이터가 없습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* 시간대별 지출 추이 */}
      {analytics.timelineData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">지출 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                name="일일 지출"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 카테고리별 비교 차트 */}
      {analytics.categoryData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">카테고리별 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#3b82f6" name="지출액">
                {analytics.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 통계 요약 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">지출 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">평균 지출</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{analytics.costCount > 0 ? Math.round(analytics.totalCost / analytics.costCount).toLocaleString() : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">최대 지출</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{analytics.categoryData.length > 0 ? analytics.categoryData[0].value.toLocaleString() : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">총 항목 수</p>
            <p className="text-lg font-semibold text-gray-900">{analytics.costCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">카테고리 수</p>
            <p className="text-lg font-semibold text-gray-900">{analytics.categoryData.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
