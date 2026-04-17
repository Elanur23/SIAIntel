export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'tr', 'de', 'es', 'fr', 'ar', 'ru', 'jp', 'zh'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const localeRegions: Record<string, string> = {
  en: 'US',
  tr: 'TR',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  ar: 'AE',
  ru: 'RU',
  jp: 'JP',
  zh: 'CN',
};

const _terms: Record<string, string> = { en: 'Terms of Service', tr: 'Kullanım Koşulları', de: 'Nutzungsbedingungen', es: 'Términos de uso', fr: "Conditions d'utilisation", ar: 'الشروط والأحكام', ru: 'Условия использования', jp: '利用規約', zh: '服务条款' };
const _termsDesc: Record<string, string> = { en: 'Terms of use and service.', tr: 'Kullanım koşulları ve hizmet şartları.', de: 'Nutzungsbedingungen.', es: 'Términos de uso y servicio.', fr: "Conditions d'utilisation et de service.", ar: 'شروط الاستخدام والخدمة.', ru: 'Условия использования и сервиса.', jp: '利用規約とサービス条件。', zh: '使用条款和服务条款。' };
const _privacy: Record<string, string> = { en: 'Privacy Policy', tr: 'Gizlilik Politikası', de: 'Datenschutz', es: 'Política de privacidad', fr: 'Politique de confidentialité', ar: 'سياسة الخصوصية', ru: 'Политика конфиденциальности', jp: 'プライバシーポリシー', zh: '隐私政策' };
const _privacyDesc: Record<string, string> = { en: 'Privacy policy and data protection.', tr: 'Gizlilik politikası ve veri koruma.', de: 'Datenschutz und Daten protection.', es: 'Política de privacidad y protección de datos.', fr: 'Politique de confidentialité et protection des données.', ar: 'سياسة الخصوصية وحماية البيانات.', ru: 'Политика конфиденциальности и защита данных.', jp: 'プライバシーポリシーとデータ保護。', zh: '隐私政策和数据保护。' };

const translations: Record<string, Record<string, Record<string, string>>> = {
  terms: { title: _terms, description: _termsDesc },
  privacyPolicy: { title: _privacy, description: _privacyDesc },
};

export function getTranslation(
  namespace: keyof typeof translations,
  key: string,
  locale: string
): string {
  const ns = translations[namespace];
  if (!ns) return key;
  const keys = ns[key as keyof typeof ns];
  if (!keys) return key;
  return keys[locale] ?? keys.en ?? key;
}
