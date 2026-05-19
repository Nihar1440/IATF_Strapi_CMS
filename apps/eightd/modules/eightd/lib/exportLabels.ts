/**
 * Bilingual field labels for 8D report exports (PDF / XLSX).
 *
 * Both export routes previously defined near-identical label maps inline.
 * This module provides a single source of truth.
 */

export interface ExportLabels {
  // Section headers
  team: string
  problem: string
  containment: string
  rootCause: string
  corrective: string
  implementation: string
  prevention: string
  closure: string

  // D2
  what: string
  where: string
  when: string
  howMany: string
  detection: string
  customerText: string
  notes: string

  // D3
  action: string
  responsible: string
  dueDate: string

  // D4 (VDA 8D)
  tua: string
  tun: string
  sua: string
  sun: string
  rootCauseLabel: string
  systemicCause: string
  derivedFrom: string

  // D5
  relatedCause: string
  targetDate: string
  verification: string

  // D6-D8
  implStatus: string
  implDate: string
  implResp: string
  implVerif: string
  preventMeasures: string
  processDoc: string
  training: string
  custApproval: string
  closureDate: string
  lessons: string
  recognition: string

  // Cover / common
  reportTitle: string
  iatfLabel: string
  customer: string
  supplier: string
  product: string
  partNumber: string
  customerComplaintNumber: string
  customerPartNumber: string
  supplierPartNumber: string
  reportDate: string
  reportId: string
  noData: string
  cleanpointDeliveryOn: string
  deliveryNoteNumber: string
  deliveredOn: string
  quantityCorrect: string
  quantityIncorrect: string
}

const EN_LABELS: ExportLabels = {
  team: 'D1 – Team',
  problem: 'D2 – Problem Description',
  containment: 'D3 – Containment Actions',
  rootCause: 'D4 – Root Cause Analysis (5-Why)',
  corrective: 'D5 – Corrective Actions',
  implementation: 'D6 – Implementation & Verification',
  prevention: 'D7 – Prevention',
  closure: 'D8 – Closure',

  what: 'What',
  where: 'Where',
  when: 'When',
  howMany: 'How Many',
  detection: 'Detection Method',
  customerText: 'Customer Complaint',
  notes: 'Additional Notes',

  action: 'Action',
  responsible: 'Responsible',
  dueDate: 'Due Date',

  tua: 'TUA — Technical Cause (Occurrence)',
  tun: 'TUN — Technical Cause (Non-Detection)',
  sua: 'SUA — Systemic Cause (Occurrence)',
  sun: 'SUN — Systemic Cause (Non-Detection)',
  rootCauseLabel: 'Root Cause',
  systemicCause: 'Systemic Cause',
  derivedFrom: 'Derived From',

  relatedCause: 'Related Cause',
  targetDate: 'Target Date',
  verification: 'Verification',

  implStatus: 'Implementation Status',
  implDate: 'Implementation Date',
  implResp: 'Responsible',
  implVerif: 'Verification Results',
  preventMeasures: 'Preventive Measures',
  processDoc: 'Process Doc. Updates',
  training: 'Training Required',
  custApproval: 'Customer Approval',
  closureDate: 'Closure Date',
  lessons: 'Lessons Learned',
  recognition: 'Team Recognition',

  reportTitle: '8D Problem Solving Report',
  iatfLabel: 'IATF 16949',
  customer: 'Customer',
  supplier: 'Supplier',
  product: 'Product',
  partNumber: 'Part Number',
  customerComplaintNumber: 'Customer Complaint Number',
  customerPartNumber: 'Customer Part Number',
  supplierPartNumber: 'Supplier Part Number',
  reportDate: 'Report Date',
  reportId: 'Report ID',
  noData: 'No data entered',
  cleanpointDeliveryOn: 'Cleanpoint Delivery On',
  deliveryNoteNumber: 'Delivery Note Number',
  deliveredOn: 'Delivered On',
  quantityCorrect: 'Quantity Correct',
  quantityIncorrect: 'Quantity Incorrect',
}

const DE_LABELS: ExportLabels = {
  team: 'D1 – Team',
  problem: 'D2 – Problembeschreibung',
  containment: 'D3 – Sofortmaßnahmen',
  rootCause: 'D4 – Ursachenanalyse (5-Why)',
  corrective: 'D5 – Korrekturmaßnahmen',
  implementation: 'D6 – Umsetzung & Verifikation',
  prevention: 'D7 – Vorbeugung',
  closure: 'D8 – Abschluss',

  what: 'Was',
  where: 'Wo',
  when: 'Wann',
  howMany: 'Wie viele',
  detection: 'Erkennung',
  customerText: 'Kundenbeanstandung',
  notes: 'Zusätzliche Hinweise',

  action: 'Maßnahme',
  responsible: 'Verantwortlicher',
  dueDate: 'Fällig',

  tua: 'TUA — Technische Ursache (Entstehung)',
  tun: 'TUN — Technische Ursache (Nichterkennung)',
  sua: 'SUA — Systemische Ursache (Entstehung)',
  sun: 'SUN — Systemische Ursache (Nichterkennung)',
  rootCauseLabel: 'Grundursache',
  systemicCause: 'Systemische Ursache',
  derivedFrom: 'Abgeleitet von',

  relatedCause: 'Bezug Ursache',
  targetDate: 'Zieldatum',
  verification: 'Verifikation',

  implStatus: 'Status',
  implDate: 'Datum',
  implResp: 'Verantwortlicher',
  implVerif: 'Ergebnisse',
  preventMeasures: 'Vorbeugende Maßnahmen',
  processDoc: 'Prozessdokumentation',
  training: 'Schulungsbedarf',
  custApproval: 'Kundengenehmigung',
  closureDate: 'Abschlussdatum',
  lessons: 'Lessons Learned',
  recognition: 'Teamerkennung',

  reportTitle: '8D-Problembericht',
  iatfLabel: 'IATF 16949',
  customer: 'Kunde',
  supplier: 'Lieferant',
  product: 'Produkt',
  partNumber: 'Teilenummer',
  customerComplaintNumber: 'Kundenreklamationsnummer',
  customerPartNumber: 'Kundenteilenummer',
  supplierPartNumber: 'Lieferantenteilenummer',
  reportDate: 'Berichtsdatum',
  reportId: 'Berichts-ID',
  noData: 'Keine Daten',
  cleanpointDeliveryOn: 'Cleanpoint Lieferung am',
  deliveryNoteNumber: 'Lieferscheinnummer',
  deliveredOn: 'Geliefert am',
  quantityCorrect: 'Menge i.O.',
  quantityIncorrect: 'Menge n.i.O.',
}

/** Get the appropriate label set for the given language. */
export function getExportLabels(lang: 'en' | 'de'): ExportLabels {
  return lang === 'de' ? DE_LABELS : EN_LABELS
}
