import { NextResponse } from 'next/server'
import { OEM_CATALOG } from '@/modules/csr/data'
import type { OemInfo, OemId } from '@/modules/csr/types'

/**
 * GET /api/csr/oems
 *
 * Returns the available OEM list, fetched from Strapi CMS when available.
 * Falls back to the local static catalog so the app always works.
 */
export async function GET() {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL
  const strapiToken = process.env.STRAPI_API_TOKEN

  if (strapiUrl && strapiToken) {
    try {
      const url = new URL('/api/oem-profiles', strapiUrl)
      url.searchParams.set('filters[active][$eq]', 'true')
      url.searchParams.set('pagination[pageSize]', '100')
      url.searchParams.set('sort', 'oemId:asc')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${strapiToken}` },
        next: { revalidate: 300 },
      })

      if (res.ok) {
        const json = (await res.json()) as {
          data: Array<{
            oemId: string
            name: string
            logo?: string
            lastUpdate?: string
            csrCount: number
          }>
        }

        if (json.data.length > 0) {
          const oems: OemInfo[] = json.data.map((d) => ({
            id: d.oemId as OemId,
            name: d.name,
            logo: d.logo ?? `${d.oemId.toLowerCase()}.svg`,
            lastUpdate: d.lastUpdate ?? new Date().toISOString().slice(0, 10),
            csrCount: d.csrCount,
          }))

          return NextResponse.json(
            { oems },
            { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
          )
        }
      }
    } catch {
      // Strapi unavailable — fall through to local catalog
    }
  }

  return NextResponse.json({ oems: OEM_CATALOG })
}
