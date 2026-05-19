import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

type MessageImporter = (locale: string) => Promise<Record<string, unknown>>

export function createRequestConfig(importMessages: MessageImporter) {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const locale = hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale

    return {
      locale,
      messages: await importMessages(locale),
    }
  })
}
