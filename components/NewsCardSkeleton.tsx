'use client'

import { motion } from 'framer-motion'

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
  },
}

export function NewsCardSkeleton() {
  return (
    <div
      className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[4rem] overflow-hidden flex flex-col h-full shadow-2xl"
      style={{ minHeight: '480px' }}
    >
      {/* Image area - aspect-video (16:9) for CLS: 0 */}
      <div className="relative aspect-video w-full overflow-hidden bg-white/5">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>

      {/* Content area - fixed structure */}
      <div className="p-12 flex-1 flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-4 w-20 rounded bg-white/10" />
        </div>
        <div className="space-y-3">
          <div className="h-8 w-full rounded bg-white/10" />
          <div className="h-8 w-[80%] rounded bg-white/10" />
        </div>
        <div className="space-y-2 pl-8 border-l-2 border-white/10">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-2/3 rounded bg-white/5" />
        </div>
        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-white/5" />
          <div className="h-12 w-12 rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}

export function NewsCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Full news section skeleton (header + cards) for Suspense fallback */
export function NewsSectionSkeleton() {
  return (
    <section>
      <div className="flex items-center gap-8 mb-20">
        <div className="w-16 h-16 rounded-[2rem] bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-10 w-96 max-w-full rounded bg-white/5" />
          <div className="h-4 w-64 rounded bg-white/5" />
        </div>
        <div className="flex-1 h-px bg-white/5 ml-8" />
      </div>
      <NewsCardSkeletonGrid count={6} />
    </section>
  )
}

/** Full homepage content skeleton (hero + news) for Suspense fallback */
export function HomePageSkeleton() {
  return (
    <>
      {/* Hero skeleton with shimmer */}
      <section className="relative pt-12 pb-24 overflow-hidden border-b border-white/5">
        <div className="container mx-auto px-4 lg:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="h-12 w-48 rounded-full bg-white/5 overflow-hidden relative">
                <ShimmerOverlay />
              </div>
              <div className="h-16 w-full max-w-xl rounded bg-white/5 overflow-hidden relative">
                <ShimmerOverlay />
              </div>
              <div className="h-6 w-full max-w-lg rounded bg-white/5 overflow-hidden relative">
                <ShimmerOverlay />
              </div>
            </div>
            <div className="lg:col-span-5 aspect-square rounded-[5rem] overflow-hidden bg-white/5 relative">
              <ShimmerOverlay />
            </div>
          </div>
        </div>
      </section>
      {/* News section skeleton */}
      <div className="container mx-auto px-4 lg:px-10 py-24">
        <NewsSectionSkeleton />
      </div>
    </>
  )
}

function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      />
    </div>
  )
}
