/**
 * SIA OSINT INTELLIGENCE - GOOGLE CUSTOM SEARCH SERVICE
 * FEATURES: 24/7 LEAK TRACKING | TARGETED URL MONITORING | KEYWORD TRIGGERS
 */

import { google } from 'googleapis';
import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

const customSearch = google.customsearch('v1');

/**
 * Initializes the Custom Search Client
 * Note: Requires GOOGLE_CUSTOM_SEARCH_ID (CX) in .env
 */
async function getSearchClient() {
  const config = getGoogleCloudConfig();
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ID;

  if (!config || !cx) {
    throw new Error('[SIA_OSINT] Custom Search ID or Google Credentials missing');
  }

  return { customSearch, cx, apiKey: process.env.GOOGLE_API_KEY };
}

export interface LeakDetection {
  title: string;
  link: string;
  snippet: string;
  source: string;
  timestamp: string;
}

/**
 * Scans the deep/clear web for specific institutional leaks
 * (e.g., "Project Lazarus-X", "State Street Bitcoin Protocol")
 */
export async function scanForLeaks(query: string): Promise<LeakDetection[]> {
  try {
    const { customSearch, cx } = await getSearchClient();

    const response = await customSearch.cse.list({
      cx: cx,
      q: query,
      num: 5, // Top 5 results to avoid noise
      dateRestrict: 'd[1]', // Only last 24 hours
    });

    const results = response.data.items || [];

    const detections: LeakDetection[] = results.map(item => ({
      title: item.title || 'N/A',
      link: item.link || '#',
      snippet: item.snippet || '',
      source: item.displayLink || 'Unknown',
      timestamp: new Date().toISOString()
    }));

    sentinel.log('GOOGLE_OSINT', 'SUCCESS',
      `Scan complete for: "${query}". Found ${detections.length} potential leads.`);

    return detections;

  } catch (error: any) {
    sentinel.log('GOOGLE_OSINT', 'ERROR', `Scan failed: ${error.message}`);
    return [];
  }
}

/**
 * Checks for "Project Lazarus-X" related updates across specific dark/finance nodes
 */
export async function monitorLazarusXNodes(): Promise<LeakDetection[]> {
  const queries = [
    'Project Lazarus-X State Street leak',
    'BNY Mellon quantum bitcoin recovery protocol',
    'Swiss banking summit secret recording 2026'
  ];

  let allLeads: LeakDetection[] = [];

  for (const q of queries) {
    const results = await scanForLeaks(q);
    allLeads = [...allLeads, ...results];
  }

  return allLeads;
}
