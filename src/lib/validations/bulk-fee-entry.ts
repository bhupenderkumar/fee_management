import { z } from 'zod'

// Individual fee entry validation schema
export const bulkFeeEntrySchema = z.object({
  student_id: z.string().min(1, 'Please select a student'),
  amount_received: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),
  balance_remaining: z.number().min(0, 'Balance cannot be negative'),
  payment_status: z.enum(['completed', 'partial', 'pending'], {
    errorMap: () => ({ message: 'Please select a valid payment status' })
  }),
  notes: z.string().optional(),
  fee_month: z.number().min(1).max(12).optional(),
  fee_year: z.number().min(2020).max(2030).optional(),
})

// Bulk fee entry request validation schema
export const bulkFeeEntryRequestSchema = z.object({
  entries: z.array(bulkFeeEntrySchema).min(1, 'At least one fee entry is required').max(100, 'Maximum 100 entries allowed per batch')
})

// Client-side validation schema with additional UI fields
export const bulkFeeEntryUISchema = bulkFeeEntrySchema.extend({
  id: z.string().optional(), // Temporary ID for UI management
  student_name: z.string().optional(), // For display purposes
  class_name: z.string().optional(), // For display purposes
  isValid: z.boolean().optional(),
  validationErrors: z.record(z.string()).optional(),
})

// Type inference from schemas
export type BulkFeeEntryFormData = z.infer<typeof bulkFeeEntrySchema>
export type BulkFeeEntryRequestData = z.infer<typeof bulkFeeEntryRequestSchema>
export type BulkFeeEntryUIData = z.infer<typeof bulkFeeEntryUISchema>

// Validation helper functions
export function validateBulkFeeEntry(entry: any): { isValid: boolean; errors: Record<string, string> } {
  try {
    bulkFeeEntrySchema.parse(entry)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

export function validateBulkFeeEntryRequest(request: any): { isValid: boolean; errors: string[] } {
  try {
    bulkFeeEntryRequestSchema.parse(request)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.errors.map(err => err.message) }
    }
    return { isValid: false, errors: ['Validation failed'] }
  }
}

// Helper function to calculate summary from entries
export function calculateBulkFeeEntrySummary(entries: BulkFeeEntryUIData[]): {
  totalEntries: number
  totalAmount: number
  validEntries: number
  invalidEntries: number
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>
  paymentStatusBreakdown: Record<string, { count: number; amount: number }>
} {
  const summary = {
    totalEntries: entries.length,
    totalAmount: 0,
    validEntries: 0,
    invalidEntries: 0,
    paymentMethodBreakdown: {} as Record<string, { count: number; amount: number }>,
    paymentStatusBreakdown: {} as Record<string, { count: number; amount: number }>
  }

  entries.forEach(entry => {
    // Count valid/invalid entries
    if (entry.isValid !== false) {
      summary.validEntries++
      summary.totalAmount += entry.amount_received || 0

      // Payment method breakdown
      const method = entry.payment_method
      if (method) {
        if (!summary.paymentMethodBreakdown[method]) {
          summary.paymentMethodBreakdown[method] = { count: 0, amount: 0 }
        }
        summary.paymentMethodBreakdown[method].count++
        summary.paymentMethodBreakdown[method].amount += entry.amount_received || 0
      }

      // Payment status breakdown
      const status = entry.payment_status
      if (status) {
        if (!summary.paymentStatusBreakdown[status]) {
          summary.paymentStatusBreakdown[status] = { count: 0, amount: 0 }
        }
        summary.paymentStatusBreakdown[status].count++
        summary.paymentStatusBreakdown[status].amount += entry.amount_received || 0
      }
    } else {
      summary.invalidEntries++
    }
  })

  return summary
}
