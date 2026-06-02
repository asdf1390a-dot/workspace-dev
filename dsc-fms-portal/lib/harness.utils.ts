export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getShiftLabel(shift: 'A' | 'B' | 'C'): string {
  const labels = {
    A: '05:00 - 14:00',
    B: '14:00 - 22:00',
    C: '22:00 - 06:00',
  };
  return labels[shift];
}

export function getMaintenanceTypeLabel(type: 'preventive' | 'corrective' | 'predictive'): string {
  const labels = {
    preventive: '정기 유지보수',
    corrective: '비상 유지보수',
    predictive: '예측 유지보수',
  };
  return labels[type];
}

export function getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
  const labels = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  };
  return labels[priority];
}

export function getPriorityStyling(priority: 'high' | 'medium' | 'low'): {
  bg: string;
  text: string;
  border: string;
} {
  const styles = {
    high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
    low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  };
  return styles[priority];
}

export function getConflictSeverityLabel(severity: 'critical' | 'warning'): string {
  const labels = {
    critical: '심각',
    warning: '주의',
  };
  return labels[severity];
}

export function getConflictTypeLabe(type: 'time_overlap' | 'resource_contention' | 'capacity_exceeded'): string {
  const labels = {
    time_overlap: '시간 겹침',
    resource_contention: '자산 충돌',
    capacity_exceeded: '용량 초과',
  };
  return labels[type];
}

export function getValidationStatusLabel(status: 'valid' | 'conflict' | 'warning' | 'error'): string {
  const labels = {
    valid: '확인됨',
    conflict: '충돌 발생',
    warning: '주의사항',
    error: '오류',
  };
  return labels[status];
}

export function getValidationStatusColor(status: 'valid' | 'conflict' | 'warning' | 'error'): string {
  const colors = {
    valid: 'text-green-600 bg-green-50',
    conflict: 'text-red-600 bg-red-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-gray-600 bg-gray-50',
  };
  return colors[status];
}

export function calculateTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  return s1 <= e2 && s2 <= e1;
}

export function getEventTypeLabel(
  eventType:
    | 'request_received'
    | 'validation_started'
    | 'validation_completed'
    | 'conflict_detected'
    | 'retry_scheduled'
    | 'retry_executed',
): string {
  const labels = {
    request_received: '요청 수신',
    validation_started: '검증 시작',
    validation_completed: '검증 완료',
    conflict_detected: '충돌 감지',
    retry_scheduled: '재시도 예정',
    retry_executed: '재시도 실행',
  };
  return labels[eventType];
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

export function getTeamTypeLabel(
  teamType: 'maintenance' | 'production' | 'inspection' | 'quality',
): string {
  const labels = {
    maintenance: '유지보수팀',
    production: '생산팀',
    inspection: '검사팀',
    quality: '품질팀',
  };
  return labels[teamType];
}

export function getTeamStatusLabel(status: 'active' | 'inactive' | 'on_break'): string {
  const labels = {
    active: '활동중',
    inactive: '비활동',
    on_break: '휴식중',
  };
  return labels[status];
}

export function getTeamStatusColor(status: 'active' | 'inactive' | 'on_break'): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = {
    active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
    inactive: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
    on_break: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  };
  return colors[status];
}

export function calculateTeamUtilization(currentWorkload: number, maxCapacity: number): number {
  if (maxCapacity === 0) return 0;
  return Math.min(100, Math.round((currentWorkload / maxCapacity) * 100));
}

export function getTeamUtilizationColor(utilization: number): string {
  if (utilization >= 90) return 'text-red-600';
  if (utilization >= 75) return 'text-yellow-600';
  return 'text-green-600';
}
