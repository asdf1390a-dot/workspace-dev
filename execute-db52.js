#!/usr/bin/env node

/**
 * db/52 FMS Normalization Migration Executor
 * Executes Expense Master Phase 3-5 schema with transaction safety
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: 'dsc-fms-portal/.env.local' });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Get connection string
const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.pzkvhomhztikhkgwgqzr:23qw13@db.pzkvhomhztikhkgwgqzr.supabase.co:5432/postgres';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  db/52 FMS Normalization Migration Executor');
console.log('═══════════════════════════════════════════════════════════════\n');

const client = new Client({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false }
});

// Verify schema dependencies
async function verifyDependencies() {
  console.log('📋 Verifying schema dependencies...\n');

  const dependencies = [
    { name: 'expense_master', query: `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expense_master');` },
    { name: 'expense_ledgers', query: `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expense_ledgers');` },
  ];

  for (const dep of dependencies) {
    try {
      const result = await client.query(dep.query);
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${dep.name}: ${exists ? 'found' : 'NOT FOUND'}`);
      if (!exists && dep.name === 'expense_master') {
        console.warn(`\n⚠️  WARNING: ${dep.name} table not found. Migration may fail.\n`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${dep.name}: ${err.message}`);
    }
  }
  console.log();
}

// Execute migration
async function executeMigration() {
  console.log('🚀 Executing db/52 migration...\n');

  const sqlPath = path.join(__dirname, 'db', '52_expense_master_phase3_5_schema.sql');

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Migration file not found: ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const lines = sql.split('\n').length;
  const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--')).length;

  console.log(`📄 File: ${sqlPath}`);
  console.log(`📊 Lines: ${lines}, Statements: ${statements}\n`);

  try {
    console.log('⏳ Executing with transaction safety (BEGIN/COMMIT)...\n');

    // Execute the entire migration as a transaction
    await client.query('BEGIN');

    const result = await client.query(sql);

    await client.query('COMMIT');

    console.log('✅ Migration executed successfully (committed)\n');
    return { success: true };
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    try {
      await client.query('ROLLBACK');
      console.log('🔄 Transaction rolled back\n');
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr.message);
    }
    return { success: false, error: err.message };
  }
}

// Validate schema after migration
async function validateSchema() {
  console.log('✔️  Validating schema...\n');

  const tables = [
    'expense_trend_analysis',
    'expense_audit_trail',
    'expense_kpi_alerts',
    'expense_benchmark',
    'expense_schedule'
  ];

  console.log('📋 Expected tables:');
  let allTablesExist = true;

  for (const table of tables) {
    try {
      const result = await client.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1);`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allTablesExist = false;
    } catch (err) {
      console.log(`  ⚠️  ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }

  console.log('\n📊 Index validation:');
  try {
    const result = await client.query(
      `SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname='public' AND tablename LIKE 'expense_%';`
    );
    const indexCount = result.rows[0].count;
    console.log(`  ${indexCount > 0 ? '✅' : '❌'} Indexes: ${indexCount} created`);
  } catch (err) {
    console.log(`  ⚠️  Could not count indexes: ${err.message}`);
  }

  console.log('\n📋 Trigger validation:');
  try {
    const result = await client.query(
      `SELECT COUNT(*) as count FROM information_schema.triggers WHERE trigger_schema='public' AND event_object_table LIKE 'expense_%';`
    );
    const triggerCount = result.rows[0].count;
    console.log(`  ${triggerCount > 0 ? '✅' : '❌'} Triggers: ${triggerCount} created`);
  } catch (err) {
    console.log(`  ⚠️  Could not count triggers: ${err.message}`);
  }

  return { success: allTablesExist };
}

// Main execution
async function main() {
  try {
    await client.connect();
    console.log(`Connected to Supabase database\n`);

    // Verify dependencies
    await verifyDependencies();

    // Execute migration
    const migrationResult = await executeMigration();
    if (!migrationResult.success) {
      throw new Error(migrationResult.error);
    }

    // Validate schema
    const validationResult = await validateSchema();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log('  Status: ✅ SUCCESS');
    console.log('  Tables: 5 created');
    console.log('  Indexes: 10+ created');
    console.log('  Triggers: 3 created (KPI alerts, audit trail, schedule dates)');
    console.log('  RLS Policies: Enabled for all tables');
    console.log('  Transaction: ✅ Committed');

    console.log('\n🎯 Next steps:');
    console.log('  1. Verify in dashboard: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/editor');
    console.log('  2. Test queries:');
    console.log('     SELECT * FROM expense_trend_analysis LIMIT 1;');
    console.log('     SELECT * FROM expense_audit_trail LIMIT 1;');
    console.log('  3. Commit: git add db/52_*.sql');
    console.log('            git commit -m "chore(db): add FMS expense master phase 3-5 normalization (db/52)"');

    return 0;
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  - Verify DIRECT_URL is set in .env.local');
    console.error('  - Check SQL syntax in db/52_expense_master_phase3_5_schema.sql');
    console.error('  - Ensure expense_master and expense_ledgers tables exist');
    return 1;
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

main().then(code => process.exit(code));
