/* ------------------------------------------------------------------ */
/*  CSR Database – Default process taxonomy for automotive suppliers  */
/*  Used as a suggested starting point when user doesn't upload       */
/*  their own process map.                                            */
/* ------------------------------------------------------------------ */

import type { ProcessEntry } from '../types'

/** Common automotive supplier COP (Customer-Oriented Processes) */
export const DEFAULT_PROCESSES: ProcessEntry[] = [
  { id: 'P-COP-01', name: 'Sales & Order Management', owner: '' },
  { id: 'P-COP-02', name: 'Product & Process Development (APQP)', owner: '' },
  { id: 'P-COP-03', name: 'Purchasing & Supplier Management', owner: '' },
  { id: 'P-COP-04', name: 'Production Planning & Scheduling', owner: '' },
  { id: 'P-COP-05', name: 'Production / Manufacturing', owner: '' },
  { id: 'P-COP-06', name: 'Warehouse & Logistics', owner: '' },
  { id: 'P-COP-07', name: 'Customer Service & After-Sales', owner: '' },
]

/** Common automotive supplier Support Processes */
export const DEFAULT_SUPPORT_PROCESSES: ProcessEntry[] = [
  { id: 'P-SUP-01', name: 'Quality Management', owner: '' },
  { id: 'P-SUP-02', name: 'Document & Record Control', owner: '' },
  { id: 'P-SUP-03', name: 'Human Resources & Training', owner: '' },
  { id: 'P-SUP-04', name: 'Maintenance & Equipment Management', owner: '' },
  { id: 'P-SUP-05', name: 'Measurement & Testing', owner: '' },
  { id: 'P-SUP-06', name: 'Internal Audit', owner: '' },
  { id: 'P-SUP-07', name: 'Corrective & Preventive Actions', owner: '' },
  { id: 'P-SUP-08', name: 'Management Review', owner: '' },
  { id: 'P-SUP-09', name: 'IT & Infrastructure', owner: '' },
  { id: 'P-SUP-10', name: 'Environmental, Health & Safety', owner: '' },
]

/** Full default process map */
export const ALL_DEFAULT_PROCESSES: ProcessEntry[] = [
  ...DEFAULT_PROCESSES,
  ...DEFAULT_SUPPORT_PROCESSES,
]

/** German translations of default process names */
export const DEFAULT_PROCESSES_DE: Record<string, string> = {
  'P-COP-01': 'Vertrieb & Auftragsmanagement',
  'P-COP-02': 'Produkt- & Prozessentwicklung (APQP)',
  'P-COP-03': 'Einkauf & Lieferantenmanagement',
  'P-COP-04': 'Produktionsplanung & Steuerung',
  'P-COP-05': 'Produktion / Fertigung',
  'P-COP-06': 'Lager & Logistik',
  'P-COP-07': 'Kundenservice & After-Sales',
  'P-SUP-01': 'Qualitätsmanagement',
  'P-SUP-02': 'Dokumenten- & Aufzeichnungslenkung',
  'P-SUP-03': 'Personalwesen & Schulung',
  'P-SUP-04': 'Instandhaltung & Betriebsmittelmanagement',
  'P-SUP-05': 'Mess- & Prüftechnik',
  'P-SUP-06': 'Internes Audit',
  'P-SUP-07': 'Korrektur- & Vorbeugungsmaßnahmen',
  'P-SUP-08': 'Managementbewertung',
  'P-SUP-09': 'IT & Infrastruktur',
  'P-SUP-10': 'Umwelt, Gesundheit & Arbeitssicherheit',
}
