'use client';

import Link from 'next/link';
import { Home, TrendingUp, Globe } from 'lucide-react';

type RegionCode = string;

interface GlobalNavigationProps {
  currentRegion?: RegionCode;
}

export default function GlobalNavigation({ currentRegion }: GlobalNavigationProps = {}) {
  const lang = currentRegion ?? 'en';
  return (
    <nav className="bg-black border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href={`/${lang}`} className="text-white font-bold text-xl">
          SIA Terminal
        </Link>
        <div className="flex gap-6">
          <Link href={`/${lang}`} className="text-gray-400 hover:text-white flex items-center gap-2">
            <Home size={18} />
            Home
          </Link>
          <Link href={`/${lang}/intelligence`} className="text-gray-400 hover:text-white flex items-center gap-2">
            <TrendingUp size={18} />
            Intelligence
          </Link>
        </div>
      </div>
    </nav>
  );
}
