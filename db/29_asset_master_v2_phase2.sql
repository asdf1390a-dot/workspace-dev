-- Asset Master Phase 2: Import Batches Table
-- db/29 - Asset Import Batch Tracking

CREATE TABLE IF NOT EXISTS asset_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  total_rows INT DEFAULT 0,
  imported_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_import_batches_user_id ON asset_import_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON asset_import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_at ON asset_import_batches(created_at);

ALTER TABLE asset_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batches" ON asset_import_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create batches" ON asset_import_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches" ON asset_import_batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches" ON asset_import_batches
  FOR DELETE USING (auth.uid() = user_id);
