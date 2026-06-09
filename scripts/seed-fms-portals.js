#!/usr/bin/env node

/**
 * FMS Portals Seed Script
 * Imports data from Excel files into Supabase
 * Usage: node scripts/seed-fms-portals.js
 */

const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROD_FILE = path.join(process.cwd(), 'DSC_생산성관리_통합대시보드.xlsx');
const COST_FILE = path.join(process.cwd(), '경영실적_4월_기본템플릿.xlsx');

async function seedProductivitySheets() {
  console.log('📊 Seeding Productivity Sheets...');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PROD_FILE);

  const sheetConfigs = {
    '생산성 집계': {
      table: 'productivity_summary',
      headerRow: 5,
      transform: (row) => ({
        item: row[0],
        production_team: row[1],
        tech_team: row[2],
        total: row[3],
        target: row[4],
        achievement_rate: row[5]
      })
    },
    '투입시간': {
      table: 'investment_hours',
      headerRow: 3,
      transform: (row) => ({
        work_date: row[0],
        team: row[1],
        investment_hours_h: parseFloat(row[2]) || null,
        work_content: row[3],
        leader: row[4],
        reviewer: row[5]
      })
    },
    '02-IDLE': {
      table: 'idle_time',
      headerRow: 3,
      transform: (row) => ({
        event_date: row[0],
        category: row[1],
        idle_hours_h: parseFloat(row[2]) || null,
        reason: row[3],
        team: row[4],
        impact_level: row[5],
        solution: row[6]
      })
    },
    'MANPOWER': {
      table: 'manpower',
      headerRow: 3,
      transform: (row) => ({
        work_date: row[0],
        team: row[1],
        allocated_personnel: row[2],
        department: row[3],
        role: row[4],
        experience_years: parseFloat(row[5]) || null,
        productivity_index: row[6],
        confirmation: row[7]
      })
    },
    'MAN': {
      table: 'man',
      headerRow: 3,
      transform: (row) => ({
        work_date: row[0],
        team: row[1],
        personnel_count: row[2],
        grade_level: row[3],
        experience_years: parseFloat(row[4]) || null,
        productivity_index: row[5],
        deployment_dept: row[6]
      })
    },
    'PRODUCTIVITY': {
      table: 'productivity',
      headerRow: 3,
      transform: (row) => ({
        work_date: row[0],
        team: row[1],
        production_qty: row[2],
        unit_price: row[3],
        production_amount: row[4],
        investment_hours: row[5],
        basic_productivity: row[6],
        adjustment_rate: row[7],
        final_productivity: row[8],
        target: row[9],
        achievement_rate: row[10]
      })
    },
    'CT기준정보': {
      table: 'ct_standard_info',
      headerRow: 3,
      transform: (row) => ({
        process_name: row[0],
        component_name: row[1],
        standard_hours_h: parseFloat(row[2]) || null,
        difficulty_level: row[3],
        inspection_criteria: row[4],
        inspection_cost_krw: parseFloat(row[5]?.toString().replace(/,/g, '')) || null,
        notes: row[6]
      })
    },
    '검수수불': {
      table: 'inspection_payment',
      headerRow: 3,
      transform: (row) => ({
        item: row[0],
        production_data: row[1],
        sales_data: row[2],
        difference_rate_percent: row[3],
        verification_status: row[4],
        responsible_team: row[5]
      })
    }
  };

  for (const [sheetName, config] of Object.entries(sheetConfigs)) {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      console.log(`⚠️  Sheet not found: ${sheetName}`);
      continue;
    }

    console.log(`  📄 ${sheetName}...`);

    // Clear existing data
    await supabase.from(config.table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const records = [];
    const startRow = config.headerRow + 1;

    for (let rowNum = startRow; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const values = row.values?.slice(1); // Remove first element (Excel row index)

      if (!values || values.every(v => v === null || v === undefined)) {
        continue;
      }

      const record = config.transform(values);
      if (Object.values(record).some(v => v !== null && v !== undefined && v !== '')) {
        records.push(record);
      }
    }

    if (records.length > 0) {
      const { error } = await supabase.from(config.table).insert(records);
      if (error) {
        console.error(`    ❌ Error: ${error.message}`);
      } else {
        console.log(`    ✅ Imported ${records.length} rows`);
      }
    }
  }
}

async function seedCostBudget() {
  console.log('\n💰 Seeding Cost/Budget...');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(COST_FILE);

  const worksheet = workbook.getWorksheet('경비');
  if (!worksheet) {
    console.log('⚠️  Sheet not found: 경비');
    return;
  }

  // Clear existing data
  await supabase.from('cost_budget').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const records = [];
  const startRow = 5; // Data starts at row 5

  for (let rowNum = startRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const values = row.values?.slice(1);

    if (!values || !values[0]) {
      continue;
    }

    const record = {
      category: values[0],
      column_2: values[1],
      amount_2023: parseFloat(values[2]?.toString?.().replace(/,/g, '')) || null,
      percent_2023: parseFloat(values[3]) || null,
      amount_2024: parseFloat(values[4]?.toString?.().replace(/,/g, '')) || null,
      percent_2024: parseFloat(values[5]) || null,
      increase_amount: parseFloat(values[6]?.toString?.().replace(/,/g, '')) || null,
      increase_rate: parseFloat(values[7]) || null,
      reason_for_change: values[8],
      jan_amount: parseFloat(values[9]) || null,
      feb_amount: parseFloat(values[10]) || null,
      mar_amount: parseFloat(values[11]) || null,
      apr_amount: parseFloat(values[12]) || null,
      may_amount: parseFloat(values[13]) || null,
      jun_amount: parseFloat(values[14]) || null
    };

    if (Object.values(record).some(v => v !== null && v !== undefined && v !== '')) {
      records.push(record);
    }
  }

  if (records.length > 0) {
    const { error } = await supabase.from('cost_budget').insert(records);
    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Imported ${records.length} rows`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 FMS Portals Seed Script\n');

    if (!fs.existsSync(PROD_FILE)) {
      console.error(`❌ File not found: ${PROD_FILE}`);
      process.exit(1);
    }

    if (!fs.existsSync(COST_FILE)) {
      console.error(`❌ File not found: ${COST_FILE}`);
      process.exit(1);
    }

    await seedProductivitySheets();
    await seedCostBudget();

    console.log('\n✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

main();
