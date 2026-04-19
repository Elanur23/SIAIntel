import * as dotenv from 'dotenv';
dotenv.config();

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login API...\n');
  
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    console.error('❌ ADMIN_SECRET not set in .env');
    process.exit(1);
  }
  
  try {
    // Test with correct password
    console.log('✅ Testing with correct password...');
    const response = await fetch('http://localhost:3003/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: adminSecret,
      }),
    });
    
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
    
    if (response.ok && data.success) {
      console.log('✅ Login successful!\n');
    } else {
      console.error('❌ Login failed!\n');
      process.exit(1);
    }
    
    // Test with wrong password
    console.log('🔒 Testing with wrong password...');
    const wrongResponse = await fetch('http://localhost:3003/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'wrong-password',
      }),
    });
    
    const wrongData = await wrongResponse.json();
    
    console.log(`   Status: ${wrongResponse.status}`);
    console.log(`   Response:`, wrongData);
    
    if (wrongResponse.status === 401 && !wrongData.success) {
      console.log('✅ Correctly rejected wrong password!\n');
    } else {
      console.error('❌ Should have rejected wrong password!\n');
      process.exit(1);
    }
    
    console.log('🎉 All login tests passed!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAdminLogin();
