import { callGeminiCentral } from '@/lib/neural-assembly/gemini-central-provider'

export interface FormattedArticle {
  headline: string
  subheadline: string
  summary: string
  body: string
  keyInsights: string[]
  riskNote: string
}

/**
 * Validates if an object is a valid FormattedArticle
 */
function isValidFormattedArticle(obj: any): obj is FormattedArticle {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.headline === 'string' &&
    obj.headline.trim().length > 0 &&
    typeof obj.subheadline === 'string' &&
    typeof obj.summary === 'string' &&
    typeof obj.body === 'string' &&
    obj.body.trim().length > 0 &&
    Array.isArray(obj.keyInsights) &&
    obj.keyInsights.every((insight: any) => typeof insight === 'string') &&
    typeof obj.riskNote === 'string'
  )
}

/**
 * Extracts JSON from AI response that may contain markdown fences or extra text
 */
function extractJsonFromResponse(text: string): string {
  // Remove markdown code fences if present
  const withoutFences = text.replace(/```json\s*|\s*```/g, '')
  
  // Try to find the first JSON object
  const jsonMatch = withoutFences.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  
  return withoutFences.trim()
}

/**
 * Creates a safe local fallback FormattedArticle from raw content
 */
function createLocalFallback(raw: string): FormattedArticle {
  const lines = raw.split('\n').map(line => line.trim()).filter(Boolean)
  
  if (lines.length === 0) {
    throw new Error('Raw content is empty or contains no usable text')
  }
  
  // Extract headline from first meaningful line or first sentence
  const firstLine = lines[0]
  const headline = firstLine.length > 100 
    ? firstLine.split(/[.!?]/)[0].trim() || firstLine.substring(0, 80).trim() + '...'
    : firstLine
  
  // Create subheadline from second line or first sentence of first paragraph
  const subheadline = lines.length > 1 
    ? lines[1].length > 150 ? lines[1].substring(0, 120).trim() + '...' : lines[1]
    : headline.split(/[.!?]/)[1]?.trim() || ''
  
  // Create summary from first few sentences
  const firstParagraph = lines.slice(0, 3).join(' ')
  const sentences = firstParagraph.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 0 ? '.' : '')
  
  // Clean body content - remove system artifacts and format nicely
  const cleanedLines = lines
    .filter(line => !line.match(/^\[.*\]$|^#|^\*\*|^--|^===/))
    .map(line => line.replace(/^\s*[-*•]\s*/, '• '))
  
  const body = cleanedLines.length > 0 
    ? cleanedLines.join('\n\n')
    : raw.replace(/\[.*?\]/g, '').trim()
  
  // Extract key insights from bullet-like lines or important short statements
  const keyInsights: string[] = []
  for (const line of lines) {
    if (line.match(/^\s*[-*•]\s*/) || (line.length < 100 && line.includes(':'))) {
      const insight = line.replace(/^\s*[-*•]\s*/, '').trim()
      if (insight.length > 10 && insight.length < 200) {
        keyInsights.push(insight)
      }
    }
  }
  
  // Limit to 5 key insights
  const limitedInsights = keyInsights.slice(0, 5)
  
  return {
    headline: headline || 'Intelligence Report',
    subheadline: subheadline || '',
    summary: summary || 'Intelligence report analysis.',
    body: body || raw,
    keyInsights: limitedInsights,
    riskNote: 'This article is based on the available raw intelligence report and should be reviewed before publication.'
  }
}

const EDITORIAL_TRANSFORM_PROMPT = `ROLE:
You are a professional newsroom editor for a global intelligence news platform.

MISSION:
Transform the given RAW intelligence report into a clean, publishable, high-quality news article.

STRICT RULES:
- REMOVE all system tags like: [REPORT_METADATA], [DEEP ANALYSIS], [INTELLIGENCE_REPORT_END], etc.
- DO NOT show brackets or internal labels
- DO NOT mention "OSINT", "internal document", "classified" explicitly
- DO NOT output raw dump structure
- WRITE like a premium financial/news article (Bloomberg / FT style)
- KEEP facts, numbers, and insights 100% intact
- NO hallucination

OUTPUT STRUCTURE (MANDATORY):
Return ONLY valid JSON with this exact structure:
{
  "headline": "Strong, clear, non-clickbait headline (max 14 words)",
  "subheadline": "1 sentence summary",
  "summary": "2-3 sentences (very clear)",
  "body": "Clean paragraphs. No bullet spam. Explain clearly, readable.",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "riskNote": "Short disclaimer (natural tone, not robotic)"
}

STYLE:
- Professional
- Clear
- Human-readable
- Not robotic, not academic`

export async function transformRawToArticle(raw: string): Promise<FormattedArticle> {
  // Validate input
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error('Raw content is empty or invalid')
  }

  const trimmedRaw = raw.trim()
  if (trimmedRaw.length < 10) {
    throw new Error('Raw content is too short to transform into an article')
  }

  try {
    // Attempt AI provider transformation first
    const result = await callGeminiCentral({
      context: {
        module: 'editorial',
        function: 'transformRawToArticle',
        purpose: 'Transform raw intelligence report to publishable article',
      },
      systemInstruction: EDITORIAL_TRANSFORM_PROMPT,
      prompt: `INPUT:\n${trimmedRaw}\n\nOUTPUT:\nReturn ONLY the formatted article as valid JSON. No explanations.`,
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    })

    // Parse and validate AI response
    let parsed: any
    try {
      const jsonText = extractJsonFromResponse(result.text)
      parsed = JSON.parse(jsonText)
    } catch (parseError) {
      console.warn('[EDITORIAL] AI response JSON parse failed, using local fallback:', parseError)
      return createLocalFallback(trimmedRaw)
    }

    // Validate AI response structure
    if (!isValidFormattedArticle(parsed)) {
      console.warn('[EDITORIAL] AI response validation failed, using local fallback. Response:', parsed)
      return createLocalFallback(trimmedRaw)
    }

    // AI response is valid, return it with defensive defaults
    return {
      headline: parsed.headline.trim(),
      subheadline: parsed.subheadline?.trim() || '',
      summary: parsed.summary?.trim() || '',
      body: parsed.body.trim(),
      keyInsights: Array.isArray(parsed.keyInsights) 
        ? parsed.keyInsights.filter((insight: any) => typeof insight === 'string' && insight.trim().length > 0)
        : [],
      riskNote: parsed.riskNote?.trim() || 'This report is for informational purposes only.',
    }
  } catch (error) {
    console.warn('[EDITORIAL] AI provider failed, using local fallback:', error)
    // Use local fallback when AI provider fails
    return createLocalFallback(trimmedRaw)
  }
}
