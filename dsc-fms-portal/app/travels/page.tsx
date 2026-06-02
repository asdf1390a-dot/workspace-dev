// Travel Management — Dashboard
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Travel {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export default function TravelDashboard() {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTravels();
  }, []);

  async function fetchTravels() {
    try {
      setLoading(true);
      const response = await fetch('/api/travels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch travels');
      const result = await response.json();
      setTravels(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading travels...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Travels</h1>
          <Link
            href="/travels/requests/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Plan New Travel
          </Link>
        </div>

        {travels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No travels yet</p>
            <Link
              href="/travels/requests/new"
              className="text-blue-600 hover:underline"
            >
              Create your first travel →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travels.map((travel) => (
              <Link
                key={travel.id}
                href={`/travels/${travel.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <h2 className="text-xl font-semibold mb-2">{travel.name}</h2>
                <p className="text-gray-600 mb-3">{travel.location}</p>
                <div className="text-sm text-gray-500 mb-4">
                  {new Date(travel.start_date).toLocaleDateString()} - {new Date(travel.end_date).toLocaleDateString()}
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: travel.status === 'upcoming' ? '#dbeafe' :
                                      travel.status === 'ongoing' ? '#fef08a' :
                                      '#dcfce7',
                    color: travel.status === 'upcoming' ? '#0369a1' :
                           travel.status === 'ongoing' ? '#854d0e' :
                           '#166534'
                  }}>
                  {travel.status.charAt(0).toUpperCase() + travel.status.slice(1)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
