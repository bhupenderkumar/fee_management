import { NextRequest, NextResponse } from 'next/server'
import { getStudentsWithPendingFees, getPaymentSummary } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const summary = searchParams.get('summary') === 'true'
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (summary) {
      const summaryData = await getPaymentSummary()
      return NextResponse.json(summaryData)
    } else if (month && year) {
      // Get students with pending fees for specific month/year
      const pendingStudents = await getStudentsWithPendingFeesForMonth(parseInt(month), parseInt(year))
      return NextResponse.json(pendingStudents)
    } else {
      const pendingStudents = await getStudentsWithPendingFees()
      return NextResponse.json(pendingStudents)
    }
  } catch (error) {
    console.error('Error fetching pending fees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending fees' },
      { status: 500 }
    )
  }
}

async function getStudentsWithPendingFeesForMonth(month: number, year: number) {
  // Get ALL students from IDCard table
  const { data: allStudents, error: studentsError } = await supabase
    .schema('school')
    .from('IDCard')
    .select(`
      *,
      class:Class(name, section)
    `)

  if (studentsError) throw studentsError

  // Get ALL payments
  const { data: allPayments, error: paymentsError } = await supabase
    .from('fee_payments')
    .select('*')

  if (paymentsError) throw paymentsError

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

  // Create set of students who have completed payments for this month
  const studentsWithCompletedPayments = new Set(
    completedPaymentsThisMonth.map(payment => payment.student_id)
  )

  // Group all payments by student_id
  const paymentsByStudent = new Map()
  allPayments?.forEach(payment => {
    if (!paymentsByStudent.has(payment.student_id)) {
      paymentsByStudent.set(payment.student_id, [])
    }
    paymentsByStudent.get(payment.student_id).push(payment)
  })

  // Return ALL students MINUS those with completed payments for this specific month
  const pendingStudents = (allStudents || [])
    .filter(student => !studentsWithCompletedPayments.has(student.id))
    .map(student => {
      const studentPayments = paymentsByStudent.get(student.id) || []

      // Get payment for this specific month using payment_date
      const monthPayment = studentPayments.find((payment: any) => {
        const paymentDate = new Date(payment.payment_date)
        return paymentDate.getMonth() + 1 === month &&
               paymentDate.getFullYear() === year
      })

      // Calculate totals from all payments
      const totalPaid = studentPayments.reduce((sum: number, payment: { amount_received: string | number }) =>
        sum + (parseFloat(payment.amount_received.toString()) || 0), 0)

      // Get last payment
      const lastPayment = studentPayments.sort((a: { payment_date: string }, b: { payment_date: string }) =>
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

  return pendingStudents
}
