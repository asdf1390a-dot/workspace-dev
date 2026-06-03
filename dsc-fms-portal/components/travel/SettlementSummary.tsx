'use client';

import { useTravelContext, SettlementMember, TravelMember } from '@/context/TravelContext';

export default function SettlementSummary() {
  const { settlement, members, costs } = useTravelContext();

  if (!settlement || settlement.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">정산 현황</h3>
        <p className="text-gray-600">비용 데이터가 없습니다</p>
      </div>
    );
  }

  const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const membersById = new Map(members.map(m => [m.id, m]));

  const creditors = settlement.filter(m => m.balance > 0.01);
  const debtors = settlement.filter(m => m.balance < -0.01);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">정산 현황</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">총 지출</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">정산 완료</p>
          <p className="text-2xl font-bold text-green-600">
            {settlement.filter(m => Math.abs(m.balance) < 0.01).length}명
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">정산 필요</p>
          <p className="text-2xl font-bold text-orange-600">
            {settlement.filter(m => Math.abs(m.balance) > 0.01).length}명
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {creditors.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">받아야 할 금액</h4>
            <div className="space-y-2">
              {creditors.map(member => {
                const memberInfo = membersById.get(member.member_id);
                return (
                  <div
                    key={member.member_id}
                    className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {memberInfo?.name || 'Unknown Member'}
                      </p>
                      <p className="text-sm text-gray-600">
                        지출: ₹{member.total_paid.toLocaleString()} | 몫: ₹{member.share.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +₹{member.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {debtors.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">내야 할 금액</h4>
            <div className="space-y-2">
              {debtors.map(member => {
                const memberInfo = membersById.get(member.member_id);
                return (
                  <div
                    key={member.member_id}
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {memberInfo?.name || 'Unknown Member'}
                      </p>
                      <p className="text-sm text-gray-600">
                        지출: ₹{member.total_paid.toLocaleString()} | 몫: ₹{member.share.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        -₹{Math.abs(member.balance).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {settlement.filter(m => Math.abs(m.balance) < 0.01).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">정산 완료</h4>
            <div className="space-y-2">
              {settlement
                .filter(m => Math.abs(m.balance) < 0.01)
                .map(member => {
                  const memberInfo = membersById.get(member.member_id);
                  return (
                    <div
                      key={member.member_id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">
                        {memberInfo?.name || 'Unknown Member'}
                      </p>
                      <p className="text-sm text-gray-600">✓ 정산됨</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
