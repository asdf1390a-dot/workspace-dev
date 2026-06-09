import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetDetailContent from './asset-detail-content';

interface AssetDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AssetDetailPageProps) {
  return {
    title: `Asset ${params.id} - DSC FMS Portal`,
    description: 'Asset details and management',
  };
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Details</h1>
          <p className="text-slate-600 mt-1">ID: {params.id}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/assets">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<AssetDetailSkeleton />}>
        <AssetDetailContent assetId={params.id} />
      </Suspense>
    </div>
  );
}

function AssetDetailSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded animate-pulse w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </Card>
  );
}
