'use client'

import { useState } from 'react'
import { Shield, ChevronDown, ChevronUp } from 'lucide-react'

const COMPLIANCE_TEXT = {
  tr: {
    title: 'SIA UYUMLULUK KALKANI',
    subtitle: 'SAFE_HARBOR_PROTOCOL_V3 // YASAL_UYUMLULUK_DOĞRULANDI',
    body: 'Bu içerik, SIA Intelligence tarafından açık kaynaklı verilerin istatistiksel modellemesi yoluyla üretilmiştir. Yatırım tavsiyesi niteliği taşımaz. SPK Mevzuatı 6362 Sayılı Kanun kapsamında, tüm analizler yalnızca bilgi amaçlıdır. Finansal kararlarınız için yetkili yatırım danışmanlarına başvurunuz.',
    badge: 'YASAL UYUM AKTİF',
    tags: ['SPK_6362', 'OSINT_VERIFIED', 'E-E-A-T_COMPLIANT'],
  },
  en: {
    title: 'SIA COMPLIANCE SHIELD',
    subtitle: 'SAFE_HARBOR_PROTOCOL_V3 // LEGAL_COMPLIANCE_VERIFIED',
    body: 'This content is produced by SIA Intelligence through statistical modeling of open-source data. It does not constitute investment advice. In compliance with SEC regulations, all analyses are for informational purposes only. Consult licensed financial advisors for investment decisions.',
    badge: 'COMPLIANCE ACTIVE',
    tags: ['SEC_COMPLIANT', 'OSINT_VERIFIED', 'E-E-A-T_COMPLIANT'],
  },
}

export default function ComplianceShield({ lang = 'en' }: { lang: string }) {
  const [expanded, setExpanded] = useState(false)
  const isTr = lang === 'tr'
  const text = isTr ? COMPLIANCE_TEXT.tr : COMPLIANCE_TEXT.en

  return (
    <div className="mt-12 border border-amber-500/20 rounded-2xl bg-amber-950/10 overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-amber-950/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="text-amber-500" size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">
              {text.title}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {text.subtitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {text.badge}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-amber-500/10">
          <p className="text-sm text-slate-400 leading-relaxed mt-4">
            {text.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {text.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-mono text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5"
              >
                {tag}
              </span>
            ))}
            <span className="text-[9px] font-mono text-slate-600">•</span>
            <span className="text-[9px] font-mono text-slate-600">
              SIA_V14_TERMINAL
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
