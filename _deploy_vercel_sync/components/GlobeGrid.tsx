'use client'

export default function GlobeGrid({ className = '' }: { className?: string }) {
  const rings = 8
  const segments = 16

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full opacity-[0.06]"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
          </linearGradient>
        </defs>
        <g transform="translate(200, 200)">
          {/* Latitude rings */}
          {Array.from({ length: rings - 1 }).map((_, i) => {
            const y = -150 + ((i + 1) * 300) / rings
            const r = Math.sqrt(150 * 150 - y * y)
            return (
              <ellipse
                key={`lat-${i}`}
                cx="0"
                cy={y}
                rx={r}
                ry={r * 0.3}
                fill="none"
                stroke="url(#globeGrad)"
                strokeWidth="0.5"
              />
            )
          })}
          {/* Longitude lines */}
          {Array.from({ length: segments }).map((_, i) => {
            const angle = (i * Math.PI * 2) / segments
            const x1 = -150 * Math.cos(angle)
            const y1 = 150 * 0.3 * Math.sin(angle)
            const x2 = 150 * Math.cos(angle)
            const y2 = -150 * 0.3 * Math.sin(angle)
            return (
              <line
                key={`lon-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#globeGrad)"
                strokeWidth="0.5"
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}
