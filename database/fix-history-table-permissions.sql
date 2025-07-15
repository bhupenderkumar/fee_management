-- Fix permissions for fee_history_update table
-- Run this in your Supabase SQL Editor

-- First, ensure the table exists in the correct schema
CREATE TABLE IF NOT EXISTS school.fee_history_update (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_payment_id UUID NOT NULL REFERENCES school.fee_payments(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  updated_by VARCHAR(255) DEFAULT 'system',
  update_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_history_fee_payment_id ON school.fee_history_update(fee_payment_id);
CREATE INDEX IF NOT EXISTS idx_fee_history_created_at ON school.fee_history_update(created_at);

-- Enable RLS for fee_history_update table
ALTER TABLE school.fee_history_update ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on fee_history_update" ON school.fee_history_update;

-- Create a more permissive policy for the history table
CREATE POLICY "Allow all operations on fee_history_update" ON school.fee_history_update
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON school.fee_history_update TO authenticated;
GRANT ALL ON school.fee_history_update TO anon;

-- Grant usage on the sequence (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA school TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA school TO anon;

-- Verify the table exists and has correct permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'fee_history_update';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'fee_history_update';

-- Test insert to verify permissions work
-- (This will be rolled back, just for testing)
BEGIN;
INSERT INTO school.fee_history_update (
    fee_payment_id,
    field_name,
    old_value,
    new_value,
    updated_by,
    update_reason
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test_field',
    'test_old',
    'test_new',
    'test_user',
    'Permission test'
);
ROLLBACK;

-- If the above test passes, permissions are working correctly
SELECT 'Permissions test completed successfully' as status;
