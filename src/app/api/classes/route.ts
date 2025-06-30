import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .schema('school')
      .from('IDCard')
      .select('class_id')
      .order('class_id')

    if (error) throw error

    // Get unique class names
    const uniqueClasses = [...new Set(data.map(item => item.class_id).filter(Boolean))]
    return NextResponse.json(uniqueClasses)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}
