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
      if (!attendance.student_id || !attendance.date || !attendance.status) {
        return NextResponse.json(
          { error: 'Each attendance record must have student_id, date, and status' },
          { status: 400 }
        )
      }

      if (!['present', 'absent', 'PRESENT', 'ABSENT'].includes(attendance.status)) {
        return NextResponse.json(
          { error: 'Status must be either "present", "absent", "PRESENT", or "ABSENT"' },
          { status: 400 }
        )
      }
    }

    // Add default values for missing fields and map to database schema
    const processedAttendanceList = attendanceList.map(attendance => ({
      studentId: attendance.student_id,  // Map student_id to studentId (database column)
      date: attendance.date,             // Map date to date (database column)
      status: attendance.status.toUpperCase(), // Convert to uppercase for database enum
      createdBy: attendance.marked_by || null, // UUID field, set to null if not provided
      description: attendance.notes || null,
      classId: attendance.classId || null,
      lastModifiedBy: attendance.marked_by || null // UUID field, set to null if not provided
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
