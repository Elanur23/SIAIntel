/**
 * Idle Timeout Management
 * 
 * Tracks user activity and enforces idle timeout policy.
 * Compatible with NextAuth.js 5 beta.
 */

import { NextRequest } from 'next/server';

// Configuration
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export interface IdleTimeoutResult {
  isExpired: boolean;
  remainingTime: number; // milliseconds
  shouldWarn: boolean;
  lastActivity: number;
}

/**
 * Check if session has exceeded idle timeout
 */
export function checkIdleTimeout(lastActivity: number | null | undefined): IdleTimeoutResult {
  const now = Date.now();
  const lastActivityTime = lastActivity || now;
  const idleTime = now - lastActivityTime;
  const remainingTime = Math.max(0, IDLE_TIMEOUT_MS - idleTime);
  
  return {
    isExpired: idleTime > IDLE_TIMEOUT_MS,
    remainingTime,
    shouldWarn: remainingTime < WARNING_THRESHOLD_MS && remainingTime > 0,
    lastActivity: lastActivityTime,
  };
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): number {
  return Date.now();
}

/**
 * Extract session from NextAuth token
 */
export function getSessionFromToken(token: any): { lastActivity?: number } | null {
  if (!token) return null;
  
  return {
    lastActivity: token.lastActivity as number | undefined,
  };
}
