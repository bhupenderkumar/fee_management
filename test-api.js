// Simple test script to verify API endpoints
const BASE_URL = 'http://localhost:3003';

async function testAPI() {
  console.log('Testing Fee Management API endpoints...\n');

  try {
    // Test 1: Get all fee payments
    console.log('1. Testing GET /api/payments');
    const paymentsResponse = await fetch(`${BASE_URL}/api/payments?limit=5`);
    const paymentsData = await paymentsResponse.json();
    console.log(`✓ Found ${paymentsData.data?.length || 0} payments`);

    // Test 2: Get pending fees (all)
    console.log('\n2. Testing GET /api/pending-fees');
    const pendingResponse = await fetch(`${BASE_URL}/api/pending-fees`);
    const pendingData = await pendingResponse.json();
    console.log(`✓ Found ${pendingData.length || 0} students with pending fees`);
    if (pendingData.length > 0) {
      console.log(`   First student: ${pendingData[0].student_name} - Reason: ${pendingData[0].pendingReason || 'N/A'}`);
    }

    // Test 3: Get pending fees for specific month/year
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    console.log(`\n3. Testing GET /api/pending-fees?month=${currentMonth}&year=${currentYear}`);
    const monthlyPendingResponse = await fetch(`${BASE_URL}/api/pending-fees?month=${currentMonth}&year=${currentYear}`);
    const monthlyPendingData = await monthlyPendingResponse.json();
    console.log(`✓ Found ${monthlyPendingData.length || 0} students with pending fees for ${currentMonth}/${currentYear}`);
    if (monthlyPendingData.length > 0) {
      console.log(`   First student: ${monthlyPendingData[0].student_name} - Reason: ${monthlyPendingData[0].pendingReason || 'N/A'}`);
    }

    // Test 3b: Test for May 2025 (should find Jane Smith with partial payment)
    console.log(`\n3b. Testing GET /api/pending-fees?month=5&year=2025`);
    const mayPendingResponse = await fetch(`${BASE_URL}/api/pending-fees?month=5&year=2025`);
    const mayPendingData = await mayPendingResponse.json();
    console.log(`✓ Found ${mayPendingData.length || 0} students with pending fees for May 2025`);
    if (mayPendingData.length > 0) {
      console.log(`   First student: ${mayPendingData[0].student_name} - Reason: ${mayPendingData[0].pendingReason || 'N/A'}`);
    }

    // Test 4: Test fee history endpoint (if we have payments)
    if (paymentsData.data && paymentsData.data.length > 0) {
      const firstPaymentId = paymentsData.data[0].id;
      console.log(`\n4. Testing GET /api/fee-history?fee_payment_id=${firstPaymentId}`);
      const historyResponse = await fetch(`${BASE_URL}/api/fee-history?fee_payment_id=${firstPaymentId}`);
      const historyData = await historyResponse.json();
      console.log(`✓ Found ${historyData.length || 0} history records for payment ${firstPaymentId}`);
    }

    console.log('\n✅ All API tests completed successfully!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testAPI();
}

module.exports = { testAPI };
