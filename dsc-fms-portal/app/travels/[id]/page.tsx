'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function TravelRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    if (id) {
      router.push(`/jeepney-personal/dsc-hub/travels/${id}`);
    }
  }, [router, id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">리다이렉트 중...</p>
        <div className="mt-4 animate-spin text-gray-400">⏳</div>
      </div>
    </div>
  );
}
