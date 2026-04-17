/**
 * SIA WHALE NODE VISUALIZATION - GOOGLE MAPS SERVICE
 * FEATURES: GEO-SPATIAL TRACKING | INSTITUTIONAL HUB MAPPING | WHALE FLOWS
 */

export interface WhaleNode {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  intensity: number; // 0-100 (Liquidity depth)
  type: 'CUSTODIAN' | 'CENTRAL_BANK' | 'EXCHANGE' | 'DARK_POOL';
  assets: string[];
}

// Fixed coordinates for major institutional nodes
export const GLOBAL_HUBS: Record<string, { lat: number, lng: number }> = {
  'NEW_YORK': { lat: 40.7128, lng: -74.0060 },
  'GENEVA': { lat: 46.2044, lng: 6.1432 },
  'HONG_KONG': { lat: 22.3193, lng: 114.1694 },
  'SINGAPORE': { lat: 1.3521, lng: 103.8198 },
  'LONDON': { lat: 51.5074, lng: -0.1278 },
  'ABU_DHABI': { lat: 24.4539, lng: 54.3773 },
  'TOKYO': { lat: 35.6762, lng: 139.6503 },
  'ZURICH': { lat: 47.3769, lng: 8.5417 },
};

/**
 * Generates a heat map dataset for the terminal's global dashboard
 * Connects "Lazarus-X" nodes to geographical coordinates
 */
export function getWhaleHeatMap(activeProject?: string): WhaleNode[] {
  // Default institutional nodes
  const nodes: WhaleNode[] = [
    {
      id: 'NODE_NY_JPM',
      name: 'J.P. Morgan Liquidity Hub',
      location: GLOBAL_HUBS.NEW_YORK,
      intensity: 95,
      type: 'CUSTODIAN',
      assets: ['DOLLAR', 'BTC', 'ETH']
    },
    {
      id: 'NODE_GEN_BNY',
      name: 'BNY Mellon Geneva Vault',
      location: GLOBAL_HUBS.GENEVA,
      intensity: 88,
      type: 'CUSTODIAN',
      assets: ['BTC', 'GOLD']
    },
    {
      id: 'NODE_ZUR_LAZARUS',
      name: 'Lazarus-X Quantum Node',
      location: GLOBAL_HUBS.ZURICH,
      intensity: 92,
      type: 'DARK_POOL',
      assets: ['BTC', 'LOST_ASSETS']
    },
    {
      id: 'NODE_AD_CENTRAL',
      name: 'Abu Dhabi Digital Asset Reserve',
      location: GLOBAL_HUBS.ABU_DHABI,
      intensity: 85,
      type: 'CENTRAL_BANK',
      assets: ['MBRIDGE', 'DOLLAR']
    }
  ];

  if (activeProject === 'LAZARUS_X') {
    // Boost Swiss nodes intensity if Lazarus-X is active
    return nodes.map(node => {
      if (node.id.includes('GEN') || node.id.includes('ZUR')) {
        return { ...node, intensity: 100 };
      }
      return node;
    });
  }

  return nodes;
}

/**
 * Returns Google Maps API configuration
 */
export function getMapConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    defaultCenter: GLOBAL_HUBS.GENEVA,
    defaultZoom: 4,
    styles: [
      {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
      },
      // Dark theme styles for SIA Terminal
      // ...
    ]
  };
}
