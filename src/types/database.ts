export interface Student {
  id: string
  class_id: string
  student_name: string
  father_name: string
  mother_name: string
  father_mobile?: string
  mother_mobile?: string
  student_photo_url?: string
  father_photo_url?: string
  mother_photo_url?: string
  date_of_birth?: string
  address?: string
  created_at?: string
  download_count?: number
  class?: {
    name: string
    section: string
  }
}

export interface FeePayment {
  id: string
  student_id: string
  amount_received: number
  payment_date: string
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque'
  balance_remaining: number
  payment_status: 'completed' | 'partial' | 'pending'
  notes?: string
  receipt_url: string
  has_updates?: boolean
  fee_month?: number
  fee_year?: number
  created_at: string
  updated_at: string
  // Joined student data
  student?: Student
}

export interface FeeHistoryUpdate {
  id: string
  fee_payment_id: string
  field_name: string
  old_value?: string
  new_value?: string
  updated_by: string
  update_reason?: string
  created_at: string
}

export interface Attendance {
  id: string
  studentId: string  // Changed from student_id to match database schema
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' // Updated to match database enum values
  createdBy?: string | null  // UUID field - can be null
  description?: string  // Changed from notes to match database schema
  createdAt?: string  // Changed from created_at to match database schema (optional for input)
  updatedAt?: string  // Changed from updated_at to match database schema (optional for input)
  classId?: string   // Added to match database schema
  lastModifiedBy?: string | null  // UUID field - can be null
  // Joined student data
  student?: Student
}

export interface AttendanceMessage {
  id: string
  student_id: string
  date: string
  message_content: string
  recipient_type: 'father' | 'mother' | 'both'
  recipient_number: string
  sent_at: string
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed'
  created_at: string
  // Joined student data
  student?: Student
}

export interface Database {
  school: {
    Tables: {
      IDCard: {
        Row: Student
        Insert: Omit<Student, 'id' | 'created_at' | 'download_count'>
        Update: Partial<Omit<Student, 'id' | 'created_at'>>
      }
      fee_payments: {
        Row: FeePayment
        Insert: Omit<FeePayment, 'id' | 'created_at' | 'updated_at' | 'receipt_url' | 'has_updates'>
        Update: Partial<Omit<FeePayment, 'id' | 'created_at' | 'updated_at'>>
      }
      fee_history_update: {
        Row: FeeHistoryUpdate
        Insert: Omit<FeeHistoryUpdate, 'id' | 'created_at'>
        Update: Partial<Omit<FeeHistoryUpdate, 'id' | 'created_at'>>
      }
      attendance: {
        Row: Attendance
        Insert: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Attendance, 'id' | 'created_at' | 'updated_at'>>
      }
      attendance_messages: {
        Row: AttendanceMessage
        Insert: Omit<AttendanceMessage, 'id' | 'created_at' | 'sent_at'>
        Update: Partial<Omit<AttendanceMessage, 'id' | 'created_at' | 'sent_at'>>
      }
    }
  }
}
