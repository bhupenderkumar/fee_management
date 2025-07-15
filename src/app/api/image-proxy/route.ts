import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('url')
    const filePath = searchParams.get('path')



    if (!originalUrl && !filePath) {
      return NextResponse.json(
        { error: 'Either URL or file path is required' },
        { status: 400 }
      )
    }

    let pathToUse = filePath

    // If we have an original URL, extract the file path from it
    if (originalUrl && originalUrl.includes('supabase.co')) {
      try {
        const urlParts = originalUrl.split('/storage/v1/object/')
        if (urlParts.length > 1) {
          const pathPart = urlParts[1].split('?')[0] // Remove query params

          // Handle different URL formats
          if (pathPart.startsWith('public/')) {
            // This is already a public URL, extract the path after the bucket name
            // Handle the case where database has double File/ prefix
            // Format: public/File/File/id-cards/... -> id-cards/...
            let cleanPath = pathPart.replace('public/File/', '')
            // Remove additional File/ if it exists (database issue)
            if (cleanPath.startsWith('File/')) {
              cleanPath = cleanPath.replace('File/', '')
            }
            pathToUse = cleanPath
          } else if (pathPart.startsWith('sign/')) {
            // This is a signed URL, remove the sign/ prefix
            pathToUse = pathPart.replace('sign/', '')
          } else {
            // Fallback: use the path as-is
            pathToUse = pathPart
          }

        }
      } catch (error) {
        console.error('Error parsing original URL:', error)
      }
    }

    if (!pathToUse) {
      return NextResponse.json(
        { error: 'Could not determine file path' },
        { status: 400 }
      )
    }

    // Since the bucket is public, use public URL (no expiration)
    const { data: publicData } = supabaseAdmin.storage
      .from('File')
      .getPublicUrl(pathToUse)

    if (publicData?.publicUrl) {
      return NextResponse.json({
        signedUrl: publicData.publicUrl,
        isPublic: true,
        expiresAt: null // Public URLs don't expire
      })
    }

    // Fallback: try to generate a signed URL if public URL fails
    const { data, error } = await supabaseAdmin.storage
      .from('File')
      .createSignedUrl(pathToUse, 3600) // 1 hour expiration

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json(
        { error: 'Failed to generate image URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      isPublic: false,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Error in image proxy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
