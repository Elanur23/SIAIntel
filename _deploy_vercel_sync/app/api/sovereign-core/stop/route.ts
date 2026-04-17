/**
 * API: Stop Autonomous Engine
 * POST /api/sovereign-core/stop
 */

import { NextRequest, NextResponse } from 'next/server';
import { stopAutonomousEngine, getEngineStatus } from '@/lib/sovereign-core/autonomous-engine';

export async function POST(request: NextRequest) {
  try {
    stopAutonomousEngine();
    
    const status = getEngineStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Autonomous engine stopped',
      status
    });
    
  } catch (error: any) {
    console.error('Stop engine error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to stop engine',
        details: error.message
      },
      { status: 500 }
    );
  }
}
