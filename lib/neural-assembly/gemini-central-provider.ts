export interface GeminiCallContext {
  module: string
  function: string
  purpose?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface GeminiCallRequest {
  context?: GeminiCallContext
  prompt?: string | string[]
  systemInstruction?: string
  model?: string
  generationConfig?: Record<string, unknown>
  [key: string]: unknown
}

export interface GeminiCallResult {
  text: string
  content: string
  model: string
  provider: 'fallback'
  [key: string]: unknown
}

function buildFallbackText(request: GeminiCallRequest): string {
  const promptValue = Array.isArray(request.prompt) ? request.prompt.join('\n') : request.prompt
  const prompt = String(promptValue || '')

  if (prompt.includes('"title"') && prompt.includes('"excerpt"') && prompt.includes('"content"')) {
    return JSON.stringify({
      title: 'Generated Title',
      excerpt: 'Generated summary.',
      content: 'Generated content body.',
      keywords: [],
    })
  }

  if (prompt.includes('"languages"')) {
    return JSON.stringify({ languages: [] })
  }

  if (prompt.includes('JSON')) {
    return '{}'
  }

  return 'Generated fallback response.'
}

export async function callGeminiCentral(request: GeminiCallRequest): Promise<GeminiCallResult> {
  const text = buildFallbackText(request)
  return {
    text,
    content: text,
    model: String(request.model || 'gemini-fallback'),
    provider: 'fallback',
  }
}

export async function generateEmbeddingCentral(params: {
  text: string
  context?: GeminiCallContext
}): Promise<{ embedding: number[] }> {
  const normalized = params.text.slice(0, 512)
  const embedding = Array.from({ length: 32 }, (_, index) => {
    const code = normalized.charCodeAt(index % Math.max(1, normalized.length)) || 0
    return Number((code / 255).toFixed(6))
  })

  return { embedding }
}
