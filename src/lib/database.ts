import { supabaseAdmin } from './supabase'
import { Student, FeePayment, Attendance, AttendanceMessage } from '@/types/database'
import { cacheUtils } from './cache'

// Get class information with names
export async function getClassesWithNames(): Promise<{id: string, name: string, section: string}[]> {
  if (typeof window !== 'undefined') {
    // Client-side: Check cache first
    const cachedClasses = cacheUtils.getClassesWithNames()
    if (cachedClasses) {
      console.log('📦 Using cached classes with names')
      return cachedClasses
    }

    // Cache miss: fetch from API
    console.log('🌐 Fetching classes with names from API')
    const response = await fetch('/api/classes-with-names')
    if (!response.ok) throw new Error('Failed to fetch classes')
    const classes = await response.json()

    // Cache the result
    cacheUtils.setClassesWithNames(classes)
    return classes
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('Class')
      .select('id, name, section')
      .order('name, section')

    if (error) throw error

    return data || []
  }
}

// Client-side functions that use API routes
export async function getClasses(): Promise<string[]> {
  if (typeof window !== 'undefined') {
    // Client-side: Check cache first
    const cachedClasses = cacheUtils.getClasses()
    if (cachedClasses) {
      console.log('📦 Using cached classes')
      return cachedClasses
    }

    // Cache miss: fetch from API
    console.log('🌐 Fetching classes from API')
    const response = await fetch('/api/classes')
    if (!response.ok) throw new Error('Failed to fetch classes')
    const classes = await response.json()

    // Cache the result
    cacheUtils.setClasses(classes)
    return classes
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('class_id')
      .order('class_id')

    if (error) throw error

    // Get unique class names
    const uniqueClasses = [...new Set(data.map(item => item.class_id).filter(Boolean))]
    return uniqueClasses
  }
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  if (typeof window !== 'undefined') {
    // Client-side: Check cache first
    const cachedStudents = cacheUtils.getStudentsByClass(className)
    if (cachedStudents) {
      console.log(`📦 Using cached students for class: ${className}`)
      return cachedStudents
    }

    // Cache miss: fetch from API
    console.log(`🌐 Fetching students for class: ${className}`)
    const response = await fetch(`/api/students?class=${encodeURIComponent(className)}`)
    if (!response.ok) throw new Error('Failed to fetch students')
    const students = await response.json()

    // Cache the result
    cacheUtils.setStudentsByClass(className, students)
    return students
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('*')
      .eq('class_id', className)
      .order('student_name')

    if (error) throw error
    return data || []
  }
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  const { data, error } = await supabaseAdmin
    .schema('school')
    .from('IDCard')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw error
  }
  return data
}

// Fee payment operations
export async function createFeePayment(payment: Omit<FeePayment, 'id' | 'created_at' | 'updated_at' | 'receipt_url' | 'has_updates'>): Promise<FeePayment> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment),
    })
    if (!response.ok) throw new Error('Failed to create payment')
    return response.json()
  } else {
    // Server-side: direct database access
    const receiptId = crypto.randomUUID()
    const receiptUrl = `/receipt/${receiptId}`

    // Extract month and year from payment_date
    const paymentDate = new Date(payment.payment_date)
    const fee_month = paymentDate.getMonth() + 1
    const fee_year = paymentDate.getFullYear()

    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('fee_payments')
      .insert({
        ...payment,
        receipt_url: receiptUrl,
        fee_month,
        fee_year
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}

export async function updateFeePayment(
  id: string,
  updates: Partial<FeePayment>,
  updatedBy: string = 'system',
  updateReason?: string
): Promise<FeePayment> {
  const response = await fetch('/api/payments', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      ...updates,
      updated_by: updatedBy,
      update_reason: updateReason
    }),
  })

  if (!response.ok) throw new Error('Failed to update payment')

  // Clear related cache after successful update
  cacheUtils.clearStudentCache()

  return response.json()
}

