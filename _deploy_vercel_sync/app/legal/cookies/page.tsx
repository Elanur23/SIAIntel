import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | SIA Intelligence Terminal',
  description: 'Cookie Policy for SIA Intelligence Terminal - How we use cookies and tracking technologies',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            Cookie Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last Updated: March 1, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">1. Essential Cookies</h3>
                <p className="mb-2">Required for the website to function properly.</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                  <li>Session management</li>
                  <li>Security features</li>
                  <li>Load balancing</li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">2. Analytics Cookies</h3>
                <p className="mb-2">Help us understand how visitors interact with our website.</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                  <li><strong>Google Analytics</strong>: Traffic analysis and user behavior</li>
                  <li>Page views and session duration</li>
                  <li>Device and browser information</li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">3. Advertising Cookies</h3>
                <p className="mb-2">Used to display relevant advertisements.</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                  <li><strong>Google AdSense</strong>: Personalized ad delivery</li>
                  <li>Ad performance measurement</li>
                  <li>Frequency capping</li>
                  <li>Fraud prevention</li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-[#FFB800] mb-2">4. Functional Cookies</h3>
                <p className="mb-2">Remember your preferences and settings.</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                  <li>Language preferences</li>
                  <li>Theme settings</li>
                  <li>User interface customization</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Third-Party Cookies</h2>
            <p className="mb-4">
              We use third-party services that may set their own cookies:
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-black/50 border border-white/5">
                <p className="font-bold text-white mb-1">Google AdSense</p>
                <p className="text-xs">
                  Privacy Policy:{' '}
                  <a href="https://policies.google.com/privacy" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                    https://policies.google.com/privacy
                  </a>
                </p>
              </div>
              <div className="p-3 bg-black/50 border border-white/5">
                <p className="font-bold text-white mb-1">Google Analytics</p>
                <p className="text-xs">
                  Privacy Policy:{' '}
                  <a href="https://policies.google.com/privacy" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                    https://policies.google.com/privacy
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Managing Cookies</h2>
            <p className="mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Browser Settings</strong>: Most browsers allow you to refuse or delete cookies
              </li>
              <li>
                <strong>Google Ads Settings</strong>:{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Opt out of personalized ads
                </a>
              </li>
              <li>
                <strong>Google Analytics Opt-out</strong>:{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Browser add-on
                </a>
              </li>
            </ul>
            <p className="mt-4 text-yellow-500">
              Note: Disabling cookies may affect the functionality of our website.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Cookie Lifespan</h2>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-white/5 border-b border-white/5">
                <span>Session Cookies</span>
                <span className="text-gray-500">Deleted when browser closes</span>
              </div>
              <div className="flex justify-between p-2 bg-white/5 border-b border-white/5">
                <span>Analytics Cookies</span>
                <span className="text-gray-500">Up to 2 years</span>
              </div>
              <div className="flex justify-between p-2 bg-white/5 border-b border-white/5">
                <span>Advertising Cookies</span>
                <span className="text-gray-500">Up to 13 months</span>
              </div>
              <div className="flex justify-between p-2 bg-white/5">
                <span>Functional Cookies</span>
                <span className="text-gray-500">Up to 1 year</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your Consent</h2>
            <p>
              By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by adjusting your browser settings or contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
            <p>
              For questions about our use of cookies, please contact:{' '}
              <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                privacy@siaintel.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-gray-600">
          <p>
            This cookie policy complies with GDPR, ePrivacy Directive, and Google AdSense requirements.
          </p>
        </div>
      </div>
    </div>
  )
}

