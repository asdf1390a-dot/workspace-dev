'use client';

import { useState, useEffect } from 'react';
import { AssetDocument } from '@/lib/assets/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssetFilesContentProps {
  assetId: string;
}

const typeLabels: Record<string, string> = {
  photo: '📷 Photo',
  proof: '✅ Proof',
  invoice: '📄 Invoice',
  other: '📎 Other',
};

const typeColors: Record<string, string> = {
  photo: 'border-blue-200 bg-blue-50',
  proof: 'border-green-200 bg-green-50',
  invoice: 'border-yellow-200 bg-yellow-50',
  other: 'border-slate-200 bg-slate-50',
};

export default function AssetFilesContent({ assetId }: AssetFilesContentProps) {
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [assetId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/assets/${assetId}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const token = localStorage.getItem('token');
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      formData.append('document_type', 'other');

      const res = await fetch(`/api/assets/${assetId}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to upload files');
      }

      setSuccess(true);
      await loadDocuments();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/assets/${assetId}/documents/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to delete file');
      }

      setSuccess(true);
      await loadDocuments();
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

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

  if (loading) {
    return <div className="text-center py-8">Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Files</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded border border-green-200">Files uploaded successfully!</div>}

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleChange}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-lg font-medium text-slate-900">Drag and drop files here</p>
              <p className="text-sm text-slate-600 mt-1">or click to select files</p>
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="mt-4"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files Section */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">No files uploaded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedDocs).map(([type, docs]) => (
            <Card key={type} className={`border ${typeColors[type]}`}>
              <CardHeader>
                <CardTitle className="text-lg">{typeLabels[type]} ({docs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.filename}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(doc.uploaded_at).toLocaleDateString()} • {(doc.file_size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm text-blue-600 hover:underline"
                        >
                          Download
                        </a>
                        {deleteConfirm === doc.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs text-slate-700 bg-slate-200 hover:bg-slate-300 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(doc.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
