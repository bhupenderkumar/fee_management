'use client'

import { useState } from 'react'
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Heart,
  AlertTriangle,
  CreditCard,

  CheckCircle,
  XCircle,
  IndianRupee
} from 'lucide-react'
import ChildDetailsComponent from './ChildDetailsComponent'

interface Student {
  id: string
  student_name: string
  father_name: string
  mother_name?: string
  class_id: string
  section?: string
  student_photo_url?: string
  father_photo_url?: string
  mother_photo_url?: string

  date_of_birth?: string
  gender?: string
  address?: string
  father_mobile?: string
  mother_mobile?: string
  email?: string
  blood_group?: string
  emergency_contact?: string
  previous_school?: string
  admission_date?: string
  fees_amount?: number
  transport_required?: boolean
  medical_conditions?: string
  fee_payments?: { id: string; amount_received: number; payment_date: string; payment_method: string; payment_status: string; balance_remaining: number }[]
  class?: {
    name: string
    section: string
  }
}

interface StudentDetailModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
}

export default function StudentDetailModal({ student, isOpen, onClose }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('personal')

  if (!isOpen || !student) return null

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate fee summary
  const feePayments = student.fee_payments || []
  const totalPaid = feePayments.reduce((sum, payment) => sum + (payment.amount_received || 0), 0)
  const totalPending = feePayments.reduce((sum, payment) => sum + (payment.balance_remaining || 0), 0)
  const lastPayment = feePayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact Info', icon: Phone },
    { id: 'academic', label: 'Academic Info', icon: GraduationCap },
    { id: 'fees', label: 'Fee Records', icon: CreditCard },
    { id: 'medical', label: 'Medical Info', icon: Heart }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-amber-100 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-900">{student.student_name}</h2>
                <p className="text-amber-700">Student ID: {student.id.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-amber-600 hover:text-amber-800 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Student and Parent Photos */}
              <div className="flex justify-center mb-6">
                <ChildDetailsComponent
                  student={student}
                  size="large"
                  showParents={true}
                  showBasicInfo={true}
                  variant="modal"
                  className="max-w-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{student.student_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(student.date_of_birth || '')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{calculateAge(student.date_of_birth || '')} years</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{student.gender || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Family Information</h3>
                  
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Father's Name</p>
                      <p className="font-medium">{student.father_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Mother's Name</p>
                      <p className="font-medium">{student.mother_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{student.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Father's Mobile</p>
                      <p className="font-medium">{student.father_mobile || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Mother's Mobile</p>
                      <p className="font-medium">{student.mother_mobile || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium">{student.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact</p>
                      <p className="font-medium">{student.emergency_contact || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Info Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Class</p>
                      <p className="font-medium">{student.class_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Section</p>
                      <p className="font-medium">{student.section || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Admission Date</p>
                      <p className="font-medium">{formatDate(student.admission_date || '')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Previous School</p>
                      <p className="font-medium">{student.previous_school || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Transport Required</p>
                      <p className="font-medium">{student.transport_required ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Information</h3>

              {/* Fee Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Total Paid</p>
                      <p className="text-xl font-bold text-green-800">₹{totalPaid.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Total Pending</p>
                      <p className="text-xl font-bold text-red-800">₹{totalPending.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Monthly Fee</p>
                      <p className="text-xl font-bold text-blue-800">₹{student.fees_amount?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Payment Info */}
              {lastPayment && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
                  <h4 className="font-medium text-amber-900 mb-2">Last Payment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-amber-600">Amount</p>
                      <p className="font-medium">₹{lastPayment.amount_received?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-amber-600">Date</p>
                      <p className="font-medium">{formatDate(lastPayment.payment_date)}</p>
                    </div>
                    <div>
                      <p className="text-amber-600">Method</p>
                      <p className="font-medium">{lastPayment.payment_method || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Payment History</h4>
                {feePayments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">Method</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {feePayments.map((payment, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{formatDate(payment.payment_date)}</td>
                            <td className="px-4 py-2">₹{payment.amount_received?.toLocaleString()}</td>
                            <td className="px-4 py-2">{payment.payment_method || 'N/A'}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payment.payment_status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.payment_status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-2">₹{payment.balance_remaining?.toLocaleString() || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No payment records found</p>
                )}
              </div>
            </div>
          )}

          {/* Medical Info Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>
                      <p className="font-medium">{student.blood_group || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Medical Conditions</p>
                      <p className="font-medium">{student.medical_conditions || 'None reported'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {student.medical_conditions && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Important Medical Information</h4>
                      <p className="text-yellow-700 mt-1">{student.medical_conditions}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
