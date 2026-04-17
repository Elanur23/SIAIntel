'use client'

import Link from 'next/link'
import type { ExpertByline } from '@/lib/identity/expert-attribution'

interface ExpertBylineProps {
  byline: ExpertByline
  language: string
}

export default function ExpertByline({ byline, language }: ExpertBylineProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <div className="flex items-start gap-4">
        {/* Expert Avatar */}
        <Link href={`/${language}${byline.profileUrl}`}>
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl hover:bg-emerald-500/20 transition-colors cursor-pointer">
            {byline.name.charAt(0)}
          </div>
        </Link>

        {/* Expert Info */}
        <div className="flex-1">
          <Link 
            href={`/${language}${byline.profileUrl}`}
            className="text-lg font-bold text-white hover:text-emerald-400 transition-colors"
          >
            {byline.name}
          </Link>
          <p className="text-emerald-400 text-sm mb-2">{byline.title}</p>
          <p className="text-slate-300 text-sm mb-3 line-clamp-2">
            {byline.bio}
          </p>
          
          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {byline.expertise.map((skill, i) => (
              <span 
                key={i} 
                className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
          
          {/* Experience Badge */}
          <div className="text-xs text-slate-400">
            {byline.yearsExperience} years of experience
          </div>
        </div>
      </div>
    </div>
  )
}
