'use client';

import { useMemo, useEffect, useState } from 'react';
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
  payer_id?: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  user?: {
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
}

interface SettlementMember {
  member_id: string;
  user_id: string;
  total_paid: number;
  share: number;
  balance: number;
}

interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
}

interface TravelAnalyticsTabProps {
  costs: Cost[];
  budget?: number;
  startDate?: string;
  endDate?: string;
  travelId?: string;
}

interface DateRange {
  from?: string;
  to?: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TravelAnalyticsTab({
  costs,
  budget = 0,
  startDate,
  endDate,
  travelId,
}: TravelAnalyticsTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [settlement, setSettlement] = useState<SettlementMember[]>([]);
  const [settlementTransactions, setSettlementTransactions] = useState<SettlementTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (travelId) {
      fetchMembersAndSettlement();
    }
  }, [travelId]);

  const simplifySettlement = (members: SettlementMember[]): SettlementTransaction[] => {
    const debtors = members.filter((m) => m.balance < -0.01);
    const creditors = members.filter((m) => m.balance > 0.01);
    const transactions: SettlementTransaction[] = [];

    debtors.forEach((debtor) => {
      let owed = Math.abs(debtor.balance);

      for (let creditor of creditors) {
        if (creditor.balance < 0.01) continue;
        if (owed < 0.01) break;

        const payment = Math.min(owed, creditor.balance);
        transactions.push({
          from: debtor.user_id,
          to: creditor.user_id,
          amount: Math.round(payment * 100) / 100,
        });

        owed -= payment;
        creditor.balance -= payment;
      }
    });

    return transactions;
  };

  const fetchMembersAndSettlement = async () => {
    if (!travelId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const [membersRes, settlementRes] = await Promise.all([
        fetch(`/api/travels/${travelId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/travels/${travelId}/settlement`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      }

      if (settlementRes.ok) {
        const settlementData = await settlementRes.json();
        const settlementList = settlementData.data?.settlement || [];
        setSettlement(settlementList);

        // Calculate simplified settlement
        const transactions = simplifySettlement([...settlementList]);
        setSettlementTransactions(transactions);
      }
    } catch (err) {
      console.error('Failed to fetch members/settlement:', err);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const categoryBreakdown: { [key: string]: number } = {};
    const dailyCosts: { [key: string]: number } = {};
    const memberSpending: { [key: string]: number } = {};
    let totalCost = 0;

    // Filter costs based on date range and category
    const filteredCosts = costs.filter(cost => {
      const costDate = cost.created_at.split('T')[0];

      // Date range filter
      if (dateRange.from && costDate < dateRange.from) return false;
      if (dateRange.to && costDate > dateRange.to) return false;

      // Category filter
      if (selectedCategories.length > 0) {
        const category = cost.category || 'Other';
        return selectedCategories.includes(category);
      }

      return true;
    });

    filteredCosts.forEach(cost => {
      totalCost += cost.amount;

      const category = cost.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + cost.amount;

      const date = new Date(cost.created_at).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + cost.amount;

      // Track member-wise spending (by payer)
      if (cost.payer_id) {
        memberSpending[cost.payer_id] = (memberSpending[cost.payer_id] || 0) + cost.amount;
      }
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

    const memberData = settlement.map(member => ({
      memberId: member.member_id,
      userId: member.user_id,
      paid: member.total_paid,
      share: member.share,
      balance: member.balance,
      memberName: members.find(m => m.user_id === member.user_id)?.user?.user_metadata?.name ||
                  members.find(m => m.user_id === member.user_id)?.user?.email || 'Unknown',
    }));

    const remaining = Math.max(0, budget - totalCost);
    const utilization = budget > 0 ? Math.round((totalCost / budget) * 100) : 0;

    return {
      categoryData,
      timelineData,
      memberData,
      totalCost: Math.round(totalCost),
      remaining,
      utilization,
      costCount: filteredCosts.length,
    };
  }, [costs, budget, settlement, members, dateRange, selectedCategories]);

  // Get all available categories from costs
  const allCategories = Array.from(new Set(costs.map(c => c.category || 'Other'))).sort();

  return (
    <div className="space-y-8">
      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">시작 날짜</label>
            <input
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">종료 날짜</label>
            <input
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 카테고리 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              multiple
              value={selectedCategories}
              onChange={(e) => setSelectedCategories(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              size={Math.min(5, allCategories.length + 1)}
            >
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl/Cmd+Click으로 복수 선택</p>
          </div>
        </div>

        {/* 필터 상태 표시 */}
        {(dateRange.from || dateRange.to || selectedCategories.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {dateRange.from && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                시작: {dateRange.from}
                <button
                  onClick={() => setDateRange({ ...dateRange, from: undefined })}
                  className="ml-1 text-blue-600 hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            )}
            {dateRange.to && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                종료: {dateRange.to}
                <button
                  onClick={() => setDateRange({ ...dateRange, to: undefined })}
                  className="ml-1 text-blue-600 hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedCategories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {cat}
                <button
                  onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                  className="ml-1 text-purple-600 hover:text-purple-900"
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                setDateRange({ from: undefined, to: undefined });
                setSelectedCategories([]);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              모두 지우기
            </button>
          </div>
        )}
      </div>

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

      {/* 멤버별 참여 분석 (Day 11) */}
      {analytics.memberData.length > 0 && (
        <>
          {/* 멤버별 정산 요약 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">멤버별 정산 요약</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">멤버</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">지불액</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">몫</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.memberData.map((member) => (
                    <tr key={member.memberId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{member.memberName}</td>
                      <td className="px-4 py-3 text-right text-gray-700">₹{member.paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">₹{member.share.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        member.balance > 0.01 ? 'text-green-600' :
                        member.balance < -0.01 ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        ₹{member.balance > 0 ? '+' : ''}{member.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * 잔액: 양수 = 받을 금액, 음수 = 낼 금액
            </p>
          </div>

          {/* 멤버별 기여도 */}
          {analytics.memberData.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 멤버별 지불액 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">멤버별 지불액</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.memberData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="memberName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Bar dataKey="paid" fill="#3b82f6" name="지불액">
                      {analytics.memberData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 멤버별 몫 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">멤버별 몫</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.memberData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="memberName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Bar dataKey="share" fill="#10b981" name="몫">
                      {analytics.memberData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 기여도 파이 차트 */}
          {analytics.memberData.length > 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">멤버별 기여도</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {analytics.memberData.map((member, index) => (
                  <div key={member.memberId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{member.memberName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {Math.round((member.paid / analytics.totalCost) * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">₹{member.paid.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 정산 권고사항 */}
          {settlementTransactions.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">정산 권고사항</h3>
              <div className="space-y-3">
                {settlementTransactions.map((transaction, index) => {
                  const fromMember = analytics.memberData.find(m => m.userId === transaction.from);
                  const toMember = analytics.memberData.find(m => m.userId === transaction.to);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border-l-4 border-amber-400">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{fromMember?.memberName || 'Unknown'}</span>
                          <span className="text-gray-500"> → </span>
                          <span className="font-semibold text-gray-900">{toMember?.memberName || 'Unknown'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">₹{transaction.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-4 p-3 bg-white rounded">
                💡 위의 정산을 수행하면 모든 멤버의 잔액이 정산됩니다.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
