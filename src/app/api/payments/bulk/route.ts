import { NextRequest, NextResponse } from 'next/server'
import { bulkCreateFeePayments } from '@/lib/database'
import { bulkFeeEntryRequestSchema, validateBulkFeeEntryRequest } from '@/lib/validations/bulk-fee-entry'
import { BulkFeeEntryResponse } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request structure
    const validation = validateBulkFeeEntryRequest(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { entries } = body

    // Additional validation for each entry
    const validationErrors: Array<{ index: number; errors: Record<string, string> }> = []
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      
      // Validate required fields
      const requiredFields = ['student_id', 'amount_received', 'payment_date', 'payment_method', 'payment_status']
      const entryErrors: Record<string, string> = {}
      
      for (const field of requiredFields) {
        if (!entry[field]) {
          entryErrors[field] = `${field} is required`
        }
      }

      // Validate numeric fields
      if (entry.amount_received !== undefined) {
        const amount = parseFloat(entry.amount_received)
        if (isNaN(amount) || amount <= 0) {
          entryErrors.amount_received = 'Amount must be a positive number'
        } else {
          entry.amount_received = amount
        }
      }

      if (entry.balance_remaining !== undefined) {
        const balance = parseFloat(entry.balance_remaining)
        if (isNaN(balance) || balance < 0) {
          entryErrors.balance_remaining = 'Balance cannot be negative'
        } else {
          entry.balance_remaining = balance
        }
      } else {
        entry.balance_remaining = 0
      }

      // Validate payment method
      const validPaymentMethods = ['cash', 'card', 'upi', 'bank_transfer', 'cheque']
      if (entry.payment_method && !validPaymentMethods.includes(entry.payment_method)) {
        entryErrors.payment_method = 'Invalid payment method'
      }

      // Validate payment status
      const validPaymentStatuses = ['completed', 'partial', 'pending']
      if (entry.payment_status && !validPaymentStatuses.includes(entry.payment_status)) {
        entryErrors.payment_status = 'Invalid payment status'
      }

      // Validate date format
      if (entry.payment_date) {
        const date = new Date(entry.payment_date)
        if (isNaN(date.getTime())) {
          entryErrors.payment_date = 'Invalid date format'
        } else {
          // Extract month and year from payment_date if not provided
          if (!entry.fee_month) {
            entry.fee_month = date.getMonth() + 1
          }
          if (!entry.fee_year) {
            entry.fee_year = date.getFullYear()
          }
        }
      }

      // Validate month and year if provided
      if (entry.fee_month !== undefined) {
        const month = parseInt(entry.fee_month)
        if (isNaN(month) || month < 1 || month > 12) {
          entryErrors.fee_month = 'Month must be between 1 and 12'
        } else {
          entry.fee_month = month
        }
      }

      if (entry.fee_year !== undefined) {
        const year = parseInt(entry.fee_year)
        if (isNaN(year) || year < 2020 || year > 2030) {
          entryErrors.fee_year = 'Year must be between 2020 and 2030'
        } else {
          entry.fee_year = year
        }
      }

      if (Object.keys(entryErrors).length > 0) {
        validationErrors.push({ index: i, errors: entryErrors })
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed for some entries',
          validationErrors
        },
        { status: 400 }
      )
    }

    // Process the bulk creation
    const result = await bulkCreateFeePayments(entries)

    const response: BulkFeeEntryResponse = {
      success: result.success,
      created: result.created,
      errors: result.errors,
      summary: result.summary
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error processing bulk fee entries:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process bulk fee entries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
