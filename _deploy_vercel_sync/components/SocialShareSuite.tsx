'use client'

import { useState } from 'react'
import {
  Twitter,
  Linkedin,
  MessageCircle,
  Send,
  Facebook,
  Share2,
  Link as LinkIcon,
  Check,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SocialShareSuiteProps {
  url: string
  title: string
  lang: string
}

export default function SocialShareSuite({ url, title, lang }: SocialShareSuiteProps) {
  const [copied, setCopied] = useState(false)

  const shareLinks = [
    {
      name: 'X',
      icon: <Twitter size={18} />,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: 'hover:bg-black',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={18} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'hover:bg-[#0077b5]',
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={18} />,
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      color: 'hover:bg-[#25d366]',
    },
    {
      name: 'Telegram',
      icon: <Send size={18} />,
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: 'hover:bg-[#0088cc]',
    },
    {
      name: 'Facebook',
      icon: <Facebook size={18} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'hover:bg-[#1877f2]',
    }
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const label = lang === 'tr' ? 'İSTİHBARATI PAYLAŞ' : 'TRANSMIT INTELLIGENCE'

  return (
    <div className="py-8 border-y border-white/5 my-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
            <Share2 size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{label}</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Global Signal Distribution active</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {shareLinks.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl transition-all group ${platform.color} hover:border-transparent hover:scale-105 active:scale-95`}
              title={`Share on ${platform.name}`}
            >
              <span className="text-white/40 group-hover:text-white transition-colors">
                {platform.icon}
              </span>
              <span className="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest hidden sm:inline">
                {platform.name}
              </span>
            </a>
          ))}

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl transition-all group hover:bg-blue-600 hover:border-transparent hover:scale-105 active:scale-95"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-emerald-400"
                >
                  <Check size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="link"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-white/40 group-hover:text-white"
                >
                  <LinkIcon size={18} />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest hidden sm:inline">
              {copied ? (lang === 'tr' ? 'KOPYALANDI' : 'COPIED') : (lang === 'tr' ? 'BAĞLANTIYI KOPYALA' : 'COPY LINK')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