export async function deleteFeePayment(
  id: string,
  deletedBy: string = 'admin',
  deleteReason: string
): Promise<{ message: string; deleted_record: FeePayment }> {
  const params = new URLSearchParams({
    id,
    deleted_by: deletedBy,
    delete_reason: deleteReason
  })

  const response = await fetch(`/api/payments?${params.toString()}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete payment')
  }

  // Clear related cache after successful deletion
  cacheUtils.clearStudentCache()

  return response.json()
}

export async function getFeePaymentByReceiptUrl(receiptUrl: string): Promise<FeePayment | null> {
  const { data, error } = await supabaseAdmin
    .schema('school')
    .from('fee_payments')
    .select(`
      *,
      student:IDCard(
        *,
        class:Class(name, section)
      )
    `)
    .eq('receipt_url', receiptUrl)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw error
  }
  return data
}

export async function getFeePaymentsByStudent(studentId: string): Promise<FeePayment[]> {
  const { data, error } = await supabaseAdmin
    .schema('school')
    .from('fee_payments')
    .select('*')
    .eq('student_id', studentId)
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAllFeePayments(): Promise<FeePayment[]> {
  const { data, error } = await supabaseAdmin
    .schema('school')
    .from('fee_payments')
    .select(`
      *,
      student:IDCard(*)
    `)
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getStudentsWithPendingFees(): Promise<(Student & { totalPaid: number; totalPending: number; lastPaymentDate?: string; lastPaymentAmount?: number; pendingMonth?: number; pendingYear?: number; pendingReason?: string })[]> {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Get ALL students from IDCard table
  const { data: allStudents, error: studentsError } = await supabaseAdmin
    .schema('school')
    .from('IDCard')
    .select(`
      *,
      class:Class(name, section)
    `)

  if (studentsError) throw studentsError

  // Get ALL payments
  const { data: allPayments, error: paymentsError } = await supabaseAdmin
    .schema('school')
    .from('fee_payments')
    .select('*')

  if (paymentsError) throw paymentsError

  // Filter payments for current month with completed status and zero balance
  const completedPaymentsThisMonth = (allPayments || []).filter(payment => {
    const paymentDate = new Date(payment.payment_date)
    const paymentMonth = paymentDate.getMonth() + 1
    const paymentYear = paymentDate.getFullYear()

    return paymentMonth === currentMonth &&
           paymentYear === currentYear &&
           payment.payment_status === 'completed' &&
           payment.balance_remaining === 0
  })

  // Create set of students who have completed payments for current month
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

  // Return ALL students MINUS those with completed payments for current month
  const studentsWithPending = (allStudents || [])
    .filter(student => !studentsWithCompletedPayments.has(student.id))
    .map(student => {
      const studentPayments = paymentsByStudent.get(student.id) || []

      // Calculate totals from all payments
      const totalPaid = studentPayments.reduce((sum: number, payment: FeePayment) =>
        sum + (payment.amount_received || 0), 0)

      const totalPending = studentPayments.reduce((sum: number, payment: FeePayment) =>
        sum + (payment.balance_remaining || 0), 0)

      // Get last payment
      const lastPayment = studentPayments.sort((a: FeePayment, b: FeePayment) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      )[0]

      // Check if student has payment for current month using payment_date
      const currentMonthPayment = studentPayments.find((payment: FeePayment) => {
        const paymentDate = new Date(payment.payment_date)
        return paymentDate.getMonth() + 1 === currentMonth &&
               paymentDate.getFullYear() === currentYear
      })

      // Calculate pending amount
      let pendingAmount = totalPending
      if (!currentMonthPayment) {
        pendingAmount += 1000 // Add default monthly fee if no payment for current month
      }

      return {
        ...student,
        totalPaid,
        totalPending: pendingAmount,
        lastPaymentDate: lastPayment?.payment_date,
        lastPaymentAmount: lastPayment ? parseFloat(lastPayment.amount_received) : null,
        pendingReason: !currentMonthPayment
          ? `No payment for ${currentMonth}/${currentYear}`
          : `Outstanding balance: ₹${totalPending}`
      }
    })

  return studentsWithPending
}

export async function getPaymentSummary(): Promise<{
  totalCollected: number
  totalPending: number
  totalStudents: number
  studentsWithPending: number
}> {
  const { data: payments, error: paymentsError } = await supabaseAdmin
    .schema('school')
    .from('fee_payments')
    .select('amount_received, balance_remaining')

  if (paymentsError) throw paymentsError

  const { data: students, error: studentsError } = await supabaseAdmin
    .schema('school')
    .from('IDCard')
    .select('id')

  if (studentsError) throw studentsError

  const totalCollected = payments?.reduce((sum, payment) => sum + payment.amount_received, 0) || 0
  const totalPending = payments?.reduce((sum, payment) => sum + payment.balance_remaining, 0) || 0

  // Count students with pending fees
  const studentsWithPending = await getStudentsWithPendingFees()
   
  return {
    totalCollected,
    totalPending,
    totalStudents: students?.length || 0,
    studentsWithPending: studentsWithPending.length
  }
}

// Attendance operations
export async function markAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Promise<Attendance> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData),
    })
    if (!response.ok) throw new Error('Failed to mark attendance')
    return response.json()
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('Attendance')
      .upsert(attendanceData, {
        onConflict: 'studentId,date',
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}

export async function bulkMarkAttendance(attendanceList: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]): Promise<Attendance[]> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attendanceList }),
    })
    if (!response.ok) throw new Error('Failed to mark bulk attendance')
    return response.json()
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('Attendance')
      .upsert(attendanceList, {
        onConflict: 'studentId,date',
        ignoreDuplicates: false
      })
      .select('*')

    if (error) throw error
    return data || []
  }
}

export async function getAttendanceByDate(date: string): Promise<Attendance[]> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`)
    if (!response.ok) throw new Error('Failed to fetch attendance')
    return response.json()
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('Attendance')
      .select(`
        *,
        student:IDCard(*)
      `)
      .eq('date', date)
      .order('createdAt', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export async function getStudentsWithAttendanceForDate(date: string, classId?: string | null): Promise<(Student & { attendance?: Attendance })[]> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    let url = `/api/attendance/students?date=${encodeURIComponent(date)}`
    if (classId) {
      url += `&class=${encodeURIComponent(classId)}`
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch students with attendance')
    return response.json()
  } else {
    // Server-side: direct database access
    let studentsQuery = supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select(`
        *,
        class:Class(name, section)
      `)
      .order('student_name')

    if (classId && classId !== 'all') {
      studentsQuery = studentsQuery.eq('class_id', classId)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) throw studentsError

    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .schema('school')
      .from('Attendance')
      .select('*')
      .eq('date', date)

    if (attendanceError) throw attendanceError

    // Merge students with their attendance data
    const studentsWithAttendance = students?.map(student => {
      const studentAttendance = attendance?.find(att => att.studentId === student.id)
      return {
        ...student,
        attendance: studentAttendance
      }
    }) || []

    return studentsWithAttendance
  }
}

export async function getAttendanceStatistics(date: string, classId?: string | null): Promise<{
  totalStudents: number
  presentCount: number
  absentCount: number
  attendancePercentage: number
}> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    let url = `/api/attendance/statistics?date=${encodeURIComponent(date)}`
    if (classId) {
      url += `&class=${encodeURIComponent(classId)}`
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch attendance statistics')
    return response.json()
  } else {
    // Server-side: direct database access
    let studentsQuery = supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('id', { count: 'exact' })

    if (classId && classId !== 'all') {
      studentsQuery = studentsQuery.eq('class_id', classId)
    }

    const { data: totalStudents, error: studentsError } = await studentsQuery

    if (studentsError) throw studentsError

    const attendanceQuery = supabaseAdmin
      .schema('school')
      .from('Attendance')
      .select('status, studentId')
      .eq('date', date)

    const { data: attendance, error: attendanceError } = await attendanceQuery

    if (attendanceError) throw attendanceError

    // If filtering by class, we need to filter attendance by students in that class
    let filteredAttendance = attendance || []
    if (classId && classId !== 'all') {
      const studentIds = totalStudents?.map(s => s.id) || []
      filteredAttendance = attendance?.filter(att => studentIds.includes(att.studentId)) || []
    }

    const total = totalStudents?.length || 0
    const presentCount = filteredAttendance.filter(att => att.status === 'present').length || 0
    const absentCount = filteredAttendance.filter(att => att.status === 'absent').length || 0
    const attendancePercentage = total > 0 ? (presentCount / total) * 100 : 0

    return {
      totalStudents: total,
      presentCount,
      absentCount,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100
    }
  }
}

