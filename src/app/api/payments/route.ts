import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'payment_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const studentName = searchParams.get('studentName')
    const className = searchParams.get('className')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build the query
    let query = supabaseAdmin
      .from('fee_payments')
      .select(`
        *,
        student:IDCard(
          *,
          class:Class(name, section)
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('payment_status', status)
    }

    if (method) {
      query = query.eq('payment_method', method)
    }

    if (startDate) {
      query = query.gte('payment_date', startDate)
    }

    if (endDate) {
      query = query.lte('payment_date', endDate)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // Filter by student name or class name if provided (client-side filtering for joined data)
    let filteredData = data || []

    if (studentName) {
      filteredData = filteredData.filter(payment =>
        payment.student?.student_name?.toLowerCase().includes(studentName.toLowerCase())
      )
    }

    if (className) {
      filteredData = filteredData.filter(payment =>
        payment.student?.class?.name?.toLowerCase().includes(className.toLowerCase())
      )
    }

    return NextResponse.json({
      data: filteredData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['student_id', 'amount_received', 'payment_date', 'payment_method', 'payment_status']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Ensure numeric fields are properly typed
    body.amount_received = parseFloat(body.amount_received)
    body.balance_remaining = parseFloat(body.balance_remaining || 0)

    // Extract month and year from payment_date
    const paymentDate = new Date(body.payment_date)
    body.fee_month = paymentDate.getMonth() + 1 // JavaScript months are 0-indexed
    body.fee_year = paymentDate.getFullYear()

    // Generate unique receipt URL
    const receiptId = crypto.randomUUID()
    const receiptUrl = `/receipt/${receiptId}`

    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .insert({
        ...body,
        receipt_url: receiptUrl
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updated_by = 'system', update_reason, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get the current record to track changes
    const { data: currentRecord, error: fetchError } = await supabaseAdmin
      .from('fee_payments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const fieldsToUpdate = { ...updateData }

    // Ensure numeric fields are properly typed
    if (fieldsToUpdate.amount_received) {
      fieldsToUpdate.amount_received = parseFloat(fieldsToUpdate.amount_received)
    }
    if (fieldsToUpdate.balance_remaining !== undefined) {
      fieldsToUpdate.balance_remaining = parseFloat(fieldsToUpdate.balance_remaining)
    }

    // Update month and year if payment_date is being updated
    if (fieldsToUpdate.payment_date) {
      const paymentDate = new Date(fieldsToUpdate.payment_date)
      fieldsToUpdate.fee_month = paymentDate.getMonth() + 1
      fieldsToUpdate.fee_year = paymentDate.getFullYear()
    }

    // Mark as having updates
    fieldsToUpdate.has_updates = true

    // Update the record
    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('fee_payments')
      .update(fieldsToUpdate)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    // Track changes in history table
    const historyEntries = []
    for (const [field, newValue] of Object.entries(updateData)) {
      if (currentRecord[field] !== newValue) {
        historyEntries.push({
          fee_payment_id: id,
          field_name: field,
          old_value: currentRecord[field]?.toString() || null,
          new_value: newValue?.toString() || null,
          updated_by,
          update_reason
        })
      }
    }

    // Insert history entries if there are changes
    if (historyEntries.length > 0) {
      const { error: historyError } = await supabaseAdmin
        .from('fee_history_update')
        .insert(historyEntries)

      if (historyError) {
        console.error('Error creating history entries:', historyError)
        // Don't fail the update if history tracking fails
      }
    }

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
