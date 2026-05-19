import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://iatf-solutions.com'
const LOCALES = ['en', 'de'] as const
const CHANGE_FREQ = 'weekly' as const

/**
 * Public routes that should be indexed.
 * Add new pages here as the site grows.
 */
const PUBLIC_ROUTES = [
  { path: '', priority: 1.0 },      // home
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority } of PUBLIC_ROUTES) {
    for (const locale of LOCALES) {
      const url = `${BASE_URL}/${locale}${path ? `/${path}` : ''}`
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: CHANGE_FREQ,
        priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l,
              `${BASE_URL}/${l}${path ? `/${path}` : ''}`,
            ])
          ),
        },
      })
    }
  }

  return entries
}
