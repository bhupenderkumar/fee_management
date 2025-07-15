import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all students with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const classFilter = searchParams.get('class') || ''
    const sortBy = searchParams.get('sortBy') || 'student_name'

    // Validate sortBy to ensure it's a valid column
    const validSortColumns = ['student_name', 'father_name', 'mother_name', 'class_id', 'created_at']
    const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : 'student_name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select(`
        *,
        fee_payments:fee_payments(
          id,
          amount_received,
          payment_date,
          payment_method,
          payment_status,
          balance_remaining
        )
      `)

    // Apply search filter
    if (search) {
      query = query.or(`student_name.ilike.%${search}%,father_name.ilike.%${search}%,mother_name.ilike.%${search}%`)
    }

    // Apply class filter
    if (classFilter) {
      query = query.eq('class_id', classFilter)
    }

    // Apply sorting
    query = query.order(actualSortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: students, error } = await query

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`student_name.ilike.%${search}%,father_name.ilike.%${search}%,mother_name.ilike.%${search}%`)
    }

    if (classFilter) {
      countQuery = countQuery.eq('class_id', classFilter)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting students:', countError)
    }

    return NextResponse.json({
      data: students || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/students-management:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      student_name,
      father_name,
      mother_name,
      class_id,
      section,

      date_of_birth,
      gender,
      address,
      father_mobile,
      mother_mobile,
      email,
      blood_group,
      emergency_contact,
      previous_school,
      admission_date,
      fees_amount,
      transport_required,
      medical_conditions,
      created_by = 'admin'
    } = body

    // Validate required fields
    if (!student_name || !father_name || !class_id) {
      return NextResponse.json(
        { error: 'Missing required fields: student_name, father_name, class_id' },
        { status: 400 }
      )
    }

    // Note: admission_number field doesn't exist in IDCard table, so we skip uniqueness check

    // Insert new student
    const { data: newStudent, error: insertError } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .insert({
        student_name,
        father_name,
        mother_name,
        class_id,
        section,

        date_of_birth,
        gender,
        address,
        father_mobile,
        mother_mobile,
        email,
        blood_group,
        emergency_contact,
        previous_school,

        fees_amount,
        transport_required: transport_required || false,
        medical_conditions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating student:', insertError)
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Student created successfully',
      data: newStudent
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/students-management:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing student
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      student_name,
      father_name,
      mother_name,
      class_id,
      section,

      date_of_birth,
      gender,
      address,
      father_mobile,
      mother_mobile,
      email,
      blood_group,
      emergency_contact,
      previous_school,
      admission_date,
      fees_amount,
      transport_required,
      medical_conditions,
      updated_by = 'admin',
      update_reason
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Check if student exists
    const { data: existingStudent, error: checkError } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Update student
    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .update({
        student_name,
        father_name,
        mother_name,
        class_id,
        section,

        date_of_birth,
        gender,
        address,
        father_mobile,
        mother_mobile,
        email,
        blood_group,
        emergency_contact,
        previous_school,

        fees_amount,
        transport_required,
        medical_conditions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating student:', updateError)
      return NextResponse.json(
        { error: 'Failed to update student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Student updated successfully',
      data: updatedStudent
    })
  } catch (error) {
    console.error('Error in PUT /api/students-management:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a student
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const deleted_by = searchParams.get('deleted_by') || 'admin'
    const delete_reason = searchParams.get('delete_reason')

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    if (!delete_reason) {
      return NextResponse.json(
        { error: 'Delete reason is required' },
        { status: 400 }
      )
    }

    // Check if student exists
    const { data: existingStudent, error: checkError } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Delete the student (this will cascade to related records)
    const { error: deleteError } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting student:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
      deleted_student: existingStudent
    })
  } catch (error) {
    console.error('Error in DELETE /api/students-management:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
