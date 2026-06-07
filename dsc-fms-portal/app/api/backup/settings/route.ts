import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BackupSettings {
  id?: string;
  user_id?: string;
  schedule_hour?: string;
  schedule_day_of_week?: string;
  notification_channels?: string[];
  storage_quota_gb?: number;
  auto_delete_days?: number;
  retention_policy?: string;
  created_at?: string;
  updated_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('backup_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default settings if not found
    if (!data) {
      return NextResponse.json({
        schedule_hour: '02:00',
        schedule_day_of_week: 'daily',
        notification_channels: ['Email'],
        storage_quota_gb: 100,
        auto_delete_days: 90,
        retention_policy: 'standard',
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[backup/settings GET]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body = (await request.json()) as BackupSettings;

    // Check if settings already exist
    const { data: existing } = await supabase
      .from('backup_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('backup_settings')
        .update({
          schedule_hour: body.schedule_hour,
          schedule_day_of_week: body.schedule_day_of_week,
          notification_channels: body.notification_channels,
          storage_quota_gb: body.storage_quota_gb,
          auto_delete_days: body.auto_delete_days,
          retention_policy: body.retention_policy,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data, { status: 200 });
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('backup_settings')
        .insert([
          {
            user_id: userId,
            schedule_hour: body.schedule_hour || '02:00',
            schedule_day_of_week: body.schedule_day_of_week || 'daily',
            notification_channels: body.notification_channels || ['Email'],
            storage_quota_gb: body.storage_quota_gb || 100,
            auto_delete_days: body.auto_delete_days || 90,
            retention_policy: body.retention_policy || 'standard',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err: any) {
    console.error('[backup/settings POST]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
