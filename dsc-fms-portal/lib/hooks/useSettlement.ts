import { useEffect, useState } from 'react';

export interface SettlementMember {
  member_id: string;
  user_id: string;
  total_paid: number;
  share: number;
  balance: number;
}

export interface SettlementSummary {
  settlement: SettlementMember[];
  total_cost: number;
  currency: string;
  by_date: { [key: string]: number };
}

export function useSettlement(travelId: string) {
  const [settlement, setSettlement] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!travelId) return;

    async function fetchSettlement() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('sb-token');
        if (!token) {
          setError('Authentication required');
          return;
        }

        const response = await fetch(`/api/travels/${travelId}/settlement`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settlement data');
        }

        const data = await response.json();
        setSettlement(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchSettlement();
  }, [travelId]);

  return { settlement, loading, error };
}
