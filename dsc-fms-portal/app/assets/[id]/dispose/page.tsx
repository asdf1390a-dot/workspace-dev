import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetDisposeContent from './asset-dispose-content';

interface AssetDisposePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AssetDisposePageProps) {
  return {
    title: `Dispose Asset ${params.id} - DSC FMS Portal`,
    description: 'Dispose of an asset',
  };
}

export default function AssetDisposePage({ params }: AssetDisposePageProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispose Asset</h1>
          <p className="text-slate-600 mt-1">Asset ID: {params.id}</p>
        </div>
        <Link href={`/assets/${params.id}`}>
          <Button variant="outline">Back to Details</Button>
        </Link>
      </div>

      {/* Content */}
      <Suspense fallback={<AssetDisposeSkeleton />}>
        <AssetDisposeContent assetId={params.id} />
      </Suspense>
    </div>
  );
}

function AssetDisposeSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </Card>
  );
}
