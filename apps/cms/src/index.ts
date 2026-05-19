import { runSeeding } from './utils/seed-logic';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // ── Configure Locales First ──────────────────────────────────────────────
    try {
      const localeQuery = strapi.db.query('plugin::i18n.locale')
      const locales = await localeQuery.findMany()
      const hasEnglishLocale = locales.some((locale: { code?: string }) => locale.code === 'en')
      const hasGermanLocale = locales.some((locale: { code?: string }) => locale.code === 'de')

      if (!hasEnglishLocale) {
        await localeQuery.create({
          data: {
            name: 'English (en)',
            code: 'en',
          },
        })
      }

      if (!hasGermanLocale) {
        await localeQuery.create({
          data: {
            name: 'German (de)',
            code: 'de',
          },
        })
      }
    } catch (error) {
      strapi.log.error('Failed to configure locales:', error)
    }

    // ── Run Seeding Logic ────────────────────────────────────────────────────
    await runSeeding(strapi);


    // ── Configure Public Permissions ─────────────────────────────────────────
    try {
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      })

      if (publicRole) {
        const apiNames = ['csr-info-page', 'eightd-info-page', 'fmea-info-page', 'landing-page']
        for (const apiName of apiNames) {
          const contentTypeName = `api::${apiName}.${apiName}`

          // Ensure find and findOne are enabled
          const actions = ['find', 'findOne']
          for (const action of actions) {
            const existingPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
              where: {
                role: publicRole.id,
                action: `${contentTypeName}.${action}`
              }
            })

            if (!existingPermission) {
              await strapi.db.query('plugin::users-permissions.permission').create({
                data: {
                  role: publicRole.id,
                  action: `${contentTypeName}.${action}`
                }
              })
            }
          }
        }
      }
    } catch (error) {
      strapi.log.error('Failed to set public permissions:', error)
    }
  },
};
