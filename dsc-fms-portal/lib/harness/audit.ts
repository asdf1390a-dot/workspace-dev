import { AuditLog } from '../harness.types';
import { supabaseAdmin } from '../travel/supabase-client';

type EventType = AuditLog['event_type'];
type Status = AuditLog['status'];

interface CreateAuditLogParams {
  requestId: string;
  responseId?: string;
  eventType: EventType;
  status: Status;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  nextRetryAt?: string;
  requestSource: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<AuditLog | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        request_id: params.requestId,
        response_id: params.responseId,
        event_type: params.eventType,
        status: params.status,
        error_code: params.errorCode,
        error_message: params.errorMessage,
        retry_count: params.retryCount,
        next_retry_at: params.nextRetryAt,
        metadata: {
          request_source: params.requestSource,
          user_agent: params.userAgent,
          ip_address: params.ipAddress,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Audit log creation failed:', error);
      return null;
    }

    return data as AuditLog;
  } catch (err) {
    console.error('Audit log error:', err);
    return null;
  }
}

export async function getAuditLogs(
  filters?: {
    requestId?: string;
    status?: 'success' | 'failure';
    dateRange?: { from: string; to: string };
  },
) {
  let query = supabaseAdmin.from('audit_logs').select('*');

  if (filters?.requestId) {
    query = query.eq('request_id', filters.requestId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.from)
      .lte('created_at', filters.dateRange.to);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Audit log fetch failed:', error);
    return [];
  }

  return (data || []) as AuditLog[];
}

export function getRequestMetadata(req: Request): {
  userAgent?: string;
  ipAddress?: string;
} {
  const userAgent = req.headers.get('user-agent') || undefined;
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined;

  return { userAgent, ipAddress };
}
