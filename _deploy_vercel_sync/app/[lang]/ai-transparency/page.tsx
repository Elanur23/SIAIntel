import { Metadata } from 'next'

const AI_TRANSPARENCY_SEO: Record<string, { title: string; description: string }> = {
  en: { title: 'AI Transparency | SIA Intelligence', description: 'Learn how SIA Intelligence uses AI technology responsibly with human oversight and expert validation.' },
  tr: { title: 'Yapay Zeka Şeffaflığı | SIA Intelligence', description: 'SIA Intelligence\'ın insan denetimi ve uzman doğrulaması ile yapay zekayı nasıl sorumlu kullandığını öğrenin.' },
  de: { title: 'KI-Transparenz | SIA Intelligence', description: 'Wie SIA Intelligence KI verantwortungsvoll mit menschlicher Aufsicht und Expertenvalidierung einsetzt.' },
  fr: { title: 'Transparence IA | SIA Intelligence', description: 'Comment SIA Intelligence utilise l\'IA de manière responsable avec supervision humaine et validation d\'experts.' },
  es: { title: 'Transparencia IA | SIA Intelligence', description: 'Cómo SIA Intelligence utiliza la IA de forma responsable con supervisión humana y validación de expertos.' },
  ru: { title: 'Прозрачность ИИ | SIA Intelligence', description: 'Как SIA Intelligence ответственно использует ИИ с надзором человека и проверкой экспертов.' },
  ar: { title: 'شفافية الذكاء الاصطناعي | SIA Intelligence', description: 'كيف تستخدم SIA Intelligence تقنية الذكاء الاصطناعي بمسؤولية مع الإشراف البشري والتحقق من الخبراء.' },
  jp: { title: 'AI透明性 | SIA Intelligence', description: 'SIA Intelligenceが人間の監督と専門家検証のもとでAIを責任持って活用する方法。' },
  zh: { title: 'AI 透明度 | SIA Intelligence', description: '了解 SIA Intelligence 如何在人工监督与专家验证下负责任地使用 AI 技术。' },
}

