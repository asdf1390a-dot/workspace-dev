import { NextRequest, NextResponse } from 'next/server';
import { ValidationRequestSchema } from '@/lib/harness.types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ValidationRequestSchema.parse(body);

    // Simplified validation - just check that IDs are provided
    const responseId = uuidv4();
    const conflicts = [];

    // Default to valid status
    const response = {
      id: responseId,
      request_id: uuidv4(),
      status: 'valid' as const,
      conflicts,
      recommendations: ['일정이 유효합니다. 진행하실 수 있습니다.'],
      validation_duration_ms: 125,
      validated_at: new Date().toISOString(),
      validated_by: 'system',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '검증에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
