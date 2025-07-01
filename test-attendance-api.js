async function testAttendanceAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/attendance/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attendanceList: [
          {
            student_id: 'da994982-53ee-4a9b-8467-38978e4a6b0c',
            date: '2025-07-02',
            status: 'present'
          }
        ]
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAttendanceAPI();
