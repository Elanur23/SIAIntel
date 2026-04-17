import { NextRequest, NextResponse } from 'next/server';
import { DIPAnalysisReport } from '@/lib/ai/deep-intelligence-pro';
import { SEOMetadata } from '@/lib/ai/seo-meta-architect';


export const dynamic = 'force-dynamic';

// In-memory storage (production'da database kullan)
let publishedReports: Array<{
  id: string;
  dipReport: DIPAnalysisReport;
  seoMetadata: SEOMetadata;
  status: 'draft' | 'published';
  publishedAt: string;
}> = [];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Intelligence Save: Rapor kaydediliyor...');

    const body = await request.json();
    const { dipReport, seoMetadata, status } = body;

    if (!dipReport || !seoMetadata) {
      return NextResponse.json(
        { error: 'dipReport ve seoMetadata gerekli' },
        { status: 400 }
      );
    }

    const savedReport = {
      id: `INTEL-${Date.now()}`,
      dipReport,
      seoMetadata,
      status: status || 'published',
      publishedAt: new Date().toISOString()
    };

    publishedReports.unshift(savedReport); // En yenisi başta

    // En fazla 10 rapor tut
    if (publishedReports.length > 10) {
      publishedReports = publishedReports.slice(0, 10);
    }

    console.log(`Intelligence saved: ${savedReport.id}`);

    return NextResponse.json({
      success: true,
      data: savedReport,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Intelligence Save API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save intelligence report',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const status = searchParams.get('status') || 'published';

    const filtered = publishedReports.filter(r => r.status === status);
    const limited = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limited,
      metadata: {
        total: filtered.length,
        returned: limited.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Intelligence Get API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch intelligence reports',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
