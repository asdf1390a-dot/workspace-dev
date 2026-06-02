import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    scheduleHour: '02:00',
    scheduleDayOfWeek: 'daily',
    notificationChannels: ['Email'],
    storageQuotaGb: 100,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    ...body,
  });
}
