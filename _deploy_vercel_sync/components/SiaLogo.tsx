'use client'

import Link from 'next/link'

type SiaLogoProps = {
  href?: string | null
  variant?: 'header' | 'footer' | 'compact'
  className?: string
}

/**
 * SIA Intelligence – Kurumsal logo
 * Finansal istihbarat, veri ve güven teması; hexagon = node/ağ, merkez = sinyal.
 */
export default function SiaLogo({ href = '/', variant = 'header', className = '' }: SiaLogoProps) {
  const isLink = href != null
  const size = variant === 'footer' ? 'lg' : variant === 'compact' ? 'sm' : 'md'
  const iconSize = size === 'lg' ? 44 : size === 'sm' ? 32 : 40
  const textSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl'
  const taglineSize = size === 'lg' ? 'text-[8px]' : 'text-[7px]'
  const tagline = 'Financial Intelligence'

  const mainColor = 'text-white'
  const accentColor = 'text-blue-400'
  const taglineColor = 'text-slate-400'
  const lineColor = 'bg-blue-500/60'

  const content = (
    <div className={`relative flex items-center gap-3 group ${className}`}>
      {/* Mark: hexagon node + signal */}
      <div className="relative flex-shrink-0" style={{ width: iconSize, height: iconSize }}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="siaLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="siaLogoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Hexagon outline */}
          <path
            d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
            fill="none"
            stroke="url(#siaLogoGradient)"
            strokeWidth="1.8"
            strokeLinejoin="round"
            className="transition-opacity group-hover:opacity-100"
          />
          {/* Inner fill subtle */}
          <path
            d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
            fill="url(#siaLogoGlow)"
            fillOpacity="0.15"
          />
          {/* Center node / signal */}
          <circle
            cx="20"
            cy="20"
            r="4"
            fill="none"
            stroke="url(#siaLogoGradient)"
            strokeWidth="1.2"
            className="opacity-90"
          />
          <circle cx="20" cy="20" r="1.5" fill="#3b82f6" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span className={`${textSize} font-black tracking-tighter ${mainColor} uppercase font-heading`}>
            SIA
          </span>
          <span className={`${textSize} font-semibold tracking-tighter ${accentColor} uppercase ml-1 font-heading`}>
            INTEL
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`h-px w-4 ${lineColor} rounded-full`} />
          <span className={`${taglineSize} font-semibold ${taglineColor} uppercase tracking-[0.2em]`}>
            {tagline}
          </span>
        </div>
      </div>
    </div>
  )

  if (isLink) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:ring-offset-[#020203] rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}
