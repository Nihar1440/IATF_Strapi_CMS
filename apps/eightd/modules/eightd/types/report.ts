// ─── Report Metadata ─────────────────────────────────────────────────────────

export interface Metadata {
  reportId: string
  customer: string
  supplier: string
  productName: string
  partNumber: string
  customerComplaintNumber: string
  customerPartNumber: string
  supplierPartNumber: string
  complaintDate: string
  reportDate: string
  location: string
  internalReference: string
  batchLotNumber: string
  // Template D0 fields
  priority: string
  deadline: string
  createdBy: string
  department: string
  reportStatus: string
  symptomDescription: string
}

// ─── D1 — Team ──────────────────────────────────────────────────────────────

export interface D1Team {
  teamLeader: string
  qualityRep: string
  productionRep: string
  engineeringRep: string
  sponsor: string
  additionalMembers: string
}

// ─── D2 — Problem Description (VDA 8D Enhanced) ─────────────────────────────

export interface IsIsNotEntry {
  is: string
  isNot: string
}

export interface IsIsNotAnalysis {
  what: IsIsNotEntry
  where: IsIsNotEntry
  when: IsIsNotEntry
  howMany: IsIsNotEntry
}

export interface D2Problem {
  what: string
  where: string
  when: string
  howMany: string
  how: string
  whyProblem: string
  detectionMethod: string
  customerComplaintText: string
  quantitativeDeviation: string
  qualitativeDescription: string
  customerImpact: string
  isAnalysis: IsIsNotAnalysis
  isNotAnalysis: IsIsNotAnalysis
  internalFailureCode: string
  additionalNotes: string
}

// ─── D3 — Containment Actions (VDA 8D Enhanced) ─────────────────────────────

export type ContainmentScope = 'finished_goods' | 'wip' | 'in_transit' | 'customer_stock' | 'all'

export interface ContainmentAction {
  id: string
  action: string
  responsible: string
  dueDate: string
  effectiveness: string
  scope: ContainmentScope
  riskAssessment: string
  notes: string
}

export interface D3Containment {
  actions: ContainmentAction[]
  cleanpointDeliveryOn: string
  deliveryNoteNumber: string
  deliveredOn: string
  quantityCorrect: string
  quantityIncorrect: string
  effectivenessVerification: string
}

// ─── D4 — Root Cause Analysis (VDA 8D: TUA/TUN/SUA/SUN) ─────────────────────

export interface FiveWhyChain {
  why1: string
  why2: string
  why3: string
  why4: string
  why5: string
  rootCause: string
  possibleCause: string
  rootCauseCode: string
  causeDomain: string
}

export interface SystemicCause {
  cause: string
  causeCode: string
  derivedFrom: string
}

export interface D4RootCause {
  /** Technical cause of occurrence */
  tua: FiveWhyChain
  /** Technical cause of non-detection */
  tun: FiveWhyChain
  /** Systemic cause of occurrence */
  sua: SystemicCause
  /** Systemic cause of non-detection */
  sun: SystemicCause
  /** @deprecated — kept for backward compatibility */
  occurrence?: FiveWhyChain
  /** @deprecated — kept for backward compatibility */
  detection?: FiveWhyChain
}

// ─── D5 — Corrective Actions (VDA 8D Enhanced) ──────────────────────────────

export type CauseType = 'TUA' | 'TUN' | 'SUA' | 'SUN'

export interface CorrectiveAction {
  id: string
  action: string
  relatedRootCause: string
  linkedCauseType: CauseType
  linkedCauseCode: string
  actionCategory: string
  responsible: string
  targetDate: string
  verificationMethod: string
  notes: string
}

export interface D5Actions {
  actions: CorrectiveAction[]
  plannedVerification: string
}

// ─── D6 — Implementation ─────────────────────────────────────────────────────

export interface D6Implementation {
  implementationStatus: string
  implementationDate: string
  responsible: string
  verificationResults: string
  containmentRemoved: string
}

// ─── D7 — Prevention ─────────────────────────────────────────────────────────

export interface SystemicMeasureItem {
  actionRequired: string
  transfer: string
  responsible: string
  dueDate: string
}

export interface D7Prevention {
  fmea: SystemicMeasureItem
  controlPlan: SystemicMeasureItem
  workInstructions: SystemicMeasureItem
  testInspectionPlan: SystemicMeasureItem
  otherDocuments: SystemicMeasureItem
}

