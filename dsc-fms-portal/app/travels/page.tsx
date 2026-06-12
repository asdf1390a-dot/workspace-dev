'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TravelsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/jeepney-personal/dsc-hub/travels');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">리다이렉트 중...</p>
        <div className="mt-4 animate-spin text-gray-400">⏳</div>
      </div>
    </div>
  );
}
