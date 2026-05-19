import type { Language } from '../types/report'

type LabelMap = Record<string, string>

const IMPLEMENTATION_STATUS_LABELS: Record<Language, LabelMap> = {
  en: {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    completed: 'Completed',
    verified: 'Verified Effective',
  },
  de: {
    'not-started': 'Nicht begonnen',
    'in-progress': 'In Bearbeitung',
    completed: 'Abgeschlossen',
    verified: 'Wirksamkeit bestaetigt',
  },
}

const APPROVAL_STATUS_LABELS: Record<Language, LabelMap> = {
  en: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  de: {
    pending: 'Ausstehend',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
  },
}

const PRIORITY_LABELS: Record<Language, LabelMap> = {
  en: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  },
  de: {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    critical: 'Kritisch',
  },
}

const REPORT_STATUS_LABELS: Record<Language, LabelMap> = {
  en: {
    open: 'Open',
    'in-progress': 'In Progress',
    closed: 'Closed',
  },
  de: {
    open: 'Offen',
    'in-progress': 'In Bearbeitung',
    closed: 'Geschlossen',
  },
}

function localizeValue(value: string, language: Language, labels: Record<Language, LabelMap>) {
  if (!value) return value
  return labels[language][value] ?? value
}

export function localizeImplementationStatus(value: string, language: Language) {
  return localizeValue(value, language, IMPLEMENTATION_STATUS_LABELS)
}

export function localizeApprovalStatus(value: string, language: Language) {
  return localizeValue(value, language, APPROVAL_STATUS_LABELS)
}

export function localizePriority(value: string, language: Language) {
  return localizeValue(value, language, PRIORITY_LABELS)
}

export function localizeReportStatus(value: string, language: Language) {
  return localizeValue(value, language, REPORT_STATUS_LABELS)
}
