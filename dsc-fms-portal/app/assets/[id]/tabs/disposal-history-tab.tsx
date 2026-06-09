'use client';

import { Asset } from '@/lib/assets/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DisposalHistoryTabProps {
  asset: Asset;
}

export default function DisposalHistoryTab({ asset }: DisposalHistoryTabProps) {
  const isDisposed = asset.status === 'sold' || asset.status === 'scrapped';

  if (!isDisposed) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">This asset has not been disposed yet</p>
        <Link href={`/assets/${asset.id}/dispose`}>
          <Button>Dispose Asset</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Disposal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-800">Disposal Reason</p>
            <p className="font-medium text-blue-900 mt-1">{asset.disposal_reason || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-blue-800">Disposal Date</p>
            <p className="font-medium text-blue-900 mt-1">
              {asset.disposed_at ? new Date(asset.disposed_at).toLocaleDateString() : '-'}
            </p>
          </div>
          {asset.disposal_price && (
            <div>
              <p className="text-sm text-blue-800">Sale Price</p>
              <p className="font-medium text-blue-900 mt-1">{asset.disposal_price}</p>
            </div>
          )}
          {asset.buyer_name && (
            <div>
              <p className="text-sm text-blue-800">Buyer</p>
              <p className="font-medium text-blue-900 mt-1">{asset.buyer_name}</p>
            </div>
          )}
          {asset.buyer_contact && (
            <div className="md:col-span-2">
              <p className="text-sm text-blue-800">Buyer Contact</p>
              <p className="font-medium text-blue-900 mt-1">{asset.buyer_contact}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/assets/${asset.id}/edit`}>
          <Button variant="outline">Edit Details</Button>
        </Link>
      </div>
    </div>
  );
}
