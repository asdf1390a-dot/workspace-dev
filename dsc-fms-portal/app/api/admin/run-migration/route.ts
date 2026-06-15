import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.headers.get('x-admin-token');
    if (token !== process.env.ADMIN_MIGRATION_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Drop and recreate tables
    const statements = [
      // Drop triggers
      `DROP TRIGGER IF EXISTS trigger_log_asset_changes ON assets;`,
      `DROP TRIGGER IF EXISTS trigger_update_asset_edit_tracking ON assets;`,
      `DROP FUNCTION IF EXISTS log_asset_changes();`,
      `DROP FUNCTION IF EXISTS update_asset_edit_tracking();`,

      // Drop policies
      `DROP POLICY IF EXISTS "asset_disposals_insert_policy" ON asset_disposals;`,
      `DROP POLICY IF EXISTS "asset_disposals_select_policy" ON asset_disposals;`,
      `DROP POLICY IF EXISTS "asset_edit_history_insert_policy" ON asset_edit_history;`,
      `DROP POLICY IF EXISTS "asset_edit_history_select_policy" ON asset_edit_history;`,

      // Drop tables
      `DROP TABLE IF EXISTS asset_disposals;`,
      `DROP TABLE IF EXISTS asset_edit_history;`,
      `ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_last_edited_by;`,

      // Add columns to assets
      `ALTER TABLE assets ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_edited_by uuid;`,
      `ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_edited_at timestamptz DEFAULT now();`,
      `ALTER TABLE assets ADD CONSTRAINT fk_assets_last_edited_by FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;`,

      // Create asset_edit_history
      `CREATE TABLE asset_edit_history (id BIGSERIAL PRIMARY KEY, asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, changed_by UUID NOT NULL REFERENCES auth.users(id), changed_field VARCHAR(255) NOT NULL, previous_value TEXT, new_value TEXT, changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`,
      `CREATE INDEX idx_asset_edit_history_asset_id ON asset_edit_history(asset_id);`,
      `CREATE INDEX idx_asset_edit_history_changed_at ON asset_edit_history(changed_at);`,
      `CREATE INDEX idx_asset_edit_history_changed_by ON asset_edit_history(changed_by);`,

      // Create asset_disposals
      `CREATE TABLE asset_disposals (id BIGSERIAL PRIMARY KEY, asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, disposed_by UUID NOT NULL REFERENCES auth.users(id), disposal_reason VARCHAR(255) NOT NULL, disposal_date DATE NOT NULL, disposal_certificate_url TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`,
      `CREATE INDEX idx_asset_disposals_asset_id ON asset_disposals(asset_id);`,
      `CREATE INDEX idx_asset_disposals_disposed_by ON asset_disposals(disposed_by);`,
      `CREATE INDEX idx_asset_disposals_created_at ON asset_disposals(created_at);`,

      // Enable RLS
      `ALTER TABLE asset_edit_history ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;`,

      // Policies
      `CREATE POLICY "asset_edit_history_select_policy" ON asset_edit_history FOR SELECT USING (true);`,
      `CREATE POLICY "asset_edit_history_insert_policy" ON asset_edit_history FOR INSERT WITH CHECK (changed_by = auth.uid());`,
      `CREATE POLICY "asset_disposals_select_policy" ON asset_disposals FOR SELECT USING (true);`,
      `CREATE POLICY "asset_disposals_insert_policy" ON asset_disposals FOR INSERT WITH CHECK (disposed_by = auth.uid());`,

      // Triggers
      `CREATE OR REPLACE FUNCTION update_asset_edit_tracking() RETURNS TRIGGER AS $func$ BEGIN NEW.last_edited_by := auth.uid(); NEW.last_edited_at := now(); RETURN NEW; END; $func$ LANGUAGE plpgsql SECURITY DEFINER;`,
      `CREATE TRIGGER trigger_update_asset_edit_tracking BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_asset_edit_tracking();`,
      `CREATE OR REPLACE FUNCTION log_asset_changes() RETURNS TRIGGER AS $func$ BEGIN IF OLD.asset_tag IS DISTINCT FROM NEW.asset_tag THEN INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value) VALUES (NEW.id, auth.uid(), 'asset_tag', COALESCE(OLD.asset_tag::text, 'null'), COALESCE(NEW.asset_tag::text, 'null')); END IF; IF OLD.status IS DISTINCT FROM NEW.status THEN INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value) VALUES (NEW.id, auth.uid(), 'status', COALESCE(OLD.status::text, 'null'), COALESCE(NEW.status::text, 'null')); END IF; RETURN NEW; END; $func$ LANGUAGE plpgsql SECURITY DEFINER;`,
      `CREATE TRIGGER trigger_log_asset_changes AFTER UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION log_asset_changes();`,
    ];

    const results = [];
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          results.push({ statement: statement.substring(0, 50), status: 'error', error: error.message });
        } else {
          results.push({ statement: statement.substring(0, 50), status: 'ok' });
        }
      } catch (err: any) {
        results.push({ statement: statement.substring(0, 50), status: 'exception', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: results.filter(r => r.status !== 'ok'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
