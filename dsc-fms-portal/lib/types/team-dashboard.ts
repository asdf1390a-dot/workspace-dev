// Team Dashboard Types

// Team Members
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  start_date?: string;
  avatar_url?: string;
  bio?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamMemberRequest {
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  start_date?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdateTeamMemberRequest {
  name?: string;
  role?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  active?: boolean;
}

// Performance Metrics
export interface TeamPerformanceMetric {
  id: string;
  member_id: string;
  week_start: string;
  technical_competency: number;
  task_achievement: number;
  communication: number;
  learning_speed: number;
  reliability: number;
  completion_rate?: number;
  risk_factors?: string[];
  created_at: string;
  updated_at: string;
}

export interface PerformanceTrendData {
  memberId: string;
  weeks: number;
  data: TeamPerformanceMetric[];
  total: number;
}

// Communications
export interface TeamMessage {
  id: string;
  thread_id?: string;
  member_id: string;
  channel: string; // slack, discord, telegram
  message_content: string;
  message_timestamp: string;
  external_message_id?: string;
  created_at: string;
}

export interface CreateTeamMessageRequest {
  member_id: string;
  channel: string;
  message_content: string;
  message_timestamp?: string;
  thread_id?: string;
  external_message_id?: string;
}

export interface MessageThread {
  id: string;
  channel: string;
  thread_subject?: string;
  message_count: number;
  participants: string[];
  created_at: string;
  updated_at: string;
}

// Resource Capacity
export interface ResourceCapacity {
  month: string;
  totalMembers: number;
  totalTeamCapacity: number;
  totalAllocated: number;
  totalAvailable: number;
  teamAllocationPercentage: number;
}

export interface ResourceAllocation {
  id: string;
  member_id: string;
  project_id: string;
  allocated_hours: number;
  estimated_hours: number;
  completed_hours: number;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
  status: 'scheduled' | 'active' | 'paused' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Team Structure
export interface TeamStructure {
  id: string;
  member_id: string;
  reports_to_id?: string;
  position_level: number;
  created_at: string;
  updated_at: string;
}

// Portfolio Items
export interface PortfolioItem {
  id: string;
  member_id: string;
  project_name: string;
  description?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  status: 'in_progress' | 'completed' | 'archived';
  image_url?: string;
  created_at: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  member_id: string;
  activity_type: string;
  activity_description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
