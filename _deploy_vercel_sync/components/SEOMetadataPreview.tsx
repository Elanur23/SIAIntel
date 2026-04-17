'use client';

import { SEOMetadata } from '@/lib/ai/seo-meta-architect';
import { CheckCircle, AlertCircle, TrendingUp, Search, Image, Code } from 'lucide-react';

interface SEOMetadataPreviewProps {
  metadata: SEOMetadata;
  seoScore?: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export default function SEOMetadataPreview({ metadata, seoScore }: SEOMetadataPreviewProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400 border-green-700 bg-green-900/20';
    if (score >= 70) return 'text-yellow-400 border-yellow-700 bg-yellow-900/20';
    return 'text-red-400 border-red-700 bg-red-900/20';
  };

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      {seoScore && (
        <div className={`p-4 border rounded-lg ${getScoreColor(seoScore.score)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} />
              <h3 className="font-bold">SEO Score</h3>
            </div>
            <div className="text-3xl font-bold">{seoScore.score}/100</div>
          </div>
          
          {seoScore.issues.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-sm font-semibold">Issues:</div>
              {seoScore.issues.map((issue, i) => (
                <div key={i} className="text-sm flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meta Tags */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search size={18} className="text-blue-400" />
          <h3 className="font-bold text-white">Meta Tags</h3>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Title ({metadata.metaTitle.length} chars)</div>
            <div className="text-white font-medium">{metadata.metaTitle}</div>
          </div>
          
          <div>
            <div className="text-gray-400 mb-1">Description ({metadata.metaDescription.length} chars)</div>
            <div className="text-gray-300">{metadata.metaDescription}</div>
          </div>
          
          <div>
            <div className="text-gray-400 mb-1">Keywords</div>
            <div className="flex flex-wrap gap-2">
              {metadata.keywords.map((keyword, i) => (
                <span key={i} className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Google Discover Headlines */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-green-400" />
          <h3 className="font-bold text-white">Google Discover Headlines</h3>
        </div>
        
        <div className="space-y-2">
          {metadata.discoverHeadlines.map((headline, i) => (
            <div key={i} className="p-3 bg-green-900/10 border border-green-800 rounded">
              <div className="text-green-400 text-xs font-semibold mb-1">H2 #{i + 1}</div>
              <div className="text-white font-medium">{headline}</div>
              <div className="text-gray-400 text-xs mt-1">{headline.length} characters</div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Alt Texts */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Image size={18} className="text-purple-400" />
          <h3 className="font-bold text-white">Image Alt Texts</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-purple-900/10 border border-purple-800 rounded">
            <div className="text-purple-400 font-semibold mb-1">Hero Image</div>
            <div className="text-gray-300">{metadata.imageAltTexts.hero}</div>
          </div>
          
          <div className="p-2 bg-purple-900/10 border border-purple-800 rounded">
            <div className="text-purple-400 font-semibold mb-1">Chart Image</div>
            <div className="text-gray-300">{metadata.imageAltTexts.chart}</div>
          </div>
          
          <div className="p-2 bg-purple-900/10 border border-purple-800 rounded">
            <div className="text-purple-400 font-semibold mb-1">Thumbnail</div>
            <div className="text-gray-300">{metadata.imageAltTexts.thumbnail}</div>
          </div>
        </div>
      </div>

      {/* JSON-LD Schema */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Code size={18} className="text-orange-400" />
          <h3 className="font-bold text-white">JSON-LD Schema</h3>
        </div>
        
        <pre className="bg-black p-3 rounded text-xs text-gray-300 overflow-auto max-h-64">
          {JSON.stringify(metadata.jsonLdSchema, null, 2)}
        </pre>
      </div>

      {/* Open Graph Preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="font-bold text-white mb-3">Social Media Preview</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 p-2 text-xs text-gray-400">Facebook / LinkedIn</div>
            <div className="p-3">
              <div className="text-blue-400 text-sm font-semibold mb-1">{metadata.ogTitle}</div>
              <div className="text-gray-400 text-xs">{metadata.ogDescription}</div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 p-2 text-xs text-gray-400">Twitter</div>
            <div className="p-3">
              <div className="text-blue-400 text-sm font-semibold mb-1">{metadata.twitterTitle}</div>
              <div className="text-gray-400 text-xs">{metadata.twitterDescription}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Canonical URL */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="font-bold text-white mb-2">Canonical URL</h3>
        <div className="text-blue-400 text-sm font-mono break-all">{metadata.canonicalUrl}</div>
      </div>
    </div>
  );
}
