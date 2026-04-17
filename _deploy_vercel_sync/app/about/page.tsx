/**
 * SIAINTEL ABOUT PAGE
 * Core identity and mission statement for global financial intelligence.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 lg:p-20 font-sans selection:bg-blue-600">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-blue-500">
            About SIAINTEL
          </h1>
          <p className="text-xl text-slate-400 font-medium max-w-3xl mx-auto">
            Autonomous Financial Intelligence — Processing global data streams through the SIA_V14 Protocol to deliver sovereign market insights.
          </p>
        </section>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-4">
            <h3 className="text-lg font-black text-blue-400 uppercase tracking-widest">Autonomous</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Our proprietary neural networks scan 21 global nodes in real-time, detecting anomalies and liquidity shifts before they hit mainstream media.
            </p>
          </div>
          <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-4">
            <h3 className="text-lg font-black text-emerald-400 uppercase tracking-widest">Verified</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every data point is cross-validated through our Multi-Agent Consensus system, ensuring institutional-grade accuracy and E-E-A-T compliance.
            </p>
          </div>
          <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-4">
            <h3 className="text-lg font-black text-amber-400 uppercase tracking-widest">Sovereign</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              We provide raw, unfiltered intelligence that empowers users to achieve data sovereignty in increasingly volatile global markets.
            </p>
          </div>
        </div>

        {/* Editorial Integrity */}
        <section className="space-y-8 bg-blue-600/5 p-12 rounded-[3rem] border border-blue-500/20">
          <h2 className="text-3xl font-black uppercase italic">Editorial Integrity</h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            SIAINTEL is managed by a decentralized team of financial analysts and blockchain architects.
            While we leverage advanced AI models (Gemini 1.5 Pro, Llama 3.1), every critical alert undergoes human review to maintain the highest editorial standards.
            We do not publish rumors; we publish verified intelligence nodes.
          </p>
        </section>

        <div className="pt-12 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">
          <span>SIAINTEL GLOBAL TERMINAL</span>
          <span>EST. 2024 // VERSION 14.1</span>
        </div>
      </div>
    </div>
  );
}

