import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

const SECRET_KEY = process.env.AUTH_SECRET_KEY || 'first-step-school-2024'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    try {
      // Verify the JWT token
      const decoded = verify(token, SECRET_KEY) as { [key: string]: unknown }
      
      return NextResponse.json({
        valid: true,
        decoded,
        message: 'Token is valid'
      })

    } catch {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired token'
        },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
