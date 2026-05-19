import { landingPageSeedDataEn, landingPageSeedDataDe } from '../seeds/landing';
import { csrInfoSeedDataEn, csrInfoSeedDataDe, eightdInfoSeedDataEn, eightdInfoSeedDataDe, fmeaInfoSeedDataEn, fmeaInfoSeedDataDe } from '../seeds/info-pages';
import { oemSeedData, processSeedData } from '../seeds/others';

export async function runSeeding(strapi: any) {
  const forceSeed = true; // process.env.FORCE_SEED === 'true';

  strapi.log.info('Checking if database needs seeding...');

  // 1. Seed Landing Page
  const landingUid = 'api::landing-page.landing-page';
  const landingService = strapi.documents(landingUid);
  
  if (forceSeed) {
    strapi.log.info('Force seeding Landing Page: Purging all records...');
    await strapi.db.query(landingUid).deleteMany({});
  }

  const checkLanding = await landingService.findFirst({ locale: 'en' });
  if (!checkLanding) {
    strapi.log.info('Seeding Landing Page...');
    // Create EN
    const en = await landingService.create({ data: landingPageSeedDataEn, locale: 'en', status: 'published' });
    
    // Create DE (might split documentId)
    const de = await landingService.create({ data: landingPageSeedDataDe, locale: 'de', status: 'published' });

    if (en.documentId !== de.documentId) {
      strapi.log.info('Landing Page: Fixing split documentId...');
      await strapi.db.query(landingUid).updateMany({
        where: { documentId: de.documentId },
        data: { documentId: en.documentId }
      });
    }
  }

  // 2. Seed Info Pages
  const infoPages = [
    { api: 'csr-info-page', en: csrInfoSeedDataEn, de: csrInfoSeedDataDe },
    { api: 'eightd-info-page', en: eightdInfoSeedDataEn, de: eightdInfoSeedDataDe },
    { api: 'fmea-info-page', en: fmeaInfoSeedDataEn, de: fmeaInfoSeedDataDe },
  ];

  for (const page of infoPages) {
    const apiUid = `api::${page.api}.${page.api}`;
    const service = strapi.documents(apiUid);
    
    if (forceSeed) {
      strapi.log.info(`Force seeding ${page.api}: Purging all records...`);
      await strapi.db.query(apiUid).deleteMany({});
    }

    const check = await service.findFirst({ locale: 'en' });
    if (!check) {
      strapi.log.info(`Seeding ${page.api}...`);
      // Create EN
      const en = await service.create({ data: page.en, locale: 'en', status: 'published' });
      
      // Create DE
      const de = await service.create({ data: page.de, locale: 'de', status: 'published' });

      if (en.documentId !== de.documentId) {
        strapi.log.info(`${page.api}: Fixing split documentId...`);
        await strapi.db.query(apiUid).updateMany({
          where: { documentId: de.documentId },
          data: { documentId: en.documentId }
        });
      }
    }
  }

  // 3. Seed OEMs
  const oemCount = await strapi.db.query('api::oem-profile.oem-profile').count();
  if (oemCount === 0 || forceSeed) {
    strapi.log.info('Seeding OEM Profiles...');
    for (const oem of oemSeedData) {
      await strapi.db.query('api::oem-profile.oem-profile').create({ data: oem });
    }
  }

  // 4. Seed Processes
  const processCount = await strapi.db.query('api::process-definition.process-definition').count();
  if (processCount === 0 || forceSeed) {
    strapi.log.info('Seeding Process Definitions...');
    for (const p of processSeedData) {
      await strapi.db.query('api::process-definition.process-definition').create({ data: p });
    }
  }
}
