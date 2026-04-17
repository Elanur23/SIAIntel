/**
 * Dynamic OG Image Generation API
 * 
 * Generates OpenGraph images on-the-fly for social media sharing
 * Uses SVG-to-PNG conversion for high-quality images
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateOGImageHTML } from '@/lib/sia-news/og-image-generator'
import type { Language } from '@/lib/sia-news/types'


export const dynamic = 'force-dynamic';

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract parameters
    const title = searchParams.get('title') || 'SIA Financial Intelligence'
    const language = (searchParams.get('language') || 'en') as Language
    const sentiment = parseInt(searchParams.get('sentiment') || '50')
    const eeat = parseInt(searchParams.get('eeat') || '75')
    const width = parseInt(searchParams.get('width') || '1200')
    const height = parseInt(searchParams.get('height') || '630')
    
    // Generate SVG HTML
    const svgHtml = generateOGImageHTML({
      title,
      language,
      sentiment,
      eeat
    })
    
    // Return SVG as image
    return new NextResponse(svgHtml, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
    
  } catch (error) {
    console.error('OG image generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate OG image' },
      { status: 500 }
    )
  }
}
