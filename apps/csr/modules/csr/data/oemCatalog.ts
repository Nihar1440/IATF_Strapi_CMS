/* ------------------------------------------------------------------ */
/*  CSR Database – OEM Metadata                                       */
/*  Source: https://www.iatfglobaloversight.org/oem-requirements/      */
/* ------------------------------------------------------------------ */

import type { OemInfo } from '../types'

export const OEM_CATALOG: OemInfo[] = [
  {
    id: 'BMW',
    name: 'BMW Group',
    logo: 'bmw.svg',
    lastUpdate: '2025-09-01',
    csrCount: 42,
  },
  {
    id: 'VW',
    name: 'Volkswagen Group (VW, Audi, Porsche, SEAT, Škoda)',
    logo: 'vw.svg',
    lastUpdate: '2025-08-15',
    csrCount: 56,
  },
  {
    id: 'MERCEDES',
    name: 'Mercedes-Benz Group',
    logo: 'mercedes.svg',
    lastUpdate: '2025-07-20',
    csrCount: 38,
  },
  {
    id: 'STELLANTIS',
    name: 'Stellantis (FCA, PSA, Opel)',
    logo: 'stellantis.svg',
    lastUpdate: '2025-06-10',
    csrCount: 45,
  },
  {
    id: 'FORD',
    name: 'Ford Motor Company',
    logo: 'ford.svg',
    lastUpdate: '2025-05-22',
    csrCount: 36,
  },
  {
    id: 'GM',
    name: 'General Motors',
    logo: 'gm.svg',
    lastUpdate: '2025-04-30',
    csrCount: 40,
  },
  {
    id: 'RENAULT',
    name: 'Renault Group (Renault, Dacia, Alpine)',
    logo: 'renault.svg',
    lastUpdate: '2026-04',
    csrCount: 14,
  },
  {
    id: 'TOYOTA',
    name: 'Toyota Motor Corporation',
    logo: 'toyota.svg',
    lastUpdate: '2025-03-15',
    csrCount: 30,
  },
  {
    id: 'HYUNDAI_KIA',
    name: 'Hyundai / Kia',
    logo: 'hyundai_kia.svg',
    lastUpdate: '2025-06-25',
    csrCount: 28,
  },
  {
    id: 'VOLVO',
    name: 'Volvo Cars',
    logo: 'volvo.svg',
    lastUpdate: '2025-05-10',
    csrCount: 26,
  },
]

export function getOemInfo(oemId: string): OemInfo | undefined {
  return OEM_CATALOG.find((o) => o.id === oemId)
}

export function getOemName(oemId: string): string {
  return getOemInfo(oemId)?.name ?? oemId
}
