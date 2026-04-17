/**
 * SIA EMBEDDING SERVICE - V2.0
 * Uses Google Gemini text-embedding-004 for high-precision semantic vectors.
 * Enables cross-language intelligence and topical authority.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generates a high-dimensional vector for a given text.
 * Optimized for financial and news context.
 */
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // Truncate text if it's too long (embedding-004 limit is 2048 tokens)
    const cleanText = text.substring(0, 8000);

    const result = await model.embedContent(cleanText);
    const embedding = result.embedding;

    return embedding.values;
  } catch (e: any) {
    console.error('[SIA_EMBEDDING] Failed to generate vector:', e.message);
    return null;
  }
}

/**
 * Calculates Cosine Similarity between two vectors.
 * Returns a score between 0 and 1.
 */
export function calculateSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let mA = 0;
  let mb = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mb += vecB[i] * vecB[i];
  }

  mA = Math.sqrt(mA);
  mb = Math.sqrt(mb);

  return dotProduct / (mA * mb);
}

/**
 * Sanitizes news content for better embedding quality.
 */
export function prepareForEmbedding(title: string, summary: string): string {
  return `Title: ${title}\nContext: ${summary}`.toLowerCase();
}
