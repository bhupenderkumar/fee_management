-- Fix missing fee_month and fee_year columns in fee_payments table
-- Run this in your Supabase SQL Editor

-- Add the missing columns to fee_payments table
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS fee_month INTEGER;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS fee_year INTEGER;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS has_updates BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_payments_month_year ON fee_payments(fee_month, fee_year);
CREATE INDEX IF NOT EXISTS idx_fee_payments_has_updates ON fee_payments(has_updates);

-- Update existing records to populate fee_month and fee_year based on payment_date
UPDATE fee_payments 
SET 
  fee_month = EXTRACT(MONTH FROM payment_date),
  fee_year = EXTRACT(YEAR FROM payment_date)
WHERE fee_month IS NULL OR fee_year IS NULL;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fee_payments' 
AND column_name IN ('fee_month', 'fee_year', 'has_updates');
