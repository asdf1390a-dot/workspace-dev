'use client';

import { Asset } from '@/lib/assets/types';

interface BasicInfoTabProps {
  asset: Asset;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  idle: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-orange-100 text-orange-800',
  sold: 'bg-blue-100 text-blue-800',
  scrapped: 'bg-red-100 text-red-800',
};

export default function BasicInfoTab({ asset }: BasicInfoTabProps) {
  const sections = [
    {
      title: 'Asset Identification',
      fields: [
        { label: 'Asset ID', value: asset.id },
        { label: 'Asset Code', value: asset.machine_asset_code },
        { label: 'Physical Tag', value: asset.machine_asset_number },
        { label: 'Serial Number', value: asset.serial_no || '-' },
      ],
    },
    {
      title: 'Asset Information',
      fields: [
        { label: 'Name (English)', value: asset.name_en },
        { label: 'Name (Tamil)', value: asset.name_ta || '-' },
        { label: 'Model', value: asset.model || '-' },
        { label: 'Make', value: asset.make || '-' },
        { label: 'Year of Manufacture', value: asset.year_of_manufacture || '-' },
      ],
    },
    {
      title: 'Location & Status',
      fields: [
        { label: 'Location', value: asset.location },
        {
          label: 'Status',
          value: (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[asset.status]}`}>
              {asset.status.replace('_', ' ').toUpperCase()}
            </span>
          ),
        },
      ],
    },
    {
      title: 'Additional Information',
      fields: [
        { label: 'Remarks', value: asset.remark || '-' },
        { label: 'Created At', value: new Date(asset.created_at).toLocaleString() },
        { label: 'Updated At', value: new Date(asset.updated_at).toLocaleString() },
      ],
    },
  ];

  // Only show disposal section if asset has been disposed
  if (asset.status === 'sold' || asset.status === 'scrapped') {
    sections.push({
      title: 'Disposal Information',
      fields: [
        { label: 'Disposal Reason', value: asset.disposal_reason || '-' },
        { label: 'Disposal Price', value: asset.disposal_price ? `${asset.disposal_price}` : '-' },
        { label: 'Buyer Name', value: asset.buyer_name || '-' },
        { label: 'Buyer Contact', value: asset.buyer_contact || '-' },
        { label: 'Disposal Date', value: asset.disposed_at ? new Date(asset.disposed_at).toLocaleString() : '-' },
      ],
    });
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-lg font-semibold mb-4 text-slate-900">{section.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.label} className="border-l-4 border-slate-200 pl-4 py-2">
                <p className="text-sm font-medium text-slate-600">{field.label}</p>
                <p className="text-base text-slate-900 mt-1">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
