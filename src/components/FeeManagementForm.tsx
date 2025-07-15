'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Student } from '@/types/database'
import { getClassesWithNames, getStudentsByClass, createFeePayment } from '@/lib/database'
import { CreditCard, Calendar, DollarSign, FileText, Share2 } from 'lucide-react'
import { shareOnWhatsApp, generateReceiptMessage, formatPhoneNumber, isValidWhatsAppNumber } from '@/utils/whatsapp'
import ChildDetailsComponent from './ChildDetailsComponent'

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
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
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
    setLoadingClasses(true)
    try {
      const classData = await getClassesWithNames()
      setClasses(classData)
    } catch (error) {
      console.error('Error loading classes:', error)
      alert('Failed to load classes. Please refresh the page.')
    } finally {
      setLoadingClasses(false)
    }
  }

  const loadStudents = async (className: string) => {
    setLoadingStudents(true)
    try {
      const studentData = await getStudentsByClass(className)
      setStudents(studentData)
    } catch (error) {
      console.error('Error loading students:', error)
      alert('Failed to load students. Please try selecting the class again.')
      setStudents([])
    } finally {
      setLoadingStudents(false)
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

  const handleWhatsAppShare = (phoneNumber: string, parentType: 'father' | 'mother') => {
    if (receiptUrl && selectedStudent && isValidWhatsAppNumber(phoneNumber)) {
      const message = generateReceiptMessage({
        studentName: selectedStudent.student_name,
        receiptUrl: receiptUrl
      })

      shareOnWhatsApp({
        phoneNumber,
        message
      })
    } else {
      alert('Invalid phone number or missing receipt information')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Class Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Select Class
          </label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setValue('student_id', '')
              }}
              disabled={loadingClasses}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="" className="text-gray-500">
                {loadingClasses ? 'Loading classes...' : 'Choose a class...'}
              </option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id} className="text-black">
                  {classItem.name} - {classItem.section}
                </option>
              ))}
            </select>
            {loadingClasses && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              </div>
            )}
          </div>
        </div>

        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Select Student
          </label>
          <div className="relative">
            <select
              {...register('student_id')}
              disabled={!selectedClass || loadingStudents}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 bg-white text-black disabled:cursor-not-allowed"
            >
              <option value="" className="text-gray-500">
                {loadingStudents ? 'Loading students...' : !selectedClass ? 'Select a class first...' : 'Choose a student...'}
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id} className="text-black">
                  {student.student_name} - {student.father_name}
                </option>
              ))}
            </select>
            {loadingStudents && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              </div>
            )}
          </div>
          {errors.student_id && (
            <p className="mt-1 text-sm text-black">{errors.student_id.message}</p>
          )}
        </div>

        {/* Student Details Display */}
        {selectedStudent && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium text-black mb-4">Student Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-center md:justify-start">
                <ChildDetailsComponent
                  student={{
                    ...selectedStudent,
                    class: selectedClassInfo ? { name: selectedClassInfo.name, section: selectedClassInfo.section } : undefined
                  }}
                  size="medium"
                  showParents={true}
                  showBasicInfo={true}
                  variant="card"
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Father Mobile:</span> {selectedStudent.father_mobile || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Mother Mobile:</span> {selectedStudent.mother_mobile || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Amount Received
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount_received', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black placeholder-gray-500"
              placeholder="0.00"
            />
            {errors.amount_received && (
              <p className="mt-1 text-sm text-black">{errors.amount_received.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Payment Date
            </label>
            <input
              type="date"
              {...register('payment_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
            />
            {errors.payment_date && (
              <p className="mt-1 text-sm text-black">{errors.payment_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              <CreditCard className="inline w-4 h-4 mr-1" />
              Payment Method
            </label>
            <select
              {...register('payment_method')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
            >
              <option value="cash" className="text-black">Cash</option>
              <option value="card" className="text-black">Card</option>
              <option value="upi" className="text-black">UPI</option>
              <option value="bank_transfer" className="text-black">Bank Transfer</option>
              <option value="cheque" className="text-black">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Balance Remaining
            </label>
            <input
              type="number"
              step="0.01"
              {...register('balance_remaining', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black placeholder-gray-500"
              placeholder="0.00"
            />
            {errors.balance_remaining && (
              <p className="mt-1 text-sm text-black">{errors.balance_remaining.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Payment Status
            </label>
            <select
              {...register('payment_status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
            >
              <option value="completed" className="text-black">Completed</option>
              <option value="partial" className="text-black">Partial</option>
              <option value="pending" className="text-black">Pending</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Additional Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-black placeholder-gray-500"
            placeholder="Any additional notes about the payment..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Record Payment & Generate Receipt'}
        </button>
      </form>

      {/* Receipt Generated */}
      {receiptUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-black mb-4">
            Receipt Generated Successfully!
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Receipt URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={receiptUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(receiptUrl)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                <FileText className="w-4 h-4" />
                View Receipt
              </a>

              {/* WhatsApp Share Buttons */}
              {selectedStudent && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-black">Share on WhatsApp:</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {selectedStudent.father_mobile && isValidWhatsAppNumber(selectedStudent.father_mobile) && (
                      <button
                        onClick={() => handleWhatsAppShare(selectedStudent.father_mobile!, 'father')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex-1"
                      >
                        <Share2 className="w-4 h-4" />
                        Father ({formatPhoneNumber(selectedStudent.father_mobile)})
                      </button>
                    )}
                    {selectedStudent.mother_mobile && isValidWhatsAppNumber(selectedStudent.mother_mobile) && (
                      <button
                        onClick={() => handleWhatsAppShare(selectedStudent.mother_mobile!, 'mother')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex-1"
                      >
                        <Share2 className="w-4 h-4" />
                        Mother ({formatPhoneNumber(selectedStudent.mother_mobile)})
                      </button>
                    )}
                    {!selectedStudent.father_mobile && !selectedStudent.mother_mobile && (
                      <p className="text-sm text-gray-600 italic">No mobile numbers available for WhatsApp sharing</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
