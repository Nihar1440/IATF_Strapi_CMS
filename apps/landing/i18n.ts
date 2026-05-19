import { createRequestConfig } from '@iatf/config/i18n/request-config'

export default createRequestConfig(
  async (locale) => (await import(`./messages/${locale}.json`)).default
)
