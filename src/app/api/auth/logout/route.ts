import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Log logout attempt
    console.log(`Logout request at ${new Date().toISOString()} from IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`)

    // In a JWT-based system, logout is primarily handled client-side
    // by removing the token from storage. Server-side, we just log the event.
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
