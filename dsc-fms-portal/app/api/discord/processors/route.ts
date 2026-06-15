// app/api/discord/processors/route.ts
// Health check endpoint for Discord processors

import { NextRequest, NextResponse } from 'next/server';

interface ProcessorsStatus {
  available: string[];
  status: string;
}

export async function GET(): Promise<NextResponse<ProcessorsStatus>> {
  return NextResponse.json({
    available: ['secretary', 'translator', 'analyst', 'planner', 'developer'],
    status: 'operational'
  });
}
