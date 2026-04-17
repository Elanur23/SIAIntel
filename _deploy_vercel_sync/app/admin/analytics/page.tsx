import React from 'react';
import { TrendingUp, Globe2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    { name: 'Avg. Session Duration', value: '4m 32s', change: '+12%', trend: 'up' },
    { name: 'Bounce Rate', value: '32.4%', change: '-5%', trend: 'down' },
    { name: 'Pages per Session', value: '3.8', change: '+0.4', trend: 'up' },
    { name: 'Live Readers', value: '142', change: 'Live', trend: 'neutral' },
  ];

  const geoData = [
    { country: 'Turkey', users: '42,100', percentage: '45%' },
    { country: 'United States', users: '12,400', percentage: '15%' },
    { country: 'Germany', users: '8,200', percentage: '10%' },
    { country: 'Russia', users: '5,100', percentage: '6%' },
  ];

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Intelligence_Metrics</h2>
          <p className="text-gray-500 text-sm font-mono mt-1 tracking-widest">Global traffic and engagement data</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full text-[10px] font-black text-green-400 uppercase flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live_Data_Stream
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-white/5 border border-white/5 p-6 rounded-[2rem]">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{metric.name}</p>
            <div className="flex justify-between items-end">
              <p className="text-2xl font-black text-white">{metric.value}</p>
              <span className={`text-[10px] font-black flex items-center gap-1 ${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-blue-400'}`}>
                {metric.trend === 'up' && <ArrowUpRight size={12} />}
                {metric.trend === 'down' && <ArrowDownRight size={12} />}
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/5 p-8 rounded-[2.5rem] min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black uppercase text-blue-400 flex items-center gap-2"><TrendingUp size={20} /> Traffic_Velocity</h3>
            <div className="flex gap-2">
              {['24h', '7d', '30d'].map(t => <button key={t} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold hover:bg-white/10 transition-all uppercase">{t}</button>)}
            </div>
          </div>
          <div className="flex-1 border border-white/5 rounded-3xl bg-black/40 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <p className="text-gray-600 text-xs font-mono uppercase tracking-[0.5em]">Chart_Engine_Active</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <h3 className="text-lg font-black uppercase text-purple-400 flex items-center gap-2"><Globe2 size={20} /> Geo_Distribution</h3>
          <div className="space-y-4">
            {geoData.map((item) => (
              <div key={item.country} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-white">{item.country}</span>
                  <span className="text-gray-500">{item.users}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: item.percentage }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

