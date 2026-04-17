// Test login API
const testLogin = async () => {
  try {
    console.log('Testing login with password: sia2026');
    
    const response = await fetch('http://localhost:3003/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'sia2026' }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testLogin();
