-- Sample birthday data for testing the birthday management system
-- Run this in Supabase SQL Editor to add test data

-- Update existing students with birthday information
-- This assumes you have existing students in the IDCard table

-- Sample birthday updates for testing different scenarios
UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE 
WHERE student_name ILIKE '%test%' 
AND date_of_birth IS NULL 
LIMIT 1;

-- Add birthdays for this week (for testing week filter)
UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE + INTERVAL '2 days'
WHERE student_name ILIKE '%student%' 
AND date_of_birth IS NULL 
LIMIT 1;

UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE + INTERVAL '5 days'
WHERE student_name ILIKE '%child%' 
AND date_of_birth IS NULL 
LIMIT 1;

-- Add birthdays for this month (for testing month filter)
UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE + INTERVAL '15 days'
WHERE date_of_birth IS NULL 
LIMIT 2;

UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE - INTERVAL '10 days'
WHERE date_of_birth IS NULL 
LIMIT 2;

-- Add some birthdays from previous years (same month/day, different year)
UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE - INTERVAL '8 years'
WHERE date_of_birth IS NULL 
LIMIT 3;

UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE - INTERVAL '10 years' + INTERVAL '3 days'
WHERE date_of_birth IS NULL 
LIMIT 2;

UPDATE school.IDCard 
SET date_of_birth = CURRENT_DATE - INTERVAL '7 years' - INTERVAL '2 days'
WHERE date_of_birth IS NULL 
LIMIT 2;

-- Verify the birthday data
SELECT 
  student_name,
  father_name,
  mother_name,
  date_of_birth,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) as age,
  CASE 
    WHEN DATE_TRUNC('day', date_of_birth) = DATE_TRUNC('day', CURRENT_DATE) THEN 'TODAY'
    WHEN date_of_birth BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'THIS WEEK'
    WHEN EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) THEN 'THIS MONTH'
    ELSE 'OTHER'
  END as birthday_period
FROM school.IDCard 
WHERE date_of_birth IS NOT NULL
ORDER BY 
  CASE 
    WHEN DATE_TRUNC('day', date_of_birth) = DATE_TRUNC('day', CURRENT_DATE) THEN 1
    WHEN date_of_birth BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 2
    WHEN EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) THEN 3
    ELSE 4
  END,
  date_of_birth;

-- Sample insert for completely new test students (if needed)
-- Uncomment and modify as needed

/*
INSERT INTO school.IDCard (
  student_name,
  father_name,
  mother_name,
  father_mobile,
  mother_mobile,
  date_of_birth,
  class_id,
  address
) VALUES 
(
  'Birthday Test Student 1',
  'Test Father 1',
  'Test Mother 1',
  '+91 9876543210',
  '+91 9876543211',
  CURRENT_DATE,
  (SELECT id FROM school.classes LIMIT 1),
  'Test Address 1'
),
(
  'Birthday Test Student 2',
  'Test Father 2',
  'Test Mother 2',
  '+91 9876543212',
  '+91 9876543213',
  CURRENT_DATE + INTERVAL '3 days',
  (SELECT id FROM school.classes LIMIT 1),
  'Test Address 2'
),
(
  'Birthday Test Student 3',
  'Test Father 3',
  'Test Mother 3',
  '+91 9876543214',
  '+91 9876543215',
  CURRENT_DATE - INTERVAL '9 years',
  (SELECT id FROM school.classes LIMIT 1),
  'Test Address 3'
);
*/
