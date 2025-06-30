import { NextRequest, NextResponse } from 'next/server'
import { getAttendanceStatistics } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const classId = searchParams.get('class')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const statistics = await getAttendanceStatistics(date, classId)
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching attendance statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 }
    )
  }
}
