'use client';

import { PieChart, BarChart3 } from 'lucide-react';

interface ResourceMetric {
  month: string;
  totalMembers: number;
  totalCapacity: number;
  totalAllocated: number;
  totalAvailable: number;
  allocationPercentage: number;
}

const mockResourceData: ResourceMetric[] = [
  {
    month: 'June 2026',
    totalMembers: 15,
    totalCapacity: 600,
    totalAllocated: 480,
    totalAvailable: 120,
    allocationPercentage: 80,
  },
  {
    month: 'May 2026',
    totalMembers: 14,
    totalCapacity: 560,
    totalAllocated: 420,
    totalAvailable: 140,
    allocationPercentage: 75,
  },
  {
    month: 'April 2026',
    totalMembers: 13,
    totalCapacity: 520,
    totalAllocated: 390,
    totalAvailable: 130,
    allocationPercentage: 75,
  },
];

interface AllocationItem {
  id: string;
  memberName: string;
  projectName: string;
  allocatedHours: number;
  estimatedHours: number;
  completedHours: number;
  status: 'scheduled' | 'active' | 'paused' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

const mockAllocations: AllocationItem[] = [
  {
    id: '1',
    memberName: 'John Doe',
    projectName: 'Team Dashboard Phase 2',
    allocatedHours: 120,
    estimatedHours: 100,
    completedHours: 75,
    status: 'active',
    priority: 'high',
  },
  {
    id: '2',
    memberName: 'Jane Smith',
    projectName: 'API Enhancement',
    allocatedHours: 80,
    estimatedHours: 80,
    completedHours: 60,
    status: 'active',
    priority: 'medium',
  },
  {
    id: '3',
    memberName: 'Bob Johnson',
    projectName: 'Testing & QA',
    allocatedHours: 60,
    estimatedHours: 60,
    completedHours: 60,
    status: 'completed',
    priority: 'high',
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'scheduled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-red-500';
    case 'medium':
      return 'border-l-4 border-yellow-500';
    case 'low':
      return 'border-l-4 border-green-500';
    default:
      return 'border-l-4 border-gray-500';
  }
}

export default function ResourcesPage() {
  const latestMetric = mockResourceData[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
            Resource Capacity
          </h1>
          <p className="text-gray-600 mt-1">Manage team capacity and resource allocation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Total Team Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{latestMetric.totalMembers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Total Capacity</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{latestMetric.totalCapacity}h</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Allocated Hours</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{latestMetric.totalAllocated}h</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Available Hours</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{latestMetric.totalAvailable}h</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Allocation Overview</h2>
        <div className="space-y-4">
          {mockResourceData.map((metric, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">{metric.month}</h3>
                <span className="text-2xl font-bold text-blue-600">{metric.allocationPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${metric.allocationPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>{metric.totalAllocated}h allocated</span>
                <span>{metric.totalAvailable}h available</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Allocations</h2>
        <div className="space-y-3">
          {mockAllocations.map((allocation) => (
            <div
              key={allocation.id}
              className={`border rounded-lg p-4 ${getPriorityColor(allocation.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{allocation.projectName}</h4>
                  <p className="text-sm text-gray-600">{allocation.memberName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(allocation.status)}`}>
                  {allocation.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Allocated</p>
                  <p className="font-semibold text-gray-900">{allocation.allocatedHours}h</p>
                </div>
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="font-semibold text-gray-900">{allocation.completedHours}h</p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated</p>
                  <p className="font-semibold text-gray-900">{allocation.estimatedHours}h</p>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {Math.round((allocation.completedHours / allocation.estimatedHours) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${(allocation.completedHours / allocation.estimatedHours) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
