import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Notification {
  id?: string;
  user_id?: string;
  type?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const limit = request.nextUrl.searchParams.get('limit') || '50';
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';

    let query = supabase
      .from('backup_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error && error.code !== 'PGRST116') throw error;

    // Transform data to match expected format
    const notifications = (data || []).map((notif: any) => ({
      id: notif.id,
      type: notif.type,
      message: notif.message,
      timestamp: notif.created_at,
      read: notif.read,
    }));

    return NextResponse.json({
      notifications,
      total: notifications.length,
    });
  } catch (err: any) {
    console.error('[backup/notifications GET]', err);
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

    const body = (await request.json()) as Notification;

    if (!body.type || !body.message) {
      return NextResponse.json(
        { error: 'type and message required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('backup_notifications')
      .insert([
        {
          user_id: userId,
          type: body.type,
          message: body.message,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        notificationId: data.id,
        notification: {
          id: data.id,
          type: data.type,
          message: data.message,
          timestamp: data.created_at,
          read: data.read,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[backup/notifications POST]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const notifId = request.nextUrl.searchParams.get('notifId');
    if (!notifId) {
      return NextResponse.json(
        { error: 'notifId required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('backup_notifications')
      .update({ read: body.read })
      .eq('id', notifId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      notification: {
        id: data.id,
        type: data.type,
        message: data.message,
        read: data.read,
      },
    });
  } catch (err: any) {
    console.error('[backup/notifications PATCH]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
