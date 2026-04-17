'use client';

import { useEffect, useState } from 'react';
import { DIPAnalysisReport } from '@/lib/ai/deep-intelligence-pro';
import { SEOMetadata } from '@/lib/ai/seo-meta-architect';
import DIPAnalysisCard from './DIPAnalysisCard';
import { Sparkles } from 'lucide-react';

interface IntelligenceReport {
  id: string;
  dipReport: DIPAnalysisReport;
  seoMetadata: SEOMetadata;
  status: string;
  publishedAt: string;
}

export default function LatestIntelligenceReports({ limit = 3 }: { limit?: number }) {
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000); // Her 5 saniyede bir kontrol et
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/intelligence/save?limit=${limit}&status=published`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch intelligence reports:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
        <Sparkles className="mx-auto mb-4 text-gray-600" size={48} />
        <h3 className="text-xl font-bold text-gray-400 mb-2">No Intelligence Reports Yet</h3>
        <p className="text-gray-500">Generate your first report from the admin panel</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {reports.map((report) => (
        <div key={report.id}>
          <DIPAnalysisCard report={report.dipReport} />
        </div>
      ))}
    </div>
  );
}
