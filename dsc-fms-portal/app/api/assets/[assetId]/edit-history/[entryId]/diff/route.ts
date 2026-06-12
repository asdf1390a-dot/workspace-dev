import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const calculateSeverity = (field: string): 'low' | 'moderate' | 'high' => {
  const highSeverityFields = ['status', 'location', 'condition', 'owner_id'];
  const moderateFields = ['name', 'description', 'purchase_date'];

  if (highSeverityFields.includes(field)) return 'high';
  if (moderateFields.includes(field)) return 'moderate';
  return 'low';
};

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string; entryId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('asset_edit_history')
      .select('*, changed_by(id, raw_user_meta_data)')
      .eq('id', params.entryId)
      .eq('asset_id', params.assetId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Edit history entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      field: data.changed_field,
      previous_value: data.previous_value,
      new_value: data.new_value,
      changed_by: data.changed_by?.raw_user_meta_data?.name || 'Unknown',
      changed_at: data.changed_at,
      severity: calculateSeverity(data.changed_field),
    });
  } catch (error: any) {
    console.error('[edit-history-diff]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
