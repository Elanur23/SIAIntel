import { TrustStrip } from "@/components/TrustStrip"
import { Suspense } from 'react'
import { Activity } from 'lucide-react'
import { HomePageSkeleton } from '@/components/NewsCardSkeleton'
import HomePageContent from '@/components/HomePageContent'
import FlashRadarGrid from '@/components/FlashRadarGrid'

export const dynamicParams = true
export const revalidate = 0

export default function HomePage({ params }: { params: { lang: string } }) {
  const rawLang = String(params.lang || 'en')

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageContent rawLang={rawLang} />
      </Suspense>

      <TrustStrip />

      <section className="py-20 border-b border-white/5 bg-black/40 relative z-10">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="flex items-center gap-6 mb-12">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/40">GLOBAL_SIGNAL_STREAM</h2>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Real-time anomaly detection across nodes</p>
            </div>
          </div>
          <FlashRadarGrid />
        </div>
      </section>

    </div>
  )
}
