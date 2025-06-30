import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '6') // Default to June
    const year = parseInt(searchParams.get('year') || '2025') // Default to 2025

    // Get ALL students
    const { data: allStudents, error: studentsError } = await supabase
      .schema('school')
      .from('IDCard')
      .select(`
        id,
        student_name,
        father_name,
        mother_name,
        father_mobile,
        mother_mobile,
        class:Class(name, section)
      `)

    if (studentsError) {
      console.error('Students error:', studentsError)
      throw studentsError
    }

    // Get ALL payments
    const { data: allPayments, error: allPaymentsError } = await supabase
      .schema('school')
      .from('fee_payments')
      .select('*')

    if (allPaymentsError) {
      console.error('All payments error:', allPaymentsError)
      throw allPaymentsError
    }

    // Filter payments for the specific month/year with completed status and zero balance
    const completedPaymentsThisMonth = (allPayments || []).filter(payment => {
      const paymentDate = new Date(payment.payment_date)
      const paymentMonth = paymentDate.getMonth() + 1
      const paymentYear = paymentDate.getFullYear()

      return paymentMonth === month &&
             paymentYear === year &&
             payment.payment_status === 'completed' &&
             payment.balance_remaining === 0
    })

    // Create set of students who have completed payments
    const completedStudentIds = new Set(
      completedPaymentsThisMonth.map(payment => payment.student_id)
    )

    // Group payments by student_id
    const paymentsByStudent = new Map()
    allPayments?.forEach(payment => {
      if (!paymentsByStudent.has(payment.student_id)) {
        paymentsByStudent.set(payment.student_id, [])
      }
      paymentsByStudent.get(payment.student_id).push(payment)
    })

    // Return ALL students MINUS those with completed payments for this month
    const pendingStudents = (allStudents || [])
      .filter(student => !completedStudentIds.has(student.id))
      .map(student => {
        const studentPayments = paymentsByStudent.get(student.id) || []
        
        // Get payment for this specific month using payment_date
        const monthPayment = studentPayments.find((payment: any) => {
          const paymentDate = new Date(payment.payment_date)
          return paymentDate.getMonth() + 1 === month &&
                 paymentDate.getFullYear() === year
        })

        // Calculate totals
        const totalPaid = studentPayments.reduce((sum: number, payment: any) =>
          sum + (parseFloat(payment.amount_received) || 0), 0)

        // Get last payment
        const lastPayment = studentPayments.sort((a: any, b: any) =>
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        )[0]

        return {
          ...student,
          totalPaid,
          totalPending: monthPayment ? parseFloat(monthPayment.balance_remaining) : 1000,
          lastPaymentDate: lastPayment?.payment_date,
          lastPaymentAmount: lastPayment ? parseFloat(lastPayment.amount_received) : null,
          pendingMonth: month,
          pendingYear: year,
          pendingReason: !monthPayment 
            ? `No payment record for ${month}/${year}` 
            : `Outstanding balance: ₹${monthPayment.balance_remaining}`
        }
      })

    return NextResponse.json({
      month,
      year,
      totalStudents: allStudents?.length || 0,
      completedPayments: completedPaymentsThisMonth?.length || 0,
      pendingStudents: pendingStudents.length,
      students: pendingStudents
    })

  } catch (error) {
    console.error('Error in test-pending:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending fees', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
