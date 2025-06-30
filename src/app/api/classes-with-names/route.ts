import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .schema('school')
      .from('Class')
      .select('id, name, section')
      .order('name, section')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching classes with names:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}
