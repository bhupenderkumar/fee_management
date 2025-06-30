import { NextRequest, NextResponse } from 'next/server'
import { markAttendance, getAttendanceByDate } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const attendanceData = await request.json()
    
    // Validate required fields
    if (!attendanceData.student_id || !attendanceData.attendance_date || !attendanceData.status) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, attendance_date, status' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['present', 'absent'].includes(attendanceData.status)) {
      return NextResponse.json(
        { error: 'Status must be either "present" or "absent"' },
        { status: 400 }
      )
    }

    const result = await markAttendance({
      student_id: attendanceData.student_id,
      attendance_date: attendanceData.attendance_date,
      status: attendanceData.status,
      marked_by: attendanceData.marked_by || 'admin',
      notes: attendanceData.notes || null
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
