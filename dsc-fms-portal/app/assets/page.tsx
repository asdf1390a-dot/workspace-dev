import { Suspense } from 'react';
import AssetsContent from './assets-content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = {
  title: 'Assets',
  description: 'Asset Master',
};

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <AssetsContent />
    </Suspense>
  );
}
// Force redeploy trigger — Sat Jun 14 02:23:30 KST 2026
