// Test if the integration is working by checking the page structure

const testTravel = async () => {
  // Check if endpoints exist by testing with a dummy ID
  const testId = '00000000-0000-0000-0000-000000000000';
  const endpoints = [
    `/api/travels/${testId}`,
    `/api/travels/${testId}/costs`,
    `/api/travels/${testId}/costs/test-cost-id/approve`,
    `/api/travels/${testId}/settlement`
  ];
  
  console.log('Testing API endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        headers: { 'Authorization': 'Bearer test' }
      });
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (err) {
      console.log(`${endpoint}: Connection error - ${err.message}`);
    }
  }
};

testTravel();
