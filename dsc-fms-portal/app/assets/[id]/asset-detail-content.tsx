'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Asset, AssetDocument, AssetDisposalHistory } from '@/lib/assets/types';
import BasicInfoTab from './tabs/basic-info-tab';
import FilesTab from './tabs/files-tab';
import DisposalHistoryTab from './tabs/disposal-history-tab';
import AuditLogTab from './tabs/audit-log-tab';

interface AssetDetailContentProps {
  assetId: string;
}

type TabType = 'basic' | 'files' | 'disposal' | 'audit';

export default function AssetDetailContent({ assetId }: AssetDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [disposalHistory, setDisposalHistory] = useState<AssetDisposalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load asset details
        const assetRes = await fetch(`/api/assets/${assetId}`);
        if (!assetRes.ok) throw new Error('Failed to load asset');
        const assetData = await assetRes.json();
        setAsset(assetData.data || assetData);

        // Load documents
        const docsRes = await fetch(`/api/assets/${assetId}/documents`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(Array.isArray(docsData) ? docsData : docsData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assetId]);

  if (loading) {
    return <div className="text-center py-8">Loading asset details...</div>;
  }

  if (error || !asset) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">{error || 'Asset not found'}</p>
          <Link href="/assets" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Return to Assets List
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'files', label: `Files (${documents.length})`, icon: '📁' },
    { id: 'disposal', label: 'Disposal History', icon: '🗂️' },
    { id: 'audit', label: 'Change Log', icon: '📜' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 px-4 py-3 text-center font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="pt-6">
          {activeTab === 'basic' && <BasicInfoTab asset={asset} />}
          {activeTab === 'files' && <FilesTab assetId={assetId} documents={documents} />}
          {activeTab === 'disposal' && <DisposalHistoryTab asset={asset} />}
          {activeTab === 'audit' && <AuditLogTab assetId={assetId} />}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link href={`/assets/${assetId}/edit`}>
          <Button>Edit Asset</Button>
        </Link>
        {asset.status !== 'sold' && asset.status !== 'scrapped' && (
          <Link href={`/assets/${assetId}/dispose`}>
            <Button variant="destructive">Dispose Asset</Button>
          </Link>
        )}
        <Link href={`/assets/${assetId}/files`}>
          <Button variant="outline">Manage Files</Button>
        </Link>
      </div>
    </div>
  );
}
