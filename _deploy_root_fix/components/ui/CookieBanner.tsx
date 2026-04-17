'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Shield, Cookie } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

type ConsentChoice = 'all' | 'necessary' | 'custom' | null

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const COOKIE_CONSENT_KEY = 'sia_cookie_consent'
const COOKIE_PREFERENCES_KEY = 'sia_cookie_preferences'
const CONSENT_DURATION_DAYS = 365

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  })
  const { currentLang } = useLanguage()

  // Translations for all 9 languages
  const translations = {
    en: {
      title: 'Cookie Consent',
      description:
        'We use cookies to enhance your experience, analyze site traffic, and serve personalized content. Your privacy matters to us.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      settings: 'Cookie Settings',
      savePreferences: 'Save Preferences',
      close: 'Close',
      necessary: 'Necessary Cookies',
      necessaryDesc: 'Required for basic site functionality. Cannot be disabled.',
      analytics: 'Analytics Cookies',
      analyticsDesc: 'Help us understand how visitors interact with our site (Google Analytics).',
      marketing: 'Marketing Cookies',
      marketingDesc: 'Used to deliver relevant ads and track campaign performance (Google AdSense).',
      preferencesLabel: 'Preference Cookies',
      preferencesDesc: 'Remember your language and regional preferences.',
      learnMore: 'Learn more in our',
      privacyPolicy: 'Privacy Policy',
      gdprCompliant: 'GDPR & KVKK Compliant',
    },
    tr: {
      title: 'Çerez Onayı',
      description:
        'Deneyiminizi geliştirmek, site trafiğini analiz etmek ve kişiselleştirilmiş içerik sunmak için çerezler kullanıyoruz. Gizliliğiniz bizim için önemlidir.',
      acceptAll: 'Tümünü Kabul Et',
      rejectAll: 'Tümünü Reddet',
      settings: 'Çerez Ayarları',
      savePreferences: 'Tercihleri Kaydet',
      close: 'Kapat',
      necessary: 'Gerekli Çerezler',
      necessaryDesc: 'Temel site işlevselliği için gereklidir. Devre dışı bırakılamaz.',
      analytics: 'Analitik Çerezler',
      analyticsDesc:
        'Ziyaretçilerin sitemizle nasıl etkileşime girdiğini anlamamıza yardımcı olur (Google Analytics).',
      marketing: 'Pazarlama Çerezleri',
      marketingDesc:
        'İlgili reklamlar sunmak ve kampanya performansını izlemek için kullanılır (Google AdSense).',
      preferencesLabel: 'Tercih Çerezleri',
      preferencesDesc: 'Dil ve bölgesel tercihlerinizi hatırlar.',
      learnMore: 'Daha fazla bilgi için',
      privacyPolicy: 'Gizlilik Politikası',
      gdprCompliant: 'GDPR & KVKK Uyumlu',
    },
    de: {
      title: 'Cookie-Zustimmung',
      description:
        'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Website-Traffic zu analysieren und personalisierte Inhalte bereitzustellen. Ihre Privatsphäre ist uns wichtig.',
      acceptAll: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      settings: 'Cookie-Einstellungen',
      savePreferences: 'Einstellungen speichern',
      close: 'Schließen',
      necessary: 'Notwendige Cookies',
      necessaryDesc: 'Erforderlich für grundlegende Website-Funktionen. Kann nicht deaktiviert werden.',
      analytics: 'Analyse-Cookies',
      analyticsDesc:
        'Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren (Google Analytics).',
      marketing: 'Marketing-Cookies',
      marketingDesc:
        'Werden verwendet, um relevante Anzeigen zu liefern und die Kampagnenleistung zu verfolgen (Google AdSense).',
      preferencesLabel: 'Präferenz-Cookies',
      preferencesDesc: 'Merken sich Ihre Sprach- und Regionalpräferenzen.',
      learnMore: 'Erfahren Sie mehr in unserer',
      privacyPolicy: 'Datenschutzerklärung',
      gdprCompliant: 'DSGVO & KVKK konform',
    },
    fr: {
      title: 'Consentement aux cookies',
      description:
        'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic du site et diffuser du contenu personnalisé. Votre vie privée nous tient à cœur.',
      acceptAll: 'Tout accepter',
      rejectAll: 'Tout refuser',
      settings: 'Paramètres des cookies',
      savePreferences: 'Enregistrer les préférences',
      close: 'Fermer',
      necessary: 'Cookies nécessaires',
      necessaryDesc: 'Requis pour les fonctionnalités de base du site. Ne peut pas être désactivé.',
      analytics: 'Cookies analytiques',
      analyticsDesc:
        'Nous aident à comprendre comment les visiteurs interagissent avec notre site (Google Analytics).',
      marketing: 'Cookies marketing',
      marketingDesc:
        'Utilisés pour diffuser des publicités pertinentes et suivre les performances des campagnes (Google AdSense).',
      preferencesLabel: 'Cookies de préférence',
      preferencesDesc: 'Mémorisent vos préférences linguistiques et régionales.',
      learnMore: 'En savoir plus dans notre',
      privacyPolicy: 'Politique de confidentialité',
      gdprCompliant: 'Conforme RGPD & KVKK',
    },
    es: {
      title: 'Consentimiento de cookies',
      description:
        'Utilizamos cookies para mejorar su experiencia, analizar el tráfico del sitio y ofrecer contenido personalizado. Su privacidad es importante para nosotros.',
      acceptAll: 'Aceptar todo',
      rejectAll: 'Rechazar todo',
      settings: 'Configuración de cookies',
      savePreferences: 'Guardar preferencias',
      close: 'Cerrar',
      necessary: 'Cookies necesarias',
      necessaryDesc: 'Requeridas para la funcionalidad básica del sitio. No se pueden desactivar.',
      analytics: 'Cookies analíticas',
      analyticsDesc:
        'Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio (Google Analytics).',
      marketing: 'Cookies de marketing',
      marketingDesc:
        'Se utilizan para ofrecer anuncios relevantes y rastrear el rendimiento de campañas (Google AdSense).',
      preferencesLabel: 'Cookies de preferencias',
      preferencesDesc: 'Recuerdan sus preferencias de idioma y región.',
      learnMore: 'Más información en nuestra',
      privacyPolicy: 'Política de privacidad',
      gdprCompliant: 'Cumple con RGPD & KVKK',
    },
    ru: {
      title: 'Согласие на использование файлов cookie',
      description:
        'Мы используем файлы cookie для улучшения вашего опыта, анализа трафика сайта и предоставления персонализированного контента. Ваша конфиденциальность важна для нас.',
      acceptAll: 'Принять все',
      rejectAll: 'Отклонить все',
      settings: 'Настройки cookie',
      savePreferences: 'Сохранить настройки',
      close: 'Закрыть',
      necessary: 'Необходимые cookie',
      necessaryDesc: 'Требуются для базовой функциональности сайта. Не могут быть отключены.',
      analytics: 'Аналитические cookie',
      analyticsDesc:
        'Помогают нам понять, как посетители взаимодействуют с нашим сайтом (Google Analytics).',
      marketing: 'Маркетинговые cookie',
      marketingDesc:
        'Используются для показа релевантной рекламы и отслеживания эффективности кампаний (Google AdSense).',
      preferencesLabel: 'Cookie предпочтений',
      preferencesDesc: 'Запоминают ваши языковые и региональные предпочтения.',
      learnMore: 'Узнайте больше в нашей',
      privacyPolicy: 'Политике конфиденциальности',
      gdprCompliant: 'Соответствует GDPR & KVKK',
    },
    ar: {
      title: 'موافقة ملفات تعريف الارتباط',
      description:
        'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور على الموقع وتقديم محتوى مخصص. خصوصيتك مهمة بالنسبة لنا.',
      acceptAll: 'قبول الكل',
      rejectAll: 'رفض الكل',
      settings: 'إعدادات ملفات تعريف الارتباط',
      savePreferences: 'حفظ التفضيلات',
      close: 'إغلاق',
      necessary: 'ملفات تعريف الارتباط الضرورية',
      necessaryDesc: 'مطلوبة للوظائف الأساسية للموقع. لا يمكن تعطيلها.',
      analytics: 'ملفات تعريف الارتباط التحليلية',
      analyticsDesc: 'تساعدنا على فهم كيفية تفاعل الزوار مع موقعنا (Google Analytics).',
      marketing: 'ملفات تعريف الارتباط التسويقية',
      marketingDesc:
        'تُستخدم لتقديم إعلانات ذات صلة وتتبع أداء الحملات (Google AdSense).',
      preferencesLabel: 'ملفات تعريف الارتباط التفضيلية',
      preferencesDesc: 'تتذكر تفضيلات اللغة والمنطقة الخاصة بك.',
      learnMore: 'تعرف على المزيد في',
      privacyPolicy: 'سياسة الخصوصية',
      gdprCompliant: 'متوافق مع GDPR و KVKK',
    },
    jp: {
      title: 'Cookieの同意',
      description:
        'お客様の体験を向上させ、サイトのトラフィックを分析し、パーソナライズされたコンテンツを提供するためにCookieを使用しています。お客様のプライバシーは私たちにとって重要です。',
      acceptAll: 'すべて受け入れる',
      rejectAll: 'すべて拒否',
      settings: 'Cookie設定',
      savePreferences: '設定を保存',
      close: '閉じる',
      necessary: '必須Cookie',
      necessaryDesc: 'サイトの基本機能に必要です。無効にできません。',
      analytics: '分析Cookie',
      analyticsDesc:
        '訪問者がサイトとどのように対話するかを理解するのに役立ちます（Google Analytics）。',
      marketing: 'マーケティングCookie',
      marketingDesc:
        '関連する広告を配信し、キャンペーンのパフォーマンスを追跡するために使用されます（Google AdSense）。',
      preferencesLabel: '設定Cookie',
      preferencesDesc: '言語と地域の設定を記憶します。',
      learnMore: '詳細については',
      privacyPolicy: 'プライバシーポリシー',
      gdprCompliant: 'GDPR & KVKK準拠',
    },
    zh: {
      title: 'Cookie同意',
      description:
        '我们使用Cookie来增强您的体验、分析网站流量并提供个性化内容。您的隐私对我们很重要。',
      acceptAll: '接受全部',
      rejectAll: '拒绝全部',
      settings: 'Cookie设置',
      savePreferences: '保存偏好',
      close: '关闭',
      necessary: '必要Cookie',
      necessaryDesc: '网站基本功能所需。无法禁用。',
      analytics: '分析Cookie',
      analyticsDesc: '帮助我们了解访问者如何与我们的网站互动（Google Analytics）。',
      marketing: '营销Cookie',
      marketingDesc: '用于提供相关广告并跟踪活动效果（Google AdSense）。',
      preferencesLabel: '偏好Cookie',
      preferencesDesc: '记住您的语言和地区偏好。',
      learnMore: '了解更多信息，请查看我们的',
      privacyPolicy: '隐私政策',
      gdprCompliant: '符合GDPR和KVKK',
    },
  }

  const t = translations[String(currentLang) as keyof typeof translations] || translations.en

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)

    if (consent) {
      // User has already consented, initialize tracking if allowed
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences) as CookiePreferences
        if (prefs.analytics || prefs.marketing) {
          initializeTracking(prefs)
        }
      }
    } else {
      // Show banner after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = (choice: ConsentChoice, customPrefs?: CookiePreferences) => {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + CONSENT_DURATION_DAYS)

    const consentData = {
      choice,
      timestamp: new Date().toISOString(),
      expiry: expiryDate.toISOString(),
    }

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    let finalPreferences: CookiePreferences

    if (choice === 'all') {
      finalPreferences = {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
      }
    } else if (choice === 'necessary') {
      finalPreferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      }
    } else {
      finalPreferences = customPrefs || preferences
    }

    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(finalPreferences))

    // Initialize tracking if analytics or marketing is enabled
    if (finalPreferences.analytics || finalPreferences.marketing) {
      initializeTracking(finalPreferences)
    }

    setIsVisible(false)
  }

  const initializeTracking = (prefs: CookiePreferences) => {
    // Google Analytics 4 initialization
    if (prefs.analytics && typeof window !== 'undefined') {
      const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

      if (GA4_ID) {
        // Load gtag.js script
        const script = document.createElement('script')
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
        script.async = true
        document.head.appendChild(script)

        // Initialize gtag
        window.dataLayer = window.dataLayer || []
        function gtag(...args: any[]) {
          window.dataLayer.push(args)
        }
        gtag('js', new Date())
        gtag('config', GA4_ID, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure',
        })

        console.log('[COOKIE-BANNER] Google Analytics initialized')
      }
    }

    // Google AdSense initialization
    if (prefs.marketing && typeof window !== 'undefined') {
      const ADSENSE_ID = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID

      if (ADSENSE_ID) {
        const script = document.createElement('script')
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`
        script.async = true
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)

        console.log('[COOKIE-BANNER] Google AdSense initialized')
      }
    }
  }

  const handleAcceptAll = () => {
    saveConsent('all')
  }

  const handleRejectAll = () => {
    saveConsent('necessary')
  }

  const handleSavePreferences = () => {
    saveConsent('custom', preferences)
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return // Cannot disable necessary cookies
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in"
        onClick={() => !showSettings && setIsVisible(false)}
      />

      {/* Banner */}
      <div className="relative w-full max-w-6xl mx-4 mb-6 pointer-events-auto animate-slide-up">
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-2xl shadow-lime-500/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center">
                <Cookie className="text-lime-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  {t.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Shield size={12} className="text-lime-500" />
                  <span className="text-[9px] font-bold text-lime-400 uppercase tracking-widest">
                    {t.gdprCompliant}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              aria-label={t.close}
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showSettings ? (
              // Main View
              <div className="space-y-6">
                <p className="text-slate-300 leading-relaxed">{t.description}</p>
                <p className="text-sm text-slate-400">
                  {t.learnMore}{' '}
                  <a
                    href={`/${String(currentLang)}/privacy-policy`}
                    className="text-lime-400 hover:text-lime-300 underline transition-colors"
                  >
                    {t.privacyPolicy}
                  </a>
                  .
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 min-w-[140px] px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-black uppercase text-sm rounded-xl transition-all shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40"
                  >
                    {t.acceptAll}
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 min-w-[140px] px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-sm rounded-xl transition-all border border-white/10"
                  >
                    {t.rejectAll}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-sm rounded-xl transition-all border border-white/10"
                  >
                    <Settings size={16} />
                    {t.settings}
                  </button>
                </div>
              </div>
            ) : (
              // Settings View
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Necessary Cookies */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-bold uppercase text-sm">{t.necessary}</h4>
                      <div className="px-3 py-1 bg-lime-500/20 text-lime-400 text-xs font-black uppercase rounded-full">
                        Always Active
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{t.necessaryDesc}</p>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-bold uppercase text-sm">{t.analytics}</h4>
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={`w-12 h-6 rounded-full transition-all ${
                          preferences.analytics ? 'bg-lime-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            preferences.analytics ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400">{t.analyticsDesc}</p>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-bold uppercase text-sm">{t.marketing}</h4>
                      <button
                        onClick={() => togglePreference('marketing')}
                        className={`w-12 h-6 rounded-full transition-all ${
                          preferences.marketing ? 'bg-lime-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            preferences.marketing ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400">{t.marketingDesc}</p>
                  </div>

                  {/* Preference Cookies */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-bold uppercase text-sm">
                        {t.preferencesLabel}
                      </h4>
                      <button
                        onClick={() => togglePreference('preferences')}
                        className={`w-12 h-6 rounded-full transition-all ${
                          preferences.preferences ? 'bg-lime-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            preferences.preferences ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400">{t.preferencesDesc}</p>
                  </div>
                </div>

                {/* Settings Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-black uppercase text-sm rounded-xl transition-all shadow-lg shadow-lime-500/20"
                  >
                    {t.savePreferences}
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-sm rounded-xl transition-all border border-white/10"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}

// Type declaration for window.dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
