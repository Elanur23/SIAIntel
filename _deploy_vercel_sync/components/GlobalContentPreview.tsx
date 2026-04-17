'use client';

import { GlobalContentPackage, LanguageContent } from '@/lib/ai/global-cpm-master';
import { Globe, DollarSign, TrendingUp } from 'lucide-react';

interface GlobalContentPreviewProps {
  contentPackage: GlobalContentPackage;
}

export default function GlobalContentPreview({ contentPackage }: GlobalContentPreviewProps) {
  const getCPMColor = (cpm: number): string => {
    if (cpm >= 400) return 'text-purple-400 border-purple-700 bg-purple-900/20';
    if (cpm >= 200) return 'text-green-400 border-green-700 bg-green-900/20';
    if (cpm >= 180) return 'text-blue-400 border-blue-700 bg-blue-900/20';
    return 'text-gray-400 border-gray-700 bg-gray-900/20';
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Globe size={32} className="text-blue-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">Global Content Package</h3>
              <p className="text-gray-400">{contentPackage.languages.length} Languages Generated</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">${contentPackage.totalCPMPotential}</div>
            <div className="text-sm text-gray-400">Total CPM Potential</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-black/30 rounded p-3">
            <div className="text-gray-400 text-sm mb-1">Highest CPM</div>
            <div className="text-xl font-bold text-purple-400">
              {Math.max(...contentPackage.languages.map(l => l.cpm))}
            </div>
          </div>
          <div className="bg-black/30 rounded p-3">
            <div className="text-gray-400 text-sm mb-1">Average CPM</div>
            <div className="text-xl font-bold text-blue-400">
              ${(contentPackage.totalCPMPotential / contentPackage.languages.length).toFixed(0)}
            </div>
          </div>
          <div className="bg-black/30 rounded p-3">
            <div className="text-gray-400 text-sm mb-1">Premium Markets</div>
            <div className="text-xl font-bold text-green-400">
              {contentPackage.languages.filter(l => l.cpm >= 200).length}
            </div>
          </div>
        </div>
      </div>

      {/* Language Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentPackage.languages
          .sort((a, b) => b.cpm - a.cpm)
          .map((lang, index) => (
            <div
              key={index}
              className={`border rounded-lg p-6 ${getCPMColor(lang.cpm)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{lang.flag}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white">{lang.language}</h4>
                    <p className="text-sm text-gray-400">{lang.region}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <DollarSign size={20} />
                    {lang.cpm}
                  </div>
                  <div className="text-xs text-gray-400">CPM</div>
                </div>
              </div>

              {/* SEO Title */}
              <div className="mb-3 p-3 bg-blue-900/20 border border-blue-700 rounded">
                <div className="text-xs font-semibold text-blue-400 mb-1">SEO TITLE (High CTR)</div>
                <div className="text-sm font-bold text-white">{lang.seoTitle}</div>
              </div>

              {/* Intelligence Brief */}
              <div className="mb-3 p-3 bg-purple-900/20 border border-purple-700 rounded">
                <div className="text-xs font-semibold text-purple-400 mb-1">INTELLIGENCE BRIEF</div>
                <p className="text-sm text-gray-300">{lang.intelligenceBrief}</p>
              </div>

              {/* Title */}
              <div className="mb-3">
                <h5 className="text-lg font-bold text-white mb-1">{lang.title}</h5>
                <p className="text-sm text-gray-300">{lang.subtitle}</p>
              </div>

              {/* Summary */}
              <div className="mb-4 p-3 bg-black/30 rounded">
                <p className="text-sm text-gray-300 line-clamp-3">{lang.summary}</p>
              </div>

              {/* Market Focus */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-400 mb-1">MARKET FOCUS</div>
                <div className="text-sm text-white">{lang.marketFocus}</div>
              </div>

              {/* CPM Keywords */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-400 mb-2">CPM KEYWORDS (Premium)</div>
                <div className="flex flex-wrap gap-2">
                  {lang.cpmKeywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-green-900/30 border border-green-700 rounded text-xs text-green-400 font-semibold"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Local Angle */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-400 mb-1">LOCAL ANGLE</div>
                <div className="text-sm text-white">{lang.localAngle}</div>
              </div>

              {/* Content Preview */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <details className="cursor-pointer">
                  <summary className="text-sm font-semibold text-gray-400 hover:text-white">
                    View Full Content ({lang.content.length} chars)
                  </summary>
                  <div className="mt-3 p-3 bg-black/40 rounded max-h-64 overflow-auto">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{lang.content}</p>
                  </div>
                </details>
              </div>
            </div>
          ))}
      </div>

      {/* CPM Analysis */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-green-400" />
          CPM Revenue Analysis
        </h3>
        
        <div className="space-y-3">
          {contentPackage.languages
            .sort((a, b) => b.cpm - a.cpm)
            .map((lang, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold">{lang.language}</span>
                    <span className="text-green-400 font-bold">${lang.cpm}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${(lang.cpm / 440) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {((lang.cpm / contentPackage.totalCPMPotential) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
