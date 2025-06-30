import { NextRequest, NextResponse } from 'next/server'
import { getStudentsWithAttendanceForDate } from '@/lib/database'

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

    const studentsWithAttendance = await getStudentsWithAttendanceForDate(date, classId)
    return NextResponse.json(studentsWithAttendance)
  } catch (error) {
    console.error('Error fetching students with attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students with attendance' },
      { status: 500 }
    )
  }
}
