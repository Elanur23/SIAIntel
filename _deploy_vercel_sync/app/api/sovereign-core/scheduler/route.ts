import { NextRequest, NextResponse } from 'next/server';
import { autonomousScheduler } from '@/lib/sovereign-core/scheduler';

/**
 * GET /api/sovereign-core/scheduler
 * Get scheduler status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = autonomousScheduler.getStatus();

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scheduler GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduler status',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sovereign-core/scheduler
 * Control scheduler (start/stop)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, config } = body;

    if (action === 'start') {
      autonomousScheduler.start(config);
      return NextResponse.json({
        success: true,
        message: 'Scheduler started',
        status: autonomousScheduler.getStatus()
      });
    }

    if (action === 'stop') {
      autonomousScheduler.stop();
      return NextResponse.json({
        success: true,
        message: 'Scheduler stopped',
        status: autonomousScheduler.getStatus()
      });
    }

    if (action === 'trigger') {
      await autonomousScheduler.triggerManualRun();
      return NextResponse.json({
        success: true,
        message: 'Manual run triggered'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: start, stop, or trigger' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Scheduler POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Scheduler operation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
