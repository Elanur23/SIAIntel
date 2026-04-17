/**
 * SIA EXPERT PROFILE PAGE - V3.0 (IDENTITY & EEAT ENHANCED)
 */
import { Metadata } from 'next'
import { getAllExperts } from '@/lib/identity/council-of-five'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ShieldCheck, Award, BookOpen, User, Zap, Radio, Globe, Terminal, GraduationCap, Briefcase, BadgeCheck } from 'lucide-react'
import { getT } from '@/lib/i18n/server-utils'

export async function generateStaticParams() {
  const experts = getAllExperts()
  return experts.map((expert) => ({
    expertId: expert.id,
  }))
}

export async function generateMetadata({ params }: { params: { expertId: string; lang: string } }): Promise<Metadata> {
  const experts = getAllExperts()
  const expert = experts.find(e => e.id === params.expertId)
  if (!expert) return { title: 'Expert Not Found' }

  return {
    title: `${expert.name} | SIA Council of Five`,
    description: expert.bio[params.lang] || expert.bio.en,
  }
}

export default function ExpertProfilePage({ params }: { params: { expertId: string; lang: string } }) {
  const experts = getAllExperts()
  const expert = experts.find(e => e.id === params.expertId)
  if (!expert) notFound()

  const lang = params.lang || 'en'
  const tr = getT(lang)
  const bio = expert.bio[params.lang] || expert.bio.en

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <div className="container mx-auto px-4 lg:px-10 py-12 md:py-20 relative z-10">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-16">
          <Link href={`/${lang}`} className="hover:text-blue-500 transition-colors flex items-center gap-2 uppercase">
            <Terminal size={12} /> Terminal
          </Link>
          <ChevronRight size={10} />
          <Link href={`/${lang}/experts`} className="hover:text-blue-500 transition-colors uppercase">Council</Link>
          <ChevronRight size={10} />
          <span className="text-white/60 uppercase">{expert.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* --- 👤 PROFILE HEADER (LEFT) --- */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8 relative overflow-hidden backdrop-blur-xl">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                  <User size={150} />
               </div>

               <div className="relative flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                     <div className="w-40 h-40 rounded-full border-2 border-blue-500/20 flex items-center justify-center bg-white/[0.03] text-6xl font-black text-white/10 overflow-hidden group">
                        <div className="absolute inset-0 border-t-2 border-blue-500 animate-spin-slow opacity-40" />
                        {expert.name.charAt(0)}
                     </div>
                     <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-[#020203] shadow-lg">
                        <BadgeCheck size={20} className="text-white" />
                     </div>
                  </div>

                  <div>
                     <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">{expert.name}</h1>
                     <span className="px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        {expert.title}
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center">
                     <span className="block text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">EXPERIENCE</span>
                     <div className="text-2xl font-black text-white italic">{expert.yearsExperience}+ YRS</div>
                  </div>
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center">
                     <span className="block text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">AUTHORITY</span>
                     <div className="text-2xl font-black text-emerald-500 italic">9.8/10</div>
                  </div>
               </div>

               <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center text-[10px] font-black py-3 border-b border-white/5">
                     <span className="text-white/30 uppercase tracking-widest">PUBLICATIONS</span>
                     <span className="text-white">{expert.publications} DOCUMENTS</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black py-3 border-b border-white/5">
                     <span className="text-white/30 uppercase tracking-widest">CLEARANCE</span>
                     <span className="text-blue-400 font-mono text-[9px]">LEVEL_V_ALPHA</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black py-3">
                     <span className="text-white/30 uppercase tracking-widest">STATUS</span>
                     <span className="text-emerald-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ON_CHAIN_VERIFIED
                     </span>
                  </div>
               </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 space-y-6">
               <div className="flex items-center gap-3 text-blue-500">
                  <Zap size={20} className="fill-blue-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">EXPERT_BADGE</h3>
               </div>
               <p className="text-sm text-slate-400 font-light leading-relaxed italic">
                  Member of the Council of Five. Subject Matter Expert for {expert.category} Intelligence protocols.
               </p>
            </div>
          </div>

          {/* --- 📄 DOSSIER CONTENT (RIGHT) --- */}
          <div className="lg:col-span-8 space-y-12">

            {/* Biography */}
            <section className="p-10 lg:p-16 rounded-[4rem] bg-white/[0.02] border border-white/5 space-y-10 relative overflow-hidden backdrop-blur-xl group">
               <div className="flex items-center gap-6 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                     <Radio size={24} className="animate-pulse" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black uppercase italic tracking-tighter">Personnel_Dossier</h2>
                     <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Verified Background & Meta-Analysis</p>
                  </div>
               </div>

               <p className="text-xl lg:text-2xl text-slate-300 font-light leading-relaxed italic border-l-4 border-blue-600/50 pl-10">
                  {bio}
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 text-white/40 uppercase tracking-widest text-[10px] font-black">
                        <GraduationCap size={16} className="text-blue-500" /> Education_History
                     </div>
                     <div className="space-y-6">
                        {expert.education.map((edu, i) => (
                           <div key={i} className="relative pl-6 border-l border-white/10 hover:border-blue-500 transition-colors group/item">
                              <div className="absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-white/20 group-hover/item:bg-blue-500" />
                              <p className="text-white font-black uppercase italic tracking-tight">{edu.degree}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{edu.institution} // {edu.year}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center gap-3 text-white/40 uppercase tracking-widest text-[10px] font-black">
                        <Briefcase size={16} className="text-emerald-500" /> Service_History
                     </div>
                     <div className="space-y-6">
                        {expert.experience.map((exp, i) => (
                           <div key={i} className="relative pl-6 border-l border-white/10 hover:border-emerald-500 transition-colors group/item">
                              <div className="absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-white/20 group-hover/item:bg-emerald-500" />
                              <p className="text-white font-black uppercase italic tracking-tight">{exp.role}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{exp.organization} // {exp.years}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* Expertise & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8 backdrop-blur-xl group">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                     <Zap size={20} className="text-amber-500" /> Neural_Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {expert.expertise.map((skill, i) => (
                        <span key={i} className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all cursor-default">
                           {skill}
                        </span>
                     ))}
                  </div>
               </div>

               <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8 backdrop-blur-xl group">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                     <ShieldCheck size={20} className="text-emerald-500" /> Verified_Certificates
                  </h3>
                  <div className="space-y-3">
                     {expert.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-2xl">
                           <BadgeCheck size={16} className="text-emerald-500 shrink-0" />
                           <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{cert}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Final Trust Note */}
            <div className="p-8 text-center border-t border-white/5 pt-12">
               <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mb-4">Identity_Verification_Protocol: SIA_EEAT_V2</p>
               <div className="flex items-center justify-center gap-10 opacity-30 grayscale group-hover:grayscale-0 transition-all">
                  <Globe size={20} />
                  <Zap size={20} />
                  <ShieldCheck size={20} />
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
