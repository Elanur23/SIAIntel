/**
 * API: Start Autonomous Engine
 * POST /api/sovereign-core/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { startAutonomousEngine, getEngineStatus } from '@/lib/sovereign-core/autonomous-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const config = {
      intervalMinutes: body.intervalMinutes || 15,
      autoCleanOldNews: body.autoCleanOldNews !== false,
      cleanOldNewsDays: body.cleanOldNewsDays || 7,
      maxProcessPerCycle: body.maxProcessPerCycle || 5
    };
    
    startAutonomousEngine(config);
    
    const status = getEngineStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Autonomous engine started',
      status
    });
    
  } catch (error: any) {
    console.error('Start engine error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start engine',
        details: error.message
      },
      { status: 500 }
    );
  }
}
