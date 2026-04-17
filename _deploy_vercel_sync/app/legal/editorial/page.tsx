import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editorial Policy | SIA Intelligence Terminal',
  description: 'Editorial Standards and Content Guidelines for SIA Intelligence Terminal',
}

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            Editorial Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last Updated: March 1, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
            <p>
              SIA Intelligence Terminal is committed to providing accurate, timely, and unbiased market intelligence and analysis to our readers. Our content is generated using advanced AI technology (Gemini 1.5 Pro) combined with publicly available data (OSINT).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Editorial Standards</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">1. Accuracy</h3>
                <p>All content is based on publicly available data and verified sources. We strive for factual accuracy in all our reports and analysis.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">2. Transparency</h3>
                <p>We clearly disclose when content is AI-generated and always cite our data sources. We maintain transparency about our methodologies and limitations.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">3. Independence</h3>
                <p>Our analysis is independent and not influenced by advertisers, sponsors, or external parties. We maintain editorial independence in all our content.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">4. Objectivity</h3>
                <p>We present multiple perspectives and avoid bias in our analysis. Our goal is to provide balanced, data-driven insights.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Content Guidelines</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All market analysis is based on statistical probability and historical data</li>
              <li>We do not provide financial advice or investment recommendations</li>
              <li>All predictions include confidence scores and risk assessments</li>
              <li>We clearly distinguish between facts, analysis, and speculation</li>
              <li>Sources are always cited and verifiable</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">AI-Generated Content Disclosure</h2>
            <p className="mb-4">
              We use Google Gemini 1.5 Pro AI to generate and analyze content. All AI-generated content:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Is clearly labeled as AI-generated</li>
              <li>Is based on real-time data and verified sources</li>
              <li>Undergoes quality checks for accuracy and relevance</li>
              <li>Includes confidence scores and uncertainty indicators</li>
              <li>Is supplemented with human oversight when necessary</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Corrections Policy</h2>
            <p>
              If we discover an error in our content, we will correct it promptly and transparently. Significant corrections will be noted at the top of the article. For correction requests, please contact:{' '}
              <a href="mailto:corrections@siaintel.com" className="text-[#FFB800] hover:underline">
                corrections@siaintel.com
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Advertising Separation</h2>
            <p>
              We maintain a clear separation between editorial content and advertising. Sponsored content, if any, is clearly labeled. Advertisers have no influence over our editorial decisions or content.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
            <p>
              For questions about our editorial policy, contact:{' '}
              <a href="mailto:editorial@siaintel.com" className="text-[#FFB800] hover:underline">
                editorial@siaintel.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

