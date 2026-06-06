'use client';

import { useEffect, useState } from 'react';
import { TeamMember, TeamStructure, PortfolioItem, ActivityLog } from '@/lib/types/team-dashboard';

interface UseFetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

export function useTeamMembers(options: UseFetchOptions = {}) {
  const [data, setData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (options.page) params.set('page', String(options.page));
        if (options.limit) params.set('limit', String(options.limit));
        if (options.search) params.set('search', options.search);

        const response = await fetch(`/api/team/members?${params}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Failed to fetch team members');
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [options.page, options.limit, options.search]);

  return { data, loading, error };
}

export function useTeamStructure() {
  const [data, setData] = useState<{ tree: any; flat: TeamStructure[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/team/structure');
        if (!response.ok) throw new Error('Failed to fetch team structure');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStructure();
  }, []);

  return { data, loading, error };
}

export function usePortfolioItems(memberId?: string) {
  const [data, setData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const params = memberId ? `?memberId=${memberId}` : '';
        const response = await fetch(`/api/team/portfolio${params}`);
        if (!response.ok) throw new Error('Failed to fetch portfolio items');
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [memberId]);

  return { data, loading, error };
}

export function useActivityLog(memberId?: string) {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const params = memberId ? `?memberId=${memberId}` : '';
        const response = await fetch(`/api/team/activity${params}`);
        if (!response.ok) throw new Error('Failed to fetch activity log');
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [memberId]);

  return { data, loading, error };
}

export function useTeamMember(id: string) {
  const [data, setData] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/team/members/${id}`);
        if (!response.ok) throw new Error('Failed to fetch team member');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMember();
  }, [id]);

  return { data, loading, error };
}
