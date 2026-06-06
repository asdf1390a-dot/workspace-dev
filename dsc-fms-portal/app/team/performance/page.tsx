'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Filter } from 'lucide-react';

interface PerformanceMetric {
  member_id: string;
  technical_competency: number;
  task_achievement: number;
  communication: number;
  learning_speed: number;
  reliability: number;
  completion_rate?: number;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const percentage = (score / 5) * 100;
  const getColor = (s: number) => {
    if (s >= 4.5) return 'bg-green-500';
    if (s >= 4.0) return 'bg-blue-500';
    if (s >= 3.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}/5.0</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reliability' | 'technical_competency' | 'task_achievement'>('reliability');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/team/performance/members?sort=${sortBy}&order=desc`);
        const result = await res.json();
        setData(result.data || []);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy]);

  const calculateOverallScore = (metric: PerformanceMetric) => {
    const scores = [
      metric.technical_competency,
      metric.task_achievement,
      metric.communication,
      metric.learning_speed,
      metric.reliability,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Performance Metrics
          </h1>
          <p className="text-gray-600 mt-1">Track team member performance and competency scores</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="reliability">Sort by Reliability</option>
            <option value="technical_competency">Sort by Technical Competency</option>
            <option value="task_achievement">Sort by Task Achievement</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Loading performance data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.map((metric, idx) => (
            <Link key={idx} href={`/team/members/${metric.member_id}`}>
              <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Member {metric.member_id}</h3>
                    <p className="text-sm text-gray-600">Overall Score</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {calculateOverallScore(metric).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">/5.0</div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <ScoreBar score={metric.technical_competency} label="Technical Competency" />
                  <ScoreBar score={metric.task_achievement} label="Task Achievement" />
                  <ScoreBar score={metric.communication} label="Communication" />
                  <ScoreBar score={metric.learning_speed} label="Learning Speed" />
                  <ScoreBar score={metric.reliability} label="Reliability" />
                </div>

                {metric.completion_rate && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-900">Completion Rate</span>
                      <span className="text-lg font-bold text-green-600">{metric.completion_rate}%</span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No performance metrics available</p>
        </div>
      )}
    </div>
  );
}
