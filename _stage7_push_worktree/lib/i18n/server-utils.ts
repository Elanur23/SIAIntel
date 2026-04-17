/**
 * SIA I18N SERVER UTILS
 * Helper functions for internationalization in Server Components
 */
import { getDictionary, Locale } from './dictionaries'

/**
 * Server-side translation helper for pages that can't use React hooks
 * @param lang The locale to use for translation
 */
export function getT(lang: string) {
  const dict = getDictionary(lang as Locale)

  return (path: string): string => {
    const keys = path.split('.')
    let result: any = dict

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return path
      }
    }

    return typeof result === 'string' ? result : path
  }
}
