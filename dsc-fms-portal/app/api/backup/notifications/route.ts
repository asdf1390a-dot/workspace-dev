import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    notifications: [
      {
        id: 'notif-1',
        type: 'backup_complete',
        message: 'Backup completed successfully',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      notificationId: 'notif-new',
      ...body,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
