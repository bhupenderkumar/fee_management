// Script to fix the database schema by adding missing columns
// Run this with: node scripts/fix-database-schema.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...')
    
    // Add missing columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add the missing columns to fee_payments table
        ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS fee_month INTEGER;
        ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS fee_year INTEGER;
        ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS has_updates BOOLEAN DEFAULT FALSE;
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_fee_payments_month_year ON fee_payments(fee_month, fee_year);
        CREATE INDEX IF NOT EXISTS idx_fee_payments_has_updates ON fee_payments(has_updates);
      `
    })

    if (alterError) {
      console.error('❌ Error adding columns:', alterError)
      return
    }

    console.log('✅ Columns added successfully')

    // Update existing records
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE fee_payments 
        SET 
          fee_month = EXTRACT(MONTH FROM payment_date),
          fee_year = EXTRACT(YEAR FROM payment_date)
        WHERE fee_month IS NULL OR fee_year IS NULL;
      `
    })

    if (updateError) {
      console.error('❌ Error updating existing records:', updateError)
      return
    }

    console.log('✅ Existing records updated successfully')
    console.log('🎉 Database schema fix completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixDatabaseSchema()
