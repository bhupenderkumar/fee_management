/**
 * Test utility to verify birthday age calculation logic
 */

export function testAgeCalculation() {
  console.log('Testing Birthday Age Calculation Logic...')
  
  // Test cases with known ages
  const testCases = [
    {
      name: 'Test Student 1',
      birthDate: '2015-01-15', // Should be 9 years old in 2024
      expectedAge: 9
    },
    {
      name: 'Test Student 2', 
      birthDate: '2010-06-20', // Should be 14 years old in 2024
      expectedAge: 14
    },
    {
      name: 'Test Student 3',
      birthDate: '2018-12-25', // Should be 5 years old in 2024
      expectedAge: 5
    },
    {
      name: 'Test Student 4 (Future Birthday)',
      birthDate: '2015-12-31', // Should be 8 years old if birthday hasn't passed in 2024
      expectedAge: 8
    }
  ]
  
  testCases.forEach(testCase => {
    // Parse the birth date properly - ensure we're working with the correct date
    const birthDate = new Date(testCase.birthDate + 'T00:00:00.000Z')
    
    // Calculate age more accurately by considering the exact birth date
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    console.log(`${testCase.name}:`)
    console.log(`  Birth Date: ${testCase.birthDate}`)
    console.log(`  Calculated Age: ${age}`)
    console.log(`  Expected Age: ${testCase.expectedAge}`)
    console.log(`  Status: ${age === testCase.expectedAge ? '✅ PASS' : '❌ FAIL'}`)
    console.log('---')
  })
  
  console.log('Age calculation test completed!')
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to global scope for manual testing
  (window as any).testAgeCalculation = testAgeCalculation
}
