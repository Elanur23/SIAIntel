/**
 * SIA CONTACT PAGE - V2.0 (SEO & E-E-A-T ENHANCED)
 * FEATURES: MULTILINGUAL SEO | JSON-LD | ACCESSIBLE UI
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, MessageSquare, Send, Shield, MapPin, ChevronRight, Terminal } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { normalizePublicRouteLocale, toDictionaryLocale } from '@/lib/i18n/route-locales'

const CONTACT_LABELS: Record<string, any> = {
  en: {
    title: 'CONTACT',
    subtitle: 'Get in touch with the SIA Intelligence Unit',
    sendMessage: 'Send Message',
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    sendBtn: 'Send Message',
    contactInfo: 'Intelligence Network',
    support: 'Technical Support',
    location: 'Global Presence',
    quickResponse: 'SIA Protocol: Quick Response',
    quickResponseText:
      'Our analysts typically respond within 24 hours. For urgent intelligence tips, please email tips@siaintel.com.',
    seoTitle: 'Contact SIA Intelligence | Global Financial Terminal',
    seoDesc:
      'Get in touch with SIA Intelligence for support, media inquiries, or intelligence tips. Global financial terminal contact information.',
  },
  tr: {
    title: 'İLETİŞİM',
    subtitle: 'SIA İstihbarat Birimi ile iletişime geçin',
    sendMessage: 'Mesaj Gönderin',
    name: 'İsim',
    email: 'E-posta',
    subject: 'Konu',
    message: 'Mesaj',
    sendBtn: 'Gönder',
    contactInfo: 'İstihbarat Ağı',
    support: 'Teknik Destek',
    location: 'Küresel Varlık',
    quickResponse: 'SIA Protokolü: Hızlı Yanıt',
    quickResponseText:
      'Analistlerimiz genellikle 24 saat içinde yanıt verir. Acil istihbarat ipuçları için lütfen tips@siaintel.com adresine e-posta gönderin.',
    seoTitle: 'SIA İstihbarat ile İletişime Geçin | Küresel Finansal Terminal',
    seoDesc:
      'Destek, medya sorguları veya istihbarat ipuçları için SIA İstihbarat ile iletişime geçin. Küresel finansal terminal iletişim bilgileri.',
  },
  de: {
    title: 'KONTAKT',
    subtitle: 'Kontaktieren Sie die SIA Intelligence Unit',
    sendMessage: 'Nachricht senden',
    name: 'Name',
    email: 'E-Mail',
    subject: 'Betreff',
    message: 'Nachricht',
    sendBtn: 'Senden',
    contactInfo: 'Intelligence-Netzwerk',
    support: 'Technischer Support',
    location: 'Globale Präsenz',
    quickResponse: 'SIA-Protokoll: Schnelle Antwort',
    quickResponseText: 'Unsere Analysten antworten in der Regel innerhalb von 24 Stunden.',
    seoTitle: 'Kontaktieren Sie SIA Intelligence | Globales Finanzterminal',
    seoDesc: 'Kontaktieren Sie SIA Intelligence für Support, Medienanfragen oder Tipps.',
  },
  fr: {
    title: 'CONTACT',
    subtitle: "Contactez l'unité d'intelligence SIA",
    sendMessage: 'Envoyer un message',
    name: 'Nom',
    email: 'E-mail',
    subject: 'Sujet',
    message: 'Message',
    sendBtn: 'Envoyer',
    contactInfo: "Réseau d'intelligence",
    support: 'Support technique',
    location: 'Présence mondiale',
    quickResponse: 'Protocole SIA: Réponse rapide',
    quickResponseText: 'Nos analystes répondent généralement sous 24 heures.',
    seoTitle: 'Contactez SIA Intelligence | Terminal Financier Mondial',
    seoDesc: 'Contactez SIA Intelligence pour toute assistance ou information.',
  },
  es: {
    title: 'CONTACTO',
    subtitle: 'Contacte con la Unidad de Inteligencia SIA',
    sendMessage: 'Enviar mensaje',
    name: 'Nombre',
    email: 'Email',
    subject: 'Asunto',
    message: 'Mensaje',
    sendBtn: 'Enviar',
    contactInfo: 'Red de Inteligencia',
    support: 'Soporte Técnico',
    location: 'Presencia Global',
    quickResponse: 'Protocolo SIA: Respuesta rápida',
    quickResponseText: 'Nuestros analistas suelen responder en 24 horas.',
    seoTitle: 'Contacto SIA Intelligence | Terminal Financiero Global',
    seoDesc: 'Contacte con SIA Intelligence para soporte o consultas.',
  },
  ru: {
    title: 'КОНТАКТЫ',
    subtitle: 'Свяжитесь с подразделением SIA Intelligence',
    sendMessage: 'Отправить сообщение',
    name: 'Имя',
    email: 'Email',
    subject: 'Тема',
    message: 'Сообщение',
    sendBtn: 'Отправить',
    contactInfo: 'Интеллектуальная сеть',
    support: 'Техподдержка',
    location: 'Глобальное присутствие',
    quickResponse: 'Протокол SIA: Быстрый ответ',
    quickResponseText: 'Наши аналитики обычно отвечают в течение 24 часов.',
    seoTitle: 'Контакты SIA Intelligence | Глобальный финансовый терминал',
    seoDesc: 'Свяжитесь с SIA Intelligence для поддержки или передачи информации.',
  },
  ar: {
    title: 'اتصل بنا',
    subtitle: 'تواصل مع وحدة استخبارات SIA',
    sendMessage: 'إرسال رسالة',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    subject: 'الموضوع',
    message: 'الرسالة',
    sendBtn: 'إرسال',
    contactInfo: 'شبكة الاستخبارات',
    support: 'الدعم الفني',
    location: 'التواجد العالمي',
    quickResponse: 'بروتوكول SIA: استجابة سريعة',
    quickResponseText: 'يرد محللونا عادةً في غضon 24 ساعة.',
    seoTitle: 'اتصل بـ SIA Intelligence | محطة مالية عالمية',
    seoDesc: 'اتصل بـ SIA Intelligence للحصول على الدعم أو الاستفسارات.',
  },
  jp: {
    title: 'お問い合わせ',
    subtitle: 'SIAインテリジェンスユニットに連絡する',
    sendMessage: 'メッセージを送信',
    name: '名前',
    email: 'メール',
    subject: '件名',
    message: 'メッセージ',
    sendBtn: '送信',
    contactInfo: 'インテリジェンスネットワーク',
    support: 'テクニカルサポート',
    location: 'グローバルプレゼンス',
    quickResponse: 'SIAプロトコル: 迅速な対応',
    quickResponseText: '通常、24時間以内に回答いたします。',
    seoTitle: 'SIAインテリジェンスへのお問い合わせ | グローバル金融ターミナル',
    seoDesc: 'サポート、メディアのお問い合わせ、情報の提供はSIAインテリジェンスまで。',
  },
  zh: {
    title: '联系我们',
    subtitle: '与 SIA 情报部门取得联系',
    sendMessage: '发送消息',
    name: '姓名',
    email: '邮箱',
    subject: '主题',
    message: '留言',
    sendBtn: '发送',
    contactInfo: '情报网络',
    support: '技术支持',
    location: '全球布局',
    quickResponse: 'SIA协议：快速响应',
    quickResponseText: '我们通常在 24 小时内回复。',
    seoTitle: '联系 SIA Intelligence | 全球金融终端',
    seoDesc: '联系 SIA Intelligence 获取支持或媒体查询。',
  },
}

export default function ContactPage({ params }: { params: { lang: string } }) {
  const { setLanguage } = useLanguage()
  const routeLang = normalizePublicRouteLocale(params?.lang)
  const lang = toDictionaryLocale(routeLang)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  useEffect(() => {
    setLanguage(lang as any)
  }, [lang, setLanguage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('SIA Intelligence Unit: Message Received. We will analyze and respond.')
  }

  const t = CONTACT_LABELS[lang] || CONTACT_LABELS.en

  // JSON-LD Structured Data for Contact Page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t.seoTitle,
    description: t.seoDesc,
    url: `https://siaintel.com/${routeLang}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'SIA Intelligence',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@siaintel.com',
        contactType: 'customer support',
      },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Terminal',
        item: `https://siaintel.com/${routeLang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t.seoTitle,
        item: `https://siaintel.com/${routeLang}/contact`,
      },
    ],
  }

  return (
    <div className="text-slate-700 dark:text-slate-400 selection:bg-blue-600">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 lg:px-6 py-12 md:py-24">
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30 mb-10">
          <Link
            href={`/${routeLang}`}
            className="hover:text-blue-500 transition-colors flex items-center gap-2"
          >
            <Terminal size={12} /> Terminal
          </Link>
          <ChevronRight size={10} />
          <span className="text-slate-700 dark:text-white/60">Contact</span>
        </nav>

        <div className="mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="p-6 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 shadow-xl shadow-blue-500/5">
              <MessageSquare size={48} className="text-blue-500" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">
                {t.title}
              </h1>
              <p className="text-xl text-slate-600 dark:text-blue-400 font-bold italic uppercase tracking-widest">
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 md:p-16 shadow-2xl"
          >
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-10">
              {t.sendMessage}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    {t.name}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                  {t.subject}
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-3">
                  {t.message}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all resize-none font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-6 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 active:scale-95"
              >
                <Send size={24} />
                {t.sendBtn}
              </button>
            </form>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 md:p-16 shadow-2xl">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-10">
                {t.contactInfo}
              </h2>

              <div className="space-y-10">
                <div className="flex items-start gap-6 group">
                  <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 group-hover:bg-blue-600/20 transition-all">
                    <Mail size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-2">
                      {t.email}
                    </h3>
                    <p className="text-lg text-slate-900 dark:text-white font-black uppercase italic">
                      contact@siaintel.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="p-4 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-600/20 transition-all">
                    <Shield size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-2">
                      {t.support}
                    </h3>
                    <p className="text-lg text-slate-900 dark:text-white font-black uppercase italic">
                      support@siaintel.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="p-4 bg-orange-600/10 rounded-2xl border border-orange-500/20 group-hover:bg-orange-600/20 transition-all">
                    <MapPin size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-2">
                      {t.location}
                    </h3>
                    <p className="text-lg text-slate-900 dark:text-white font-black uppercase italic">
                      {t.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">
                {t.quickResponse}
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                "{t.quickResponseText}"
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                <span className="text-slate-400 dark:text-white/20">Related:</span>
                <Link
                  href={`/${routeLang}/editorial-policy`}
                  className="hover:text-blue-500 transition-colors"
                >
                  Editorial Policy
                </Link>
                <span className="text-slate-300 dark:text-white/20">/</span>
                <Link
                  href={`/${routeLang}/ai-transparency`}
                  className="hover:text-blue-500 transition-colors"
                >
                  AI Transparency
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
