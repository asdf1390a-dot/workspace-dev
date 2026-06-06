'use client';

import { useTeamMember, usePortfolioItems, useActivityLog } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import { Mail, Phone, MapPin, Briefcase, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const { data: member, loading: memberLoading, error: memberError } = useTeamMember(params.id);
  const { data: portfolioItems, loading: portfolioLoading } = usePortfolioItems(params.id);
  const { data: activities, loading: activitiesLoading } = useActivityLog(params.id);

  if (memberError) {
    return (
      <div className="space-y-6">
        <Link href="/team/members" className="flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Members
        </Link>
        <ErrorState message={memberError} />
      </div>
    );
  }

  if (memberLoading) return <LoadingState />;

  if (!member) {
    return (
      <div className="space-y-6">
        <Link href="/team/members" className="flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Members
        </Link>
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Member not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/team/members" className="flex items-center text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Members
      </Link>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            {member.avatar_url && (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-gray-600 mt-1">{member.role}</p>
              {member.department && (
                <p className="text-sm text-gray-500 mt-1">{member.department}</p>
              )}
              <span
                className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                  member.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {member.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 border-t pt-6">
          <div className="flex items-center text-gray-600">
            <Mail className="w-5 h-5 mr-3 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Email</p>
              <p className="font-medium">{member.email}</p>
            </div>
          </div>

          {member.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="font-medium">{member.phone}</p>
              </div>
            </div>
          )}

          {member.start_date && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Start Date</p>
                <p className="font-medium">
                  {new Date(member.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <User className="w-5 h-5 mr-3 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Member Since</p>
              <p className="font-medium">
                {new Date(member.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {member.bio && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
            <p className="text-gray-600">{member.bio}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
            Portfolio
          </h2>
          {portfolioLoading ? (
            <LoadingState />
          ) : portfolioItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No portfolio items</p>
          ) : (
            <div className="space-y-3">
              {portfolioItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 hover:shadow transition-shadow">
                  <h4 className="font-medium text-gray-900">{item.project_name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                      item.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activitiesLoading ? (
            <LoadingState />
          ) : activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activities</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="border-l-2 border-blue-500 pl-4 py-2">
                  <p className="font-medium text-gray-900 text-sm">{activity.activity_type}</p>
                  {activity.activity_description && (
                    <p className="text-xs text-gray-600 mt-1">{activity.activity_description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
