import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetHistoryContent from './asset-history-content';

interface AssetHistoryPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AssetHistoryPageProps) {
  return {
    title: `Asset ${params.id} History - DSC FMS Portal`,
    description: 'Asset edit history and change tracking',
  };
}

export default function AssetHistoryPage({ params }: AssetHistoryPageProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit History</h1>
          <p className="text-slate-600 mt-1">Asset ID: {params.id}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/assets/${params.id}`}>
            <Button variant="outline">Back to Asset</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<HistorySkeleton />}>
        <AssetHistoryContent assetId={params.id} />
      </Suspense>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded animate-pulse w-1/4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-t pt-4">
            <div className="h-6 bg-slate-200 rounded animate-pulse mb-2 w-1/3" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
          </div>
        ))}
      </div>
    </Card>
  );
}
