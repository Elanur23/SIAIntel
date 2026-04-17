/**
 * Session Status API
 * 
 * Returns remaining session time for idle timeout monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkIdleTimeout } from '@/lib/auth/idle-timeout';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Not authenticated' 
        },
        { status: 401 }
      );
    }

    // Check idle timeout
    const lastActivity = (session as any).lastActivity as number | undefined;
    const timeoutResult = checkIdleTimeout(lastActivity);

    if (timeoutResult.isExpired) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Session expired due to inactivity',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    // Return session status
    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      remainingTime: Math.floor(timeoutResult.remainingTime / 1000), // seconds
      remainingMinutes: Math.floor(timeoutResult.remainingTime / 60000),
      shouldWarn: timeoutResult.shouldWarn,
      lastActivity: timeoutResult.lastActivity,
    });

  } catch (error) {
    console.error('[SESSION-STATUS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
