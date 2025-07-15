import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { format, isToday, isThisWeek, isThisMonth, differenceInYears, differenceInDays, addYears } from 'date-fns'

// Utility function to convert signed URLs to public URLs
function convertToPublicUrl(signedUrl: string | null): string | null {
  if (!signedUrl || !signedUrl.includes('supabase.co')) {
    return signedUrl
  }

  try {
    // Extract the file path from signed URL
    const urlParts = signedUrl.split('/storage/v1/object/')
    if (urlParts.length > 1) {
      const pathPart = urlParts[1].split('?')[0] // Remove query params

      let filePath: string
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
        filePath = cleanPath
      } else if (pathPart.startsWith('sign/')) {
        // This is a signed URL, remove the sign/ prefix
        filePath = pathPart.replace('sign/', '')
      } else {
        // Fallback: use the path as-is
        filePath = pathPart
      }

      // Generate public URL
      const { data } = supabaseAdmin.storage
        .from('File')
        .getPublicUrl(filePath)
      return data?.publicUrl || signedUrl
    }
  } catch (error) {
    console.error('Error converting to public URL:', error)
  }

  return signedUrl
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // today, week, month, all

    // Fetch all students with birthday information
    const { data: students, error } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select(`
        id,
        student_name,
        father_name,
        mother_name,
        father_mobile,
        mother_mobile,
        student_photo_url,
        father_photo_url,
        mother_photo_url,
        date_of_birth,
        class_id,
        address,
        created_at
      `)
      .not('date_of_birth', 'is', null)
      .order('date_of_birth', { ascending: true })

    if (error) {
      console.error('Error fetching students:', error)
      throw error
    }

    if (!students || students.length === 0) {
      return NextResponse.json([])
    }

    // Process birthday data
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()

    const birthdayStudents = students.map(student => {
      // Parse the birth date properly - ensure we're working with the correct date
      const birthDate = new Date(student.date_of_birth + 'T00:00:00.000Z')

      // Calculate age using date-fns differenceInYears which is more accurate
      const age = differenceInYears(currentDate, birthDate)

      // Calculate this year's birthday
      const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())

      // If birthday has passed this year, calculate for next year
      let nextBirthday = thisYearBirthday
      if (thisYearBirthday < currentDate) {
        nextBirthday = addYears(thisYearBirthday, 1)
      }

      const daysUntilBirthday = differenceInDays(nextBirthday, currentDate)

      // Check if birthday falls in different time periods
      const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
      const isBirthdayToday = isToday(birthdayThisYear)
      const isBirthdayThisWeek = isThisWeek(birthdayThisYear, { weekStartsOn: 1 }) // Monday start
      const isBirthdayThisMonth = isThisMonth(birthdayThisYear)

      return {
        ...student,
        age,
        daysUntilBirthday,
        isToday: isBirthdayToday,
        isThisWeek: isBirthdayThisWeek,
        isThisMonth: isBirthdayThisMonth,
        nextBirthday: format(nextBirthday, 'yyyy-MM-dd'),
        birthdayThisYear: format(birthdayThisYear, 'yyyy-MM-dd'),
        // Convert signed URLs to public URLs to avoid expiration
        student_photo_url: convertToPublicUrl(student.student_photo_url),
        father_photo_url: convertToPublicUrl(student.father_photo_url),
        mother_photo_url: convertToPublicUrl(student.mother_photo_url)
      }
    })

    // Apply filter
    let filteredStudents = birthdayStudents
    switch (filter) {
      case 'today':
        filteredStudents = birthdayStudents.filter(student => student.isToday)
        break
      case 'week':
        filteredStudents = birthdayStudents.filter(student => student.isThisWeek)
        break
      case 'month':
        filteredStudents = birthdayStudents.filter(student => student.isThisMonth)
        break
      case 'upcoming':
        // Next 30 days
        filteredStudents = birthdayStudents.filter(student => student.daysUntilBirthday <= 30)
        break
      case 'all':
      default:
        // Sort by upcoming birthdays first
        filteredStudents = birthdayStudents.sort((a, b) => {
          // Today's birthdays first
          if (a.isToday && !b.isToday) return -1
          if (!a.isToday && b.isToday) return 1
          
          // Then by days until birthday
          return a.daysUntilBirthday - b.daysUntilBirthday
        })
        break
    }

    return NextResponse.json(filteredStudents)
  } catch (error) {
    console.error('Error fetching birthday data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch birthday data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, birthday_message, sent_to } = body

    // Log birthday message sent (optional - for tracking)
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('birthday_messages')
      .insert({
        student_id,
        message_content: birthday_message,
        sent_to,
        sent_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging birthday message:', error)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing birthday message:', error)
    return NextResponse.json(
      { error: 'Failed to process birthday message' },
      { status: 500 }
    )
  }
}
