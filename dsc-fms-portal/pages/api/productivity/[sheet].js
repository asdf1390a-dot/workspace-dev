import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const { sheet } = req.query;
  const { page = 1, pageSize = 20, search = '', sort = '' } = req.query;

  if (!sheet) {
    return res.status(400).json({ error: 'Sheet name required' });
  }

  try {
    // 시트 조회
    const { data: sheetData } = await supabase
      .from('fms_productivity_sheets')
      .select('id')
      .eq('sheet_name', sheet)
      .single();

    if (!sheetData) {
      return res.status(404).json({ error: 'Sheet not found' });
    }

    // 데이터 조회 (페이지네이션, 검색, 정렬)
    let query = supabase
      .from('fms_productivity_data')
      .select('*', { count: 'exact' })
      .eq('sheet_id', sheetData.id);

    // 검색 필터
    if (search) {
      query = query.or(
        `data->>name.ilike.%${search}%,data->>id.ilike.%${search}%`
      );
    }

    // 정렬
    if (sort) {
      const [field, order] = sort.split(':');
      query = query.order(field, { ascending: order === 'asc' });
    } else {
      query = query.order('row_number', { ascending: true });
    }

    // 페이지네이션
    const offset = (page - 1) * pageSize;
    const { data, count } = await query.range(offset, offset + pageSize - 1);

    res.status(200).json({
      data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
