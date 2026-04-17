/**
 * Telegram Publishing Admin Page
 * Phase 3C Step 1: Manual publishing interface
 * Phase 4C: Added error boundary protection
 * 
 * CRITICAL: This page allows REAL publishing to Telegram.
 * Sandbox mode is enforced by default.
 */

import { Metadata } from 'next'
import { ConfigurationStatus, TestPublishButton } from '@/components/distribution/TelegramPublishAdmin'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Telegram Publishing - SIA Distribution',
  description: 'Manual Telegram publishing with safety validation'
}

export default function TelegramPublishPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Telegram Publishing
          </h1>
          <p className="text-gray-600">
            Manual publishing to Telegram with safety validation and preview
          </p>
        </div>
        
        {/* Safety Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Real Publishing Enabled
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This interface performs REAL publishing to Telegram. All safety checks are enforced.
                  Sandbox mode is recommended for testing.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <ConfigurationStatus />
        </div>
        
        {/* Test Publishing */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Publishing</h2>
          <p className="text-gray-600 mb-4">
            Send a test message to verify your Telegram configuration.
          </p>
          <TestPublishButton />
        </div>
        
        {/* Manual Publishing */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Publishing</h2>
          <p className="text-gray-600 mb-4">
            To publish content, use the Telegram Publish Button component in your distribution workflow.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <code className="text-sm text-gray-800">
              {`import TelegramPublishButton from '@/components/distribution/TelegramPublishButton'`}
            </code>
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  )
}
