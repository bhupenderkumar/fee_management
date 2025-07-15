'use client'

import { useState, useEffect } from 'react'
import { X, Save, User, Phone, Mail, MapPin, Calendar, GraduationCap, Heart } from 'lucide-react'
import { createStudent, updateStudent, getClassesWithNames, StudentFormData } from '@/lib/database'

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

  fees_amount?: number
  transport_required?: boolean
  medical_conditions?: string
  class?: {
    name: string
    section: string
  }
}

interface AddEditStudentModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function AddEditStudentModal({ student, isOpen, onClose, onSave }: AddEditStudentModalProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    student_name: '',
    father_name: '',
    mother_name: '',
    class_id: '',
    section: '',

    date_of_birth: '',
    gender: '',
    address: '',
    father_mobile: '',
    mother_mobile: '',
    email: '',
    blood_group: '',
    emergency_contact: '',
    previous_school: '',
    admission_date: '',
    fees_amount: 0,
    transport_required: false,
    medical_conditions: ''
  })

  const [classes, setClasses] = useState<{id: string, name: string, section: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('basic')

  const isEditing = !!student

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesData = await getClassesWithNames()
        setClasses(classesData)
      } catch (error) {
        console.error('Error fetching classes:', error)
      }
    }
    fetchClasses()
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (student) {
      setFormData({
        id: student.id,
        student_name: student.student_name || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        class_id: student.class_id || '',
        section: student.section || '',

        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        address: student.address || '',
        father_mobile: student.father_mobile || '',
        mother_mobile: student.mother_mobile || '',
        email: student.email || '',
        blood_group: student.blood_group || '',
        emergency_contact: student.emergency_contact || '',
        previous_school: student.previous_school || '',

        fees_amount: student.fees_amount || 0,
        transport_required: student.transport_required || false,
        medical_conditions: student.medical_conditions || ''
      })
    } else {
      // Reset form for new student
      setFormData({
        student_name: '',
        father_name: '',
        mother_name: '',
        class_id: '',
        section: '',

        date_of_birth: '',
        gender: '',
        address: '',
        father_mobile: '',
        mother_mobile: '',
        email: '',
        blood_group: '',
        emergency_contact: '',
        previous_school: '',
    
        fees_amount: 1000,
        transport_required: false,
        medical_conditions: ''
      })
    }
    setErrors({})
    setActiveTab('basic')
  }, [student, isOpen])

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.student_name.trim()) newErrors.student_name = 'Student name is required'
    if (!formData.father_name.trim()) newErrors.father_name = 'Father name is required'
    if (!formData.class_id) newErrors.class_id = 'Class is required'

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Phone validation
    if (formData.father_mobile && !/^\d{10}$/.test(formData.father_mobile.replace(/\D/g, ''))) {
      newErrors.father_mobile = 'Invalid phone number (10 digits required)'
    }
    if (formData.mother_mobile && !/^\d{10}$/.test(formData.mother_mobile.replace(/\D/g, ''))) {
      newErrors.mother_mobile = 'Invalid phone number (10 digits required)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await updateStudent(formData, 'Updated student information')
      } else {
        await createStudent(formData)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving student:', error)
      alert(`Failed to ${isEditing ? 'update' : 'create'} student: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'medical', label: 'Medical', icon: Heart }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-amber-100 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-900">
              {isEditing ? 'Edit Student' : 'Add New Student'}
            </h2>
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

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      value={formData.student_name}
                      onChange={(e) => handleInputChange('student_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.student_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter student's full name"
                    />
                    {errors.student_name && <p className="text-red-500 text-sm mt-1">{errors.student_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={isEditing ? `${formData.id?.slice(0, 8)}...` : 'Auto-generated'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      placeholder="Auto-generated on save"
                    />
                    <p className="text-gray-500 text-sm mt-1">Unique ID will be generated automatically</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Name *
                    </label>
                    <input
                      type="text"
                      value={formData.father_name}
                      onChange={(e) => handleInputChange('father_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.father_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter father's name"
                    />
                    {errors.father_name && <p className="text-red-500 text-sm mt-1">{errors.father_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      value={formData.mother_name}
                      onChange={(e) => handleInputChange('mother_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter mother's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Mobile
                    </label>
                    <input
                      type="tel"
                      value={formData.father_mobile}
                      onChange={(e) => handleInputChange('father_mobile', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.father_mobile ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter father's mobile number"
                    />
                    {errors.father_mobile && <p className="text-red-500 text-sm mt-1">{errors.father_mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Mobile
                    </label>
                    <input
                      type="tel"
                      value={formData.mother_mobile}
                      onChange={(e) => handleInputChange('mother_mobile', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.mother_mobile ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter mother's mobile number"
                    />
                    {errors.mother_mobile && <p className="text-red-500 text-sm mt-1">{errors.mother_mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact}
                      onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter emergency contact number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Academic Tab */}
            {activeTab === 'academic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class *
                    </label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => handleInputChange('class_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.class_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.section && `- ${cls.section}`}
                        </option>
                      ))}
                    </select>
                    {errors.class_id && <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section
                    </label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => handleInputChange('section', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter section"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => handleInputChange('admission_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Fee Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.fees_amount}
                      onChange={(e) => handleInputChange('fees_amount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter monthly fee amount"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous School
                    </label>
                    <input
                      type="text"
                      value={formData.previous_school}
                      onChange={(e) => handleInputChange('previous_school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter previous school name"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="transport_required"
                      checked={formData.transport_required}
                      onChange={(e) => handleInputChange('transport_required', e.target.checked)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <label htmlFor="transport_required" className="ml-2 block text-sm text-gray-900">
                      Transport Required
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Medical Tab */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={formData.blood_group}
                      onChange={(e) => handleInputChange('blood_group', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions / Allergies
                  </label>
                  <textarea
                    value={formData.medical_conditions}
                    onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter any medical conditions, allergies, or special requirements"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Add Student')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
