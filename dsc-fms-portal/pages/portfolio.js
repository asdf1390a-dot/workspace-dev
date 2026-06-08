import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import Card from '../components/team-dashboard/shared/Card';
import Button from '../components/team-dashboard/shared/Button';
import Badge from '../components/team-dashboard/shared/Badge';
import { Spinner } from '../components/team-dashboard/shared/Skeleton';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? portfolio : portfolio.filter((item) => item.status === filter);

  return (
    <>
      <Head>
        <title>포트폴리오 | Team Dashboard</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '5rem' }}>
        {/* Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#1f2937' }}>
              포트폴리오
            </h1>
            <Link href="/team-dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">
                대시보드
              </Button>
            </Link>
          </div>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {portfolio.length}개의 포트폴리오 항목
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Filter */}
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'draft', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  border: filter === status ? '2px solid #3B82F6' : '1px solid #d1d5db',
                  background: filter === status ? '#EFF6FF' : '#ffffff',
                  color: filter === status ? '#0C4A6E' : '#374151',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {status === 'all' ? '전체' : status}
              </button>
            ))}
          </div>

          {/* Portfolio Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
              <Spinner size="md" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>
                  포트폴리오 항목이 없습니다
                </p>
                <Link href="/team-dashboard" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">
                    대시보드로 돌아가기
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  title={item.title}
                  subtitle={item.description}
                  onClick={() => {
                    // In production, open detail modal
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <Badge status={item.status}>{item.status}</Badge>
                      {item.skills_used && (
                        <div style={{ marginTop: '1rem' }}>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>
                            기술
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {item.skills_used.map((skill) => (
                              <Badge key={skill}>{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.impact && (
                        <div style={{ marginTop: '1rem' }}>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>
                            영향
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
                            {item.impact}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f3f4f6',
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
