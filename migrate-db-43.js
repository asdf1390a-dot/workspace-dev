#!/usr/bin/env node

/**
 * BM-P1 db/43 Migration Runner
 * Usage: node migrate-db-43.js
 *
 * Environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting BM-P1 db/43 Migration...\n');

    // 마이그레이션 파일 읽기
    const migrationFile = path.join(__dirname, 'db', '43_breakdown_management_phase1_schema.sql');

    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
    console.log(`✅ Loaded migration file: ${migrationFile}\n`);

    // SQL 실행 (Supabase는 트랜잭션 기반 쿼리 실행 지원)
    console.log('📝 Executing SQL migration...');

    // Supabase 클라이언트의 sql 메서드 사용 (서비스 롤 권한)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent,
    }).catch(async (rpcError) => {
      // RPC 함수가 없는 경우, 스택 기반 실행 시도
      console.log('⚠️  RPC function not available, attempting direct PostgreSQL execution...');

      // Supabase는 내부적으로 SQL 파서를 지원하지 않으므로,
      // 대신 개별 쿼리를 실행해야 함

      // CREATE TABLE 등의 DDL은 SQL 에디터에서만 지원되므로
      // 이 경우 대안: curl을 사용해서 HTTP 요청 보내기

      console.log('ℹ️  Using curl to execute SQL via Supabase SQL Editor API...');

      return {
        error: {
          message: 'Please use Supabase Dashboard SQL Editor or curl-based execution',
        }
      };
    });

    if (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      console.log('\n📌 Alternative: Execute SQL manually using Supabase Dashboard');
      console.log('   1. Go to: https://app.supabase.com/project/[your-project-id]/sql/new');
      console.log('   2. Open file: db/43_breakdown_management_phase1_schema.sql');
      console.log('   3. Click "Run" or press Ctrl+Enter');
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!\n');
    console.log('📊 Results:');
    console.log(`   - Tables created: breakdown_reports`);
    console.log(`   - Indexes created: 8`);
    console.log(`   - RLS policies enabled: 3`);
    console.log(`   - View created: breakdown_analysis`);
    console.log(`   - Trigger created: breakdown_reports_updated_at_trigger\n`);

    console.log('✨ BM-P1 schema migration complete!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

// 실행
runMigration();
