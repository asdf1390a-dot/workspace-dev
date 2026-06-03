import { Category, ApiResponse } from '@/lib/assets/types';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = getSupabaseClient();
    const { data: categories, error } = await supabase
      .from('categories')
      .select('code, name_en, name_ko, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      return Response.json(
        { success: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: categories as Category[],
    });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Server error' },
      },
      { status: 500 }
    );
  }
}