export async function getAttendanceTrends(days: number = 30): Promise<{
  date: string
  presentCount: number
  absentCount: number
  attendancePercentage: number
}[]> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch(`/api/attendance/trends?days=${days}`)
    if (!response.ok) throw new Error('Failed to fetch attendance trends')
    return response.json()
  } else {
    // Server-side: direct database access
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const { data: attendance, error } = await supabaseAdmin
      .schema('school')
      .from('Attendance')
      .select('date, status')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')

    if (error) throw error

    const { data: totalStudents, error: studentsError } = await supabaseAdmin
      .schema('school')
      .from('IDCard')
      .select('id', { count: 'exact' })

    if (studentsError) throw studentsError

    const total = totalStudents?.length || 0

    // Group by date and calculate statistics
    const dateGroups = attendance?.reduce((acc, record) => {
      const date = record.date
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0 }
      }
      if (record.status === 'present') {
        acc[date].present++
      } else {
        acc[date].absent++
      }
      return acc
    }, {} as Record<string, { present: number; absent: number }>) || {}

    return Object.entries(dateGroups).map(([date, counts]) => ({
      date,
      presentCount: counts.present,
      absentCount: counts.absent,
      attendancePercentage: total > 0 ? Math.round((counts.present / total) * 10000) / 100 : 0
    }))
  }
}

