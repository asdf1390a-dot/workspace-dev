'use client';

import { Suspense } from 'react';
import AssetsContent from './assets-content';

export const dynamic = 'force-dynamic';

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <AssetsContent />
    </Suspense>
  );
}
