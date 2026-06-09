import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const tableMap = {
  'productivity-summary': 'productivity_summary',
  'investment-hours': 'investment_hours',
  'idle-time': 'idle_time',
  'manpower': 'manpower',
  'man': 'man',
  'productivity': 'productivity',
  'ct-standard-info': 'ct_standard_info',
  'inspection-payment': 'inspection_payment'
};

export default async function handler(req, res) {
  const { sheet, page = 1, limit = 20, search, sort, order = 'asc' } = req.query;

  try {
    const tableName = tableMap[sheet];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid sheet' });
    }

    let query = supabase.from(tableName).select('*', { count: 'exact' });

    // Apply search filter if provided
    if (search) {
      const columns = await getTableColumns(tableName);
      let searchQuery = false;
      for (const col of columns) {
        if (['text', 'varchar'].includes(col.type)) {
          query = supabase.from(tableName).select('*', { count: 'exact' });
          query = query.or(`${col.name}.ilike.%${search}%`);
          searchQuery = true;
          break;
        }
      }
      if (!searchQuery) {
        query = supabase.from(tableName).select('*', { count: 'exact' });
      }
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      data,
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

async function getTableColumns(tableName) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', tableName);

  if (error) return [];
  return data.map(col => ({
    name: col.column_name,
    type: col.data_type
  }));
}
