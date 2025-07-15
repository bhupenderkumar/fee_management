'use client'

import { format } from 'date-fns'
import { FeePayment } from '@/types/database'
import { Printer, Download, Share2 } from 'lucide-react'
import { shareOnWhatsApp, generateReceiptMessage, formatPhoneNumber, isValidWhatsAppNumber } from '@/utils/whatsapp'

interface ReceiptComponentProps {
  payment: FeePayment & { student: NonNullable<FeePayment['student']> }
}

export default function ReceiptComponent({ payment }: ReceiptComponentProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Fee Receipt - ${payment.student.student_name}`,
        text: `Fee payment receipt for ${payment.student.student_name}`,
        url: window.location.href,
      })
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert('Receipt URL copied to clipboard!')
    }
  }

  const handleWhatsAppShare = (phoneNumber: string, parentType: 'father' | 'mother') => {
    if (isValidWhatsAppNumber(phoneNumber)) {
      const message = generateReceiptMessage({
        studentName: payment.student.student_name,
        receiptUrl: window.location.href,
        amount: payment.amount_received,
        paymentDate: format(new Date(payment.payment_date), 'dd/MM/yyyy'),
        paymentMethod: payment.payment_method
      })

      shareOnWhatsApp({
        phoneNumber,
        message
      })
    } else {
      alert('Invalid phone number for WhatsApp sharing')
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-color-primary-600 bg-color-primary-100'
      case 'partial':
        return 'text-color-neutral-600 bg-color-neutral-100'
      case 'pending':
        return 'text-color-accent-600 bg-color-accent-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer'
      case 'upi':
        return 'UPI'
      default:
        return method.charAt(0).toUpperCase() + method.slice(1)
    }
  }

  return (
    <div className="bg-white min-h-screen lg:min-h-0">
      {/* Print/Share Actions - Hidden in print */}
      <div className="print:hidden mb-4 lg:mb-6 space-y-4">
        {/* Print and General Share */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm lg:text-base"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm lg:text-base"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* WhatsApp Share Buttons */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-sm font-medium text-black mb-3">Share Receipt on WhatsApp:</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {payment.student.father_mobile && isValidWhatsAppNumber(payment.student.father_mobile) && (
              <button
                onClick={() => handleWhatsAppShare(payment.student.father_mobile!, 'father')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm lg:text-base flex-1"
              >
                <Share2 className="w-4 h-4" />
                Send to Father ({formatPhoneNumber(payment.student.father_mobile)})
              </button>
            )}
            {payment.student.mother_mobile && isValidWhatsAppNumber(payment.student.mother_mobile) && (
              <button
                onClick={() => handleWhatsAppShare(payment.student.mother_mobile!, 'mother')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm lg:text-base flex-1"
              >
                <Share2 className="w-4 h-4" />
                Send to Mother ({formatPhoneNumber(payment.student.mother_mobile)})
              </button>
            )}
            {!payment.student.father_mobile && !payment.student.mother_mobile && (
              <p className="text-sm text-gray-600 italic">No mobile numbers available for WhatsApp sharing</p>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-4 lg:pb-6 mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-3xl font-bold text-black mb-2">
            {process.env.NEXT_PUBLIC_SCHOOL_NAME || 'First Step School'}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mb-1">
            {process.env.NEXT_PUBLIC_SCHOOL_ADDRESS || 'School Address'}
          </p>
          <p className="text-sm lg:text-base text-gray-600 mb-4">
            Website: {process.env.NEXT_PUBLIC_SCHOOL_WEBSITE || 'www.firststepschool.com'}
          </p>
          <h2 className="text-lg lg:text-xl font-semibold text-black">
            FEE PAYMENT RECEIPT
          </h2>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
          <div>
            <h3 className="text-base lg:text-lg font-semibold text-black mb-3">Receipt Information</h3>
            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt ID:</span>
                <span className="font-medium text-black">{payment.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium text-black">{format(new Date(payment.payment_date), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Generated On:</span>
                <span className="font-medium text-black">{format(new Date(payment.created_at), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base lg:text-lg font-semibold text-black mb-3">Payment Status</h3>
            <div className="space-y-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getPaymentStatusColor(payment.payment_status)}`}>
                {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6">
          <h3 className="text-base lg:text-lg font-semibold text-black mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Student Name:</span>
                <span className="font-medium text-black break-words">{payment.student.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium text-black">
                  {payment.student.class ? `${payment.student.class.name} - ${payment.student.class.section}` : payment.student.class_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Father's Name:</span>
                <span className="font-medium text-black break-words">{payment.student.father_name}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mother's Name:</span>
                <span className="font-medium text-black break-words">{payment.student.mother_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Father's Mobile:</span>
                <span className="font-medium text-black">{payment.student.father_mobile || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mother's Mobile:</span>
                <span className="font-medium">{payment.student.mother_mobile || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border border-gray-200 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm lg:text-base">Amount Received:</span>
              <span className="text-lg lg:text-2xl font-bold text-color-primary">₹{payment.amount_received.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm lg:text-base">Payment Method:</span>
              <span className="font-medium text-sm lg:text-base">{formatPaymentMethod(payment.payment_method)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm lg:text-base">Balance Remaining:</span>
              <span className={`font-medium text-sm lg:text-base ${payment.balance_remaining > 0 ? 'text-color-accent' : 'text-color-primary'}`}>
                ₹{payment.balance_remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="bg-color-primary-50 rounded-lg p-4 mb-4 lg:mb-6">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-2">Additional Notes</h3>
            <p className="text-gray-700 text-sm lg:text-base break-words">{payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 lg:pt-6 text-center">
          <p className="text-xs lg:text-sm text-gray-600 mb-2">
            This is a computer-generated receipt and does not require a signature.
          </p>
          <p className="text-xs lg:text-sm text-gray-600">
            For any queries, please contact the school office.
          </p>
          <div className="mt-4 text-xs text-gray-500 break-all">
            Receipt URL: {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
