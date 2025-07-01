'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Student } from '@/types/database'
import { getClassesWithNames, getStudentsByClass, createFeePayment } from '@/lib/database'
import { CreditCard, Calendar, DollarSign, FileText, Share2 } from 'lucide-react'

const feePaymentSchema = z.object({
  student_id: z.string().min(1, 'Please select a student'),
  amount_received: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque']),
  balance_remaining: z.number().min(0, 'Balance cannot be negative'),
  payment_status: z.enum(['completed', 'partial', 'pending']),
  notes: z.string().optional(),
})

type FeePaymentForm = z.infer<typeof feePaymentSchema>

export default function FeeManagementForm() {
  const [classes, setClasses] = useState<{id: string, name: string, section: string}[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FeePaymentForm>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      payment_status: 'completed',
      balance_remaining: 0,
    }
  })

  const selectedStudentId = watch('student_id')
  const selectedStudent = students.find(s => s.id === selectedStudentId)
  const selectedClassInfo = classes.find(c => c.id === selectedClass)

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudents(selectedClass)
    }
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const classData = await getClassesWithNames()
      setClasses(classData)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadStudents = async (className: string) => {
    try {
      const studentData = await getStudentsByClass(className)
      setStudents(studentData)
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const onSubmit = async (data: FeePaymentForm) => {
    setLoading(true)
    try {
      const payment = await createFeePayment(data)
      setReceiptUrl(`${window.location.origin}${payment.receipt_url}`)
      reset()
      setSelectedClass('')
      setStudents([])
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Error creating payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const shareOnWhatsApp = () => {
    if (receiptUrl && selectedStudent) {
      const message = `Fee Receipt - ${selectedStudent.student_name}\n\nDear Parent,\n\nYour fee payment has been recorded. Please view and download your receipt:\n\n${receiptUrl}\n\nThank you!\n${process.env.NEXT_PUBLIC_SCHOOL_NAME || 'First Step School'}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Class Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setValue('student_id', '')
            }}
            className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900"
          >
            <option value="" className="text-color-neutral-500">Choose a class...</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id} className="text-gray-900">
                {classItem.name} - {classItem.section}
              </option>
            ))}
          </select>
        </div>

        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Student
          </label>
          <select
            {...register('student_id')}
            disabled={!selectedClass}
            className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary disabled:bg-color-neutral-100 bg-white text-color-neutral-900"
          >
            <option value="" className="text-color-neutral-500">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id} className="text-gray-900">
                {student.student_name} - {student.father_name}
              </option>
            ))}
          </select>
          {errors.student_id && (
            <p className="mt-1 text-sm text-red-600">{errors.student_id.message}</p>
          )}
        </div>

        {/* Student Details Display */}
        {selectedStudent && (
          <div className="bg-color-primary-50 p-4 rounded-lg">
            <h3 className="font-medium text-color-primary-900 mb-2">Student Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Student:</span> {selectedStudent.student_name}
              </div>
              <div>
                <span className="font-medium">Class:</span> {selectedClassInfo ? `${selectedClassInfo.name} - ${selectedClassInfo.section}` : selectedStudent.class_id}
              </div>
              <div>
                <span className="font-medium">Father:</span> {selectedStudent.father_name}
              </div>
              <div>
                <span className="font-medium">Mother:</span> {selectedStudent.mother_name}
              </div>
              <div>
                <span className="font-medium">Father Mobile:</span> {selectedStudent.father_mobile || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Mother Mobile:</span> {selectedStudent.mother_mobile || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Amount Received
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount_received', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900 placeholder-color-neutral-500"
              placeholder="0.00"
            />
            {errors.amount_received && (
              <p className="mt-1 text-sm text-red-600">{errors.amount_received.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Payment Date
            </label>
            <input
              type="date"
              {...register('payment_date')}
              className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900"
            />
            {errors.payment_date && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="inline w-4 h-4 mr-1" />
              Payment Method
            </label>
            <select
              {...register('payment_method')}
              className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900"
            >
              <option value="cash" className="text-color-neutral-900">Cash</option>
              <option value="card" className="text-gray-900">Card</option>
              <option value="upi" className="text-gray-900">UPI</option>
              <option value="bank_transfer" className="text-gray-900">Bank Transfer</option>
              <option value="cheque" className="text-gray-900">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Balance Remaining
            </label>
            <input
              type="number"
              step="0.01"
              {...register('balance_remaining', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900 placeholder-color-neutral-500"
              placeholder="0.00"
            />
            {errors.balance_remaining && (
              <p className="mt-1 text-sm text-red-600">{errors.balance_remaining.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              {...register('payment_status')}
              className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900"
            >
              <option value="completed" className="text-color-neutral-900">Completed</option>
              <option value="partial" className="text-gray-900">Partial</option>
              <option value="pending" className="text-gray-900">Pending</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Additional Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary bg-white text-color-neutral-900 placeholder-color-neutral-500"
            placeholder="Any additional notes about the payment..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-color-primary text-white py-3 px-4 rounded-md hover:bg-color-secondary focus:outline-none focus:ring-2 focus:ring-color-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Record Payment & Generate Receipt'}
        </button>
      </form>

      {/* Receipt Generated */}
      {receiptUrl && (
        <div className="bg-color-primary-50 border border-color-primary-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-color-primary-900 mb-4">
            Receipt Generated Successfully!
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Receipt URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={receiptUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-color-primary-300 rounded-md bg-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(receiptUrl)}
                  className="px-4 py-2 bg-color-primary text-white rounded-md hover:bg-color-secondary"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-color-primary text-white rounded-md hover:bg-color-secondary"
              >
                <FileText className="w-4 h-4" />
                View Receipt
              </a>
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-color-primary text-white rounded-md hover:bg-color-secondary"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
