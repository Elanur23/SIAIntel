'use client'

/**
 * Telegram Publish Admin Components
 * Phase 3C Step 1: Client-side components for admin page
 */

import { useState, useEffect } from 'react'
import type { TelegramPublishMode } from '@/lib/distribution/publishing/telegram-real-adapter'

export function ConfigurationStatus() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/distribution/telegram/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load status:', err)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return <div className="text-gray-600">Loading configuration status...</div>
  }
  
  if (!status) {
    return <div className="text-red-600">Failed to load configuration status</div>
  }
  
  return (
    <div className="space-y-3">
      <StatusItem
        label="Bot Token Configured"
        status={status.configStatus?.hasBotToken}
      />
      <StatusItem
        label="Test Chat ID Configured"
        status={status.configStatus?.hasTestChatId}
      />
      <StatusItem
        label="Production Chat ID Configured"
        status={status.configStatus?.hasProductionChatId}
      />
      <StatusItem
        label="Chat IDs Are Different"
        status={status.configStatus?.chatIdsAreDifferent}
      />
      <StatusItem
        label="Sandbox Mode Ready"
        status={status.configStatus?.sandboxConfigured}
      />
      <StatusItem
        label="Production Mode Ready"
        status={status.configStatus?.productionConfigured}
      />
      
      {/* Feature Flags */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-3">Feature Flags</h3>
        <StatusItem
          label="Sandbox Publishing Enabled"
          status={status.featureFlags?.enableTelegramSandboxPublish}
        />
        <StatusItem
          label="Production Publishing Enabled"
          status={status.featureFlags?.enableTelegramProductionPublish}
        />
      </div>
    </div>
  )
}

function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
        status
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {status ? '✓ Yes' : '✗ No'}
      </span>
    </div>
  )
}

export function TestPublishButton() {
  const [mode, setMode] = useState<TelegramPublishMode>('sandbox')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/distribution/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }
  
  return (
    <div>
      {/* Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Mode
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="sandbox"
              checked={mode === 'sandbox'}
              onChange={(e) => setMode(e.target.value as TelegramPublishMode)}
              className="mr-2"
            />
            <span>Sandbox (Test)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="production"
              checked={mode === 'production'}
              onChange={(e) => setMode(e.target.value as TelegramPublishMode)}
              className="mr-2"
            />
            <span>Production (Real)</span>
          </label>
        </div>
      </div>
      
      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? 'Testing...' : `Test ${mode.toUpperCase()} Connection`}
      </button>
      
      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-semibold mb-2 ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? '✓ Test Successful' : '✗ Test Failed'}
          </div>
          {result.result?.messageId && (
            <p className="text-sm text-green-700">
              Message ID: {result.result.messageId}
            </p>
          )}
          {result.result?.chatId && (
            <p className="text-sm text-green-700">
              Chat ID: {result.result.chatId}
            </p>
          )}
          {result.error && (
            <p className="text-sm text-red-700">
              {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
