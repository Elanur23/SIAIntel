/**
 * Autonomous Distribution Assistant Page
 * Phase 3D: Human-in-the-loop suggestion interface
 * Phase 4C: Added error boundary protection
 * 
 * CRITICAL: This is NOT automation. All actions require manual approval.
 */

import { Metadata } from 'next'
import AutonomousAssistant from '@/components/distribution/AutonomousAssistant'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Autonomous Assistant - SIA Distribution',
  description: 'AI-powered publishing suggestions with manual approval'
}

export default function AutonomousAssistantPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            AUTONOMOUS_ASSISTANT
          </h1>
          <p className="text-slate-400 text-sm">
            AI-Powered Publishing Suggestions • Human-in-the-Loop System
          </p>
        </div>
        
        {/* Safety Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-blue-500 font-bold mb-2">🤖 How It Works</h2>
          <ul className="text-slate-400 text-sm space-y-2">
            <li>• AI scans existing content and suggests what to publish</li>
            <li>• Scores each suggestion based on trend relevance, engagement, timing, and safety</li>
            <li>• Recommends best headline, variant, platform, and publish time</li>
            <li>• <strong className="text-white">YOU approve or reject each suggestion</strong></li>
            <li>• <strong className="text-white">NO automatic publishing</strong> - manual confirmation required</li>
          </ul>
        </div>
        
        {/* Assistant Component */}
        <AutonomousAssistant />
      </div>
      </div>
    </ErrorBoundary>
  )
}
