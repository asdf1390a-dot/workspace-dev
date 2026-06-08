import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import Card from '../components/team-dashboard/shared/Card';
import Button from '../components/team-dashboard/shared/Button';
import Badge from '../components/team-dashboard/shared/Badge';
import { Spinner } from '../components/team-dashboard/shared/Skeleton';
import Modal from '../components/team-dashboard/shared/Modal';

export default function Projects() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    target_date: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/milestones');
      if (res.ok) {
        const data = await res.json();
        setMilestones(data);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.target_date) {
      alert('제목과 목표일을 입력해주세요');
      return;
    }

    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: formData.project_id || 'default',
          title: formData.title,
          target_date: formData.target_date,
          status: formData.status,
        }),
      });

      if (res.ok) {
        setFormData({ project_id: '', title: '', target_date: '', status: 'pending' });
        setShowNewMilestone(false);
        fetchMilestones();
      } else {
        const error = await res.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('마일스톤 생성 중 오류가 발생했습니다');
    }
  };

  const statusProgress = {
    pending: 0,
    in_progress: 50,
    completed: 100,
    blocked: 0,
  };

  const completed = milestones.filter((m) => m.status === 'completed').length;
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
  const pending = milestones.filter((m) => m.status === 'pending').length;
  const blocked = milestones.filter((m) => m.status === 'blocked').length;

  return (
    <>
      <Head>
        <title>프로젝트 | Team Dashboard</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '5rem' }}>
        {/* Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#1f2937' }}>
              프로젝트 및 마일스톤
            </h1>
            <Button variant="primary" size="sm" onClick={() => setShowNewMilestone(true)}>
              새 마일스톤
            </Button>
          </div>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {milestones.length}개의 마일스톤
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: '완료', value: completed, status: 'completed' },
              { label: '진행 중', value: inProgress, status: 'in_progress' },
              { label: '보류 중', value: pending, status: 'pending' },
              { label: '차단됨', value: blocked, status: 'blocked' },
            ].map((stat) => (
              <Card key={stat.status} title={stat.label}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3B82F6' }}>
                  {stat.value}
                </div>
              </Card>
            ))}
          </div>

          {/* Milestones */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
              <Spinner size="md" />
            </div>
          ) : milestones.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  마일스톤이 없습니다
                </p>
              </div>
            </Card>
          ) : (
            <div style={{ space: '1rem' }}>
              {milestones.map((milestone) => (
                <Card
                  key={milestone.id}
                  title={milestone.title}
                  subtitle={new Date(milestone.target_date).toLocaleDateString('ko-KR')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <Badge status={milestone.status}>{milestone.status}</Badge>
                    {milestone.status === 'completed' && (
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {milestone.completion_date
                          ? new Date(milestone.completion_date).toLocaleDateString('ko-KR')
                          : '날짜 미설정'}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${statusProgress[milestone.status] || 0}%`,
                          background: milestone.status === 'completed'
                            ? '#10b981'
                            : milestone.status === 'in_progress'
                            ? '#f59e0b'
                            : milestone.status === 'blocked'
                            ? '#ef4444'
                            : '#d1d5db',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {milestone.description && (
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      {milestone.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Milestone Modal */}
      <Modal
        isOpen={showNewMilestone}
        onClose={() => {
          setShowNewMilestone(false);
          setFormData({ project_id: '', title: '', target_date: '', status: 'pending' });
        }}
        title="새 마일스톤"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowNewMilestone(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleCreateMilestone}>
              생성
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleCreateMilestone}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="마일스톤 제목"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              목표일 *
            </label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="pending">보류 중</option>
              <option value="in_progress">진행 중</option>
              <option value="completed">완료</option>
              <option value="blocked">차단됨</option>
            </select>
          </div>
        </form>
      </Modal>

      <BottomNav />
    </>
  );
}
