/**
 * AdSense Placeholder - AdSense onayı sonrası gerçek reklam ID'leri ile değiştirilecek
 * NEXT_PUBLIC_GOOGLE_ADSENSE_ID env ile yapılandırın
 */
'use client'

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXX'

type SlotType = 'HEADER' | 'FOOTER' | 'SIDEBAR' | 'IN_ARTICLE' | 'IN_FEED'

interface AdsUnitPlaceholderProps {
  slot: SlotType
  slotId?: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
}

const SLOT_IDS: Record<SlotType, string> = {
  HEADER: '1111111111',
  FOOTER: '2222222222',
  SIDEBAR: '3333333333',
  IN_ARTICLE: '4444444444',
  IN_FEED: '5555555555',
}

export default function AdsUnitPlaceholder({
  slot,
  slotId,
  format = 'auto',
  className = '',
}: AdsUnitPlaceholderProps) {
  const adSlot = slotId || SLOT_IDS[slot]
  const isPlaceholder = !ADSENSE_CLIENT || ADSENSE_CLIENT.includes('XXX')

  if (isPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-xl min-h-[90px] ${className}`}
        data-ad-slot-placeholder={slot}
      >
        <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">
          AdSense: {slot} (Placeholder)
        </span>
      </div>
    )
  }

  return (
    <div className={`ads-unit-wrapper ${className}`} data-slot={slot}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center', minHeight: '90px' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
