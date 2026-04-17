'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Activity, Search, Database, Cpu, Wifi, Shield, Sun, Moon } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTheme, applyTheme } from '@/contexts/ThemeContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const lang = (params?.lang as string) || "en";
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Terminal", href: `/${lang}` },
    { name: "Ai", href: `/${lang}/ai` },
    { name: "Economy", href: `/${lang}/economy` },
    { name: "Crypto", href: `/${lang}/crypto` },
    { name: "About", href: `/${lang}/about` },
  ];

  return (
    <header
      className={`fixed top-9 left-0 right-0 z-[150] w-full transition-all duration-500 ${ // Ticker'ın (h-9 = 36px) hemen altına konumlandırıldı
        isScrolled
          ? "bg-white/90 dark:bg-black/70 backdrop-blur-xl border-b border-black/5 dark:border-white/10 py-3 shadow-2xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex items-center justify-between h-[4.25rem]"> {/* Header'ın kendi yüksekliği */}
          {/* LOGO ENGINE */}
          <Link href={`/${lang}`} className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/40 transition-transform group-hover:scale-110">
              <Activity className="h-6 w-6 text-white" />
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white dark:border-black bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-black uppercase tracking-tighter text-slate-950 dark:text-white">
                SIA<span className="text-blue-600 dark:text-blue-500">INTEL</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/40">
                PROTOCOL_V4.0
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV PROTOCOL */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`group relative text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                  pathname === link.href
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 w-0 bg-blue-600 dark:bg-blue-500 transition-all duration-300 group-hover:w-full ${
                  pathname === link.href ? "w-full" : ""
                }`} />
              </Link>
            ))}
          </nav>

          {/* SYSTEM TOOLS */}
          <div className="hidden items-center gap-4 lg:flex">
            <div className="relative">
              <button
                onClick={() => setIsScanOpen(!isScanOpen)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${
                  isScanOpen
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20"
                    : "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-white border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-blue-500/30"
                }`}
              >
                <Search className={`h-4 w-4 ${isScanOpen ? "text-white" : "text-blue-600 dark:text-blue-500"}`} />
                SCAN_SYSTEM
              </button>

              <AnimatePresence>
                {isScanOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 p-6 backdrop-blur-2xl shadow-2xl z-50"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500">System_Integrity</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">Secure</span>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-slate-400 dark:text-white/20" />
                          <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                              <span className="text-slate-500 dark:text-white/40">Database_Sync</span>
                              <span className="text-blue-600 dark:text-blue-400">100%</span>
                            </div>
                            <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full w-full bg-blue-600 dark:bg-blue-500" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Cpu className="h-4 w-4 text-slate-400 dark:text-white/20" />
                          <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                              <span className="text-slate-500 dark:text-white/40">Neural_Load</span>
                              <span className="text-emerald-600 dark:text-emerald-400">12%</span>
                            </div>
                            <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full w-[12%] bg-emerald-500" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Wifi className="h-4 w-4 text-slate-400 dark:text-white/20" />
                          <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                              <span className="text-slate-500 dark:text-white/40">Uplink_Latency</span>
                              <span className="text-blue-600 dark:text-blue-400">8ms</span>
                            </div>
                            <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full w-[85%] bg-blue-600 dark:bg-blue-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">
                        Last_Scan: {new Date().toLocaleTimeString()} // ID: SIA_77
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = resolvedTheme === 'dark' ? 'light' : 'dark';
                applyTheme(next);
                if (typeof localStorage !== 'undefined') localStorage.setItem('theme', next);
                setTheme(next);
              }}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
              aria-label={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <LanguageSwitcher />
            <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
            <Link
              href={`/${lang}/login`}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
            >
              <Shield className="h-4 w-4" />
              ESTABLISH_LINK
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className="rounded-xl bg-black/5 dark:bg-white/5 p-2 text-slate-950 dark:text-white lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU ENGINE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-black/5 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-black uppercase tracking-widest text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px w-full bg-black/5 dark:bg-white/10" />
              <div className="flex items-center gap-4">
                {/* Theme Toggle for Mobile */}
                <button
                  type="button"
                  onClick={() => {
                    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
                    applyTheme(next);
                    if (typeof localStorage !== 'undefined') localStorage.setItem('theme', next);
                    setTheme(next);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 shadow-sm"
                >
                  {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span className="text-[10px] font-black uppercase">{resolvedTheme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}</span>
                </button>
                <LanguageSwitcher />
              </div>
              <Link
                href={`/${lang}/login`}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-xs font-black uppercase tracking-widest text-white"
              >
                ESTABLISH_LINK
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
