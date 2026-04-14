export type RegionCode = 'US' | 'TR' | 'DE' | 'ES' | 'FR' | 'AE';

export const regionalContent: Record<RegionCode, any> = {
  US: { name: 'United States', currency: 'USD' },
  TR: { name: 'Turkey', currency: 'TRY' },
  DE: { name: 'Germany', currency: 'EUR' },
  ES: { name: 'Spain', currency: 'EUR' },
  FR: { name: 'France', currency: 'EUR' },
  AE: { name: 'UAE', currency: 'AED' },
};
