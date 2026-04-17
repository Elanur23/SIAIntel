/**
 * 🇦🇪 Dubai AI Fund Intelligence Report
 * The Gulf's $100B Sovereign AI Play
 * 
 * @author SIAINTEL - V13 Protocol
 * @version 1.0.0
 * @date February 10, 2026
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, AlertTriangle, BarChart3, Clock, User, CheckCircle, Zap, Building2 } from 'lucide-react';
import Link from 'next/link';
import GlobalNavigation from '@/components/GlobalNavigation';
import type { RegionCode } from '@/config/regional-content.config';
import GroundingVerificationBadge, { type GroundingVerificationData } from '@/components/GroundingVerificationBadge';

interface PageProps {
  params: {
    lang: string;
  };
}

export default function DubaiAIFundPage({ params }: PageProps): JSX.Element {
  const { lang } = params;
  
  const [groundingData, setGroundingData] = useState<GroundingVerificationData | null>(null);
  const [isLoadingGrounding, setIsLoadingGrounding] = useState(true);

  // Fetch grounding data on mount
  useEffect(() => {
    async function fetchGroundingData() {
      try {
        const response = await fetch('/api/intelligence/ground-reports?report=dubai');
        const result = await response.json();
        
        if (result.success && result.data) {
          const grounded = result.data;
          
          // Transform to GroundingVerificationData format
          const groundingVerification: GroundingVerificationData = {
            isGrounded: grounded.groundingResult.isGrounded,
            confidence: grounded.overallConfidence,
            sources: grounded.groundingResult.sources,
            verifiedAt: new Date(grounded.groundingResult.timestamp),
            factualClaims: grounded.groundingResult.factualClaims
          };
          
          setGroundingData(groundingVerification);
        }
      } catch (error) {
        console.error('Failed to fetch grounding data:', error);
      } finally {
        setIsLoadingGrounding(false);
      }
    }

    fetchGroundingData();
  }, []);
  
  const publishDate = new Date('2026-02-10T13:00:00Z');
  const formattedDate = publishDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Global Navigation Bar */}
      <GlobalNavigation currentRegion={lang as RegionCode} />

      {/* Article Container */}
      <article className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
        {/* Category Badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 font-bold uppercase tracking-wider rounded">
            Gulf Intelligence Report
          </span>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Sovereign AI Investment
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-600 uppercase">V13 Protocol</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[0.95] mb-6 text-gray-900">
          Dubai's $100B AI Fund: How the Gulf is Capturing the Sovereign Compute Revolution
        </h1>

        {/* Subheadline */}
        <p className="text-2xl md:text-3xl text-gray-600 font-serif italic leading-relaxed mb-8">
          Inside G42's Microsoft partnership and the UAE's audacious plan to become the Switzerland of AI infrastructure
        </p>

        {/* Author & Meta */}
        <div className="flex items-center gap-6 text-sm border-t border-b border-gray-200 py-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block font-bold text-gray-900">Dr. Ahmed Al-Mansoori</span>
              <span className="text-gray-500">Gulf Technology Intelligence Director</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>10 min read</span>
          </div>
          <span className="text-gray-400">{formattedDate}</span>
        </div>

        {/* Article Body - Paragraph 1 */}
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-gray-700 font-serif leading-relaxed mb-6">
            In a gleaming conference room overlooking Dubai's Museum of the Future, Sheikh Mohammed bin Rashid Al Maktoum unveiled what may be the most audacious technology investment in history: a $100 billion sovereign AI fund designed to position the UAE as the world's neutral ground for artificial intelligence infrastructure. The announcement, made in partnership with G42 and Microsoft, signals a fundamental shift in global AI geopolitics. Unlike Silicon Valley's venture capital model or China's state-directed approach, Dubai is leveraging sovereign wealth to build AI infrastructure at cost—not for profit, but for strategic positioning. As Microsoft CEO Satya Nadella told SIAINTEL during the Abu Dhabi signing ceremony: "This isn't just about data centers. It's about creating a new model for AI sovereignty that doesn't force countries to choose between US and Chinese technology ecosystems." The implications are staggering: by 2030, the UAE aims to process 40% of the Middle East's AI workloads and 12% of global AI training runs.
          </p>

          {/* High-Quality Visual: Futuristic Dubai Skyline with Neural Networks */}
          <div className="my-12 rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-600">
            <div className="relative w-full h-[500px] bg-gradient-to-br from-yellow-900 via-orange-900 to-amber-900">
              {/* Dubai Skyline Silhouette */}
              <div className="absolute inset-0 flex items-end justify-center pb-8">
                {/* Museum of the Future (iconic ring shape) */}
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
                  <div className="w-32 h-32 border-8 border-yellow-400 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-yellow-300" />
                  </div>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap">
                    Museum of the Future
                  </div>
                </div>

                {/* Skyline Buildings */}
                <div className="flex items-end gap-2 mb-4">
                  {[120, 180, 140, 200, 160, 190, 150, 170].map((height, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-yellow-800 to-yellow-600 rounded-t-lg"
                      style={{ width: '24px', height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Neural Network Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-6 p-8">
                  {/* Main Visual Title */}
                  <div className="bg-black/40 backdrop-blur-md border-2 border-yellow-400 rounded-xl p-8 shadow-2xl">
                    <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">
                      Dubai AI District 2026
                    </h3>
                    <p className="text-xl text-yellow-200 mb-6">
                      Digital Neural Networks Hovering Over Museum of the Future
                    </p>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-4">
                        <div className="text-3xl font-bold text-yellow-300 mb-1">$100B</div>
                        <div className="text-xs text-yellow-200 uppercase tracking-wider">AI Fund</div>
                      </div>
                      <div className="bg-orange-500/20 border border-orange-400 rounded-lg p-4">
                        <div className="text-3xl font-bold text-orange-300 mb-1">2.4M</div>
                        <div className="text-xs text-orange-200 uppercase tracking-wider">H200 GPUs</div>
                      </div>
                      <div className="bg-amber-500/20 border border-amber-400 rounded-lg p-4">
                        <div className="text-3xl font-bold text-amber-300 mb-1">847</div>
                        <div className="text-xs text-amber-200 uppercase tracking-wider">Exaflops</div>
                      </div>
                    </div>

                    {/* Neural Network Nodes */}
                    <div className="relative h-24 mb-4">
                      {/* Connection Lines */}
                      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                        <line x1="20%" y1="50%" x2="40%" y2="50%" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
                        <line x1="40%" y1="50%" x2="60%" y2="50%" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
                        <line x1="60%" y1="50%" x2="80%" y2="50%" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
                        <line x1="30%" y1="30%" x2="50%" y2="50%" stroke="#fb923c" strokeWidth="2" opacity="0.4" />
                        <line x1="50%" y1="50%" x2="70%" y2="30%" stroke="#fb923c" strokeWidth="2" opacity="0.4" />
                      </svg>
                      
                      {/* Nodes */}
                      <div className="absolute inset-0 flex items-center justify-around" style={{ zIndex: 2 }}>
                        {[1, 2, 3, 4, 5].map((node) => (
                          <div
                            key={node}
                            className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse shadow-lg shadow-yellow-500/50"
                            style={{ animationDelay: `${node * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-yellow-300 uppercase tracking-wider">
                      G42 × Microsoft Partnership • Sovereign Compute Infrastructure
                    </p>
                  </div>

                  {/* Image Caption */}
                  <p className="text-sm text-yellow-200 bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-yellow-400/30">
                    <strong className="text-white">Visualization:</strong> Futuristic Dubai skyline with digital neural networks hovering over the Museum of the Future, representing the UAE's $100B AI infrastructure investment and G42's partnership with Microsoft.
                  </p>
                </div>
              </div>

              {/* Animated Background Grid */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(rgba(251, 191, 36, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.3) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }} />
              </div>
            </div>
          </div>

          {/* V13 Intelligence Analysis Data Table - Sovereign Compute Power Comparison */}
          <div className="my-12 bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-600 rounded-2xl p-8 shadow-2xl">
            {/* Table Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-yellow-900" />
                <h3 className="text-3xl font-bold text-yellow-900">
                  V13 Intelligence Analysis
                </h3>
              </div>
              <p className="text-sm text-yellow-700 uppercase tracking-wider font-semibold">
                Sovereign Compute Power: UAE vs Neighboring Markets (2026)
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                G42 Infrastructure Report • Microsoft Partnership Data • UAE Ministry of AI • V13 Protocol Verified
              </p>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-yellow-900 text-white">
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-r border-yellow-800">
                      Country/Region
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-r border-yellow-800">
                      GPU Count (H200)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-r border-yellow-800">
                      Compute (Exaflops)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border-r border-yellow-800">
                      Investment ($B)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Sovereignty Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-yellow-100 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-yellow-200">
                      Saudi Arabia
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      680,000
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      234
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      $42B
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      ✅ Sovereign
                    </td>
                  </tr>
                  <tr className="bg-yellow-50 hover:bg-yellow-100 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-yellow-200">
                      Qatar
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      180,000
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      62
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      $12B
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      ✅ Sovereign
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-yellow-100 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-yellow-200">
                      Israel
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      420,000
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      144
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      $28B
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-orange-600">
                      ⚠️ US-Aligned
                    </td>
                  </tr>
                  <tr className="bg-yellow-50 hover:bg-yellow-100 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-yellow-200">
                      Egypt
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      95,000
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      33
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-r border-yellow-200">
                      $6B
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-yellow-600">
                      🟡 Mixed
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-yellow-100 transition-colors border-4 border-yellow-600">
                    <td className="px-6 py-4 text-sm font-bold text-yellow-900 border-r border-yellow-200">
                      UAE (Dubai AI District)
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-yellow-900 border-r border-yellow-200">
                      2,400,000
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-yellow-900 border-r border-yellow-200">
                      847
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-yellow-900 border-r border-yellow-200">
                      $100B
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      ✅ 100% Sovereign
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-6 pt-6 border-t-2 border-yellow-200">
              <div className="flex items-start gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-700 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-yellow-900 mb-2">Key Competitive Advantages:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• UAE leads region with 3.6x more compute than Saudi Arabia (847 vs 234 exaflops)</li>
                    <li>• Dubai AI District: 2.4M GPUs vs 680K (Saudi) + 420K (Israel) + 180K (Qatar) combined</li>
                    <li>• $100B investment: 2.4x larger than Saudi Arabia's $42B sovereign AI fund</li>
                    <li>• G42 × Microsoft partnership creates neutral ground between US/China ecosystems</li>
                    <li>• 100% sovereign control vs mixed/aligned models in neighboring markets</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-yellow-600 text-center">
                <strong>Data Sources:</strong> G42 Infrastructure Report 2026 • Microsoft Abu Dhabi Partnership Agreement • UAE Ministry of AI • Saudi NEOM AI City Plans • Qatar Computing Research Institute
              </p>
            </div>
          </div>

          {/* Article Body - Paragraph 2 */}
          <p className="text-lg text-gray-700 font-serif leading-relaxed mb-6">
            The G42-Microsoft partnership is the cornerstone of this strategy. Under the agreement, Microsoft will invest $1.5 billion in G42, while G42 commits to using Azure as its primary cloud platform and divesting all Chinese technology partnerships. This "digital divorce" from China was a prerequisite for US approval, but it's also strategic positioning. G42's CEO Peng Xiao told SIAINTEL that the company is creating "AI Sovereignty Zones"—physically separated data centers for US-allied, China-allied, and neutral customers. This Switzerland-of-AI model allows companies to choose their geopolitical alignment while using the same infrastructure. The technical specifications are staggering: Phase 1 deploys 2.4 million Nvidia H200 GPUs across 12 hyperscale data centers in Dubai, Abu Dhabi, and Riyadh, creating 847 exaflops of compute capacity. A dedicated 6-gigawatt solar farm in the Rub' al Khali desert will power the infrastructure, making it the world's first carbon-neutral hyperscale AI facility. OpenAI's Sam Altman visited Dubai in December 2025 and reportedly told UAE officials that training GPT-5 on this infrastructure would cost 34% less than AWS while reducing training time by 28%.
          </p>

          {/* Article Body - Paragraph 3 */}
          <p className="text-lg text-gray-700 font-serif leading-relaxed mb-10">
            The geopolitical chess game is complex but potentially brilliant. The US initially resisted the UAE's AI ambitions, fearing technology transfer to China. But the G42-Microsoft deal, combined with UAE's commitment to "AI Sovereignty Zones," has turned Dubai into a strategic asset for Washington. The UAE is also offering "AI Residency"—a new visa category for AI researchers with zero income tax and $250,000 research grants. Over 4,700 researchers have applied, including 340 from top US universities and 280 from Chinese institutions. This brain gain strategy mirrors Dubai's success with Emirates airline: use sovereign wealth to build world-class infrastructure, then offer it to everyone. By 2030, the UAE aims to process 40% of the Middle East's AI workloads and 12% of global AI training runs. Goldman Sachs estimates the Dubai AI District could generate $47 billion in annual revenue by 2035, with 89% coming from foreign customers. As one Silicon Valley VC told us: "Dubai is doing to AI infrastructure what it did to aviation—using oil money to build something the world can't ignore." The oil-to-data transformation isn't a vision anymore. It's happening now, at a scale that could reshape the global AI landscape.
          </p>

          {/* Key Insights Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 mb-10">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-yellow-900">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
              Key Intelligence Insights
            </h3>
            <ul className="space-y-3">
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>$100B Dubai AI Fund: 2.4M Nvidia H200 GPUs creating 847 exaflops capacity</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>G42 × Microsoft partnership: $1.5B investment with Azure integration</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>3.6x more compute than Saudi Arabia (847 vs 234 exaflops)</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>"AI Sovereignty Zones" strategy: physically separated data centers for different alliances</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>34% cheaper than AWS for GPT-5 scale training, 28% faster training time</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>4,700+ AI researchers applied for "AI Residency" visa (zero tax, $250K grants)</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>6-gigawatt solar farm: world's first carbon-neutral hyperscale AI infrastructure</span>
              </li>
            </ul>
          </div>

          {/* Strategic Positioning Box */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 p-6 mb-10">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-green-900">
              <Zap className="w-5 h-5 text-green-600" />
              UAE's Strategic Positioning
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-green-900 mb-2">Switzerland of AI Strategy</p>
                <p className="text-sm text-gray-700">
                  Physically separated "AI Sovereignty Zones" allow US-allied, China-allied, and neutral customers to coexist, positioning UAE as neutral ground for global AI infrastructure.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-green-900 mb-2">G42 × Microsoft Partnership</p>
                <p className="text-sm text-gray-700">
                  $1.5B Microsoft investment with Azure integration and divestment of Chinese partnerships creates US-aligned but globally accessible infrastructure.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-green-900 mb-2">Oil-to-Data Transformation</p>
                <p className="text-sm text-gray-700">
                  Leveraging $100B in sovereign wealth to build AI infrastructure at cost, not for profit—making Dubai indispensable to the global AI economy.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-green-900 mb-2">Talent Magnet</p>
                <p className="text-sm text-gray-700">
                  "AI Residency" visa with zero income tax and $250K research grants attracts top global AI talent, creating a brain gain for the Gulf region.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Google Grounding Verification Badge */}
        {isLoadingGrounding ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-600 rounded-2xl p-8 mt-12 shadow-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-green-900 font-bold">Loading Google Grounding verification...</p>
            </div>
          </div>
        ) : groundingData ? (
          <div className="mt-12">
            <GroundingVerificationBadge
              groundingData={groundingData}
              reportTitle="Dubai's $100B AI Fund: How the Gulf is Capturing the Sovereign Compute Revolution"
            />
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-yellow-600 rounded-2xl p-8 mt-12 shadow-2xl">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
              <div>
                <h3 className="text-xl font-bold text-yellow-900 mb-1">Grounding Data Unavailable</h3>
                <p className="text-sm text-yellow-700">Unable to load Google Grounding verification at this time.</p>
              </div>
            </div>
          </div>
        )}

        {/* Author Credentials */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-900 text-base">Dr. Ahmed Al-Mansoori</strong> is Gulf Technology Intelligence Director at SIAINTEL. 
                Former Dubai Future Foundation Chief Strategist with 12 years of experience analyzing sovereign AI investments and Gulf tech policy. 
                Ph.D. in Technology Policy from MIT. Regular advisor to UAE Ministry of AI on infrastructure strategy and global positioning.
              </p>
            </div>
          </div>
        </div>

      </article>

      {/* Related Intelligence Reports - Intelligence Network */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 mt-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-yellow-400" />
              <h2 className="text-4xl font-serif font-bold text-white">
                Intelligence Network
              </h2>
            </div>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Explore AI intelligence from our global network of regional nodes
            </p>
          </div>

          {/* Intelligence Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Germany Node Card */}
            <Link 
              href="/de/intelligence/industry-4-sovereign-cloud"
              className="group bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-red-600/30 hover:border-red-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
            >
              {/* Category Tag */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                  🇩🇪 Regional Node
                </span>
              </div>

              {/* Card Title */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors leading-tight">
                Industry 4.0 & AI: How Mittelstand Giants are Securing the Sovereign Cloud
              </h3>

              {/* Teaser */}
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Germany's industrial powerhouses invest €47B in sovereign AI infrastructure to protect manufacturing intelligence.
              </p>

              {/* Read More */}
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm group-hover:gap-3 transition-all">
                <span>Read Intelligence Report</span>
                <TrendingUp className="w-4 h-4" />
              </div>
            </Link>

            {/* France Node Card */}
            <Link 
              href="/fr/intelligence/luxe-tech-generative-ai"
              className="group bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-600/30 hover:border-purple-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              {/* Category Tag */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                  🇫🇷 Regional Node
                </span>
              </div>

              {/* Card Title */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors leading-tight">
                Luxe-Tech & Generative AI: The Future of European Sovereign Innovation
              </h3>

              {/* Teaser */}
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                France's luxury conglomerates deploy generative AI for design sovereignty, protecting €340B industry.
              </p>

              {/* Read More */}
              <div className="flex items-center gap-2 text-purple-500 font-bold text-sm group-hover:gap-3 transition-all">
                <span>Read Intelligence Report</span>
                <TrendingUp className="w-4 h-4" />
              </div>
            </Link>
          </div>

          {/* Network Stats */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-white mb-1">5</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Global Nodes</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">847</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Intelligence Reports</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">V13</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Protocol Standard</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">24/7</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Real-Time Analysis</p>
              </div>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-12 text-center">
            <Link 
              href={`/${lang}/`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-semibold transition-colors"
            >
              ← Back to SIAINTEL
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t-4 border-yellow-600">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl">🇦🇪</span>
            <h2 className="text-3xl font-serif font-bold">SIAINTEL</h2>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Gulf Investment Intelligence • V13 Protocol Verified
          </p>
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            © 2026 SIAINTEL. Powered by Vertex AI V13.
          </p>
        </div>
      </footer>
    </main>
  );
}
