/**
 * Shared Zod schema for validating incoming ReportData payloads
 * in the export API routes (PDF and XLSX).
 *
 * This prevents unvalidated user-supplied JSON from being passed
 * directly to PDF/XLSX rendering functions.
 */

import { z } from 'zod'

const FIVE_WHY_DEFAULTS = {
  why1: '', why2: '', why3: '', why4: '', why5: '',
  rootCause: '', possibleCause: '', rootCauseCode: '', causeDomain: '',
} as const

const SYSTEMIC_DEFAULTS = {
  cause: '', causeCode: '', derivedFrom: '',
} as const

const fiveWhyShape = z.object({
  why1: z.string().default(''),
  why2: z.string().default(''),
  why3: z.string().default(''),
  why4: z.string().default(''),
  why5: z.string().default(''),
  rootCause: z.string().default(''),
  possibleCause: z.string().default(''),
  rootCauseCode: z.string().default(''),
  causeDomain: z.string().default(''),
})

const systemicShape = z.object({
  cause: z.string().default(''),
  causeCode: z.string().default(''),
  derivedFrom: z.string().default(''),
})

export const reportDataSchema = z.object({
  language: z.enum(['en', 'de']).default('de'),
  metadata: z.object({
    reportId: z.string().default(''),
    customer: z.string().default(''),
    supplier: z.string().default(''),
    productName: z.string().default(''),
    partNumber: z.string().default(''),
    customerComplaintNumber: z.string().default(''),
    customerPartNumber: z.string().default(''),
    supplierPartNumber: z.string().default(''),
    complaintDate: z.string().default(''),
    reportDate: z.string().default(''),
    location: z.string().default(''),
    internalReference: z.string().default(''),
    batchLotNumber: z.string().default(''),
    priority: z.string().default(''),
    deadline: z.string().default(''),
    createdBy: z.string().default(''),
    department: z.string().default(''),
    reportStatus: z.string().default(''),
    symptomDescription: z.string().default(''),
  }),
  d1: z.object({
    teamLeader: z.string().default(''),
    qualityRep: z.string().default(''),
    productionRep: z.string().default(''),
    engineeringRep: z.string().default(''),
    sponsor: z.string().default(''),
    additionalMembers: z.string().default(''),
  }),
  d2: z.object({
    what: z.string().default(''),
    where: z.string().default(''),
    when: z.string().default(''),
    howMany: z.string().default(''),
    how: z.string().default(''),
    whyProblem: z.string().default(''),
    detectionMethod: z.string().default(''),
    customerComplaintText: z.string().default(''),
    quantitativeDeviation: z.string().default(''),
    qualitativeDescription: z.string().default(''),
    customerImpact: z.string().default(''),
    internalFailureCode: z.string().default(''),
    additionalNotes: z.string().default(''),
  }).passthrough(),
  d3: z.object({
    actions: z.array(z.object({
      id: z.string(),
      action: z.string().default(''),
      responsible: z.string().default(''),
      dueDate: z.string().default(''),
      effectiveness: z.string().default(''),
      scope: z.string().default('all'),
      riskAssessment: z.string().default(''),
      notes: z.string().default(''),
    })).default([]),
    cleanpointDeliveryOn: z.string().default(''),
    deliveryNoteNumber: z.string().default(''),
    deliveredOn: z.string().default(''),
    quantityCorrect: z.string().default(''),
    quantityIncorrect: z.string().default(''),
    effectivenessVerification: z.string().default(''),
  }),
  d4: z.object({
    tua: fiveWhyShape.default(FIVE_WHY_DEFAULTS),
    tun: fiveWhyShape.default(FIVE_WHY_DEFAULTS),
    sua: systemicShape.default(SYSTEMIC_DEFAULTS),
    sun: systemicShape.default(SYSTEMIC_DEFAULTS),
  }),
  d5: z.object({
    actions: z.array(z.object({
      id: z.string(),
      action: z.string().default(''),
      relatedRootCause: z.string().default(''),
      linkedCauseType: z.string().default('TUA'),
      linkedCauseCode: z.string().default(''),
      actionCategory: z.string().default(''),
      responsible: z.string().default(''),
      targetDate: z.string().default(''),
      verificationMethod: z.string().default(''),
      notes: z.string().default(''),
    })).default([]),
    plannedVerification: z.string().default(''),
  }),
  d6: z.object({
    implementationStatus: z.string().default(''),
    implementationDate: z.string().default(''),
    responsible: z.string().default(''),
    verificationResults: z.string().default(''),
    containmentRemoved: z.string().default(''),
  }),
  d7: z.object({
    fmea: z.object({
      actionRequired: z.string().default(''),
      transfer: z.string().default(''),
      responsible: z.string().default(''),
      dueDate: z.string().default(''),
    }).default({ actionRequired: '', transfer: '', responsible: '', dueDate: '' }),
    controlPlan: z.object({
      actionRequired: z.string().default(''),
      transfer: z.string().default(''),
      responsible: z.string().default(''),
      dueDate: z.string().default(''),
    }).default({ actionRequired: '', transfer: '', responsible: '', dueDate: '' }),
    workInstructions: z.object({
      actionRequired: z.string().default(''),
      transfer: z.string().default(''),
      responsible: z.string().default(''),
      dueDate: z.string().default(''),
    }).default({ actionRequired: '', transfer: '', responsible: '', dueDate: '' }),
    testInspectionPlan: z.object({
      actionRequired: z.string().default(''),
      transfer: z.string().default(''),
      responsible: z.string().default(''),
      dueDate: z.string().default(''),
    }).default({ actionRequired: '', transfer: '', responsible: '', dueDate: '' }),
    otherDocuments: z.object({
      actionRequired: z.string().default(''),
      transfer: z.string().default(''),
      responsible: z.string().default(''),
      dueDate: z.string().default(''),
    }).default({ actionRequired: '', transfer: '', responsible: '', dueDate: '' }),
  }),
  d8: z.object({
    customerApproval: z.string().default(''),
    closureDate: z.string().default(''),
    approvedBy: z.string().default(''),
    customerSignOff: z.string().default(''),
    signOffDate: z.string().default(''),
    lessonsLearned: z.string().default(''),
    teamRecognition: z.string().default(''),
  }),
})

export type ValidatedReportData = z.infer<typeof reportDataSchema>
