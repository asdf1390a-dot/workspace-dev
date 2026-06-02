import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    dailyBackupCount: 12,
    storageUsageGb: 45.6,
    lastBackupTime: new Date().toISOString(),
  });
}
