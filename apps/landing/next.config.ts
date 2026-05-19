import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const nextConfig: NextConfig = {
  transpilePackages: ['@iatf/ui', '@iatf/config'],
}

export default withNextIntl(nextConfig)
