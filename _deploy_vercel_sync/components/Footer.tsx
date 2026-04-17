'use client'

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  Shield,
  Cpu,
  Globe,
  ExternalLink,
  ChevronRight,
  Monitor,
  Database,
  Lock
} from "lucide-react";

export default function Footer() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const currentYear = new Date().getFullYear();

  const footerGroups = [
    {
      title: "Intelligence",
      links: [
        { name: "Global Radar", href: `/${lang}` },
        { name: "Macro Signals", href: `/${lang}/economy` },
        { name: "Crypto Anomaly", href: `/${lang}/crypto` },
        { name: "AI Research", href: `/${lang}/ai` },
      ]
    },
    {
      title: "Protocol",
      links: [
        { name: "Sovereign Core", href: `/${lang}/about` },
        { name: "Neural Grid", href: `/${lang}/news-sitemap.xml` },
        { name: "Terminal API", href: `/${lang}/contact` },
        { name: "Signal Accuracy", href: `/${lang}/about#accuracy` },
      ]
    },
    {
      title: "Legal & Data",
      links: [
        { name: "Data Protection", href: `/${lang}/privacy-policy` },
        { name: "Usage Protocol", href: `/${lang}/terms` },
        { name: "AI Disclosure", href: `/${lang}/legal` },
        { name: "SEC Compliance", href: `/${lang}/legal#sec` },
      ]
    }
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-black/5 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-3xl pt-20 pb-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50 dark:opacity-100" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4 lg:gap-8">
          {/* BRAND COLUMN */}
          <div className="flex flex-col gap-6">
            <Link href={`/${lang}`} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 shadow-lg shadow-blue-900/40">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <span className="font-heading text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                SIA<span className="text-blue-500">INTEL</span>
              </span>
            </Link>

            <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500 dark:text-white/40 uppercase tracking-widest">
              Sovereign-core intelligence protocol designed for high-frequency market signal processing and real-time anomaly detection.
            </p>

            <div className="flex items-center gap-4">
              <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 transition-all hover:bg-blue-600/20 hover:text-blue-500 text-slate-400">
                <ExternalLink className="h-4 w-4" />
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 rounded bg-black px-2 py-1 text-[10px] font-black uppercase text-white transition-all group-hover:scale-100">X_LINK</span>
              </div>
              <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 transition-all hover:bg-blue-600/20 hover:text-blue-500 text-slate-400">
                <Monitor className="h-4 w-4" />
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 rounded bg-black px-2 py-1 text-[10px] font-black uppercase text-white transition-all group-hover:scale-100">TERMINAL</span>
              </div>
              <div className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 transition-all hover:bg-blue-600/20 hover:text-blue-500 text-slate-400">
                <Lock className="h-4 w-4" />
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 rounded bg-black px-2 py-1 text-[10px] font-black uppercase text-white transition-all group-hover:scale-100">SECURE</span>
              </div>
            </div>
          </div>

          {/* LINKS COLUMNS */}
          {footerGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/20">
                {group.title}
              </h4>
              <nav className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 transition-colors hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* SYSTEM STATUS RIBBON */}
        <div className="mt-20 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between border-t border-black/5 dark:border-white/5 pt-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:items-center lg:gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Node_Status</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500">STABLE</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 border-l border-black/5 dark:border-white/5 pl-4 lg:pl-8">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Sync_Rate</span>
              <span className="text-[10px] font-black uppercase text-slate-600 dark:text-white/60">100%_SYNCED</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-black/5 dark:border-white/5 pl-4 lg:pl-8">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Neural_Link</span>
              <span className="text-[10px] font-black uppercase text-slate-600 dark:text-white/60">ACTIVE_TX</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-black/5 dark:border-white/5 pl-4 lg:pl-8">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Latency</span>
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-500">12ms_RRT</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3" />
              SIA_ARCHIVE_STORAGE_ENABLED
            </div>
            <span>© {currentYear} SIA Intelligence Protocol. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
