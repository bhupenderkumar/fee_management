import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const className = searchParams.get('class')

  if (!className) {
    return NextResponse.json(
      { error: 'Class name is required' },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabase
      .schema('school')
      .from('IDCard')
      .select('*')
      .eq('class_id', className)
      .order('student_name')

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
