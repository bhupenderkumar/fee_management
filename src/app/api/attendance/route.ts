import { NextRequest, NextResponse } from 'next/server'
import { markAttendance, getAttendanceByDate } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const attendanceData = await request.json()
    
    // Validate required fields
    if (!attendanceData.student_id || !attendanceData.date || !attendanceData.status) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, date, status' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['present', 'absent', 'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'].includes(attendanceData.status)) {
      return NextResponse.json(
        { error: 'Status must be one of: "present", "absent", "PRESENT", "ABSENT", "LATE", "HALF_DAY"' },
        { status: 400 }
      )
    }

    const result = await markAttendance({
      studentId: attendanceData.student_id,
      date: attendanceData.date,
      status: attendanceData.status.toUpperCase(),
      createdBy: attendanceData.marked_by || null, // UUID field, set to null if not provided
      description: attendanceData.notes || null
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const attendance = await getAttendanceByDate(date)
    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}
