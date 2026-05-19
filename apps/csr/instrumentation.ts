import { validateEnv, appEnvSchema } from '@iatf/config/env'

export function register() {
  validateEnv(appEnvSchema)
}
