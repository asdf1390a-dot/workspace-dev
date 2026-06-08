import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import Card from '../components/team-dashboard/shared/Card';
import Button from '../components/team-dashboard/shared/Button';
import Badge from '../components/team-dashboard/shared/Badge';
import { Spinner } from '../components/team-dashboard/shared/Skeleton';
import Modal from '../components/team-dashboard/shared/Modal';

export default function TeamDashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewItem, setShowNewItem] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills_used: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, milestonesRes] = await Promise.all([
        fetch('/api/portfolio'),
        fetch('/api/milestones'),
      ]);

      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        setPortfolio(data);
      }

      if (milestonesRes.ok) {
        const data = await milestonesRes.json();
        setMilestones(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          skills_used: formData.skills_used.split(',').map((s) => s.trim()),
        }),
      });

      if (res.ok) {
        setFormData({ title: '', description: '', skills_used: '' });
        setShowNewItem(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      alert('포트폴리오 생성 중 오류가 발생했습니다');
    }
  };

  return (
    <>
      <Head>
        <title>Team Dashboard</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '5rem' }}>
        {/* Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#1f2937' }}>
            Team Dashboard
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
            포트폴리오와 마일스톤 관리
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Portfolio Section */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
                포트폴리오 ({portfolio.length})
              </h2>
              <Button variant="primary" size="sm" onClick={() => setShowNewItem(true)}>
                새 항목 추가
              </Button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Spinner size="md" />
              </div>
            ) : portfolio.length === 0 ? (
              <Card>
                <p style={{ textAlign: 'center', color: '#6b7280', margin: 0 }}>
                  아직 포트폴리오 항목이 없습니다
                </p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {portfolio.map((item) => (
                  <Card key={item.id} title={item.title} subtitle={item.description}>
                    <div>
                      <Badge status={item.status}>{item.status}</Badge>
                      {item.skills_used && (
                        <div style={{ marginTop: '1rem' }}>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            사용 기술
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {item.skills_used.map((skill) => (
                              <Badge key={skill}>{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Milestones Section */}
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
              최근 마일스톤 ({milestones.length})
            </h2>

            {milestones.length === 0 ? (
              <Card>
                <p style={{ textAlign: 'center', color: '#6b7280', margin: 0 }}>
                  마일스톤이 없습니다
                </p>
              </Card>
            ) : (
              <div style={{ space: '1rem' }}>
                {milestones.map((milestone) => (
                  <Card
                    key={milestone.id}
                    title={milestone.title}
                    subtitle={new Date(milestone.target_date).toLocaleDateString('ko-KR')}
                  >
                    <Badge status={milestone.status}>{milestone.status}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Portfolio Modal */}
      <Modal
        isOpen={showNewItem}
        onClose={() => {
          setShowNewItem(false);
          setFormData({ title: '', description: '', skills_used: '' });
        }}
        title="새 포트폴리오 항목"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowNewItem(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleCreatePortfolio}>
              생성
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleCreatePortfolio}
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
              placeholder="프로젝트 제목"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                minHeight: '100px',
              }}
              placeholder="프로젝트 설명"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              사용 기술 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={formData.skills_used}
              onChange={(e) => setFormData({ ...formData, skills_used: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="React, Next.js, Supabase"
            />
          </div>
        </form>
      </Modal>

      <BottomNav />
    </>
  );
}
