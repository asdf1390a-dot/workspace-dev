'use client';

import { AssetDocument } from '@/lib/assets/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FilesTabProps {
  assetId: string;
  documents: AssetDocument[];
}

const typeLabels: Record<string, string> = {
  photo: '📷 Photo',
  proof: '✅ Proof',
  invoice: '📄 Invoice',
  other: '📎 Other',
};

const typeColors: Record<string, string> = {
  photo: 'bg-blue-50',
  proof: 'bg-green-50',
  invoice: 'bg-yellow-50',
  other: 'bg-slate-50',
};

export default function FilesTab({ assetId, documents }: FilesTabProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">No files uploaded yet</p>
        <Link href={`/assets/${assetId}/files`}>
          <Button>Upload Files</Button>
        </Link>
      </div>
    );
  }

  const groupedDocs = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = [];
      }
      acc[doc.document_type].push(doc);
      return acc;
    },
    {} as Record<string, AssetDocument[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedDocs).map(([type, docs]) => (
        <div key={type} className={`p-4 rounded-lg ${typeColors[type]}`}>
          <h4 className="font-semibold mb-3">{typeLabels[type]} ({docs.length})</h4>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-sm">{doc.filename}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(doc.uploaded_at).toLocaleDateString()} • {(doc.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Link href={`/assets/${assetId}/files`}>
        <Button className="w-full">Manage All Files</Button>
      </Link>
    </div>
  );
}
