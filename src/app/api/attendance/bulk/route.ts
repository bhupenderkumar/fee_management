import { NextRequest, NextResponse } from 'next/server'
import { bulkMarkAttendance } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { attendanceList } = await request.json()
    
    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return NextResponse.json(
        { error: 'attendanceList must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate each attendance record
    for (const attendance of attendanceList) {
      if (!attendance.student_id || !attendance.attendance_date || !attendance.status) {
        return NextResponse.json(
          { error: 'Each attendance record must have student_id, attendance_date, and status' },
          { status: 400 }
        )
      }

      if (!['present', 'absent'].includes(attendance.status)) {
        return NextResponse.json(
          { error: 'Status must be either "present" or "absent"' },
          { status: 400 }
        )
      }
    }

    // Add default values for missing fields
    const processedAttendanceList = attendanceList.map(attendance => ({
      student_id: attendance.student_id,
      attendance_date: attendance.attendance_date,
      status: attendance.status,
      marked_by: attendance.marked_by || 'admin',
      notes: attendance.notes || null
    }))

    const result = await bulkMarkAttendance(processedAttendanceList)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error marking bulk attendance:', error)
    return NextResponse.json(
      { error: 'Failed to mark bulk attendance' },
      { status: 500 }
    )
  }
}
