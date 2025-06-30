import { NextRequest, NextResponse } from 'next/server'
import { getAttendanceTrends } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 30

    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: 'Days parameter must be a positive number' },
        { status: 400 }
      )
    }

    const trends = await getAttendanceTrends(days)
    return NextResponse.json(trends)
  } catch (error) {
    console.error('Error fetching attendance trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance trends' },
      { status: 500 }
    )
  }
}
