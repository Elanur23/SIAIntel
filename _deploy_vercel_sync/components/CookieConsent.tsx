'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'siaintel_cookie_consent'

const cookieText: Record<string, { message: string; reject: string; accept: string }> = {
  tr: {
    message: 'Bu sitede deneyiminizi iyileştirmek ve reklamları göstermek için çerezler kullanıyoruz. Devam ederek Çerez Politikası ve Gizlilik Politikası\'nı kabul etmiş olursunuz.',
    reject: 'Reddet',
    accept: 'Kabul',
  },
  en: {
    message: 'We use cookies to improve your experience and show ads. By continuing you accept our Cookie and Privacy policies.',
    reject: 'Reject',
    accept: 'Accept',
  },
  de: {
    message: 'Wir verwenden Cookies für Analyse und Werbung. Mit dem Fortfahren akzeptieren Sie unsere Cookie- und Datenschutzrichtlinie.',
    reject: 'Ablehnen',
    accept: 'Akzeptieren',
  },
  fr: {
    message: 'Nous utilisons des cookies pour améliorer votre expérience et afficher des publicités. En continuant, vous acceptez notre politique de cookies et de confidentialité.',
    reject: 'Refuser',
    accept: 'Accepter',
  },
  es: {
    message: 'Utilizamos cookies para mejorar su experiencia y mostrar anuncios. Al continuar acepta nuestra política de cookies y privacidad.',
    reject: 'Rechazar',
    accept: 'Aceptar',
  },
  ru: {
    message: 'Мы используем файлы cookie для аналитики и рекламы. Продолжая, вы принимаете нашу политику cookie и конфиденциальности.',
    reject: 'Отклонить',
    accept: 'Принять',
  },
  ar: {
    message: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وعرض الإعلانات. بالمتابعة فإنك تقبل سياسة ملفات تعريف الارتباط والخصوصية.',
    reject: 'رفض',
    accept: 'قبول',
  },
  jp: {
    message: '当サイトでは分析と広告のためにクッキーを使用しています。続行するとCookieおよびプライバシーポリシーに同意したものとみなされます。',
    reject: '拒否',
    accept: '同意',
  },
  zh: {
    message: '我们使用 Cookie 改善您的体验并展示广告。继续即表示您接受我们的 Cookie 和隐私政策。',
    reject: '拒绝',
    accept: '接受',
  },
}

export default function CookieConsent() {
  const pathname = usePathname()
  const lang = (pathname?.split('/')[1] || 'en') as keyof typeof cookieText
  const texts = cookieText[lang] || cookieText.en

  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === null) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {}
    setVisible(false)
  }

  const reject = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'rejected')
    } catch {}
    setVisible(false)
  }

  if (!mounted || !visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 bg-[#0A0A0C] border-t border-white/10 shadow-2xl"
    >
      <div className="container mx-auto max-w-4xl flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm text-slate-400 flex-1">
          {texts.message}{' '}
          <Link href="/legal/cookies" className="text-blue-400 underline hover:text-blue-300">
            {lang === 'tr' ? 'Çerez Politikası' : lang === 'de' ? 'Cookie-Richtlinie' : lang === 'fr' ? 'Politique de cookies' : lang === 'es' ? 'Política de cookies' : lang === 'ru' ? 'Политика cookie' : lang === 'ar' ? 'سياسة ملفات الارتباط' : lang === 'jp' ? 'Cookieポリシー' : 'Cookie Policy'}
          </Link>
          {' · '}
          <Link href="/legal/privacy" className="text-blue-400 underline hover:text-blue-300">
            {lang === 'tr' ? 'Gizlilik Politikası' : lang === 'de' ? 'Datenschutz' : lang === 'fr' ? 'Politique de confidentialité' : lang === 'es' ? 'Política de privacidad' : lang === 'ru' ? 'Политика конфиденциальности' : lang === 'ar' ? 'سياسة الخصوصية' : lang === 'jp' ? 'プライバシーポリシー' : 'Privacy Policy'}
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-xs font-bold uppercase border border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors rounded"
          >
            {texts.reject}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-xs font-black uppercase bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            {texts.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
