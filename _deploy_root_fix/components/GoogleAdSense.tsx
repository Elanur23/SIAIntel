'use client'

import Script from 'next/script'

interface GoogleAdSenseProps {
  adSenseId: string
}

export default function GoogleAdSense({ adSenseId }: GoogleAdSenseProps) {
  // Don't load if ID is placeholder or missing
  if (!adSenseId || adSenseId.includes('XXX')) {
    return null
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
