import * as dotenv from 'dotenv';
dotenv.config();

async function testTursoConnection() {
  console.log('🔍 Testing Turso connection...\n');
  
  try {
    // Import prisma client
    const { prisma, checkDatabaseConnection, getDatabaseInfo } = await import('../lib/db/prisma');
    
    // Get database info
    const dbInfo = await getDatabaseInfo();
    console.log('📊 Database Info:');
    console.log(`   Type: ${dbInfo.type}`);
    console.log(`   URL: ${dbInfo.url}`);
    console.log(`   Connected: ${dbInfo.connected ? '✅' : '❌'}\n`);
    
    if (!dbInfo.connected) {
      console.error('❌ Database connection failed!');
      process.exit(1);
    }
    
    // Test query
    console.log('🔍 Testing query...');
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}\n`);
    
    // Test admin user initialization
    console.log('👤 Testing admin user initialization...');
    const { initializeAdminUser } = await import('../lib/auth/user-manager');
    await initializeAdminUser();
    console.log('✅ Admin user initialized\n');
    
    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
      select: {
        id: true,
        username: true,
        role: true,
        twoFactorEnabled: true,
        enabled: true,
      },
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   2FA Enabled: ${adminUser.twoFactorEnabled}`);
      console.log(`   Enabled: ${adminUser.enabled}\n`);
    } else {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }
    
    console.log('🎉 All tests passed!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testTursoConnection();
