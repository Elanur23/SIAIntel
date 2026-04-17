'use client'

interface AdSensePlaceholderProps {
  slot: 'header' | 'sidebar' | 'in-article'
  className?: string
}

export default function AdSensePlaceholder({ slot, className = '' }: AdSensePlaceholderProps) {
  const adSenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID

  // Don't render if AdSense ID not configured
  if (!adSenseId || adSenseId === 'ca-pub-xxxxxxxxxxxxxxxx') {
    return null
  }

  const dimensions = {
    header: 'h-[90px] md:h-[250px]',
    sidebar: 'h-[600px] w-[300px]',
    'in-article': 'h-[250px]',
  }

  return (
    <div
      className={`${dimensions[slot]} ${className} flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-xl`}
    >
      <div className="text-center">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Advertisement</div>
        <div className="text-[10px] text-white/20 font-mono">AdSense Slot: {slot}</div>
      </div>
    </div>
  )
}
