import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BackupFile {
  id?: string;
  backup_id?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  storage_url?: string;
  checksum?: string;
  created_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const backupId = request.nextUrl.searchParams.get('backupId');

    // Get total size used by user's backups
    const { data: backupData, error: backupError } = await supabase
      .from('backups')
      .select('size_bytes')
      .eq('user_id', userId);

    if (backupError) throw backupError;

    const usedBytes = (backupData || []).reduce((sum: number, b: any) => sum + (b.size_bytes || 0), 0);
    const usedGb = Math.round((usedBytes / (1024 * 1024 * 1024)) * 10) / 10;

    // Get storage settings
    const { data: settings } = await supabase
      .from('backup_settings')
      .select('storage_quota_gb')
      .eq('user_id', userId)
      .single();

    const quotaGb = settings?.storage_quota_gb || 100;

    // Get files if backupId specified
    let files: any[] = [];
    if (backupId) {
      const { data: fileData, error: fileError } = await supabase
        .from('backup_files')
        .select('*')
        .eq('backup_id', backupId)
        .order('created_at', { ascending: false });

      if (fileError) throw fileError;
      files = fileData || [];
    }

    return NextResponse.json({
      usedGb,
      quotaGb,
      percentUsed: Math.round((usedGb / quotaGb) * 100),
      files: backupId ? files : undefined,
    });
  } catch (err: any) {
    console.error('[backup/storage GET]', err);
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

    const body = (await request.json()) as BackupFile;

    if (!body.backup_id || !body.file_path) {
      return NextResponse.json(
        { error: 'backup_id and file_path required' },
        { status: 400 }
      );
    }

    // Verify backup belongs to user
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .select('id')
      .eq('id', body.backup_id)
      .eq('user_id', userId)
      .single();

    if (backupError || !backup) {
      return NextResponse.json(
        { error: 'Backup not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('backup_files')
      .insert([
        {
          backup_id: body.backup_id,
          file_path: body.file_path,
          file_type: body.file_type,
          file_size: body.file_size,
          storage_url: body.storage_url,
          checksum: body.checksum,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[backup/storage POST]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const fileId = request.nextUrl.searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId required' },
        { status: 400 }
      );
    }

    // Verify file belongs to user's backup
    const { data: file, error: fileError } = await supabase
      .from('backup_files')
      .select('backup_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .select('id')
      .eq('id', file.backup_id)
      .eq('user_id', userId)
      .single();

    if (backupError || !backup) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('backup_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[backup/storage DELETE]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
