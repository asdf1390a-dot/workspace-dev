#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, 'dsc-fms-portal/.env.local') });

const migrationFile = path.join(__dirname, 'dsc-fms-portal/db/37_team_dashboard_phase2_communications.sql');
const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error('❌ DIRECT_URL not found in environment variables');
  process.exit(1);
}

async function deployMigration() {
  const client = new Client({ connectionString: directUrl });

  try {
    console.log('📡 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected');

    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🚀 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration deployed successfully');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'team_performance_metrics',
        'team_resource_allocations',
        'team_message_threads',
        'team_messages'
      )
      ORDER BY table_name;
    `);

    if (result.rows.length === 4) {
      console.log('✅ All 4 tables created:');
      result.rows.forEach(row => console.log(`   • ${row.table_name}`));
    } else {
      console.log(`⚠️  Expected 4 tables, found ${result.rows.length}`);
      result.rows.forEach(row => console.log(`   • ${row.table_name}`));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deployMigration();
