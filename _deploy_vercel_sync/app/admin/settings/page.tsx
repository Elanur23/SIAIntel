'use client';

import React, { useState } from 'react';
import { Settings, Globe, Cpu, Loader2, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [isWiping, setIsWiping] = useState(false);

  const handleWipe = async () => {
    if (!confirm("🚨 KRİTİK UYARI: Tüm sistem arşivi silinecektir. Devam etmek istiyor musunuz?")) return;
    const password = prompt("🔐 YETKİ DOĞRULAMA: Lütfen Admin imha şifresini giriniz:");
    if (!password) {
      alert("⚠️ İşlem iptal edildi: Şifre girilmedi.");
      return;
    }
    setIsWiping(true);
    try {
      const res = await fetch('/api/war-room/wipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (data.success) alert(`🔥 İMHA TAMAMLANDI: ${data.count} kayıt silindi.`);
      else alert(`❌ YETKİ REDDİ: ${data.error || "Şifre yanlış!"}`);
    } catch (error) {
      alert("❌ SİSTEM HATASI: API bağlantısı kurulamadı.");
    } finally {
      setIsWiping(false);
    }
  };

  const sections = [
    { title: 'AI_Configuration', icon: <Cpu className="text-yellow-500" />, settings: [
      { name: 'Primary Intelligence Model', desc: 'Default AI for deep reports', value: 'Gemini 2.0 Flash', status: 'online' },
      { name: 'Translation Engine', desc: 'Core for multi-lang processing', value: 'Groq Llama 3.1', status: 'active' },
      { name: 'Auto-Sentiment Analysis', desc: 'Social media noise filtering', value: 'Enabled', status: 'online' },
    ]},
    { title: 'Broadcast_Network', icon: <Globe className="text-blue-400" />, settings: [
      { name: 'Active Nodes', desc: 'Target distribution markets', value: 'TR, EN, AR, RU, DE, FR, ES', status: 'stable' },
      { name: 'RSS Frequency', desc: 'Radar scanning interval', value: '30 Seconds', status: 'active' },
    ]}
  ];

  return (
    <div className="p-10 space-y-10 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <Settings size={32} className="text-gray-500" /> System_Settings
          </h2>
          <p className="text-gray-500 text-sm font-mono mt-1 tracking-widest">Global SIA Terminal configuration</p>
        </div>
        <div className="bg-yellow-500 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(234,179,8,0.2)] cursor-pointer hover:bg-yellow-400 transition-all">Apply_Changes</div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              {section.icon}
              <h3 className="text-lg font-black uppercase tracking-tight text-white">{section.title}</h3>
            </div>
            <div className="p-8 grid grid-cols-1 gap-6">
              {section.settings.map((s) => (
                <div key={s.name} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-white font-bold text-sm group-hover:text-yellow-500 transition-colors">{s.name}</p>
                    <p className="text-gray-500 text-xs font-medium">{s.desc}</p>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <span className="text-sm font-mono text-gray-300 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">{s.value}</span>
                    <div className="flex items-center gap-2 w-24 justify-end">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-green-500' : 'bg-blue-400'} animate-pulse`} />
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{s.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-red-500/10 transition-all">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-500/20 rounded-2xl text-red-500">
            {isWiping ? <Loader2 className="animate-spin" size={24} /> : <Lock size={24} />}
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-tight">Danger_Zone</h4>
            <p className="text-red-500/60 text-xs font-bold uppercase tracking-widest">Authorized_Wipe_Protocol_Active</p>
          </div>
        </div>
        <button onClick={handleWipe} disabled={isWiping} className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-500 transition-all disabled:opacity-50 flex items-center gap-2">
          {isWiping ? "Executing..." : "Execute_Wipe"}
        </button>
      </div>
    </div>
  );
}

