import { NextRequest, NextResponse } from 'next/server';
import { generateDIPAnalysis } from '@/lib/ai/deep-intelligence-pro';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { newsContent, additionalContext } = body;

    if (!newsContent) {
      return NextResponse.json(
        { error: 'newsContent gerekli' },
        { status: 400 }
      );
    }

    const report = await generateDIPAnalysis(newsContent, additionalContext);

    return NextResponse.json({
      success: true,
      data: report,
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-002',
        methodology: '10-Layer DIP Analysis'
      }
    });

  } catch (error) {
    console.error('Deep Intelligence API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Deep Intelligence analysis failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