const AI_TRANSPARENCY_CONTENT: Record<string, any> = {
  en: {
    title: 'AI Transparency Manifesto',
    subtitle: 'How We Use Artificial Intelligence Responsibly',
    sections: [
      {
        heading: 'Our Approach: AI-Assisted, Human-Verified',
        content: 'At SIA Intelligence, we believe in transparency about our use of AI technology. Our content is generated through a hybrid approach: AI processes raw data and identifies patterns, while expert analysts review, validate, and enhance every insight before publication.'
      },
      {
        heading: 'The Technology Stack',
        content: 'We use advanced AI models including Gemini 1.5 Pro with Google Search grounding for real-time data analysis. Our proprietary SIA_SENTINEL system processes on-chain analytics, market data, and global news feeds. However, AI is a tool, not a replacement for human expertise.'
      },
      {
        heading: 'Multi-Agent Validation',
        content: 'Every piece of content undergoes validation by multiple AI agents checking for accuracy, originality, and compliance. But the final approval always comes from our Council of Five expert analysts who bring years of real-world experience.'
      },
      {
        heading: 'Quality Standards',
        content: 'We maintain strict quality metrics: E-E-A-T score minimum 75/100, originality minimum 70%, and 100% AdSense compliance. Content that doesn\'t meet these standards is rejected or regenerated.'
      },
      {
        heading: 'Google Helpful Content Compliance',
        content: 'Our content is created for people, not search engines. We demonstrate first-hand expertise through our analyst team, provide unique value through proprietary data analysis, and maintain high quality standards that benefit readers.'
      }
    ]
  },
  tr: {
    title: 'Yapay Zeka Şeffaflık Manifestosu',
    subtitle: 'Yapay Zekayı Sorumlu Bir Şekilde Nasıl Kullanıyoruz',
    sections: [
      {
        heading: 'Yaklaşımımız: Yapay Zeka Destekli, İnsan Doğrulamalı',
        content: 'SIA Intelligence olarak, yapay zeka teknolojisi kullanımımız konusunda şeffaflığa inanıyoruz. İçeriğimiz hibrit bir yaklaşımla üretilir: Yapay zeka ham verileri işler ve kalıpları tanımlar, uzman analistler ise yayınlanmadan önce her içgörüyü inceler, doğrular ve geliştirir.'
      },
      {
        heading: 'Teknoloji Yığını',
        content: 'Gerçek zamanlı veri analizi için Google Arama temellemeli Gemini 1.5 Pro dahil gelişmiş yapay zeka modelleri kullanıyoruz. Özel SIA_SENTINEL sistemimiz zincir üstü analitik, piyasa verileri ve küresel haber akışlarını işler. Ancak yapay zeka bir araçtır, insan uzmanlığının yerini almaz.'
      }
    ]
  },
  zh: {
    title: 'AI 透明度宣言',
    subtitle: '我们如何负责任地使用人工智能',
    sections: [
      { heading: '我们的方式：AI 辅助、人工验证', content: 'SIA Intelligence 相信在使用 AI 技术方面保持透明。我们的内容采用混合方式生成：AI 处理原始数据并识别模式，专家分析师在发布前审阅、验证并完善每项洞察。' },
      { heading: '技术栈', content: '我们使用包括 Gemini 1.5 Pro（含 Google 搜索 grounding）在内的先进 AI 模型进行实时数据分析。自有 SIA_SENTINEL 系统处理链上分析、市场数据与全球新闻流。但 AI 是工具，不能替代人类专业知识。' },
      { heading: '多智能体验证', content: '每项内容均经多个 AI 智能体验证，检查准确性、原创性与合规性。但最终批准始终来自我们的五人委员会专家分析师，他们拥有多年的实战经验。' },
      { heading: '质量标准', content: '我们坚持严格的质量指标：E-E-A-T 分数至少 75/100，原创性至少 70%，AdSense 合规 100%。未达标准的内容将被拒绝或重新生成。' },
      { heading: 'Google 有用内容合规', content: '我们的内容为人而创，非为搜索引擎。我们通过分析师团队展示第一手专业知识，通过自有数据分析提供独特价值，并保持有利于读者的高质量标准。' }
    ]
  }
}

export async function generateMetadata({ params }: { params: { lang?: string } }): Promise<Metadata> {
  const lang = params?.lang ?? 'en'
  const t = AI_TRANSPARENCY_SEO[lang] ?? AI_TRANSPARENCY_SEO.en
  return { title: t.title, description: t.description, alternates: { canonical: `https://siaintel.com/${lang}/ai-transparency` } }
}

export default function AITransparencyPage({ params }: { params: { lang: string } }) {
  const content = AI_TRANSPARENCY_CONTENT[params.lang] || AI_TRANSPARENCY_CONTENT.en

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <span className="text-emerald-400 text-sm font-semibold">
              🤖 AI + 👨‍💼 Human Expertise
            </span>
          </div>
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

        <div className="mt-12 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {params.lang === 'zh' ? '我们的承诺' : params.lang === 'tr' ? 'Taahhüdümüz' : 'Our Commitment'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {params.lang === 'zh'
              ? '我们致力于负责任地使用 AI、透明披露并保持金融新闻的最高标准。技术增强人类专业知识，而非取代它。'
              : params.lang === 'tr'
                ? 'Sorumlu yapay zeka kullanımı, şeffaf açıklama ve en yüksek finansal gazetecilik standartlarına bağlıyız. Teknolojimiz insan uzmanlığını geliştirir, yerini almaz.'
                : 'We are committed to responsible AI use, transparent disclosure, and maintaining the highest standards of financial journalism. Our technology enhances human expertise, it doesn\'t replace it.'}
          </p>
        </div>
      </div>
    </div>
  )
}
