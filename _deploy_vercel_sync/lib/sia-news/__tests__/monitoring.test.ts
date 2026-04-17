/**
 * Unit tests for Monitoring and Logging Layer
 * 
 * Tests comprehensive logging, performance tracking, quality metrics,
 * system health monitoring, and alerting capabilities.
 */

import {
  log,
  logRequest,
  logValidationFailure,
  logError,
  logDebug,
  trackPerformance,
  trackQuality,
  getRealtimeMetrics,
  checkSystemHealth,
  monitorComponentHealth,
  generateDailySummary,
  sendAlert,
  getRecentLogs,
  getRecentAlerts,
  configureLogging,
  clearRecentLogs,
  clearRecentAlerts
} from '../monitoring'

import { ValidationIssue } from '../types'

describe('Monitoring and Logging Layer', () => {
  beforeEach(() => {
    clearRecentLogs()
    clearRecentAlerts()
  })

  describe('Core Logging Functions', () => {
    test('log should create structured log entries', () => {
      log('INFO', 'test-component', 'Test message', { key: 'value' })
      
      const logs = getRecentLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('INFO')
      expect(logs[0].component).toBe('test-component')
      expect(logs[0].message).toBe('Test message')
      expect(logs[0].metadata).toEqual({ key: 'value' })
    })

    test('logRequest should log API requests with masked API key', () => {
      logRequest('/api/test', 'POST', { param: 'value' }, 'test-api-key-12345678')
      
      const logs = getRecentLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].component).toBe('api')
      expect(logs[0].metadata?.apiKey).toBe('test...5678')
    })

    test('logValidationFailure should log validation issues', () => {
      const issues = [
        {
          severity: 'CRITICAL',
          category: 'adsense',
          description: 'Word count below minimum'
        },
        {
          severity: 'HIGH',
          category: 'eeat',
          description: 'E-E-A-T score below threshold'
        }
      ]
      
      logValidationFailure('article-123', issues, 1)
      
      const logs = getRecentLogs('WARN')
      expect(logs.length).toBe(1)
      expect(logs[0].metadata?.criticalIssues).toBe(1)
      expect(logs[0].metadata?.highIssues).toBe(1)
    })

    test('logError should log errors with stack traces', () => {
      const error = new Error('Test error')
      logError('test-component', 'testOperation', error, { context: 'test' })
      
      const logs = getRecentLogs('ERROR')
      expect(logs.length).toBe(1)
      expect(logs[0].metadata?.error.message).toBe('Test error')
      expect(logs[0].metadata?.error.stack).toBeDefined()
    })

    test('logDebug should only log in DEBUG mode', () => {
      configureLogging({ minLevel: 'INFO' })
      logDebug('test', 'Debug message')
      expect(getRecentLogs('DEBUG').length).toBe(0)
      
      configureLogging({ minLevel: 'DEBUG' })
      logDebug('test', 'Debug message')
      expect(getRecentLogs('DEBUG').length).toBe(1)
    })
  })

  describe('Performance Tracking', () => {
    test('trackPerformance should track operation duration', async () => {
      const result = await trackPerformance(
        'test-component',
        'test-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return 'success'
        }
      )
      
      expect(result).toBe('success')
      
      const logs = getRecentLogs('INFO')
      const completionLog = logs.find(l => l.message.includes('completed'))
      expect(completionLog).toBeDefined()
      expect(completionLog?.message).toContain('ms')
    })

    test('trackPerformance should handle errors', async () => {
      await expect(
        trackPerformance(
          'test-component',
          'test-operation',
          async () => {
            throw new Error('Test error')
          }
        )
      ).rejects.toThrow('Test error')
      
      const logs = getRecentLogs('WARN')
      const failureLog = logs.find(l => l.message.includes('failed'))
      expect(failureLog).toBeDefined()
    })
  })

  describe('Quality Metrics Tracking', () => {
    test('trackQuality should store quality metrics', async () => {
      await trackQuality(
        'article-123',
        85,
        75,
        'HIGH',
        45,
        500
      )
      
      const logs = getRecentLogs('DEBUG')
      const qualityLog = logs.find(l => l.message.includes('quality metrics'))
      expect(qualityLog).toBeDefined()
      expect(qualityLog?.metadata?.eeatScore).toBe(85)
    })
  })

  describe('Real-Time Metrics', () => {
    test('getRealtimeMetrics should return aggregated metrics', async () => {
      const metrics = await getRealtimeMetrics()
      
      expect(metrics).toHaveProperty('performance')
      expect(metrics).toHaveProperty('quality')
      expect(metrics).toHaveProperty('system')
      
      expect(metrics.performance).toHaveProperty('avgDuration')
      expect(metrics.performance).toHaveProperty('successRate')
      expect(metrics.performance).toHaveProperty('operationsPerHour')
      
      expect(metrics.quality).toHaveProperty('avgEEATScore')
      expect(metrics.quality).toHaveProperty('avgOriginalityScore')
      expect(metrics.quality).toHaveProperty('avgSentiment')
    })
  })

  describe('System Health Monitoring', () => {
    test('checkSystemHealth should return system status', async () => {
      const health = await checkSystemHealth()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('components')
      expect(health).toHaveProperty('lastCheck')
      
      expect(['HEALTHY', 'DEGRADED', 'DOWN']).toContain(health.status)
    })

    test('monitorComponentHealth should return component status', async () => {
      const status = await monitorComponentHealth('test-component')
      
      expect(['UP', 'DOWN']).toContain(status)
    })
  })

  describe('Daily Summary Generation', () => {
    test('generateDailySummary should create comprehensive report', async () => {
      const summary = await generateDailySummary()
      
      expect(summary).toHaveProperty('date')
      expect(summary).toHaveProperty('totalArticles')
      expect(summary).toHaveProperty('successfulPublications')
      expect(summary).toHaveProperty('failedValidations')
      expect(summary).toHaveProperty('avgEEATScore')
      expect(summary).toHaveProperty('avgProcessingTime')
      expect(summary).toHaveProperty('byLanguage')
      expect(summary).toHaveProperty('topEntities')
      expect(summary).toHaveProperty('qualityTrends')
      
      expect(summary.qualityTrends).toHaveProperty('eeatScore')
      expect(summary.qualityTrends).toHaveProperty('originalityScore')
      expect(summary.qualityTrends.eeatScore).toHaveLength(7)
    })
  })

  describe('Alerting System', () => {
    test('sendAlert should create and route alerts', async () => {
      await sendAlert('HIGH', 'test-component', 'Test alert', { key: 'value' })
      
      const alerts = getRecentAlerts()
      expect(alerts.length).toBe(1)
      expect(alerts[0].severity).toBe('HIGH')
      expect(alerts[0].component).toBe('test-component')
      expect(alerts[0].message).toBe('Test alert')
    })

    test('getRecentAlerts should filter by severity', async () => {
      await sendAlert('LOW', 'test', 'Low alert')
      await sendAlert('HIGH', 'test', 'High alert')
      await sendAlert('CRITICAL', 'test', 'Critical alert')
      
      const highAlerts = getRecentAlerts('HIGH')
      expect(highAlerts.length).toBe(1)
      expect(highAlerts[0].severity).toBe('HIGH')
      
      const allAlerts = getRecentAlerts()
      expect(allAlerts.length).toBe(3)
    })

    test('alert severity levels should be properly defined', async () => {
      const severities = [
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
      ]
      
      for (const severity of severities) {
        await sendAlert(severity, 'test', `${severity} alert`)
      }
      
      const alerts = getRecentAlerts()
      expect(alerts.length).toBe(4)
    })
  })

  describe('Log Filtering', () => {
    test('getRecentLogs should filter by level', () => {
      log('INFO', 'test', 'Info message')
      log('WARN', 'test', 'Warning message')
      log('ERROR', 'test', 'Error message')
      
      expect(getRecentLogs('INFO').length).toBe(1)
      expect(getRecentLogs('WARN').length).toBe(1)
      expect(getRecentLogs('ERROR').length).toBe(1)
    })

    test('getRecentLogs should filter by component', () => {
      log('INFO', 'component-a', 'Message A')
      log('INFO', 'component-b', 'Message B')
      log('INFO', 'component-a', 'Message A2')
      
      const componentALogs = getRecentLogs(undefined, 'component-a')
      expect(componentALogs.length).toBe(2)
    })

    test('getRecentLogs should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        log('INFO', 'test', `Message ${i}`)
      }
      
      const logs = getRecentLogs(undefined, undefined, 5)
      expect(logs.length).toBe(5)
    })
  })

  describe('Configuration', () => {
    test('configureLogging should update log configuration', () => {
      configureLogging({ minLevel: 'ERROR' })
      
      log('INFO', 'test', 'Info message')
      log('ERROR', 'test', 'Error message')
      
      expect(getRecentLogs('INFO').length).toBe(0)
      expect(getRecentLogs('ERROR').length).toBe(1)
      
      // Reset to default
      configureLogging({ minLevel: 'DEBUG' })
    })
  })
})
