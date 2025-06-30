-- Create students table (if it doesn't exist from your existing data)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  child_name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255) NOT NULL,
  mother_name VARCHAR(255) NOT NULL,
  father_mobile VARCHAR(20) NOT NULL,
  mother_mobile VARCHAR(20) NOT NULL,
  child_photo TEXT,
  father_photo TEXT,
  mother_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fee_payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount_received DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
  balance_remaining DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('completed', 'partial', 'pending')),
  notes TEXT,
  receipt_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_child_name ON students(child_name);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt_url ON fee_payments(receipt_url);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON fee_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- Create fee_history_update table for tracking changes
CREATE TABLE IF NOT EXISTS fee_history_update (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_payment_id UUID NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  updated_by VARCHAR(255) DEFAULT 'system',
  update_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add has_updates column to fee_payments table
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS has_updates BOOLEAN DEFAULT FALSE;

-- Add month and year columns for better pending fee tracking
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS fee_month INTEGER;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS fee_year INTEGER;

-- Create indexes for the new columns and history table
CREATE INDEX IF NOT EXISTS idx_fee_payments_has_updates ON fee_payments(has_updates);
CREATE INDEX IF NOT EXISTS idx_fee_payments_month_year ON fee_payments(fee_month, fee_year);
CREATE INDEX IF NOT EXISTS idx_fee_history_fee_payment_id ON fee_history_update(fee_payment_id);
CREATE INDEX IF NOT EXISTS idx_fee_history_created_at ON fee_history_update(created_at);

-- Create policies for public access (since this is an admin tool)
-- Note: In production, you might want more restrictive policies
CREATE POLICY "Allow all operations on students" ON students
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on fee_payments" ON fee_payments
    FOR ALL USING (true);

-- Enable RLS for fee_history_update table
ALTER TABLE fee_history_update ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on fee_history_update" ON fee_history_update
    FOR ALL USING (true);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by VARCHAR(255) DEFAULT 'admin',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one record per student per date
  UNIQUE(student_id, attendance_date)
);

-- Create attendance_messages table for storing messages sent to parents
CREATE TABLE IF NOT EXISTS attendance_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  message_content TEXT NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('father', 'mother', 'both')),
  recipient_number VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for attendance tables
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_messages_student_id ON attendance_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_messages_date ON attendance_messages(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_messages_status ON attendance_messages(delivery_status);

-- Create triggers for attendance updated_at
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for attendance tables
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance tables
CREATE POLICY "Allow all operations on attendance" ON attendance
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on attendance_messages" ON attendance_messages
    FOR ALL USING (true);
