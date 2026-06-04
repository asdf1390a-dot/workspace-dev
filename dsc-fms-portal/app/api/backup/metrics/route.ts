import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all backups for user
    const { data: backups, error: backupsError } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (backupsError) throw backupsError;

    const backupsList = backups || [];
    const totalBackups = backupsList.length;
    const lastBackup = backupsList[0];
    const lastBackupTime = lastBackup?.completed_at || lastBackup?.created_at;

    // Calculate average size
    const totalSize = backupsList.reduce((sum: number, b: any) => sum + (b.size_bytes || 0), 0);
    const averageBackupSize = totalBackups > 0 ? Math.round((totalSize / totalBackups / (1024 * 1024)) * 10) / 10 : 0;

    // Calculate backup status
    const completedCount = backupsList.filter((b: any) => b.status === 'completed').length;
    const failedCount = backupsList.filter((b: any) => b.status === 'failed').length;
    const successRate = totalBackups > 0 ? Math.round((completedCount / totalBackups) * 100) : 100;

    const backupStatus = failedCount === 0 && completedCount > 0 ? 'healthy' : failedCount > 0 ? 'degraded' : 'no_backups';

    // Get file statistics
    const { data: files, error: filesError } = await supabase
      .from('backup_files')
      .select('file_type')
      .in('backup_id', backupsList.map((b: any) => b.id));

    if (filesError && filesError.code !== 'PGRST116') throw filesError;

    const fileTypes: Record<string, number> = {};
    (files || []).forEach((f: any) => {
      const type = f.file_type || 'unknown';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    });

    return NextResponse.json({
      totalBackups,
      completedBackups: completedCount,
      failedBackups: failedCount,
      successRate,
      lastBackupTime: lastBackupTime ? new Date(lastBackupTime).toISOString() : null,
      averageBackupSize: `${averageBackupSize} MB`,
      totalBackupSize: `${Math.round((totalSize / (1024 * 1024 * 1024)) * 10) / 10} GB`,
      backupStatus,
      fileTypeDistribution: fileTypes,
    });
  } catch (err: any) {
    console.error('[backup/metrics GET]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
