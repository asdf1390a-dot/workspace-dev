import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    sort = 'category',
    order = 'asc'
  } = req.query;

  try {
    let query = supabase.from('cost_budget').select('*', { count: 'exact' });

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Search by category or column_2
    if (search) {
      query = query.or(`category.ilike.%${search}%,column_2.ilike.%${search}%`);
    }

    // Sort
    query = query.order(sort || 'category', { ascending: order === 'asc' });

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Calculate sums for visible rows
    const sums = {
      amount_2023: 0,
      amount_2024: 0,
      increase_amount: 0,
      jan_amount: 0,
      feb_amount: 0,
      mar_amount: 0,
      apr_amount: 0,
      may_amount: 0,
      jun_amount: 0
    };

    data.forEach(row => {
      Object.keys(sums).forEach(key => {
        if (row[key]) sums[key] += parseFloat(row[key]);
      });
    });

    res.status(200).json({
      data,
      sums,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
