/**
 * Jest Setup File
 * 
 * Global test configuration and mocks.
 */

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key'
process.env.IDLE_TIMEOUT_MINUTES = '30'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6379'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
