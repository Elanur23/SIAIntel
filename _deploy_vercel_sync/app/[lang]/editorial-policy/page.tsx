import { Metadata } from 'next'

const EDITORIAL_SEO: Record<string, { title: string; description: string }> = {
  en: { title: 'Editorial Policy | SIA Intelligence', description: 'Our editorial standards, fact-checking process, and commitment to accuracy and transparency.' },
  tr: { title: 'Yayın İlkeleri | SIA Intelligence', description: 'Yayın standartlarımız, doğrulama süreci ve doğruluk ile şeffaflık taahhüdümüz.' },
  de: { title: 'Redaktionsrichtlinien | SIA Intelligence', description: 'Unsere redaktionellen Standards und unser Bekenntnis zu Genauigkeit und Transparenz.' },
  fr: { title: 'Politique éditoriale | SIA Intelligence', description: 'Nos standards éditoriaux et notre engagement en faveur de l\'exactitude et de la transparence.' },
  es: { title: 'Política editorial | SIA Intelligence', description: 'Nuestros estándares editoriales y compromiso con la precisión y la transparencia.' },
  ru: { title: 'Редакционная политика | SIA Intelligence', description: 'Наши редакционные стандарты и приверженность точности и прозрачности.' },
  ar: { title: 'السياسة التحريرية | SIA Intelligence', description: 'معاييرنا التحريرية والتزامنا بالدقة والشفافية.' },
  jp: { title: '編集方針 | SIA Intelligence', description: '編集基準、ファクトチェック、正確性と透明性への取り組み。' },
  zh: { title: '编辑政策 | SIA Intelligence', description: '我们的编辑标准、事实核查流程以及对准确性与透明度的承诺。' },
}

const EDITORIAL_CONTENT: Record<string, any> = {
  en: {
    title: 'Editorial Policy',
    subtitle: 'Our Standards for Accuracy, Transparency, and Quality',
    sections: [
      {
        heading: 'Editorial Independence',
        content: 'SIA Intelligence maintains strict editorial independence. Our analysis and insights are based solely on data, research, and expert judgment. We do not accept payment for coverage or favorable analysis.'
      },
      {
        heading: 'Fact-Checking Process',
        content: 'Every article undergoes multi-layer validation: AI-powered data verification, source authentication, expert analyst review, and originality checking. We cite all data sources and provide transparent attribution.'
      },
      {
        heading: 'Corrections Policy',
        content: 'We are committed to accuracy. If we make an error, we correct it promptly and transparently. All corrections are documented and clearly marked. Readers can report errors to editorial@siaintel.com.'
      },
      {
        heading: 'Conflict of Interest',
        content: 'Our analysts disclose any potential conflicts of interest. We do not trade assets we cover during active analysis periods. Our revenue comes from advertising and subscriptions, not from asset holdings.'
      },
      {
        heading: 'Risk Disclaimers',
        content: 'All content includes context-specific risk disclaimers. We clearly state that our analysis is for informational purposes only and not financial advice. Readers should conduct their own research and consult qualified advisors.'
      }
    ]
  },
  tr: {
    title: 'Yayın İlkeleri',
    subtitle: 'Doğruluk, Şeffaflık ve Kalite Standartlarımız',
    sections: [
      {
        heading: 'Yayın Bağımsızlığı',
        content: 'SIA Intelligence katı yayın bağımsızlığını korur. Analizlerimiz ve içgörülerimiz yalnızca veri, araştırma ve uzman değerlendirmesine dayanır. Kapsam veya olumlu analiz için ödeme kabul etmiyoruz.'
      },
      {
        heading: 'Doğrulama Süreci',
        content: 'Her makale çok katmanlı doğrulamadan geçer: Yapay zeka destekli veri doğrulama, kaynak kimlik doğrulama, uzman analist incelemesi ve özgünlük kontrolü. Tüm veri kaynaklarını belirtir ve şeffaf atıf sağlarız.'
      }
    ]
  },
  zh: {
    title: '编辑政策',
    subtitle: '我们对准确性、透明度与质量的标准',
    sections: [
      { heading: '编辑独立', content: 'SIA Intelligence 保持严格的编辑独立性。我们的分析与洞察仅基于数据、研究与专家判断。我们不为报道或倾向性分析接受付费。' },
      { heading: '事实核查流程', content: '每篇文章均经过多层验证：AI 数据核验、来源认证、专家分析师审阅与原创性检查。我们引用所有数据来源并透明署名。' },
      { heading: '更正政策', content: '我们致力于准确性。如有错误，将及时、透明地更正。所有更正均记录并明确标注。读者可向 editorial@siaintel.com 报告错误。' },
      { heading: '利益冲突', content: '我们的分析师披露任何潜在利益冲突。在积极分析期内我们不交易所覆盖资产。收入来自广告与订阅，而非资产持仓。' },
      { heading: '风险声明', content: '所有内容均包含针对具体情境的风险声明。我们明确声明分析仅供信息参考，不构成投资建议。读者应自行研究并咨询合格顾问。' }
    ]
  }
}

export async function generateMetadata({ params }: { params: { lang?: string } }): Promise<Metadata> {
  const lang = params?.lang ?? 'en'
  const t = EDITORIAL_SEO[lang] ?? EDITORIAL_SEO.en
  return { title: t.title, description: t.description, alternates: { canonical: `https://siaintel.com/${lang}/editorial-policy` } }
}

export default function EditorialPolicyPage({ params }: { params: { lang: string } }) {
  const content = EDITORIAL_CONTENT[params.lang] || EDITORIAL_CONTENT.en

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {content.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            {content.subtitle}
          </p>
        </div>

        <div className="space-y-8">
          {content.sections.map((section: any, index: number) => (
            <div key={index} className="bg-white dark:bg-slate-800/50 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {section.heading}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white dark:bg-slate-800/30 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {params.lang === 'zh' ? '联系编辑团队' : params.lang === 'tr' ? 'Yayın Ekibi ile İletişim' : 'Contact Editorial Team'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {params.lang === 'zh' ? '更正、反馈或编辑咨询：' : params.lang === 'tr' ? 'Düzeltmeler, geri bildirim veya yayın soruları için:' : 'For corrections, feedback, or editorial inquiries:'}
          </p>
          <a 
            href="mailto:editorial@siaintel.com"
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            editorial@siaintel.com
          </a>
        </div>
      </div>
    </div>
  )
}
