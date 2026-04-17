import { NextRequest, NextResponse } from 'next/server';
import { neuroSyncKernel } from '@/lib/sovereign-core/neuro-sync-kernel';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sovereign-core/published
 * Returns recently published content
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const publishedContent = neuroSyncKernel.getPublishedContent(limit);

    return NextResponse.json({
      success: true,
      data: publishedContent,
      count: publishedContent.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Published API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get published content',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
