'use client'

export default function AIPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Content Policy</h1>
        <p className="text-sm text-gray-600 mb-8">
          Last Updated: December 2024 | Version 1.0
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Our Commitment to Transparency</h2>
            <p className="text-gray-700 mb-4">
              At US News Today, we believe in complete transparency about our use of artificial intelligence. 
              This policy explains how we use AI, our editorial standards, and our commitment to accuracy and quality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use AI</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 AI-Generated Content</h3>
            <p className="text-gray-700 mb-4">
              Some of our content is generated using advanced AI language models. This content is:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Clearly labeled with an "AI-Generated" badge</li>
              <li>Reviewed by professional human editors</li>
              <li>Fact-checked for accuracy</li>
              <li>Edited for quality and readability</li>
              <li>Verified against multiple sources</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 AI-Assisted Content</h3>
            <p className="text-gray-700 mb-4">
              Our journalists use AI tools to assist with:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Research and information gathering</li>
              <li>Grammar and style checking</li>
              <li>Headline optimization</li>
              <li>Content summarization</li>
              <li>Translation and localization</li>
            </ul>
            <p className="text-gray-700 mb-4">
              AI-assisted content is written primarily by humans and labeled accordingly.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Human-Written Content</h3>
            <p className="text-gray-700 mb-4">
              Much of our content is written entirely by human journalists without AI assistance. 
              This content is labeled as "Human-Written" or "Human-Reviewed."
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Editorial Standards</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Human Oversight</h3>
            <p className="text-gray-700 mb-4">
              Every piece of AI-generated content undergoes human review:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Editorial Review:</strong> Professional editors review all content</li>
              <li><strong>Fact-Checking:</strong> Claims are verified against reliable sources</li>
              <li><strong>Quality Control:</strong> Content meets our editorial standards</li>
              <li><strong>Bias Detection:</strong> We check for and correct any biases</li>
              <li><strong>Accuracy Verification:</strong> All information is cross-referenced</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Quality Assurance</h3>
            <p className="text-gray-700 mb-4">
              We maintain the same quality standards for all content, regardless of how it's created:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Accuracy and factual correctness</li>
              <li>Clear and readable writing</li>
              <li>Proper sourcing and attribution</li>
              <li>Balanced and fair reporting</li>
              <li>Adherence to journalistic ethics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Disclosure Requirements</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 FTC Compliance</h3>
            <p className="text-gray-700 mb-4">
              In compliance with FTC guidelines, we clearly disclose:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>When content is AI-generated</li>
              <li>When AI tools assist in content creation</li>
              <li>The extent of human involvement</li>
              <li>Our review and verification processes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Google Guidelines</h3>
            <p className="text-gray-700 mb-4">
              We follow Google's guidelines for AI content:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Transparent disclosure of AI use</li>
              <li>Focus on helpful, quality content</li>
              <li>Human expertise and oversight</li>
              <li>E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. AI Models We Use</h2>
            <p className="text-gray-700 mb-4">
              We use various AI models for different purposes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Llama 3:</strong> Primary content generation (local, privacy-focused)</li>
              <li><strong>GPT-4:</strong> Advanced content creation and editing</li>
              <li><strong>Claude:</strong> Research and analysis</li>
              <li><strong>Gemini:</strong> Fact-checking and verification</li>
            </ul>
            <p className="text-gray-700 mb-4">
              All models are used responsibly and with human oversight.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitations and Risks</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Known Limitations</h3>
            <p className="text-gray-700 mb-4">
              We acknowledge that AI has limitations:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>May occasionally produce inaccurate information</li>
              <li>Can reflect biases present in training data</li>
              <li>May lack nuanced understanding of complex topics</li>
              <li>Cannot replace human judgment and expertise</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Our Mitigation Strategies</h3>
            <p className="text-gray-700 mb-4">
              To address these limitations, we:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Require human review of all AI content</li>
              <li>Fact-check all claims and statistics</li>
              <li>Use multiple sources for verification</li>
              <li>Train our editors on AI limitations</li>
              <li>Continuously improve our processes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Reader Rights</h2>
            <p className="text-gray-700 mb-4">
              As a reader, you have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Know when content is AI-generated or AI-assisted</li>
              <li>Understand our editorial processes</li>
              <li>Report inaccuracies or concerns</li>
              <li>Request corrections or clarifications</li>
              <li>Provide feedback on our AI use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Corrections and Updates</h2>
            <p className="text-gray-700 mb-4">
              If we discover errors in AI-generated content:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>We correct them promptly</li>
              <li>We note the correction clearly</li>
              <li>We review our processes to prevent recurrence</li>
              <li>We notify readers of significant corrections</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Feedback and Concerns</h2>
            <p className="text-gray-700 mb-4">
              We welcome your feedback about our AI use:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li><strong>Email:</strong> ai-feedback@usnewstoday.com</li>
              <li><strong>Report Errors:</strong> corrections@usnewstoday.com</li>
              <li><strong>General Inquiries:</strong> editorial@usnewstoday.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Policy Updates</h2>
            <p className="text-gray-700 mb-4">
              We may update this policy as AI technology and best practices evolve. We will:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Notify readers of significant changes</li>
              <li>Maintain transparency about our practices</li>
              <li>Continue to prioritize accuracy and quality</li>
              <li>Adapt to new regulations and guidelines</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Our Promise</h2>
            <p className="text-gray-700 mb-4">
              We promise to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Always be transparent about AI use</li>
              <li>Maintain high editorial standards</li>
              <li>Prioritize accuracy and quality</li>
              <li>Respect our readers' trust</li>
              <li>Continuously improve our processes</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex gap-4">
            <a
              href="/legal/privacy"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/legal/terms"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

