import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    channels: ['Email', 'InApp'],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    channel: body.channel,
    enabled: body.enabled,
  });
}
