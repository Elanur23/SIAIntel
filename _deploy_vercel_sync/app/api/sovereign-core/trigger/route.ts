import { NextRequest, NextResponse } from 'next/server';
import { neuroSyncKernel } from '@/lib/sovereign-core/neuro-sync-kernel';

/**
 * POST /api/sovereign-core/trigger
 * Manually trigger a processing cycle
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[API] Manual cycle trigger requested');

    const result = await neuroSyncKernel.processCycle();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trigger API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger cycle',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
