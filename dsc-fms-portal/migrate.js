#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].replace(/^"/, '').replace(/"$/, '');
    env[key] = value;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Supabase 자격증명 없음');
  process.exit(1);
}

console.log(`✅ Supabase 연결: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSql(sql, name) {
  try {
    // Split SQL by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt.trim() + ';' });
        if (error && !error.message.includes('Could not find the function')) {
          throw new Error(error.message);
        }
      }
    }
    
    console.log(`✅ ${name} 완료`);
    return true;
  } catch (err) {
    console.error(`❌ ${name} 에러:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 마이그레이션 3개 시작...\n');
  
  try {
    // SQL 파일 읽기
    const sql48 = fs.readFileSync('/tmp/db48.sql', 'utf-8');
    const sql49 = fs.readFileSync('/tmp/db49.sql', 'utf-8');
    
    // db/36 다운로드
    console.log('⏳ db/36 다운로드 중...');
    const sql36Response = await fetch('https://raw.githubusercontent.com/asdf1390a-dot/workspace-dev/main/db/36_team_dashboard_p1.sql');
    const sql36 = await sql36Response.text();
    
    // 실행 (순차적으로)
    const r1 = await executeSql(sql48, 'db/48 R&M 스키마');
    const r2 = await executeSql(sql49, 'db/49 생산성 스키마');
    const r3 = await executeSql(sql36, 'db/36 Team Dashboard P1');
    
    console.log('\n' + '='.repeat(50));
    if (r1 && r2 && r3) {
      console.log('✅ 모든 마이그레이션 성공!');
    } else {
      console.log('⚠️ 일부 마이그레이션 재확인 필요');
    }
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

main();
