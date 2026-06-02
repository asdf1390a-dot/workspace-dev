import { Conflict, MaintenancePlan, ProductionSchedule } from '../harness.types';

export async function detectTimeOverlap(
  prodStart: string,
  prodEnd: string,
  maintStart: string,
  maintEnd: string,
): Promise<boolean> {
  const s1 = new Date(prodStart).getTime();
  const e1 = new Date(prodEnd).getTime();
  const s2 = new Date(maintStart).getTime();
  const e2 = new Date(maintEnd).getTime();

  return s1 <= e2 && s2 <= e1;
}

export async function checkAssetMaintenanceConflict(
  assetId: string,
  requiredDowntime: boolean,
  supabase: any,
): Promise<boolean> {
  if (!requiredDowntime) return false;

  const { data: asset } = await supabase
    .from('assets')
    .select('status')
    .eq('id', assetId)
    .single();

  return asset?.status === 'maintenance';
}

export async function checkCapacityExceeded(
  teamId: string,
  supabase: any,
): Promise<boolean> {
  const { data: team } = await supabase
    .from('team_assignments')
    .select('member_count')
    .eq('id', teamId)
    .single();

  if (!team) return false;

  const { count: concurrentJobs } = await supabase
    .from('maintenance_plans')
    .select('*', { count: 'exact' })
    .eq('maintenance_team_id', teamId)
    .in('status', ['scheduled', 'in_progress']);

  return (concurrentJobs || 0) > (team.member_count || 1) * 2;
}

export function createConflict(
  type: Conflict['type'],
  severity: Conflict['severity'],
  details: string,
  affectedAssets: string[],
): Conflict {
  return {
    type,
    severity,
    details,
    affected_assets: affectedAssets,
  };
}

export function handleValidationError(error: any) {
  const message = error?.message || '검증 중 오류가 발생했습니다';
  const code = error?.code || 'VALIDATION_ERROR';
  return { message, code };
}
