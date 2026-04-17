import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corrections Policy | SIA Intelligence Terminal',
  description: 'How to report errors and request corrections for content on SIA Intelligence Terminal',
}

export default function CorrectionsPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            Corrections Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last Updated: March 1, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Our Commitment to Accuracy</h2>
            <p>
              At SIA Intelligence Terminal, we are committed to providing accurate and reliable information. When errors occur, we correct them promptly and transparently.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">How to Report an Error</h2>
            <p className="mb-4">
              If you believe you have found an error in our content, please contact us with the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The URL or title of the article containing the error</li>
              <li>A clear description of the error</li>
              <li>Supporting evidence or sources that demonstrate the error</li>
              <li>Your contact information for follow-up</li>
            </ul>
            <div className="mt-4 p-4 bg-white/5 border border-white/10">
              <p><strong>Email:</strong>{' '}
                <a href="mailto:corrections@siaintel.com" className="text-[#FFB800] hover:underline">
                  corrections@siaintel.com
                </a>
              </p>
              <p className="mt-2"><strong>Subject Line:</strong> Correction Request - [Article Title]</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Our Correction Process</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">1. Review (24-48 hours)</h3>
                <p>We review all correction requests within 24-48 hours and verify the information against our sources.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">2. Verification</h3>
                <p>Our editorial team verifies the error and determines the appropriate correction.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">3. Implementation</h3>
                <p>Corrections are made promptly, with a clear note indicating what was corrected and when.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">4. Notification</h3>
                <p>We notify the person who reported the error once the correction has been made.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Types of Corrections</h2>
            <div className="space-y-3">
              <div className="p-3 bg-black/50 border border-white/5">
                <p className="font-bold text-white mb-1">Minor Corrections</p>
                <p className="text-xs">Typos, formatting errors, or minor factual errors are corrected without notation unless they significantly change the meaning.</p>
              </div>
              <div className="p-3 bg-black/50 border border-white/5">
                <p className="font-bold text-white mb-1">Significant Corrections</p>
                <p className="text-xs">Material errors that affect the substance of the article are corrected with a clear correction notice at the top of the article.</p>
              </div>
              <div className="p-3 bg-black/50 border border-white/5">
                <p className="font-bold text-white mb-1">Updates</p>
                <p className="text-xs">When new information becomes available that changes the context of an article, we add an update note with the date.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Correction Notice Format</h2>
            <div className="p-4 bg-red-900/10 border border-red-900/30">
              <p className="text-yellow-500 font-bold mb-2">CORRECTION [Date]:</p>
              <p className="text-sm">
                An earlier version of this article [description of error]. The article has been corrected to reflect [accurate information].
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Transparency</h2>
            <p>
              We believe in transparency. All significant corrections are clearly noted and dated. We do not silently correct errors or remove content without explanation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

