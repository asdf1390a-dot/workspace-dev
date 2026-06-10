const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('🌱 Seeding FMS Portals data...');

  try {
    // 샘플 생산성 데이터
    const sheets = [
      '생산성 집계',
      '투입시간',
      'IDLE',
      'MANPOWER',
      'MAN',
      '생산성',
      'CT기준정보',
      '검수수불',
    ];

    for (let i = 0; i < sheets.length; i++) {
      const { data: sheet } = await supabase
        .from('fms_productivity_sheets')
        .select('id')
        .eq('sheet_name', sheets[i])
        .single();

      if (!sheet) continue;

      // 각 시트에 20행 샘플 데이터 추가
      const rows = [];
      for (let row = 1; row <= 20; row++) {
        rows.push({
          sheet_id: sheet.id,
          row_number: row,
          data: {
            id: `${sheets[i]}-${row}`,
            name: `${sheets[i]} Row ${row}`,
            value: Math.floor(Math.random() * 1000),
            status: 'active',
          },
        });
      }

      await supabase.from('fms_productivity_data').insert(rows);
      console.log(`✅ ${sheets[i]}: 20 rows added`);
    }

    // 샘플 경비 데이터
    const costData = [
      { category: '재료비', item_name: '강판', amount: 5000000, budget: 5500000 },
      { category: '재료비', item_name: '부품', amount: 3000000, budget: 3200000 },
      { category: '인건비', item_name: '기술자', amount: 10000000, budget: 10000000 },
      { category: '운영비', item_name: '전력비', amount: 1500000, budget: 1600000 },
      { category: '운영비', item_name: '유지보수', amount: 2000000, budget: 2200000 },
    ];

    for (const item of costData) {
      const variance = item.amount - item.budget;
      await supabase.from('fms_cost_budget').insert({
        ...item,
        variance,
        status: variance > 0 ? 'over_budget' : 'on_track',
      });
    }

    console.log(`✅ Cost Budget: ${costData.length} items added`);
    console.log('🎉 Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
