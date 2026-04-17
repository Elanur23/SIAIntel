/**
 * SIA GA4 FINAL VALIDATION SCRIPT - V1
 * Ensures real connection validation and strict JSON output.
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables BEFORE importing the service to ensure they are available
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Now import the service
import { GoogleAnalyticsService } from '../lib/signals/google-analytics-service';

async function validateGA4() {
  try {
    const service = GoogleAnalyticsService.getInstance();
    const result = await service.checkConnection();

    // Mission requirement: Output STRICT JSON
    console.log(JSON.stringify(result, null, 2));

    if (result.ga_status === 'CONNECTED') {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error(JSON.stringify({
      ga_status: 'NOT_CONNECTED',
      avg_read_time_seconds: null,
      engagement_rate: null,
      sessions: null,
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exit(1);
  }
}

validateGA4();
