import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetAuditContent from './asset-audit-content';

interface AssetAuditPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AssetAuditPageProps) {
  return {
    title: `Asset ${params.id} Audit - DSC FMS Portal`,
    description: 'Asset edit tracking and statistics',
  };
}

export default function AssetAuditPage({ params }: AssetAuditPageProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">감시 추적</h1>
          <p className="text-slate-600 mt-1">Asset ID: {params.id}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/assets/${params.id}`}>
            <Button variant="outline">자산 정보</Button>
          </Link>
          <Link href={`/assets/${params.id}/history`}>
            <Button variant="outline">편집 이력</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<AuditSkeleton />}>
        <AssetAuditContent assetId={params.id} />
      </Suspense>
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
            <div className="h-6 bg-slate-200 rounded animate-pulse w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
