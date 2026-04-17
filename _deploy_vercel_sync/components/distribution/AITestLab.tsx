/**
 * AI Test Lab Component
 * Phase 3A.5: Manual AI generation testing interface
 */

'use client'

import { useState } from 'react'
import { executeTest, listTests, type TestExecutionRequest } from '@/lib/distribution/services/ai-test-service'
import { LANGUAGES, PLATFORMS, type Language, type Platform, type DistributionMode, type AITestResult } from '@/lib/distribution/types'

interface AITestLabProps {
  onTestComplete?: (result: AITestResult) => void
}

export default function AITestLab({ onTestComplete }: AITestLabProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentTests, setRecentTests] = useState<AITestResult[]>([])
  
  // Form state
  const [articleId, setArticleId] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceContent, setSourceContent] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en')
  const [targetLocale, setTargetLocale] = useState<Language>('tr')
  const [targetPlatform, setTargetPlatform] = useState<Platform>('x')
  const [generationMode, setGenerationMode] = useState<DistributionMode>('breaking')

  const handleGenerate = async () => {
    setError(null)
    setLoading(true)

    try {
      const request: TestExecutionRequest = {
        articleId: articleId || `test_${Date.now()}`,
        sourceTitle,
        sourceContent,
        sourceLanguage,
        targetLocale,
        targetPlatform,
        generationMode,
        createdBy: 'admin' // TODO: Get from auth context
      }

      const result = await executeTest(request)

      if (!result.success) {
        setError(result.error || 'Test execution failed')
        return
      }

      if (result.testResult) {
        // Add to recent tests
        setRecentTests(prev => [result.testResult!, ...prev.slice(0, 4)])
        
        // Notify parent
        if (onTestComplete) {
          onTestComplete(result.testResult)
        }
      }

      if (result.warnings.length > 0) {
        console.warn('Test warnings:', result.warnings)
      }

    } catch (err: any) {
      setError(err.message || 'Test execution failed')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = sourceTitle.trim().length > 0 && 
                      sourceContent.trim().length >= 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-black uppercase mb-2">AI_TEST_LAB</h2>
        <p className="text-slate-400 text-sm">
          Manual AI generation testing - no publishing, no automation
        </p>
      </div>

      {/* Source Content */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-black uppercase mb-4">SOURCE_CONTENT</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Article ID (optional)
            </label>
            <input
              type="text"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              placeholder="auto-generated if empty"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Source Title *
            </label>
            <input
              type="text"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="Enter article title..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Source Content * (min 100 chars)
            </label>
            <textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder="Enter article content..."
              rows={8}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              {sourceContent.length} characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Source Language
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value as Language)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Test Parameters */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-black uppercase mb-4">TEST_PARAMETERS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Target Locale
            </label>
            <select
              value={targetLocale}
              onChange={(e) => setTargetLocale(e.target.value as Language)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Target Platform
            </label>
            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value as Platform)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              {PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {platform.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Generation Mode
            </label>
            <select
              value={generationMode}
              onChange={(e) => setGenerationMode(e.target.value as DistributionMode)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="breaking">BREAKING</option>
              <option value="editorial">EDITORIAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className={`flex-1 py-4 rounded-lg font-black uppercase transition-all ${
            canGenerate && !loading
              ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'GENERATING...' : 'GENERATE_TEST'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-500 font-bold mb-2">❌ Test Failed</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      )}

      {/* Recent Tests */}
      {recentTests.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-black uppercase mb-4">RECENT_TESTS</h3>
          <div className="space-y-3">
            {recentTests.map(test => (
              <div 
                key={test.id}
                className="bg-black/40 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm">{test.sourceTitle}</p>
                  <span className="text-xs text-slate-500">
                    {test.createdAt.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{test.sourceLanguage.toUpperCase()} → {test.targetLocale.toUpperCase()}</span>
                  <span>•</span>
                  <span>{test.targetPlatform.toUpperCase()}</span>
                  <span>•</span>
                  <span className="text-emerald-500">Trust: {test.trustScore.overall}/100</span>
                  <span>•</span>
                  <span className="text-blue-500">Compliance: {test.complianceScore.overall}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
