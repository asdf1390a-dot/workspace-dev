import useSWR from 'swr';
import { useState } from 'react';
import {
  ProductionSchedule,
  MaintenancePlan,
  ValidationResponse,
  AuditLog,
  ValidationRequest,
  ProductionScheduleInput,
  MaintenancePlanInput,
  TeamAssignment,
  TeamAssignmentInput,
} from './harness.types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ===== 생산일정 관련 훅 =====

export function useProductionSchedules(facilityId?: string) {
  const query = facilityId ? `?facility_id=${facilityId}` : '';
  const { data, error, isLoading, mutate } = useSWR<ProductionSchedule[]>(
    `/api/harness/production-schedules${query}`,
    fetcher,
  );

  return {
    schedules: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useProductionScheduleDetail(scheduleId: string) {
  const { data, error, isLoading } = useSWR<ProductionSchedule>(
    scheduleId ? `/api/harness/production-schedules/${scheduleId}` : null,
    fetcher,
  );

  return { schedule: data, isLoading, error };
}

export function useCreateProductionSchedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: ProductionScheduleInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/harness/production-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '생산일정 생성에 실패했습니다');
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// ===== 유지보수 계획 관련 훅 =====

export function useMaintenancePlans(assetId?: string) {
  const query = assetId ? `?asset_id=${assetId}` : '';
  const { data, error, isLoading, mutate } = useSWR<MaintenancePlan[]>(
    `/api/harness/maintenance-plans${query}`,
    fetcher,
  );

  return {
    plans: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useMaintenancePlanDetail(planId: string) {
  const { data, error, isLoading } = useSWR<MaintenancePlan>(
    planId ? `/api/harness/maintenance-plans/${planId}` : null,
    fetcher,
  );

  return { plan: data, isLoading, error };
}

export function useCreateMaintenancePlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: MaintenancePlanInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/harness/maintenance-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '유지보수 계획 생성에 실패했습니다');
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// ===== 검증 관련 훅 =====

export function useValidationResult(requestId?: string) {
  const { data, error, isLoading } = useSWR<ValidationResponse>(
    requestId ? `/api/harness/validation-results/${requestId}` : null,
    fetcher,
  );

  return { result: data, isLoading, error };
}

export function useConflicts(facilityId?: string, dateRange?: { from: string; to: string }) {
  let query = '';
  const params = new URLSearchParams();
  if (facilityId) params.append('facility_id', facilityId);
  if (dateRange) {
    params.append('from', dateRange.from);
    params.append('to', dateRange.to);
  }
  query = params.toString() ? `?${params.toString()}` : '';

  const { data, error, isLoading, mutate } = useSWR<ValidationResponse[]>(
    `/api/harness/conflicts${query}`,
    fetcher,
  );

  return {
    conflicts: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useValidate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async (request: ValidationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/harness/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '검증에 실패했습니다');
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { validate, loading, error };
}

// ===== 감시로그 관련 훅 =====

export function useAuditLogs(
  filters?: {
    requestId?: string;
    status?: 'success' | 'failure';
    dateRange?: { from: string; to: string };
  },
) {
  const params = new URLSearchParams();
  if (filters?.requestId) params.append('request_id', filters.requestId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateRange) {
    params.append('from', filters.dateRange.from);
    params.append('to', filters.dateRange.to);
  }
  const query = params.toString() ? `?${params.toString()}` : '';

  const { data, error, isLoading, mutate } = useSWR<AuditLog[]>(
    `/api/harness/audit-logs${query}`,
    fetcher,
  );

  return {
    logs: data || [],
    isLoading,
    error,
    mutate,
  };
}

// ===== 팀 배정 관련 훅 =====

export function useTeams(filters?: {
  facilityId?: string;
  teamType?: 'maintenance' | 'production' | 'inspection' | 'quality';
  status?: 'active' | 'inactive' | 'on_break';
}) {
  const params = new URLSearchParams();
  if (filters?.facilityId) params.append('facility_id', filters.facilityId);
  if (filters?.teamType) params.append('team_type', filters.teamType);
  if (filters?.status) params.append('status', filters.status);
  const query = params.toString() ? `?${params.toString()}` : '';

  const { data, error, isLoading, mutate } = useSWR<TeamAssignment[]>(
    `/api/harness/teams${query}`,
    fetcher,
  );

  return {
    teams: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useTeamDetail(teamId: string) {
  const { data, error, isLoading } = useSWR<TeamAssignment>(
    teamId ? `/api/harness/teams/${teamId}` : null,
    fetcher,
  );

  return { team: data, isLoading, error };
}

export function useCreateTeam() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: TeamAssignmentInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/harness/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '팀 생성에 실패했습니다');
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}
