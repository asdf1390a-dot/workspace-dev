// Travel Documents — Upload/manage documents
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function getUser(token: string) {
  const { data: user, error } = await sb.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  return user.user;
}

async function canWrite(userId: string, travelId: string) {
  const { data: travel } = await sb
    .from('travels')
    .select('user_id')
    .eq('id', travelId)
    .single();

  if (!travel) throw new Error('Travel not found');
  if (travel.user_id === userId) return true;

  const { data: member } = await sb
    .from('travel_members')
    .select('permission')
    .eq('travel_id', travelId)
    .eq('user_id', userId)
    .single();

  if (!member || member.permission !== 'read_write') throw new Error('Insufficient permissions');
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await getUser(token);
    await canWrite(user.id, params.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const document_type = formData.get('document_type') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'File required' } }, { status: 400 });
    }

    const fileName = `${params.id}/${Date.now()}_${file.name}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await sb.storage
      .from('travel-documents')
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: document, error } = await sb
      .from('travel_documents')
      .insert({
        travel_id: params.id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        file_type: file.type.split('/')[1] || 'unknown',
        document_type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: publicUrl } = sb.storage
      .from('travel-documents')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, data: { ...document, public_url: publicUrl.publicUrl }, message: 'Document uploaded' }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('permissions') ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await getUser(token);

    const { data, error } = await sb
      .from('travel_documents')
      .select('*')
      .eq('travel_id', params.id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status: 500 });
  }
}
