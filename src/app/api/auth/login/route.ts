import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'

// This should be stored in environment variables in production
const SECRET_KEY = process.env.AUTH_SECRET_KEY || 'first-step-school-2024'
const ACCESS_KEY = process.env.ACCESS_KEY || 'FirstStep@2024#Admin'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()



    if (!key) {
      return NextResponse.json(
        { error: 'Access key is required' },
        { status: 400 }
      )
    }

    // Verify the access key
    if (key !== ACCESS_KEY) {
      // Log failed attempt (in production, you might want to implement rate limiting)
      console.log(`Failed login attempt at ${new Date().toISOString()} from IP: ${request.ip || 'unknown'}`)

      return NextResponse.json(
        { error: 'Invalid access key' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = sign(
      { 
        authenticated: true,
        timestamp: Date.now(),
        role: 'admin'
      },
      SECRET_KEY,
      { expiresIn: '24h' }
    )

    // Log successful login
    console.log(`Successful login at ${new Date().toISOString()} from IP: ${request.ip || 'unknown'}`)

    return NextResponse.json({
      success: true,
      token,
      message: 'Authentication successful'
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
