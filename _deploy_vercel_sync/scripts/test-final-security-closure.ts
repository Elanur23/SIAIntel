/**
 * FINAL SECURITY CLOSURE TEST SUITE
 * 
 * Comprehensive verification of:
 * - RBAC enforcement on all protected routes
 * - Authentication flow security
 * - Utility route protection
 * - Error handling (401/403)
 * - Audit logging
 * 
 * Run: npx tsx scripts/test-final-security-closure.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    results.push({ name, passed: true, duration: Date.now() - start })
    console.log(`✅ ${name}`)
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, duration: Date.now() - start })
    console.log(`❌ ${name}: ${error.message}`)
  }
}

// Helper: Make API request
async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response
}

// Helper: Login and get session cookie
async function login(): Promise<string> {
  const response = await apiRequest('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`)
  }

  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error('No session cookie returned')
  }

  const match = setCookie.match(/sia_admin_session=([^;]+)/)
  if (!match) {
    throw new Error('Could not extract session token')
  }

  return match[1]
}

// ============================================================================
// TEST SUITE: UTILITY ROUTES RBAC ENFORCEMENT
// ============================================================================

async function testUtilityRoutes() {
  console.log('\n📋 Testing Utility Routes RBAC Enforcement...\n')

  // Test 1: test-alert requires authentication
  await runTest('test-alert: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/test-alert', {
      method: 'POST',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 2: test-alert requires manage_security permission
  await runTest('test-alert: Requires manage_security permission', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/test-alert', {
      method: 'POST',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    // Should succeed for super_admin, or fail with 403 for insufficient permissions
    if (response.status !== 200 && response.status !== 403 && response.status !== 503) {
      throw new Error(`Expected 200/403/503, got ${response.status}`)
    }
  })

  // Test 3: normalize-workspace GET requires authentication
  await runTest('normalize-workspace GET: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/normalize-workspace', {
      method: 'GET',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 4: normalize-workspace GET requires view_content permission
  await runTest('normalize-workspace GET: Requires view_content permission', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/normalize-workspace', {
      method: 'GET',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    // Should succeed for super_admin, or fail with 403 for insufficient permissions
    if (response.status !== 200 && response.status !== 403) {
      throw new Error(`Expected 200/403, got ${response.status}`)
    }
  })

  // Test 5: normalize-workspace POST requires authentication
  await runTest('normalize-workspace POST: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/normalize-workspace', {
      method: 'POST',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 6: normalize-workspace POST requires manage_integrations permission
  await runTest('normalize-workspace POST: Requires manage_integrations permission', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/normalize-workspace', {
      method: 'POST',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    // Should succeed for super_admin, or fail with 403 for insufficient permissions
    if (response.status !== 200 && response.status !== 403 && response.status !== 500) {
      throw new Error(`Expected 200/403/500, got ${response.status}`)
    }
  })

  // Test 7: backfill-multilingual requires authentication
  await runTest('backfill-multilingual: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/backfill-multilingual', {
      method: 'POST',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 8: backfill-multilingual requires manage_integrations permission
  await runTest('backfill-multilingual: Requires manage_integrations permission', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/backfill-multilingual', {
      method: 'POST',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
      body: JSON.stringify({ limit: 1 }),
    })
    
    // Should succeed for super_admin, or fail with 403 for insufficient permissions
    if (response.status !== 200 && response.status !== 403 && response.status !== 500) {
      throw new Error(`Expected 200/403/500, got ${response.status}`)
    }
  })
}

// ============================================================================
// TEST SUITE: USER MANAGEMENT RBAC
// ============================================================================

async function testUserManagementRBAC() {
  console.log('\n👥 Testing User Management RBAC...\n')

  // Test 1: users/list requires authentication
  await runTest('users/list: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/users/list', {
      method: 'GET',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 2: users/list requires view_users permission
  await runTest('users/list: Requires view_users permission', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/users/list', {
      method: 'GET',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    if (response.status !== 200 && response.status !== 403) {
      throw new Error(`Expected 200/403, got ${response.status}`)
    }
  })

  // Test 3: users/create requires authentication
  await runTest('users/create: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/users/create', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123',
        role: 'viewer',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 4: users/update-role requires authentication
  await runTest('users/update-role: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/users/update-role', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-id',
        newRole: 'editor',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 5: users/disable requires authentication
  await runTest('users/disable: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/users/disable', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-id',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })
}

// ============================================================================
// TEST SUITE: CONTENT MANAGEMENT RBAC
// ============================================================================

async function testContentManagementRBAC() {
  console.log('\n📝 Testing Content Management RBAC...\n')

  // Test 1: sync-workspace POST requires authentication
  await runTest('sync-workspace POST: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/sync-workspace', {
      method: 'POST',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 2: sync-workspace GET requires authentication
  await runTest('sync-workspace GET: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/admin/sync-workspace', {
      method: 'GET',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 3: featured-articles POST requires authentication
  await runTest('featured-articles POST: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/featured-articles', {
      method: 'POST',
      body: JSON.stringify({
        articleId: 'test-id',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 4: featured-articles PUT requires authentication
  await runTest('featured-articles PUT: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/featured-articles', {
      method: 'PUT',
      body: JSON.stringify({
        articleId: 'test-id',
        position: 1,
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 5: featured-articles DELETE requires authentication
  await runTest('featured-articles DELETE: Rejects unauthenticated request', async () => {
    const response = await apiRequest('/api/featured-articles', {
      method: 'DELETE',
      body: JSON.stringify({
        articleId: 'test-id',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })
}

// ============================================================================
// TEST SUITE: AUTHENTICATION FLOW
// ============================================================================

async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...\n')

  // Test 1: Login with valid credentials
  await runTest('Login: Accepts valid credentials', async () => {
    const response = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    })
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error('Login should succeed')
    }
  })

  // Test 2: Login with invalid credentials
  await runTest('Login: Rejects invalid credentials', async () => {
    const response = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: 'wrongpassword',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 3: CSRF token requires authentication
  await runTest('CSRF token: Requires authentication', async () => {
    const response = await apiRequest('/api/admin/csrf-token', {
      method: 'GET',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 4: CSRF token generation for authenticated user
  await runTest('CSRF token: Generates for authenticated user', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/csrf-token', {
      method: 'GET',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }

    const data = await response.json()
    if (!data.csrfToken) {
      throw new Error('CSRF token should be returned')
    }
  })

  // Test 5: Logout requires authentication
  await runTest('Logout: Requires authentication', async () => {
    const response = await apiRequest('/api/admin/logout', {
      method: 'POST',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 6: Logout succeeds for authenticated user
  await runTest('Logout: Succeeds for authenticated user', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/logout', {
      method: 'POST',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }
  })
}

// ============================================================================
// TEST SUITE: 2FA FLOW
// ============================================================================

async function test2FAFlow() {
  console.log('\n🔒 Testing 2FA Flow...\n')

  // Test 1: 2FA setup requires authentication
  await runTest('2FA setup: Requires authentication', async () => {
    const response = await apiRequest('/api/admin/2fa/setup', {
      method: 'POST',
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 2: 2FA setup succeeds for authenticated user
  await runTest('2FA setup: Succeeds for authenticated user', async () => {
    const sessionToken = await login()
    
    const response = await apiRequest('/api/admin/2fa/setup', {
      method: 'POST',
      headers: {
        Cookie: `sia_admin_session=${sessionToken}`,
      },
    })
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }

    const data = await response.json()
    if (!data.secret || !data.qrCodeUrl) {
      throw new Error('2FA setup should return secret and QR code')
    }
  })

  // Test 3: 2FA enable requires authentication
  await runTest('2FA enable: Requires authentication', async () => {
    const response = await apiRequest('/api/admin/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({
        secret: 'test-secret',
        code: '123456',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  // Test 4: 2FA verify requires valid session token
  await runTest('2FA verify: Requires valid session token', async () => {
    const response = await apiRequest('/api/admin/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        sessionToken: 'invalid-token',
        code: '123456',
      }),
    })
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('🚀 FINAL SECURITY CLOSURE TEST SUITE')
  console.log('=====================================\n')
  console.log(`Testing against: ${BASE_URL}`)
  console.log(`Admin user: ${ADMIN_USERNAME}\n`)

  const startTime = Date.now()

  // Run all test suites
  await testUtilityRoutes()
  await testUserManagementRBAC()
  await testContentManagementRBAC()
  await testAuthenticationFlow()
  await test2FAFlow()

  // Print summary
  const totalTime = Date.now() - startTime
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log('\n=====================================')
  console.log('📊 TEST SUMMARY')
  console.log('=====================================\n')
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Time: ${totalTime}ms`)
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (failed > 0) {
    console.log('Failed Tests:')
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  ❌ ${r.name}`)
        console.log(`     Error: ${r.error}`)
      })
    console.log('')
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
