'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Asset } from '@/lib/assets/types';

interface AssetEditContentProps {
  assetId: string;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'sold', label: 'Sold' },
  { value: 'scrapped', label: 'Scrapped' },
];

export default function AssetEditContent({ assetId }: AssetEditContentProps) {
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/assets/${assetId}`);
        if (!res.ok) throw new Error('Failed to load asset');
        const data = await res.json();
        const assetData = data.data || data;
        setAsset(assetData);
        setFormData(assetData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year_of_manufacture' || name === 'disposal_price' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update asset');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/assets/${assetId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading asset...</div>;
  }

  if (!asset) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Asset not found</p>
        </CardContent>
      </Card>
    );
  }

  const isDisposed = asset.status === 'sold' || asset.status === 'scrapped';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Asset Information</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded border border-green-200">Asset updated successfully!</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Identification */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Asset Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset Code (Read-Only)</label>
                <input
                  type="text"
                  value={formData.machine_asset_code || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Physical Tag (Read-Only)</label>
                <input
                  type="text"
                  value={formData.machine_asset_number || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  name="serial_no"
                  value={formData.serial_no || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Asset Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Asset Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (English) *</label>
                <input
                  type="text"
                  name="name_en"
                  value={formData.name_en || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (Tamil)</label>
                <input
                  type="text"
                  name="name_ta"
                  value={formData.name_ta || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year of Manufacture</label>
                <input
                  type="number"
                  name="year_of_manufacture"
                  value={formData.year_of_manufacture || ''}
                  onChange={handleChange}
                  min="1950"
                  max="2026"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Location & Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Location & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select name="status" value={formData.status || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded">
                  <option value="">Select status...</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Disposal Information (conditional) */}
          {isDisposed && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4">Disposal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Disposal Reason *</label>
                  <input
                    type="text"
                    name="disposal_reason"
                    value={formData.disposal_reason || ''}
                    onChange={handleChange}
                    required={isDisposed}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Disposal Price</label>
                  <input
                    type="number"
                    name="disposal_price"
                    value={formData.disposal_price || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Buyer Name</label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={formData.buyer_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Buyer Contact</label>
                  <input
                    type="text"
                    name="buyer_contact"
                    value={formData.buyer_contact || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea name="remark" value={formData.remark || ''} onChange={handleChange} rows={4} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
