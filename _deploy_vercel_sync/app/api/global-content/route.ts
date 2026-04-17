import { NextRequest, NextResponse } from 'next/server';
import { generateGlobalContent } from '@/lib/ai/global-cpm-master';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { newsContent } = body;

    if (!newsContent) {
      return NextResponse.json(
        { error: 'newsContent gerekli' },
        { status: 400 }
      );
    }

    const contentPackage = await generateGlobalContent(newsContent);

    return NextResponse.json({
      success: true,
      data: contentPackage,
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-002',
        languagesGenerated: contentPackage.languages.length,
        totalCPM: contentPackage.totalCPMPotential
      }
    });

  } catch (error) {
    console.error('Global Content API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Global content generation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
