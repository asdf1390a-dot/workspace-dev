'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  created_at: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  skills_used?: string[];
  created_at: string;
}

export default function TeamDashboard() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [milestonesRes, portfolioRes] = await Promise.all([
        fetch('/api/team-dashboard/milestones'),
        fetch('/api/team-dashboard/portfolio'),
      ]);

      if (milestonesRes.ok) {
        setMilestones(await milestonesRes.json());
      }
      if (portfolioRes.ok) {
        setPortfolio(await portfolioRes.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusColors = {
    pending: 'bg-gray-200',
    in_progress: 'bg-blue-200',
    completed: 'bg-green-200',
    on_hold: 'bg-yellow-200',
  };

  const statusLabels = {
    pending: '대기 중',
    in_progress: '진행 중',
    completed: '완료',
    on_hold: '보류',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">팀 대시보드</h1>
          <p className="text-gray-600 mt-2">마일스톤과 포트폴리오 관리</p>
        </div>

        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="milestones">마일스톤 ({milestones.length})</TabsTrigger>
            <TabsTrigger value="portfolio">포트폴리오 ({portfolio.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">마일스톤</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 마일스톤 추가
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">로드 중...</div>
            ) : milestones.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  마일스톤이 없습니다. 새 마일스톤을 추가하세요.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[milestone.status]}`}>
                          {statusLabels[milestone.status]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {milestone.target_date && (
                        <p className="text-sm text-gray-600">
                          목표 날짜: {new Date(milestone.target_date).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">포트폴리오</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 항목 추가
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">로드 중...</div>
            ) : portfolio.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  포트폴리오 항목이 없습니다. 새 항목을 추가하세요.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {portfolio.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {item.skills_used && item.skills_used.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.skills_used.map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
