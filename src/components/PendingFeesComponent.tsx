'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertCircle, CreditCard, Search, Phone, Calendar } from 'lucide-react'
import { Student } from '@/types/database'
import { shareOnWhatsApp, generateReminderMessage, formatPhoneNumber, isValidWhatsAppNumber, isWhatsAppTabOpen } from '@/utils/whatsapp'
import { EnhancedImage } from './ChildDetailsComponent'

interface PendingFeeStudent extends Student {
  totalPaid: number
  totalPending: number
  lastPaymentDate?: string
  lastPaymentAmount?: number
  pendingMonth?: number
  pendingYear?: number
  pendingReason?: string
}

export default function PendingFeesComponent() {
  const [pendingStudents, setPendingStudents] = useState<PendingFeeStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [showQuickPayment, setShowQuickPayment] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [showMonthFilter, setShowMonthFilter] = useState(false)

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const fetchPendingFees = async () => {
    setLoading(true)
    try {
      let url = '/api/pending-fees'
      if (showMonthFilter) {
        url += `?month=${selectedMonth}&year=${selectedYear}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch pending fees')
      const studentsWithPending: PendingFeeStudent[] = await response.json()
      setPendingStudents(studentsWithPending)
    } catch (error) {
      console.error('Error fetching pending fees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingFees()
  }, [selectedMonth, selectedYear, showMonthFilter])

  const filteredStudents = pendingStudents.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.father_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.mother_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesClass = !classFilter || 
                        (student.class?.name.toLowerCase().includes(classFilter.toLowerCase()))
    
    return matchesSearch && matchesClass
  })

  const handleQuickPayment = (studentId: string) => {
    setShowQuickPayment(studentId)
  }

  const sendWhatsAppReminder = (student: PendingFeeStudent, phoneNumber: string, parentType: 'father' | 'mother') => {
    if (!isValidWhatsAppNumber(phoneNumber)) {
      alert(`Invalid ${parentType}'s phone number for WhatsApp sharing`)
      return
    }

    try {
      const message = generateReminderMessage({
        studentName: student.student_name,
        className: student.class?.name,
        classSection: student.class?.section,
        pendingAmount: student.totalPending,
        lastPaymentAmount: student.lastPaymentAmount,
        lastPaymentDate: student.lastPaymentDate ? format(new Date(student.lastPaymentDate), 'dd/MM/yyyy') : undefined
      })

      // Check if WhatsApp is already open
      const wasAlreadyOpen = isWhatsAppTabOpen()

      shareOnWhatsApp({
        phoneNumber,
        message
      })

      // Provide user feedback
      const parentName = parentType === 'father' ? student.father_name : student.mother_name
      const feedbackMessage = wasAlreadyOpen
        ? `Fee reminder sent to ${parentName} (${parentType}) - message loaded in existing WhatsApp tab`
        : `Fee reminder sent to ${parentName} (${parentType}) - WhatsApp opened in new tab`

      console.log(feedbackMessage)
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error)
      alert(`Failed to send WhatsApp reminder to ${parentType}. Please try again.`)
    }
  }

  const totalPendingAmount = filteredStudents.reduce((sum, student) => sum + student.totalPending, 0)

  return (
    <div className="min-h-screen bg-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertCircle className="w-6 h-6 text-black flex-shrink-0" />
            <div>
              <h3 className="text-lg lg:text-xl font-medium text-black">
                Pending Fees Summary
                {showMonthFilter && (
                  <span className="block sm:inline text-sm font-normal sm:ml-2 mt-1 sm:mt-0">
                    for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </span>
                )}
              </h3>
              <p className="text-gray-700 text-sm lg:text-base">
                {filteredStudents.length} students have pending fees totaling ₹{totalPendingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Month/Year Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <button
                onClick={() => setShowMonthFilter(!showMonthFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors text-sm ${
                  showMonthFilter
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {showMonthFilter ? 'Show All Pending' : 'Filter by Month'}
              </button>

              {showMonthFilter && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black text-sm"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name or parent name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <input
            type="text"
            placeholder="Filter by class..."
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
          />
        </div>
      </div>

      {/* Pending Students List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-color-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading pending fees...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {pendingStudents.length === 0 
                ? "Great! No students have pending fees." 
                : "No students found matching your search criteria."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300">
                            <EnhancedImage
                              src={student.student_photo_url}
                              alt={student.student_name}
                              className="w-full h-full object-cover"
                              fallbackIcon={
                                <div className="w-full h-full bg-amber-200 flex items-center justify-center">
                                  <AlertCircle className="w-6 h-6 text-amber-600" />
                                </div>
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                          <div className="text-sm text-gray-500">
                            Father: {student.father_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Mother: {student.mother_name}
                          </div>
                          {student.pendingReason && (
                            <div className="text-xs text-color-accent-600 mt-1 bg-color-accent-50 px-2 py-1 rounded">
                              {student.pendingReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.class ? `${student.class.name} ${student.class.section}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{student.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-color-accent-600">
                        ₹{student.totalPending.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.lastPaymentDate ? (
                        <div>
                          <div>₹{student.lastPaymentAmount?.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(student.lastPaymentDate), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No payments</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {student.father_mobile && (
                          <div className="text-xs">F: {formatPhoneNumber(student.father_mobile)}</div>
                        )}
                        {student.mother_mobile && (
                          <div className="text-xs">M: {formatPhoneNumber(student.mother_mobile)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleQuickPayment(student.id)}
                          className="text-black hover:text-gray-600 flex items-center gap-1 text-xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          Collect
                        </button>

                        {/* WhatsApp Reminder Buttons */}
                        <div className="flex flex-col gap-1">
                          {student.father_mobile && isValidWhatsAppNumber(student.father_mobile) && (
                            <button
                              onClick={() => sendWhatsAppReminder(student, student.father_mobile!, 'father')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                              title={`Send fee reminder to ${student.father_name} (Father) - ${formatPhoneNumber(student.father_mobile!)}`}
                            >
                              <Phone className="w-3 h-3" />
                              Father
                            </button>
                          )}
                          {student.mother_mobile && isValidWhatsAppNumber(student.mother_mobile) && (
                            <button
                              onClick={() => sendWhatsAppReminder(student, student.mother_mobile!, 'mother')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                              title={`Send fee reminder to ${student.mother_name} (Mother) - ${formatPhoneNumber(student.mother_mobile!)}`}
                            >
                              <Phone className="w-3 h-3" />
                              Mother
                            </button>
                          )}
                          {(!student.father_mobile || !isValidWhatsAppNumber(student.father_mobile)) &&
                           (!student.mother_mobile || !isValidWhatsAppNumber(student.mother_mobile)) && (
                            <span className="text-gray-400 text-xs italic">No valid WhatsApp numbers</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Payment Modal */}
      {showQuickPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Fee Collection</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will redirect you to the fee collection form with the student pre-selected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Here you would typically navigate to the fee collection tab with the student pre-selected
                  // For now, we'll just close the modal
                  setShowQuickPayment(null)
                  // You could also emit an event or use a callback to switch tabs
                }}
                className="flex-1 bg-color-primary text-white py-2 px-4 rounded-md hover:bg-color-secondary"
              >
                Go to Collection
              </button>
              <button
                onClick={() => setShowQuickPayment(null)}
                className="flex-1 bg-color-neutral-300 text-color-neutral-700 py-2 px-4 rounded-md hover:bg-color-neutral-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </div>
  )
}
