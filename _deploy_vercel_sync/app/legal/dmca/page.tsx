import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DMCA Policy | SIA Intelligence Terminal',
  description: 'Digital Millennium Copyright Act (DMCA) Policy and Copyright Infringement Procedures',
}

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            DMCA Copyright Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last Updated: March 1, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Copyright Infringement Notification</h2>
            <p className="mb-4">
              SIA Intelligence Terminal respects the intellectual property rights of others. If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please provide our Copyright Agent with the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>An electronic or physical signature of the person authorized to act on behalf of the owner of the copyright interest</li>
              <li>A description of the copyrighted work that you claim has been infringed</li>
              <li>A description of where the material that you claim is infringing is located on our website</li>
              <li>Your address, telephone number, and email address</li>
              <li>A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
            <div className="p-4 bg-white/5 border border-white/10">
              <p className="mb-2"><strong>Copyright Agent:</strong> SIA Legal Team</p>
              <p className="mb-2"><strong>Email:</strong>{' '}
                <a href="mailto:dmca@siaintel.com" className="text-[#FFB800] hover:underline">
                  dmca@siaintel.com
                </a>
              </p>
              <p><strong>Subject Line:</strong> DMCA Takedown Request</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Counter-Notification</h2>
            <p className="mb-4">
              If you believe that your content was removed by mistake or misidentification, you may file a counter-notification with our Copyright Agent. Your counter-notification must include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your physical or electronic signature</li>
              <li>Identification of the content that has been removed and the location where it appeared before removal</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the content was removed as a result of mistake or misidentification</li>
              <li>Your name, address, telephone number, and email address</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Repeat Infringer Policy</h2>
            <p>
              In accordance with the DMCA and other applicable law, we have adopted a policy of terminating, in appropriate circumstances, users who are deemed to be repeat infringers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

