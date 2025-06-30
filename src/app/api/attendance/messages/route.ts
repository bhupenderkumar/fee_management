import { NextRequest, NextResponse } from 'next/server'
import { saveAttendanceMessage, getAttendanceMessages } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json()
    
    // Validate required fields
    if (!messageData.student_id || !messageData.attendance_date || !messageData.message_content || !messageData.recipient_number) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, attendance_date, message_content, recipient_number' },
        { status: 400 }
      )
    }

    // Validate recipient_type
    if (!['father', 'mother', 'both'].includes(messageData.recipient_type)) {
      return NextResponse.json(
        { error: 'recipient_type must be "father", "mother", or "both"' },
        { status: 400 }
      )
    }

    const result = await saveAttendanceMessage({
      student_id: messageData.student_id,
      attendance_date: messageData.attendance_date,
      message_content: messageData.message_content,
      recipient_type: messageData.recipient_type,
      recipient_number: messageData.recipient_number,
      delivery_status: messageData.delivery_status || 'pending'
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving attendance message:', error)
    return NextResponse.json(
      { error: 'Failed to save attendance message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const messages = await getAttendanceMessages(date || undefined)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching attendance messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance messages' },
      { status: 500 }
    )
  }
}