// Attendance messaging operations
export async function saveAttendanceMessage(messageData: Omit<AttendanceMessage, 'id' | 'created_at' | 'sent_at'>): Promise<AttendanceMessage> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch('/api/attendance/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    })
    if (!response.ok) throw new Error('Failed to save attendance message')
    return response.json()
  } else {
    // Server-side: direct database access
    const { data, error } = await supabaseAdmin
      .schema('school')
      .from('attendance_messages')
      .insert(messageData)
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}

export async function getAttendanceMessages(date?: string): Promise<AttendanceMessage[]> {
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const url = date ? `/api/attendance/messages?date=${encodeURIComponent(date)}` : '/api/attendance/messages'
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch attendance messages')
    return response.json()
  } else {
    // Server-side: direct database access
    let query = supabaseAdmin
      .schema('school')
      .from('AttendanceMessages')
      .select(`
        *,
        student:IDCard(*)
      `)
      .order('createdAt', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }
}

// Student Management Functions
export interface StudentManagementParams {
  page?: number
  limit?: number
  search?: string
  class?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StudentFormData {
  id?: string
  student_name: string
  father_name: string
  mother_name?: string
  class_id: string
  section?: string

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
}

export async function getAllStudents(params: StudentManagementParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.class) searchParams.set('class', params.class)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const response = await fetch(`/api/students-management?${searchParams.toString()}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch students')
  }
  return response.json()
}

export async function createStudent(studentData: StudentFormData) {
  const response = await fetch('/api/students-management', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create student')
  }

  // Clear student cache after successful creation
  cacheUtils.clearStudentCache()

  return response.json()
}

export async function updateStudent(studentData: StudentFormData, updateReason?: string) {
  const response = await fetch('/api/students-management', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...studentData,
      update_reason: updateReason
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update student')
  }

  // Clear student cache after successful update
  cacheUtils.clearStudentCache()

  return response.json()
}

export async function deleteStudent(
  id: string,
  deletedBy: string = 'admin',
  deleteReason: string
) {
  const params = new URLSearchParams({
    id,
    deleted_by: deletedBy,
    delete_reason: deleteReason
  })

  const response = await fetch(`/api/students-management?${params.toString()}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete student')
  }

  // Clear student cache after successful deletion
  cacheUtils.clearStudentCache()

  return response.json()
}
