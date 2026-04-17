import { NextRequest, NextResponse } from 'next/server';
import { generateSEOMetadata } from '@/lib/ai/seo-meta-architect';
import { DIPAnalysisReport } from '@/lib/ai/deep-intelligence-pro';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('SEO Architect: Metadata oluşturuluyor...');

    const body = await request.json();
    const { report, baseUrl } = body;

    if (!report) {
      return NextResponse.json(
        { error: 'DIP Analysis report gerekli' },
        { status: 400 }
      );
    }

    const metadata = await generateSEOMetadata(
      report as DIPAnalysisReport,
      baseUrl || 'https://sia-terminal.com'
    );

    return NextResponse.json({
      success: true,
      data: metadata,
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      }
    });

  } catch (error) {
    console.error('SEO Architect API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'SEO metadata generation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
