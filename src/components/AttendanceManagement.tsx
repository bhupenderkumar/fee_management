'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Users, MessageSquare, CheckCircle, XCircle, Save, Send, Filter, Search, RotateCcw, UserCheck, UserX } from 'lucide-react'
import DatePicker from 'react-datepicker'
import { Student, Attendance } from '@/types/database'
import { EnhancedImage } from './ChildDetailsComponent'
import "react-datepicker/dist/react-datepicker.css"

interface StudentWithAttendance extends Student {
  attendance?: Attendance
}

interface AttendanceStats {
  totalStudents: number
  presentCount: number
  absentCount: number
  attendancePercentage: number
}

interface ClassInfo {
  id: string
  name: string
  section: string
}

export default function AttendanceManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [students, setStudents] = useState<StudentWithAttendance[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sendingMessages, setSendingMessages] = useState(false)

  // New state for class selection and filtering
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'PRESENT' | 'ABSENT' | 'unmarked'>('all')
  const [bulkAction, setBulkAction] = useState<'PRESENT' | 'ABSENT' | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  // Load classes on component mount
  useEffect(() => {
    loadClasses()
  }, [])

  // Load students with attendance for selected date and class
  useEffect(() => {
    loadStudentsWithAttendance()
  }, [selectedDate, selectedClass])

  // Filter students based on search term and attendance filter
  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, attendanceFilter])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes-with-names')
      if (!response.ok) throw new Error('Failed to fetch classes')
      const classesData = await response.json()
      setClasses(classesData)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadStudentsWithAttendance = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      let url = `/api/attendance/students?date=${dateStr}`
      if (selectedClass !== 'all') {
        url += `&class=${selectedClass}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch students')

      const studentsData = await response.json()
      setStudents(studentsData)

      // Load statistics
      const statsResponse = await fetch(`/api/attendance/statistics?date=${dateStr}${selectedClass !== 'all' ? `&class=${selectedClass}` : ''}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = students

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.father_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.mother_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by attendance status
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (attendanceFilter === 'unmarked') {
          return !student.attendance
        }
        return student.attendance?.status === attendanceFilter
      })
    }

    setFilteredStudents(filtered)
  }

  const handleAttendanceChange = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          attendance: {
            ...student.attendance,
            studentId: studentId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            status,
            createdBy: 'admin',
            id: student.attendance?.id || '',
            createdAt: student.attendance?.createdAt || '',
            updatedAt: student.attendance?.updatedAt || ''
          } as Attendance
        }
      }
      return student
    }))
  }

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(studentId)
      } else {
        newSet.delete(studentId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const applyBulkAction = (status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev => prev.map(student => {
      if (selectedStudents.has(student.id)) {
        return {
          ...student,
          attendance: {
            ...student.attendance,
            studentId: student.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            status,
            createdBy: 'admin',
            id: student.attendance?.id || '',
            createdAt: student.attendance?.createdAt || '',
            updatedAt: student.attendance?.updatedAt || ''
          } as Attendance
        }
      }
      return student
    }))
    setSelectedStudents(new Set())
  }

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({
      ...student,
      attendance: {
        ...student.attendance,
        studentId: student.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status: 'PRESENT' as const,
        createdBy: 'admin',
        id: student.attendance?.id || '',
        createdAt: student.attendance?.createdAt || '',
        updatedAt: student.attendance?.updatedAt || ''
      } as Attendance
    })))
  }

  const resetAttendance = () => {
    setStudents(prev => prev.map(student => ({
      ...student,
      attendance: undefined
    })))
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      const attendanceList = students.map(student => ({
        student_id: student.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status: student.attendance?.status || 'ABSENT',
        marked_by: 'admin'
      }))

      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendanceList }),
      })

      if (!response.ok) throw new Error('Failed to save attendance')

      alert('Attendance saved successfully!')
      await loadStudentsWithAttendance() // Reload to get updated data
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const sendMessagesToAbsentStudents = async () => {
    if (!messageText.trim()) {
      alert('Please enter a message to send')
      return
    }

    setSendingMessages(true)
    try {
      const absentStudents = students.filter(student => student.attendance?.status === 'ABSENT')
      
      if (absentStudents.length === 0) {
        alert('No absent students to send messages to')
        return
      }

      const messages = []
      for (const student of absentStudents) {
        // Send to father if available
        if (student.father_mobile) {
          messages.push({
            student_id: student.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            message_content: messageText,
            recipient_type: 'father',
            recipient_number: student.father_mobile
          })
        }
        
        // Send to mother if available and different from father
        if (student.mother_mobile && student.mother_mobile !== student.father_mobile) {
          messages.push({
            student_id: student.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            message_content: messageText,
            recipient_type: 'mother',
            recipient_number: student.mother_mobile
          })
        }
      }

      // Save messages (in a real app, you'd integrate with SMS service)
      for (const message of messages) {
        await fetch('/api/attendance/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
      }

      alert(`Messages queued for ${absentStudents.length} absent students`)
      setMessageText('')
    } catch (error) {
      console.error('Error sending messages:', error)
      alert('Failed to send messages')
    } finally {
      setSendingMessages(false)
    }
  }

  const presentCount = students.filter(s => s.attendance?.status === 'PRESENT').length
  const absentCount = students.filter(s => s.attendance?.status === 'ABSENT').length
  const unmarkedCount = students.filter(s => !s.attendance?.status).length

  return (
    <div className="min-h-screen bg-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-semibold text-black mb-2">Attendance Management</h2>
                <p className="text-gray-600">Mark attendance for students</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => date && setSelectedDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    maxDate={new Date()}
                  />
                </div>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">Search Students</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
              </div>

              {/* Attendance Filter */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">Filter by Status</label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                >
                  <option value="all">All Students</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="unmarked">Unmarked</option>
                </select>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">Quick Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={markAllPresent}
                    className="flex-1 px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                    disabled={loading}
                  >
                    <UserCheck className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={resetAttendance}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                    disabled={loading}
                  >
                    <RotateCcw className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-black" />
                <div className="ml-3">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-lg lg:text-2xl font-semibold text-black">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-black" />
                <div className="ml-3">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">Present</p>
                  <p className="text-lg lg:text-2xl font-semibold text-gray-900">{presentCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <XCircle className="w-6 h-6 lg:w-8 lg:h-8 text-color-accent" />
                <div className="ml-3">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">Absent</p>
                  <p className="text-lg lg:text-2xl font-semibold text-gray-900">{absentCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-color-neutral-500" />
                <div className="ml-3">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">Unmarked</p>
                  <p className="text-lg lg:text-2xl font-semibold text-gray-900">{unmarkedCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Bulk Actions and Save */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              <p className="text-sm text-gray-600">
                {selectedStudents.size > 0
                  ? `${selectedStudents.size} students selected`
                  : unmarkedCount > 0
                    ? `${unmarkedCount} students not marked yet`
                    : 'All students marked'
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {selectedStudents.size > 0 && (
                <>
                  <button
                    onClick={() => applyBulkAction('PRESENT')}
                    className="px-4 py-2 bg-color-primary text-white rounded-md hover:bg-color-secondary transition-colors text-sm"
                  >
                    Mark Selected Present
                  </button>
                  <button
                    onClick={() => applyBulkAction('ABSENT')}
                    className="px-4 py-2 bg-color-accent text-white rounded-md hover:bg-pink-600 transition-colors text-sm"
                  >
                    Mark Selected Absent
                  </button>
                </>
              )}

              <button
                onClick={saveAttendance}
                disabled={saving}
                className="px-4 py-2 bg-color-primary text-white rounded-md hover:bg-color-secondary disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 lg:p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Students</h3>
                <p className="text-sm text-gray-600">
                  {filteredStudents.length} of {students.length} students
                  {selectedClass !== 'all' && ` in selected class`}
                </p>
              </div>

              {filteredStudents.length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-color-neutral-300 text-color-primary focus:ring-color-primary"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 lg:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm || attendanceFilter !== 'all'
                    ? 'No students match your filters'
                    : 'No students found'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      student.attendance?.status === 'PRESENT'
                        ? 'border-color-primary-200 bg-color-primary-50'
                        : student.attendance?.status === 'ABSENT'
                        ? 'border-color-accent-200 bg-color-accent-50'
                        : 'border-color-neutral-200 bg-white hover:bg-color-neutral-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                          className="mt-1 rounded border-color-neutral-300 text-color-primary focus:ring-color-primary"
                        />
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-300">
                            <EnhancedImage
                              src={student.student_photo_url}
                              alt={student.student_name}
                              className="w-full h-full object-cover"
                              fallbackIcon={
                                <div className="w-full h-full bg-amber-200 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-amber-600" />
                                </div>
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm lg:text-base">{student.student_name}</h4>
                          <p className="text-xs lg:text-sm text-gray-600">
                            Class: {student.class?.name ? `${student.class.name} - ${student.class.section}` : student.class_id}
                          </p>
                          <p className="text-xs text-gray-500">Father: {student.father_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {student.attendance?.status === 'PRESENT' && (
                          <CheckCircle className="w-5 h-5 text-color-primary" />
                        )}
                        {student.attendance?.status === 'ABSENT' && (
                          <XCircle className="w-5 h-5 text-color-accent" />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                        className={`flex-1 px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                          student.attendance?.status === 'PRESENT'
                            ? 'bg-color-primary text-white'
                            : 'bg-color-neutral-100 text-color-neutral-700 hover:bg-color-primary-100 hover:text-color-primary'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 mx-auto lg:hidden" />
                        <span className="hidden lg:inline">Present</span>
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                        className={`flex-1 px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                          student.attendance?.status === 'ABSENT'
                            ? 'bg-color-accent text-white'
                            : 'bg-color-neutral-100 text-color-neutral-700 hover:bg-color-accent-100 hover:text-color-accent'
                        }`}
                      >
                        <XCircle className="w-4 h-4 mx-auto lg:hidden" />
                        <span className="hidden lg:inline">Absent</span>
                      </button>
                    </div>

                    {student.attendance?.status === 'ABSENT' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>📞 Father: {student.father_mobile || 'N/A'}</p>
                          <p>📞 Mother: {student.mother_mobile || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messaging Section */}
        {absentCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-color-primary" />
              <h3 className="text-lg font-medium text-gray-900">Send Message to Absent Students</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary text-sm"
                  placeholder="Enter message to send to parents of absent students..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Will send to {absentCount} absent students' parents
                </p>
                <button
                  onClick={sendMessagesToAbsentStudents}
                  disabled={sendingMessages || !messageText.trim()}
                  className="px-4 py-2 bg-color-primary text-white rounded-md hover:bg-color-secondary disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {sendingMessages ? 'Sending...' : 'Send Messages'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
