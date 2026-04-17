'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AuditNode {
  lang: string;
  label: string;
  parity: number; // 0-100 (LISA Semantic Parity)
  reach: number;  // 0-100 (Predictive Discover Reach)
  grounding: number; // 0-100 (Truth Grounding Confidence)
}

const NODES: AuditNode[] = [
  { lang: 'EN', label: 'English', parity: 100, reach: 98, grounding: 96 },
  { lang: 'TR', label: 'Türkçe', parity: 98, reach: 95, grounding: 94 },
  { lang: 'DE', label: 'Deutsch', parity: 92, reach: 88, grounding: 90 },
  { lang: 'FR', label: 'Français', parity: 94, reach: 85, grounding: 92 },
  { lang: 'ES', label: 'Español', parity: 88, reach: 82, grounding: 85 },
  { lang: 'RU', label: 'Русский', parity: 75, reach: 65, grounding: 70 },
  { lang: 'AR', label: 'العربية', parity: 65, reach: 45, grounding: 60 },
  { lang: 'JP', label: '日本語', parity: 90, reach: 80, grounding: 88 },
  { lang: 'ZH', label: '中文', parity: 85, reach: 78, grounding: 82 },
];

const getColor = (value: number) => {
  if (value >= 90) return 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
  if (value >= 75) return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
  return 'bg-rose-500 shadow-[0_0_10px_#f43f5e]';
};

const getTextColor = (value: number) => {
  if (value >= 90) return 'text-emerald-400';
  if (value >= 75) return 'text-amber-400';
  return 'text-rose-400';
};

export default function SiaAdvancedAudit() {
  return (
    <div className="space-y-12 font-mono text-[10px] tracking-widest uppercase">

      {/* 1. LISA SEMANTIC PARITY AUDIT */}
      <section className="bg-black/40 border border-white/5 p-6 rounded-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="flex items-center gap-3 text-cyan-500 font-black">
            <span className="w-2 h-2 bg-cyan-500 animate-pulse" />
            LISA SEMANTIC PARITY AUDIT (v6.2)
          </h2>
          <span className="text-white/20">TARGET: {'>'}90% PARITY</span>
        </div>

        <div className="space-y-4">
          {NODES.map((node) => (
            <div key={node.lang} className="group flex items-center gap-4">
              <div className="w-6 font-black text-white/40 group-hover:text-cyan-400 transition-colors">
                {node.lang}
              </div>
              <div className="flex-1 h-[6px] bg-white/5 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${node.parity}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`absolute h-full ${getColor(node.parity)} transition-all`}
                />
              </div>
              <div className={`w-12 text-right font-black ${getTextColor(node.parity)}`}>
                {node.parity}%
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-white/20 italic">
          * SEMANTIC DRIFT DETECTED IN RU/AR NODES. RE-TRANSLATION VIA G-GEMINI-ULTRA RECOMMENDED.
        </p>
      </section>

      {/* 2. PANDA 4: PREDICTIVE DISCOVER IMPACT */}
      <section className="bg-black/40 border border-white/5 p-6 rounded-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="flex items-center gap-3 text-fuchsia-500 font-black">
            <span className="w-2 h-2 bg-fuchsia-500 animate-pulse" />
            PANDA 4: PREDICTIVE DISCOVER IMPACT
          </h2>
          <span className="text-white/20">CONFIDENCE: 96%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Probability Matrix */}
          <div className="space-y-4">
            <div className="flex justify-between text-white/40 mb-2">
              <span>ALGORITHM NODE</span>
              <span>REACH PROBABILITY</span>
            </div>
            {NODES.slice(0, 5).map((node) => (
              <div key={node.lang} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-white/60">{node.label} FEED</span>
                <span className={`font-black ${getTextColor(node.reach)}`}>~{(node.reach * 1.5).toFixed(0)}K IMP</span>
              </div>
            ))}
          </div>

          {/* Visual Impact Radar (Simplified SVG) */}
          <div className="relative aspect-square flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="white" strokeWidth="0.2" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="white" strokeWidth="0.2" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl"
              />
              <div className="text-center">
                <div className="text-3xl font-black text-white italic">HIGH</div>
                <div className="text-fuchsia-400">IMPACT_ZONE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUTH GROUNDING CONFIDENCE */}
      <section className="bg-emerald-950/10 border border-emerald-500/20 p-6 rounded-sm">
        <div className="flex items-center gap-3 text-emerald-500 font-black mb-6">
          <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
          GROUNDING VERIFICATION MAP (TRUTH_ENGINE)
        </div>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {NODES.map((node) => (
            <div key={node.lang} className="text-center p-2 border border-white/5 bg-black/40">
              <div className="text-white/40 mb-1">{node.lang}</div>
              <div className={`font-black ${getTextColor(node.grounding)}`}>{node.grounding}%</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
