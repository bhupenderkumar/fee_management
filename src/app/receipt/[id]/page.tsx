import { notFound } from 'next/navigation'

import { getFeePaymentByReceiptUrl } from '@/lib/database'
import { FeePayment } from '@/types/database'
import ReceiptComponent from '@/components/ReceiptComponent'

interface ReceiptPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params
  const receiptUrl = `/receipt/${id}`
  
  let payment: FeePayment | null = null
  
  try {
    payment = await getFeePaymentByReceiptUrl(receiptUrl)
  } catch (error) {
    console.error('Error fetching payment:', error)
  }

  if (!payment || !payment.student) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <ReceiptComponent payment={payment as FeePayment & { student: NonNullable<FeePayment['student']> }} />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: ReceiptPageProps) {
  const { id } = await params
  const receiptUrl = `/receipt/${id}`
  
  try {
    const payment = await getFeePaymentByReceiptUrl(receiptUrl)
    
    if (!payment || !payment.student) {
      return {
        title: 'Receipt Not Found',
      }
    }

    return {
      title: `Fee Receipt - ${payment.student.student_name} | ${process.env.NEXT_PUBLIC_SCHOOL_NAME || 'First Step School'}`,
      description: `Fee payment receipt for ${payment.student.student_name} - Amount: ₹${payment.amount_received}`,
    }
  } catch {
    return {
      title: 'Receipt Not Found',
    }
  }
}
