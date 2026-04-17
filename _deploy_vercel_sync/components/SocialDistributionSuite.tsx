'use client'

import { useState } from 'react'
import { Check, Copy, Download, FileText, Linkedin, MessageCircle, Send, Share2 } from 'lucide-react'
import type { SocialMediaPackage } from '@/lib/warroom/social-media'
import { buildSocialCampaignBrief } from '@/lib/warroom/social-media'

interface SocialDistributionSuiteProps {
  packageData: SocialMediaPackage
  title: string
  subtitle?: string
  shareEnabled?: boolean
  compact?: boolean
  headline?: string
  articleUrl?: string
}

type CopyTarget = 'hero' | 'x' | 'linkedin' | 'telegram' | 'whatsapp' | null

export default function SocialDistributionSuite({
  packageData,
  title,
  subtitle,
  shareEnabled = true,
  compact = false,
  headline,
  articleUrl
}: SocialDistributionSuiteProps) {
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget>(null)

  const campaignBrief = buildSocialCampaignBrief({
    headline: headline || title,
    packageData,
    articleUrl
  })

  const copyAll = async () => {
    await copyText(campaignBrief.body, 'hero')
  }

  const downloadBrief = () => {
    const blob = new Blob([campaignBrief.body], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${campaignBrief.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const copyText = async (value: string, target: CopyTarget) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedTarget(target)
      window.setTimeout(() => setCopiedTarget((current) => (current === target ? null : current)), 1600)
    } catch (error) {
      console.error('Clipboard copy failed', error)
    }
  }

  const openShare = (url: string) => {
    if (!shareEnabled || !url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const CopyButton = ({ target, value }: { target: CopyTarget; value: string }) => (
    <button
      type="button"
      onClick={() => copyText(value, target)}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/80 hover:border-blue-500/40 hover:text-white transition-colors"
    >
      {copiedTarget === target ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {copiedTarget === target ? 'Copied' : 'Copy'}
    </button>
  )

  return (
    <div className={`rounded-[2rem] border border-white/10 bg-slate-900 ${compact ? 'p-5 space-y-4' : 'p-8 space-y-6'} shadow-2xl`}>
      <div className="flex items-center gap-3 text-blue-400">
        <Share2 size={compact ? 18 : 20} />
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em]">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-blue-500 transition-colors"
        >
          <Copy size={13} /> Copy All
        </button>
        <button
          type="button"
          onClick={downloadBrief}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white/85 hover:border-blue-500/40 hover:text-white transition-colors"
        >
          <Download size={13} /> Export Brief
        </button>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <FileText size={13} /> Campaign Ready
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Hero Snippet</p>
            <CopyButton target="hero" value={packageData.heroSnippet} />
          </div>
          <p className="text-sm text-white leading-relaxed">{packageData.heroSnippet}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">X / Twitter</p>
            <CopyButton target="x" value={packageData.xPost} />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{packageData.xPost}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">LinkedIn</p>
            <CopyButton target="linkedin" value={packageData.linkedinPost} />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{packageData.linkedinPost}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => openShare(packageData.shareUrls.x)} disabled={!shareEnabled} className="flex items-center justify-center gap-2 rounded-2xl bg-black border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:border-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={14} /> X Share
          </button>
          <button type="button" onClick={() => openShare(packageData.shareUrls.linkedin)} disabled={!shareEnabled} className="flex items-center justify-center gap-2 rounded-2xl bg-[#0A66C2] px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            <Linkedin size={14} /> LinkedIn
          </button>
          <button type="button" onClick={() => openShare(packageData.shareUrls.telegram)} disabled={!shareEnabled} className="flex items-center justify-center gap-2 rounded-2xl bg-[#229ED9] px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={14} /> Telegram
          </button>
          <button type="button" onClick={() => openShare(packageData.shareUrls.whatsapp)} disabled={!shareEnabled} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            <MessageCircle size={14} /> WhatsApp
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CopyButton target="telegram" value={packageData.telegramPost} />
          <CopyButton target="whatsapp" value={packageData.whatsappText} />
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Hashtags</p>
          <p className="text-sm text-slate-300 leading-relaxed">{packageData.hashtags.map((tag) => `#${tag}`).join(' ')}</p>
        </div>

        <div className="space-y-2">
          {packageData.distributionNotes.map((note) => (
            <p key={note} className="text-xs text-slate-400 leading-relaxed border-l-2 border-blue-500/30 pl-3">{note}</p>
          ))}
        </div>
      </div>
    </div>
  )
}