/**
 * SIA SEARCH PERFORMANCE SERVICE - GOOGLE SEARCH CONSOLE API
 * FEATURES: DISCOVER METRICS | IMPRESSIONS | CLICK-THROUGH RATE (CTR)
 */

import { google } from 'googleapis';
import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

const searchConsole = google.searchconsole('v1');

/**
 * Get authenticated Search Console client
 */
async function getSearchConsoleAuth() {
  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_SEARCH_CONSOLE] Google Cloud credentials not configured');
  }

  const auth = new google.auth.JWT(
    config.clientEmail,
    undefined,
    config.privateKey,
    ['https://www.googleapis.com/auth/webmasters.readonly']
  );

  return auth;
}

export interface PerformanceStats {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Fetches Google Discover and Search performance for specific pages
 * Critical for measuring the impact of SIA Intelligence Leaks
 */
export async function getPerformanceData(
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] = ['page', 'device', 'query']
): Promise<any> {
  try {
    const auth = await getSearchConsoleAuth();

    const response = await searchConsole.searchanalytics.query({
      siteUrl: siteUrl,
      auth: auth,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit: 100,
      },
    });

    sentinel.log('SEARCH_CONSOLE', 'SUCCESS', `Performance data fetched for site: ${siteUrl}`);

    return response.data.rows || [];

  } catch (error: any) {
    sentinel.log('SEARCH_CONSOLE', 'ERROR', `Failed to fetch performance: ${error.message}`);
    throw error;
  }
}

/**
 * Specialized Discover Report for Google Discover "Top Stories"
 */
export async function getDiscoverReport(siteUrl: string, days: number = 30): Promise<any> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const auth = await getSearchConsoleAuth();

    // Google Discover uses "discover" as searchType in specific API versions or filtered by dimensions
    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      auth,
      requestBody: {
        startDate,
        endDate,
        // For Discover, dimension usually needs to be page and optionally device
        dimensions: ['page'],
        type: 'discover', // Explicitly fetch Discover data
      }
    });

    return response.data.rows || [];
  } catch (error: any) {
    sentinel.log('SEARCH_CONSOLE', 'ERROR', `Discover report failed: ${error.message}`);
    return [];
  }
}
