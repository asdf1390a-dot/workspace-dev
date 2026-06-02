import { z } from 'zod';

// ===== 타입 정의 =====

export interface ProductionSchedule {
  id: string;
  facility_id: string;
  asset_ids: string[];
  scheduled_date: string;
  shift: 'A' | 'B' | 'C';
  target_quantity: number;
  planned_downtime_minutes: number;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface MaintenancePlan {
  id: string;
  asset_id: string;
  maintenance_type: 'preventive' | 'corrective' | 'predictive';
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  maintenance_team_id: string;
  priority: 'high' | 'medium' | 'low';
  required_downtime: boolean;
  impact_scope: 'single' | 'area' | 'facility';
  notes: string;
  created_by: string;
  created_at: string;
}

export interface ValidationRequest {
  id: string;
  production_schedule_id: string;
  maintenance_plan_id: string;
  requested_by: string;
  request_type: 'conflict_check' | 'feasibility' | 'approval';
  validation_rules: string[];
  created_at: string;
}

export interface Conflict {
  type: 'time_overlap' | 'resource_contention' | 'capacity_exceeded';
  severity: 'critical' | 'warning';
  details: string;
  affected_assets: string[];
}

export interface ValidationResponse {
  id: string;
  request_id: string;
  status: 'valid' | 'conflict' | 'warning' | 'error';
  conflicts: Conflict[];
  recommendations: string[];
  validation_duration_ms: number;
  validated_at: string;
  validated_by: string;
}

export interface AuditLog {
  id: string;
  request_id: string;
  response_id?: string;
  event_type:
    | 'request_received'
    | 'validation_started'
    | 'validation_completed'
    | 'conflict_detected'
    | 'retry_scheduled'
    | 'retry_executed';
  status: 'success' | 'failure';
  error_code?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: string;
  metadata: {
    request_source: string;
    user_agent?: string;
    ip_address?: string;
  };
  created_at: string;
}

export interface TeamAssignment {
  id: string;
  team_id: string;
  team_name: string;
  team_type: 'maintenance' | 'production' | 'inspection' | 'quality';
  facility_id: string;
  member_count: number;
  leader_id: string;
  status: 'active' | 'inactive' | 'on_break';
  specialization?: string;
  assigned_assets?: string[];
  current_workload?: number;
  max_capacity: number;
  created_by: string;
  created_at: string;
}

// ===== Zod 스키마 =====

export const ProductionScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  facility_id: z.string().min(1, '시설 ID는 필수입니다'),
  asset_ids: z.array(z.string()).min(1, '최소 하나의 자산을 선택해주세요'),
  scheduled_date: z.string().date('올바른 날짜 형식을 입력해주세요'),
  shift: z.enum(['A', 'B', 'C']),
  target_quantity: z.number().min(0, '생산 수량은 0 이상이어야 합니다'),
  planned_downtime_minutes: z.number().min(0, '가동중단시간은 0 이상이어야 합니다'),
  notes: z.string().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
});

export const MaintenancePlanSchema = z.object({
  id: z.string().uuid().optional(),
  asset_id: z.string().min(1, '자산 ID는 필수입니다'),
  maintenance_type: z.enum(['preventive', 'corrective', 'predictive']),
  scheduled_start: z.string().datetime('올바른 날짜/시간 형식을 입력해주세요'),
  scheduled_end: z.string().datetime('올바른 날짜/시간 형식을 입력해주세요'),
  duration_minutes: z.number().min(1, '소요시간은 1분 이상이어야 합니다'),
  maintenance_team_id: z.string().min(1, '보전팀 ID는 필수입니다'),
  priority: z.enum(['high', 'medium', 'low']),
  required_downtime: z.boolean(),
  impact_scope: z.enum(['single', 'area', 'facility']),
  notes: z.string().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
});

export const ValidationRequestSchema = z.object({
  production_schedule_id: z.string().uuid('올바른 일정 ID를 입력해주세요'),
  maintenance_plan_id: z.string().uuid('올바른 유지보수 ID를 입력해주세요'),
  request_type: z.enum(['conflict_check', 'feasibility', 'approval']),
  validation_rules: z.array(z.string()).optional(),
});

export const TeamAssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  team_id: z.string().min(1, '팀 ID는 필수입니다'),
  team_name: z.string().min(1, '팀 이름은 필수입니다'),
  team_type: z.enum(['maintenance', 'production', 'inspection', 'quality']),
  facility_id: z.string().min(1, '시설 ID는 필수입니다'),
  member_count: z.number().min(1, '팀원 수는 1명 이상이어야 합니다'),
  leader_id: z.string().min(1, '팀 리더 ID는 필수입니다'),
  status: z.enum(['active', 'inactive', 'on_break']),
  specialization: z.string().optional(),
  assigned_assets: z.array(z.string()).optional(),
  current_workload: z.number().min(0).optional(),
  max_capacity: z.number().min(1, '최대 용량은 1 이상이어야 합니다'),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
});

export type ProductionScheduleInput = z.infer<typeof ProductionScheduleSchema>;
export type MaintenancePlanInput = z.infer<typeof MaintenancePlanSchema>;
export type ValidationRequestInput = z.infer<typeof ValidationRequestSchema>;
export type TeamAssignmentInput = z.infer<typeof TeamAssignmentSchema>;
