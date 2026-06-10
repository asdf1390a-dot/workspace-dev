import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const { page = 1, pageSize = 20, category = '', search = '', sortBy = 'item_name', sortOrder = 'asc' } = req.query;

  try {
    let query = supabase
      .from('fms_cost_budget')
      .select('*', { count: 'exact' });

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category);
    }

    // 검색 필터
    if (search) {
      query = query.or(
        `item_name.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    // 정렬
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy || 'item_name', { ascending });

    // 페이지네이션
    const offset = (page - 1) * pageSize;
    const { data, count } = await query.range(offset, offset + pageSize - 1);

    // 합계 계산
    let totalAmount = 0;
    let totalBudget = 0;

    const summary = await supabase
      .from('fms_cost_budget')
      .select('amount,budget');

    if (summary.data) {
      totalAmount = summary.data.reduce((sum, item) => sum + (item.amount || 0), 0);
      totalBudget = summary.data.reduce((sum, item) => sum + (item.budget || 0), 0);
    }

    res.status(200).json({
      data,
      summary: {
        totalAmount,
        totalBudget,
        variance: totalAmount - totalBudget,
      },
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
