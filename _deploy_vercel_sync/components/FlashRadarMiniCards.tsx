'use client';

import { useEffect, useState } from 'react';
import { FlashSignal } from '@/lib/ai/flash-radar';
import { Activity } from 'lucide-react';

export default function FlashRadarMiniCards() {
  const [signals, setSignals] = useState<FlashSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 1000); // Her 1 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async (): Promise<void> => {
    try {
      const response = await fetch('/api/flash-radar');
      const data = await response.json();
      
      if (data.success && data.data.signals) {
        setSignals(data.data.signals.slice(0, 6)); // İlk 6 sinyal
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Flash Radar Mini Cards fetch error:', error);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ABNORMAL VOLUME':
        return 'text-yellow-400';
      case 'DECOUPLING ALERT':
        return 'text-red-400';
      case 'WHALE MOVEMENT':
        return 'text-blue-400';
      case 'GAMMA SQUEEZE':
        return 'text-purple-400';
      case 'DARK POOL':
        return 'text-orange-400';
      default:
        return 'text-green-400';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded p-3 animate-pulse">
            <div className="h-3 bg-gray-800 rounded w-2/3 mb-2"></div>
            <div className="h-2 bg-gray-800 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded p-4 text-center">
        <Activity className="mx-auto mb-1 text-gray-600" size={24} />
        <p className="text-gray-400 text-sm">No signals</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {signals.map((signal, index) => (
        <div
          key={index}
          className="bg-black border border-gray-800 rounded p-3 hover:border-gray-700 transition-all"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-mono text-sm font-bold">{signal.asset}</span>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          
          <div className={`text-xs font-semibold mb-1 ${getStatusColor(signal.status)}`}>
            {signal.status}
          </div>
          
          <div className="text-xs text-gray-400 line-clamp-2">{signal.note}</div>
          
          <div className="mt-2 text-xs text-gray-600">{signal.confidence}%</div>
        </div>
      ))}
    </div>
  );
}
