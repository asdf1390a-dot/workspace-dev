import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetEditContent from './asset-edit-content';

interface AssetEditPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AssetEditPageProps) {
  return {
    title: `Edit Asset ${params.id} - DSC FMS Portal`,
    description: 'Edit asset details',
  };
}

export default function AssetEditPage({ params }: AssetEditPageProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Asset</h1>
          <p className="text-slate-600 mt-1">ID: {params.id}</p>
        </div>
        <Link href={`/assets/${params.id}`}>
          <Button variant="outline">Back to Details</Button>
        </Link>
      </div>

      {/* Content */}
      <Suspense fallback={<AssetEditSkeleton />}>
        <AssetEditContent assetId={params.id} />
      </Suspense>
    </div>
  );
}

function AssetEditSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </Card>
  );
}
