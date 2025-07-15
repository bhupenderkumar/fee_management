'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User
} from 'lucide-react'
import { 
  getAllStudents, 
  getClassesWithNames, 
  deleteStudent,
  StudentManagementParams,
  StudentFormData 
} from '@/lib/database'
import StudentDetailModal from './StudentDetailModal'
import AddEditStudentModal from './AddEditStudentModal'
import { EnhancedImage } from './ChildDetailsComponent'

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
  fee_payments?: any[]
  created_at?: string
  class?: {
    name: string
    section: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<{id: string, name: string, section: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [sortBy, setSortBy] = useState('student_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params: StudentManagementParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        class: selectedClass || undefined,
        sortBy,
        sortOrder
      }

      const response = await getAllStudents(params)
      setStudents(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error fetching students:', error)
      alert('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const classesData = await getClassesWithNames()
      setClasses(classesData)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [pagination.page, pagination.limit, searchTerm, selectedClass, sortBy, sortOrder])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle class filter
  const handleClassFilter = (classId: string) => {
    setSelectedClass(classId)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Handle view student details
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailModal(true)
  }

  // Handle add student
  const handleAddStudent = () => {
    setEditingStudent(null)
    setShowAddEditModal(true)
  }

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setShowAddEditModal(true)
  }

  // Handle delete student
  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student)
    setDeleteReason('')
    setShowDeleteModal(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingStudent || !deleteReason.trim()) {
      alert('Please provide a reason for deletion')
      return
    }

    setDeleting(true)
    try {
      await deleteStudent(deletingStudent.id, 'admin', deleteReason)
      setShowDeleteModal(false)
      setDeletingStudent(null)
      setDeleteReason('')
      fetchStudents()
      alert('Student deleted successfully')
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    } finally {
      setDeleting(false)
    }
  }

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
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-amber-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p className="ml-3 text-amber-800">Loading students...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-4">
      {/* Header */}
      <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-800" />
            <div>
              <h1 className="text-2xl font-bold text-amber-900">Student Management</h1>
              <p className="text-amber-700">Manage all student records and information</p>
            </div>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">Total Students</p>
              <p className="text-2xl font-bold text-black">{pagination.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <GraduationCap className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">Classes</p>
              <p className="text-2xl font-bold text-black">{classes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <User className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">Current Page</p>
              <p className="text-2xl font-bold text-black">{students.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <Filter className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">Filtered</p>
              <p className="text-2xl font-bold text-black">
                {selectedClass || searchTerm ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedClass}
              onChange={(e) => handleClassFilter(e.target.value)}
              className="px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- ${cls.section}`}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="student_name">Sort by Name</option>
              <option value="created_at">Sort by Date Added</option>
              <option value="class_id">Sort by Class</option>
              <option value="date_of_birth">Sort by Date of Birth</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students, parents..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider cursor-pointer hover:bg-amber-300"
                  onClick={() => handleSort('student_name')}
                >
                  Student Name {sortBy === 'student_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider cursor-pointer hover:bg-amber-300"
                  onClick={() => handleSort('created_at')}
                >
                  Date Added {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider cursor-pointer hover:bg-amber-300"
                  onClick={() => handleSort('class_id')}
                >
                  Class {sortBy === 'class_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Father Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-amber-300">
                          <EnhancedImage
                            src={student.student_photo_url}
                            alt={student.student_name}
                            className="w-full h-full object-cover"
                            fallbackIcon={
                              <div className="w-full h-full bg-amber-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-amber-800" />
                              </div>
                            }
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                        <div className="text-sm text-gray-500">{student.gender || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(student.created_at || new Date().toISOString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.class_id} {student.section && `- ${student.section}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.father_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {student.father_mobile && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{student.father_mobile}</span>
                        </div>
                      )}
                      {student.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[120px]">{student.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateAge(student.date_of_birth || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="text-amber-600 hover:text-amber-800"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">No students found</h3>
            <p className="text-amber-700">
              {searchTerm || selectedClass
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by adding your first student.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-amber-800">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} students
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-amber-200 text-amber-800 rounded hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-amber-800 text-white rounded">
                {pagination.page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 bg-amber-200 text-amber-800 rounded hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deletingStudent.student_name}</strong>?
              This action cannot be undone and will remove all associated records.
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Please provide a reason for deletion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!deleteReason.trim() || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {deleting ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedStudent(null)
        }}
      />

      {/* Add/Edit Student Modal */}
      <AddEditStudentModal
        student={editingStudent}
        isOpen={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false)
          setEditingStudent(null)
        }}
        onSave={() => {
          fetchStudents()
        }}
      />
    </div>
  )
}
