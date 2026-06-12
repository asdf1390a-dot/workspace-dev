import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string; entryId: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: historyEntry, error: historyError } = await supabase
      .from('asset_edit_history')
      .select('*')
      .eq('id', params.entryId)
      .eq('asset_id', params.assetId)
      .single();

    if (historyError || !historyEntry) {
      return NextResponse.json(
        { error: 'Edit history entry not found' },
        { status: 404 }
      );
    }

    // Check admin role or owner
    const { data: asset } = await supabase
      .from('assets')
      .select('portfolio_id')
      .eq('id', params.assetId)
      .single();

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Rollback: Revert field to previous value
    const updateData: any = {};
    updateData[historyEntry.changed_field] = historyEntry.previous_value;

    const { error: updateError } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', params.assetId);

    if (updateError) throw updateError;

    // Record rollback action
    const { data: rollbackRecord, error: rollbackError } = await supabase
      .from('asset_edit_history')
      .insert({
        asset_id: params.assetId,
        changed_by: user.id,
        changed_field: historyEntry.changed_field,
        previous_value: historyEntry.new_value,
        new_value: historyEntry.previous_value,
      })
      .select()
      .single();

    if (rollbackError) throw rollbackError;

    return NextResponse.json({
      success: true,
      message: `Field '${historyEntry.changed_field}' rolled back to previous value`,
      rollback_entry_id: rollbackRecord.id,
      previous_value: historyEntry.new_value,
      current_value: historyEntry.previous_value,
    });
  } catch (error: any) {
    console.error('[rollback]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
