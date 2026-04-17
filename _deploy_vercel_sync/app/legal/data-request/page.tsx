'use client'

import { useState } from 'react'

export default function DataRequestPage() {
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    requestType: 'access' as 'access' | 'deletion' | 'portability' | 'rectification' | 'restriction'
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/legal/data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId || formData.email,
          type: formData.requestType,
          requestorEmail: formData.email
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Failed to submit request. Please try again.')
      }
    } catch (error) {
      console.error('Data request error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Email Sent</h1>
          <p className="text-gray-700 mb-6">
            We've sent a verification email to <strong>{formData.email}</strong>
          </p>
          <p className="text-gray-600 mb-8">
            Please check your email and click the verification link to confirm your request. 
            We will process your request within 30 days as required by GDPR/CCPA.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Data Subject Rights Request</h1>
          <p className="text-gray-600 mb-8">
            Exercise your rights under GDPR (EU) and CCPA (California)
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Your Rights</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ <strong>Access:</strong> Get a copy of your personal data</li>
              <li>✓ <strong>Deletion:</strong> Request deletion of your data (Right to be Forgotten)</li>
              <li>✓ <strong>Portability:</strong> Receive your data in machine-readable format</li>
              <li>✓ <strong>Rectification:</strong> Correct inaccurate data</li>
              <li>✓ <strong>Restriction:</strong> Limit how we process your data</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send a verification link to this email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (Optional)
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="If you know your user ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Type *
              </label>
              <select
                required
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="access">Access - Get a copy of my data</option>
                <option value="deletion">Deletion - Delete all my data</option>
                <option value="portability">Portability - Export my data</option>
                <option value="rectification">Rectification - Correct my data</option>
                <option value="restriction">Restriction - Limit data processing</option>
              </select>
            </div>

            {/* Request Type Descriptions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              {formData.requestType === 'access' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Access Request</h4>
                  <p className="text-sm text-gray-700">
                    You will receive a complete copy of all personal data we have about you, including:
                  </p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 mt-2">
                    <li>Profile information</li>
                    <li>Consent records</li>
                    <li>Activity logs</li>
                    <li>Any other stored data</li>
                  </ul>
                </div>
              )}

              {formData.requestType === 'deletion' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Deletion Request (Right to be Forgotten)</h4>
                  <p className="text-sm text-gray-700">
                    We will permanently delete all your personal data from our systems. This action cannot be undone.
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Warning: This will delete your account and all associated data permanently.
                  </p>
                </div>
              )}

              {formData.requestType === 'portability' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Portability Request</h4>
                  <p className="text-sm text-gray-700">
                    You will receive your data in a machine-readable format (JSON) that you can transfer to another service.
                  </p>
                </div>
              )}

              {formData.requestType === 'rectification' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Rectification Request</h4>
                  <p className="text-sm text-gray-700">
                    We will help you correct any inaccurate or incomplete personal data we hold about you.
                  </p>
                </div>
              )}

              {formData.requestType === 'restriction' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Restriction Request</h4>
                  <p className="text-sm text-gray-700">
                    We will limit how we process your data while maintaining it in our systems.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Processing Time</h4>
              <p className="text-sm text-yellow-800">
                We will respond to your request within <strong>30 days</strong> as required by GDPR and CCPA. 
                In complex cases, we may extend this by an additional 60 days with notification.
              </p>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-sm text-gray-700 mb-4">
              If you have questions about your data rights or need assistance:
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>📧 Email: <a href="mailto:privacy@usnewstoday.com" className="text-blue-600 hover:underline">privacy@usnewstoday.com</a></li>
              <li>📄 Read our <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a></li>
              <li>⚖️ Review our <a href="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

