/**
 * @iatf/strapi-client
 *
 * Shared typed Strapi API client for all IATF apps.
 *
 * Usage:
 *   import { createStrapiClient } from '@iatf/strapi-client'
 *
 *   const cms = createStrapiClient({
 *     baseUrl: process.env.NEXT_PUBLIC_STRAPI_URL!,
 *     apiToken: process.env.STRAPI_API_TOKEN!,
 *   })
 *
 *   const landingPage = await cms.getLandingPage('en')
 */

export { createStrapiClient } from './client'
export type { StrapiClient, StrapiClientConfig } from './client'
export type {
  LandingPage,
  OemProfile,
  CsrRequirement,
  ProcessDefinition,
  PricingTier,
  InfoPage,
  StrapiListResponse,
  StrapiSingleResponse,
  OemId,
  RiskLevel,
  ChangeStatus,
  CsrSeverity,
} from './types'
