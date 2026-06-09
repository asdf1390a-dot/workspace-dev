'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Asset } from '@/lib/assets/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssetDisposeContentProps {
  assetId: string;
}

type DisposalStep = 'confirmation' | 'details' | 'review' | 'success';

interface DisposalFormData {
  status: 'sold' | 'scrapped';
  disposal_reason: string;
  disposal_price: number | null;
  buyer_name: string;
  buyer_contact: string;
}

const statusOptions = [
  { value: 'sold', label: 'Sold' },
  { value: 'scrapped', label: 'Scrapped' },
];

export default function AssetDisposeContent({ assetId }: AssetDisposeContentProps) {
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<DisposalStep>('confirmation');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DisposalFormData>({
    status: 'sold',
    disposal_reason: '',
    disposal_price: null,
    buyer_name: '',
    buyer_contact: '',
  });

  useEffect(() => {
    const loadAsset = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/assets/${assetId}`);
        if (!res.ok) throw new Error('Failed to load asset');
        const data = await res.json();
        const assetData = data.data || data;

        // Check if already disposed
        if (assetData.status === 'sold' || assetData.status === 'scrapped') {
          throw new Error('This asset has already been disposed');
        }

        setAsset(assetData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'disposal_price' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleSubmit = async () => {
    if (step === 'details') {
      if (!formData.disposal_reason.trim()) {
        setError('Disposal reason is required');
        return;
      }
      setError(null);
      setStep('review');
    } else if (step === 'review') {
      try {
        setSubmitting(true);
        setError(null);

        const token = localStorage.getItem('token');
        const res = await fetch(`/api/assets/${assetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: formData.status,
            disposal_reason: formData.disposal_reason,
            disposal_price: formData.disposal_price,
            buyer_name: formData.buyer_name,
            buyer_contact: formData.buyer_contact,
            disposed_at: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || 'Failed to dispose asset');
        }

        setStep('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to dispose asset');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading asset...</div>;
  }

  if (!asset) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">{error || 'Asset not found'}</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Asset Disposed Successfully</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-800">
            Asset <strong>{asset.machine_asset_code}</strong> has been marked as {formData.status}.
          </p>
          <div className="bg-white p-4 rounded border border-green-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Disposal Details:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>
                <span className="font-medium">Status:</span> {formData.status}
              </li>
              <li>
                <span className="font-medium">Reason:</span> {formData.disposal_reason}
              </li>
              {formData.disposal_price && (
                <li>
                  <span className="font-medium">Price:</span> {formData.disposal_price}
                </li>
              )}
              {formData.buyer_name && (
                <li>
                  <span className="font-medium">Buyer:</span> {formData.buyer_name}
                </li>
              )}
            </ul>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => router.push(`/assets/${assetId}`)}>Back to Details</Button>
            <Button variant="outline" onClick={() => router.push('/assets')}>
              View All Assets
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dispose Asset</CardTitle>
          <div className="text-sm text-slate-600">
            Step {step === 'confirmation' ? 1 : step === 'details' ? 2 : 3} of 3
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

        {/* Step 1: Confirmation */}
        {step === 'confirmation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Confirm Asset Disposal</h3>
              <p className="text-slate-600 mb-4">
                You are about to mark the following asset as disposed. This action can be edited later.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-800">Asset Code</p>
                  <p className="font-medium text-blue-900 mt-1">{asset.machine_asset_code}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-800">Physical Tag</p>
                  <p className="font-medium text-blue-900 mt-1">{asset.machine_asset_number}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-800">Name</p>
                  <p className="font-medium text-blue-900 mt-1">{asset.name_en}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-800">Location</p>
                  <p className="font-medium text-blue-900 mt-1">{asset.location}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setStep('details')}>Continue</Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4">Disposal Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Disposal Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border rounded"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Disposal Reason *</label>
                <textarea
                  name="disposal_reason"
                  value={formData.disposal_reason}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  placeholder="Explain why this asset is being disposed..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Disposal Price (Optional)</label>
                  <input
                    type="number"
                    name="disposal_price"
                    value={formData.disposal_price || ''}
                    onChange={handleFormChange}
                    placeholder="Enter amount if sold"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Buyer Name (Optional)</label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={formData.buyer_name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Buyer Contact (Optional)</label>
                <input
                  type="text"
                  name="buyer_contact"
                  value={formData.buyer_contact}
                  onChange={handleFormChange}
                  placeholder="Phone, email, or address"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit">Review</Button>
              <Button type="button" variant="outline" onClick={() => setStep('confirmation')}>
                Back
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Disposal Details</h3>
              <p className="text-slate-600 mb-4">Please review the information before confirming.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Asset</p>
                  <p className="font-medium text-slate-900 mt-1">{asset.machine_asset_code}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Disposal Status</p>
                  <p className="font-medium text-slate-900 mt-1">
                    {statusOptions.find((opt) => opt.value === formData.status)?.label}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-600">Disposal Reason</p>
                  <p className="font-medium text-slate-900 mt-1">{formData.disposal_reason}</p>
                </div>
                {formData.disposal_price && (
                  <div>
                    <p className="text-sm text-slate-600">Price</p>
                    <p className="font-medium text-slate-900 mt-1">{formData.disposal_price}</p>
                  </div>
                )}
                {formData.buyer_name && (
                  <div>
                    <p className="text-sm text-slate-600">Buyer</p>
                    <p className="font-medium text-slate-900 mt-1">{formData.buyer_name}</p>
                  </div>
                )}
                {formData.buyer_contact && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-600">Buyer Contact</p>
                    <p className="font-medium text-slate-900 mt-1">{formData.buyer_contact}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Disposal'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={submitting}>
                Back
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
