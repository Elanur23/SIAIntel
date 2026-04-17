/**
 * AUTONOMOUS SCHEDULER
 * Runs Neuro-Sync Kernel every 15 minutes
 * Production: Use APScheduler or node-cron
 */

import { neuroSyncKernel } from './neuro-sync-kernel';

export interface SchedulerConfig {
  intervalMinutes: number;
  autoStart: boolean;
  runOnStartup: boolean;
}

class AutonomousScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  private config: SchedulerConfig = {
    intervalMinutes: 15,
    autoStart: false,
    runOnStartup: true
  };

  /**
   * Start the scheduler
   */
  start(config?: Partial<SchedulerConfig>): void {
    if (this.isRunning) {
      console.warn('[SCHEDULER] Already running');
      return;
    }

    // Update config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('\n========================================');
    console.log('⚡ AUTONOMOUS SCHEDULER STARTING');
    console.log(`Interval: ${this.config.intervalMinutes} minutes`);
    console.log(`Run on startup: ${this.config.runOnStartup}`);
    console.log('========================================\n');

    this.isRunning = true;

    // Run immediately if configured
    if (this.config.runOnStartup) {
      console.log('[SCHEDULER] Running initial cycle...');
      this.runCycle();
    }

    // Schedule recurring runs
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runCycle();
    }, intervalMs);

    console.log(`[SCHEDULER] Scheduled to run every ${this.config.intervalMinutes} minutes`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[SCHEDULER] Not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    console.log('\n========================================');
    console.log('⚡ AUTONOMOUS SCHEDULER STOPPED');
    console.log('========================================\n');
  }

  /**
   * Run a single cycle
   */
  private async runCycle(): Promise<void> {
    try {
      console.log(`[SCHEDULER] Triggering cycle at ${new Date().toISOString()}`);
      await neuroSyncKernel.processCycle();
    } catch (error) {
      console.error('[SCHEDULER] Cycle error:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    config: SchedulerConfig;
    nextRun: string | null;
  } {
    let nextRun: string | null = null;
    
    if (this.isRunning && this.intervalId) {
      // Estimate next run (not exact, but close enough)
      const nextRunTime = new Date(Date.now() + this.config.intervalMinutes * 60 * 1000);
      nextRun = nextRunTime.toISOString();
    }

    return {
      isRunning: this.isRunning,
      config: this.config,
      nextRun
    };
  }

  /**
   * Trigger manual run
   */
  async triggerManualRun(): Promise<void> {
    console.log('[SCHEDULER] Manual run triggered');
    await this.runCycle();
  }
}

// Singleton instance
export const autonomousScheduler = new AutonomousScheduler();
