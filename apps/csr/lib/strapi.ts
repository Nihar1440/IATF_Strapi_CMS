import { createStrapiClient } from '@iatf/strapi-client'

export const strapi = createStrapiClient({
  baseUrl: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337',
  apiToken: process.env.STRAPI_API_TOKEN || '',
})
