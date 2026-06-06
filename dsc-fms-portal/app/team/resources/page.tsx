'use client';

import { useState, useEffect } from 'react';
import { PieChart, BarChart3 } from 'lucide-react';

interface AllocationData {
  memberId: string;
  totalCapacityHours: number;
  allocatedHours: number;
  availableHours: number;
  allocationPercentage: number;
}

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
  const [availabilityData, setAvailabilityData] = useState<AllocationData[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availRes, allocRes] = await Promise.all([
          fetch('/api/team/resources/availability?month=2026-06'),
          fetch('/api/team/resources/allocations?limit=20'),
        ]);

        const availData = await availRes.json();
        const allocData = await allocRes.json();

        setAvailabilityData(availData.data || []);
        setAllocations(allocData.data || []);
      } catch (error) {
        console.error('Failed to fetch resource data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalMembers = availabilityData.length;
  const totalCapacity = availabilityData.reduce((sum, item) => sum + item.totalCapacityHours, 0);
  const totalAllocated = availabilityData.reduce((sum, item) => sum + item.allocatedHours, 0);
  const totalAvailable = availabilityData.reduce((sum, item) => sum + item.availableHours, 0);
  const allocationPercentage = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-500">Loading resource data...</p>
      </div>
    );
  }

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
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalMembers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Total Capacity</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalCapacity}h</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Allocated Hours</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{totalAllocated}h</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Available Hours</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{totalAvailable}h</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Allocation Overview</h2>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">June 2026</h3>
            <span className="text-2xl font-bold text-blue-600">{allocationPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all"
              style={{ width: `${allocationPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>{totalAllocated}h allocated</span>
            <span>{totalAvailable}h available</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Allocations</h2>
        <div className="space-y-3">
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No allocations found
            </div>
          ) : (
            allocations.map((allocation) => (
              <div
                key={allocation.id}
                className="border rounded-lg p-4 border-l-4 border-l-gray-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Allocation {allocation.id}</h4>
                    <p className="text-sm text-gray-600">Member: {allocation.member_id}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">{allocation.start_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">{allocation.end_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Allocated Hours</p>
                    <p className="font-semibold text-gray-900">{allocation.allocated_hours}h</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
