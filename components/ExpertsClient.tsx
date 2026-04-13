'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Award, BookOpen, Zap } from 'lucide-react'

interface Expert {
  id: string
  name: string
  title: string
  bio: Record<string, string>
  expertise: string[]
  yearsExperience: number
  publications: number
}

interface ExpertsClientProps {
  experts: Expert[]
  lang: string
  translations: {
    years_exp: string
    publications: string
  }
}

export default function ExpertsClient({ experts, lang, translations }: ExpertsClientProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
      {experts.map((expert, index) => (
        <motion.div
          key={expert.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative bg-[#0A0A0C] border border-white/10 rounded-[4rem] p-10 md:p-16 overflow-hidden hover:border-blue-500/30 transition-all shadow-2xl flex flex-col h-full"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-opacity">
            <Zap size={150} className="text-blue-500" />
          </div>

          <div className="flex flex-col gap-10 relative z-10 flex-1">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="w-24 h-24 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-center text-4xl font-black text-white/10 group-hover:text-blue-500 group-hover:border-blue-500/50 transition-all shadow-inner">
                {expert.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">
                  {expert.name}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                    {expert.title}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed italic border-l-2 border-white/5 pl-8 flex-1">
              "{expert.bio[lang] || expert.bio.en}"
            </p>

            <div className="flex flex-wrap gap-2 py-6">
              {expert.expertise.slice(0, 4).map((skill, i) => (
                <span key={i} className="text-[9px] font-black uppercase bg-white/5 text-white/30 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{translations.years_exp}</span>
                <div className="flex items-center gap-2 text-xl font-black text-white italic">
                  <Award size={18} className="text-blue-500" />
                  {expert.yearsExperience}+
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{translations.publications}</span>
                <div className="flex items-center gap-2 text-xl font-black text-white italic">
                  <BookOpen size={18} className="text-emerald-500" />
                  {expert.publications}
                </div>
              </div>
              <Link href={`/${lang}/experts/${expert.id}`} className="ml-auto w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all group/btn shadow-xl">
                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ArrowRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}
