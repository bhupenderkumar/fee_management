// Sample data seeder for testing
// Run this script to populate your database with sample student data

const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleStudents = [
  {
    class_name: 'Class 1A',
    child_name: 'Aarav Sharma',
    father_name: 'Rajesh Sharma',
    mother_name: 'Priya Sharma',
    father_mobile: '+91-9876543210',
    mother_mobile: '+91-9876543211'
  },
  {
    class_name: 'Class 1A',
    child_name: 'Ananya Patel',
    father_name: 'Amit Patel',
    mother_name: 'Neha Patel',
    father_mobile: '+91-9876543212',
    mother_mobile: '+91-9876543213'
  },
  {
    class_name: 'Class 1B',
    child_name: 'Arjun Kumar',
    father_name: 'Suresh Kumar',
    mother_name: 'Kavita Kumar',
    father_mobile: '+91-9876543214',
    mother_mobile: '+91-9876543215'
  },
  {
    class_name: 'Class 1B',
    child_name: 'Diya Singh',
    father_name: 'Vikram Singh',
    mother_name: 'Sunita Singh',
    father_mobile: '+91-9876543216',
    mother_mobile: '+91-9876543217'
  },
  {
    class_name: 'Class 2A',
    child_name: 'Ishaan Gupta',
    father_name: 'Rohit Gupta',
    mother_name: 'Meera Gupta',
    father_mobile: '+91-9876543218',
    mother_mobile: '+91-9876543219'
  },
  {
    class_name: 'Class 2A',
    child_name: 'Kavya Reddy',
    father_name: 'Srinivas Reddy',
    mother_name: 'Lakshmi Reddy',
    father_mobile: '+91-9876543220',
    mother_mobile: '+91-9876543221'
  },
  {
    class_name: 'Class 2B',
    child_name: 'Nikhil Joshi',
    father_name: 'Prakash Joshi',
    mother_name: 'Asha Joshi',
    father_mobile: '+91-9876543222',
    mother_mobile: '+91-9876543223'
  },
  {
    class_name: 'Class 2B',
    child_name: 'Riya Agarwal',
    father_name: 'Manoj Agarwal',
    mother_name: 'Pooja Agarwal',
    father_mobile: '+91-9876543224',
    mother_mobile: '+91-9876543225'
  },
  {
    class_name: 'Class 3A',
    child_name: 'Siddharth Verma',
    father_name: 'Deepak Verma',
    mother_name: 'Ritu Verma',
    father_mobile: '+91-9876543226',
    mother_mobile: '+91-9876543227'
  },
  {
    class_name: 'Class 3A',
    child_name: 'Tanvi Mishra',
    father_name: 'Ashok Mishra',
    mother_name: 'Shweta Mishra',
    father_mobile: '+91-9876543228',
    mother_mobile: '+91-9876543229'
  }
]

async function seedData() {
  try {
    console.log('Starting to seed sample data...')
    
    // Insert sample students
    const { data, error } = await supabase
      .from('students')
      .insert(sampleStudents)
      .select()

    if (error) {
      console.error('Error inserting students:', error)
      return
    }

    console.log(`Successfully inserted ${data.length} students`)
    console.log('Sample data seeding completed!')
    
    // Display the inserted data
    console.log('\nInserted students:')
    data.forEach(student => {
      console.log(`- ${student.child_name} (${student.class_name}) - Father: ${student.father_name}`)
    })
    
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

// Run the seeder
seedData()
