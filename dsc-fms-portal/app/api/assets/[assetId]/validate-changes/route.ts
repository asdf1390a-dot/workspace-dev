import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const body = await request.json();
    const { changes } = body;

    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'changes array is required' },
        { status: 400 }
      );
    }

    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', params.assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const validations = changes.map((change: any) => {
      const { field, new_value } = change;
      const issues = [];

      // Validate field exists
      if (!asset.hasOwnProperty(field)) {
        issues.push(`Field '${field}' does not exist on asset`);
      }

      // Field-specific validations
      if (field === 'status') {
        const validStatuses = ['active', 'maintenance', 'disposed', 'archived'];
        if (!validStatuses.includes(new_value)) {
          issues.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      if (field === 'condition') {
        const validConditions = ['excellent', 'good', 'fair', 'poor'];
        if (!validConditions.includes(new_value)) {
          issues.push(`Invalid condition. Must be one of: ${validConditions.join(', ')}`);
        }
      }

      if (field === 'location' && (!new_value || new_value.trim().length === 0)) {
        issues.push('Location cannot be empty');
      }

      return {
        field,
        new_value,
        valid: issues.length === 0,
        issues,
      };
    });

    const allValid = validations.every(v => v.valid);

    return NextResponse.json({
      asset_id: params.assetId,
      all_valid: allValid,
      validations,
    });
  } catch (error: any) {
    console.error('[validate-changes]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
