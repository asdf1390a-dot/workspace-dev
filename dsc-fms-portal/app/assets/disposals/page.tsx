import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DisposalsContent from './disposals-content';

export const metadata = {
  title: 'Disposed Assets - DSC FMS Portal',
  description: 'List of disposed assets',
};

export default function DisposalsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">폐기된 자산</h1>
          <p className="text-slate-600 mt-1">폐기 처리된 자산 목록</p>
        </div>
        <div className="flex gap-2">
          <Link href="/assets">
            <Button variant="outline">자산 목록</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<DisposalsSkeleton />}>
        <DisposalsContent />
      </Suspense>
    </div>
  );
}

function DisposalsSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
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
