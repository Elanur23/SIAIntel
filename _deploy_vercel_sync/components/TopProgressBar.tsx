'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Sayfa değiştiğinde yükleme animasyonunu başlat
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 600) // Next.js geçişleri genelde hızlıdır

    return () => clearTimeout(timeout)
  }, [pathname, searchParams])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: '100%', opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 z-[9999] shadow-[0_0_10px_rgba(37,99,235,0.5)]"
        />
      )}
    </AnimatePresence>
  )
}
