import { z } from 'zod'

/**
 * Shared environment variable schemas for all IATF Solutions apps.
 * Import and call `validateEnv()` from the app's instrumentation.ts or top-level layout
 * to fail fast at startup if required env vars are missing.
 */

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

/** Env schema for apps that use session auth (csr, eightd) */
export const sessionEnvSchema = baseEnvSchema.extend({
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32'),
  SESSION_TTL_SECONDS: z.string().optional(),
})

/** Env schema for apps that use Stripe billing (csr, eightd) */
export const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  BILLING_ADMIN_TOKEN: z.string().min(1, 'BILLING_ADMIN_TOKEN is required').optional(),
})

/** Env schema for apps that use email delivery (csr, eightd) */
export const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  CREDIT_DELIVERY_EMAIL_FROM: z.string().min(1, 'CREDIT_DELIVERY_EMAIL_FROM is required'),
})

/** Env schema for apps that use Redis (csr, eightd) */
export const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
})

/** Env schema for apps that use AI providers */
export const aiEnvSchema = z.object({
  AI_PROVIDER: z.enum(['anthropic', 'openai', 'gemini']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
})

/** Full env schema for CSR and eightd apps */
export const appEnvSchema = baseEnvSchema
  .merge(sessionEnvSchema)
  .merge(billingEnvSchema)
  .merge(emailEnvSchema)
  .merge(redisEnvSchema)
  .merge(aiEnvSchema)

/**
 * Validate environment variables at startup. Call from instrumentation.ts.
 * Logs warnings for missing optional vars, throws on missing required vars.
 */
export function validateEnv(schema: z.ZodTypeAny = appEnvSchema): void {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    console.error(`\n❌ Environment validation failed:\n${formatted}\n`)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables — see logs above')
    }
  }
}
