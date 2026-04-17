/**
 * SIAINTEL TERMS OF SERVICE
 * Standard compliance page for AdSense and legal transparency.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 lg:p-20 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter italic border-b-4 border-blue-600 pb-4">
          Terms & Conditions
        </h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. Welcome to SIAINTEL</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing SIAINTEL (siaintel.com), you agree to comply with these terms.
            Our platform provides autonomous financial intelligence and data analysis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">2. Use of Content</h2>
          <p className="text-gray-600 leading-relaxed">
            Unless otherwise stated, SIAINTEL and/or its licensors own the intellectual property rights
            for all material on this terminal. All rights are reserved.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3. Disclaimer</h2>
          <p className="text-gray-600 leading-relaxed italic text-sm">
            [OFFICIAL_DISCLAIMER]: SIAINTEL represents statistical probability analysis and is NOT financial advice.
            Always consult with a professional advisor.
          </p>
        </section>

        <div className="pt-12 border-t border-gray-100 text-xs text-gray-400 uppercase tracking-widest">
          SIAINTEL GLOBAL TERMINAL // LEGAL_VERSION: 2026.1
        </div>
      </div>
    </div>
  );
}

