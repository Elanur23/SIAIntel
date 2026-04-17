import type { Language, MetadataPackage } from '@/lib/dispatcher/types'

export interface MetadataInput {
  title: string
  description: string
  keywords?: string[]
}

export function generateAllLanguageMetadata(
  content: Record<Language, MetadataInput>
): Record<Language, MetadataPackage> {
  const entries = Object.entries(content).map(([language, value]) => {
    const metadata: MetadataPackage = {
      title: value.title,
      description: value.description,
      keywords: value.keywords || [],
      author: 'SIA Intelligence',
      publishedTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
    }

    return [language, metadata]
  })

  return Object.fromEntries(entries) as Record<Language, MetadataPackage>
}