// ─── D8 — Closure ────────────────────────────────────────────────────────────

export interface D8Closure {
  customerApproval: string
  closureDate: string
  approvedBy: string
  customerSignOff: string
  signOffDate: string
  lessonsLearned: string
  teamRecognition: string
}

// ─── Full Report ─────────────────────────────────────────────────────────────

export type Language = 'en' | 'de'

export interface ReportData {
  language: Language
  metadata: Metadata
  d1: D1Team
  d2: D2Problem
  d3: D3Containment
  d4: D4RootCause
  d5: D5Actions
  d6: D6Implementation
  d7: D7Prevention
  d8: D8Closure
}

export type FormStep =
  | 'step1'   // Metadata + D1
  | 'step2'   // D2
  | 'step3'   // D3
  | 'step4'   // D4 + D5 (AI)
  | 'step5'   // D6–D8
  | 'preview' // Final preview
  | 'export'  // Export

// ─── Empty Defaults ──────────────────────────────────────────────────────────

export const EMPTY_FIVE_WHY: FiveWhyChain = {
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
  rootCause: '',
  possibleCause: '',
  rootCauseCode: '',
  causeDomain: '',
}

export const EMPTY_SYSTEMIC_CAUSE: SystemicCause = {
  cause: '',
  causeCode: '',
  derivedFrom: '',
}

export const EMPTY_IS_IS_NOT_ENTRY: IsIsNotEntry = {
  is: '',
  isNot: '',
}

export const EMPTY_IS_IS_NOT: IsIsNotAnalysis = {
  what: { ...EMPTY_IS_IS_NOT_ENTRY },
  where: { ...EMPTY_IS_IS_NOT_ENTRY },
  when: { ...EMPTY_IS_IS_NOT_ENTRY },
  howMany: { ...EMPTY_IS_IS_NOT_ENTRY },
}

export const EMPTY_REPORT: ReportData = {
  language: 'de',
  metadata: {
    reportId: '',
    customer: '',
    supplier: '',
    productName: '',
    partNumber: '',
    customerComplaintNumber: '',
    customerPartNumber: '',
    supplierPartNumber: '',
    complaintDate: '',
    reportDate: '',
    location: '',
    internalReference: '',
    batchLotNumber: '',
    priority: '',
    deadline: '',
    createdBy: '',
    department: '',
    reportStatus: '',
    symptomDescription: '',
  },
  d1: {
    teamLeader: '',
    qualityRep: '',
    productionRep: '',
    engineeringRep: '',
    sponsor: '',
    additionalMembers: '',
  },
  d2: {
    what: '',
    where: '',
    when: '',
    howMany: '',
    how: '',
    whyProblem: '',
    detectionMethod: '',
    customerComplaintText: '',
    quantitativeDeviation: '',
    qualitativeDescription: '',
    customerImpact: '',
    isAnalysis: { ...EMPTY_IS_IS_NOT },
    isNotAnalysis: { ...EMPTY_IS_IS_NOT },
    internalFailureCode: '',
    additionalNotes: '',
  },
  d3: {
    actions: [],
    cleanpointDeliveryOn: '',
    deliveryNoteNumber: '',
    deliveredOn: '',
    quantityCorrect: '',
    quantityIncorrect: '',
    effectivenessVerification: '',
  },
  d4: {
    tua: { ...EMPTY_FIVE_WHY },
    tun: { ...EMPTY_FIVE_WHY },
    sua: { ...EMPTY_SYSTEMIC_CAUSE },
    sun: { ...EMPTY_SYSTEMIC_CAUSE },
  },
  d5: { actions: [], plannedVerification: '' },
  d6: {
    implementationStatus: '',
    implementationDate: '',
    responsible: '',
    verificationResults: '',
    containmentRemoved: '',
  },
  d7: {
    fmea: { actionRequired: '', transfer: '', responsible: '', dueDate: '' },
    controlPlan: { actionRequired: '', transfer: '', responsible: '', dueDate: '' },
    workInstructions: { actionRequired: '', transfer: '', responsible: '', dueDate: '' },
    testInspectionPlan: { actionRequired: '', transfer: '', responsible: '', dueDate: '' },
    otherDocuments: { actionRequired: '', transfer: '', responsible: '', dueDate: '' },
  },
  d8: {
    customerApproval: '',
    closureDate: '',
    approvedBy: '',
    customerSignOff: '',
    signOffDate: '',
    lessonsLearned: '',
    teamRecognition: '',
  },
}
