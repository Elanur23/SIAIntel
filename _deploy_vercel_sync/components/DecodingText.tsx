'use client'

import { useDecodingText } from '@/hooks/useDecodingText'

interface DecodingTextProps {
  text: string
  duration?: number
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

/**
 * DECODING TEXT COMPONENT
 * 
 * Wrapper component for the useDecodingText hook.
 * Displays text with a one-time character scramble effect on mount.
 * 
 * Perfect for hero headlines and high-impact text in intelligence terminals.
 * 
 * Props:
 * - text: The text to display (required)
 * - duration: Animation duration in ms (default: 500)
 * - className: Tailwind classes to apply
 * - as: HTML element to render (default: 'span')
 * 
 * Usage:
 * <DecodingText 
 *   text="Bitcoin Surges 8% on Institutional Buying" 
 *   duration={600}
 *   className="text-5xl font-bold"
 *   as="h1"
 * />
 */
export default function DecodingText({ 
  text, 
  duration = 500, 
  className = '',
  as: Component = 'span'
}: DecodingTextProps) {
  const { displayText, isDecoding } = useDecodingText(text, duration)

  return (
    <Component className={className}>
      {displayText}
    </Component>
  )
}
