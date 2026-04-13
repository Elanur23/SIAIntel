/**
 * SIA REVENUE OPTIMIZER - V1.0
 * Contextual Affiliate & Lead Gen Engine
 *
 * Logic: Matches article category/content with high-CPC affiliate offers.
 */

export interface AffiliateOffer {
  id: string
  label: string
  cta: string
  url: string
  category: 'CRYPTO' | 'STOCKS' | 'ECONOMY' | 'AI' | 'GLOBAL'
  color: string
}

const OFFERS: AffiliateOffer[] = [
  {
    id: 'binance-global',
    label: 'Trade Crypto with 20% Rebate',
    cta: 'Initialize_Trade_Uplink',
    url: 'https://accounts.binance.com/register?ref=YOUR_REF', // User to replace
    category: 'CRYPTO',
    color: 'bg-orange-500'
  },
  {
    id: 'ibkr-global',
    label: 'Institutional Stock Trading',
    cta: 'Open_Brokerage_Account',
    url: 'https://www.interactivebrokers.com',
    category: 'STOCKS',
    color: 'bg-blue-600'
  },
  {
    id: 'sia-pro-max',
    label: 'Unlock Full Pro Max Analysis',
    cta: 'Upgrade_to_Sovereign',
    url: '/pricing',
    category: 'GLOBAL',
    color: 'bg-purple-600'
  }
]

/**
 * Returns the most relevant offer based on article category
 */
export function getContextualOffer(category: string): AffiliateOffer {
  const normalized = category.toUpperCase();
  const match = OFFERS.find(o => normalized.includes(o.category));
  return match || OFFERS.find(o => o.category === 'GLOBAL')!;
}
