/**
 * SIA AI GENERATOR — Gemini is the EXCLUSIVE model for news writing.
 * Do NOT add Groq or other models here — Groq is reserved for Flash Radar scanning.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withQuotaGuard } from '@/lib/ai/quota-guard'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface GenerateNewsParams {
  topic: string
  language: string
  category: string
  tone?: 'professional' | 'casual' | 'formal'
  length?: 'short' | 'medium' | 'long'
}

export interface GeneratedNews {
  title: string
  content: string
  excerpt: string
  keywords: string[]
}

const languageNames: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  ru: 'Russian',
  jp: 'Japanese',
  zh: 'Chinese'
}

const lengthWords: Record<string, string> = {
  short: '300-500 words',
  medium: '500-800 words',
  long: '800-1200 words'
}

export async function generateNewsArticle(params: GenerateNewsParams): Promise<GeneratedNews> {
  const {
    topic,
    language,
    category,
    tone = 'professional',
    length = 'medium'
  } = params

  const languageName = languageNames[language] || 'English'
  const wordCount = lengthWords[length]

  const prompt = `You are a professional news writer. Write a complete news article with the following specifications:

Topic: ${topic}
Language: ${languageName}
Category: ${category}
Tone: ${tone}
Length: ${wordCount}

Requirements:
1. Write in ${languageName} language ONLY
2. Create an engaging, SEO-friendly title
3. Write a compelling 2-3 sentence excerpt/summary
4. Write the full article with proper structure (introduction, body, conclusion)
5. Use journalistic style with facts and balanced perspective
6. Include relevant keywords for SEO
7. Make it informative and engaging

Return the response in this exact JSON format:
{
  "title": "Article title here",
  "excerpt": "Brief summary here",
  "content": "Full article content with paragraphs separated by \\n\\n",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Important: Return ONLY the JSON object, no additional text.`

  const result = await withQuotaGuard('gemini', async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    return model.generateContent(prompt)
  })

  if (!result) {
    throw new Error('Gemini quota exceeded. Lütfen birkaç dakika bekleyin.')
  }

  try {
    const text = result.response.text()
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '')
    }
    const generated = JSON.parse(cleanedText)
    return {
      title: generated.title,
      content: generated.content,
      excerpt: generated.excerpt,
      keywords: generated.keywords || [],
    }
  } catch (error) {
    console.error('[AI Generator] Parse error:', error)
    throw new Error('Failed to generate news article. Please try again.')
  }
}

export async function improveContent(content: string, language: string): Promise<string> {
  const languageName = languageNames[language] || 'English'

  const prompt = `You are a professional editor. Improve the following news article content:

Language: ${languageName}

Content:
${content}

Requirements:
1. Fix grammar and spelling errors
2. Improve sentence structure and flow
3. Make it more engaging and professional
4. Keep the same language (${languageName})
5. Maintain the original meaning and facts
6. Return ONLY the improved content, no additional text

Improved content:`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text().trim()
  } catch (error) {
    console.error('Content Improvement Error:', error)
    throw new Error('Failed to improve content. Please try again.')
  }
}

export async function generateSEOMetadata(title: string, content: string, language: string) {
  const languageName = languageNames[language] || 'English'

  const prompt = `Generate SEO metadata for this news article:

Title: ${title}
Language: ${languageName}
Content: ${content.substring(0, 500)}...

Generate:
1. Meta description (150-160 characters)
2. 5-7 relevant keywords
3. Open Graph title (optimized for social media)
4. Open Graph description

Return in JSON format:
{
  "metaDescription": "description here",
  "keywords": ["keyword1", "keyword2"],
  "ogTitle": "social media title",
  "ogDescription": "social media description"
}

Return ONLY the JSON object.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text().trim()
    
    let cleanedText = text
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }
    
    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('SEO Metadata Generation Error:', error)
    return {
      metaDescription: title,
      keywords: [],
      ogTitle: title,
      ogDescription: content.substring(0, 160)
    }
  }
}
