import { z } from 'zod'

// ─── Step 1: Metadata + D1 Team ──────────────────────────────────────────────

export const metadataSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  customer: z.string().min(1, 'Customer is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  productName: z.string().min(1, 'Product name is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  complaintDate: z.string().min(1, 'Complaint date is required'),
  reportDate: z.string().min(1, 'Report date is required'),
  location: z.string().optional().default(''),
  internalReference: z.string().optional().default(''),
  batchLotNumber: z.string().optional().default(''),
  priority: z.string().optional().default(''),
  deadline: z.string().optional().default(''),
  createdBy: z.string().optional().default(''),
  department: z.string().optional().default(''),
  reportStatus: z.string().optional().default(''),
  symptomDescription: z.string().optional().default(''),
})

export const d1Schema = z.object({
  teamLeader: z.string().min(1, 'Team leader is required'),
  qualityRep: z.string().optional().default(''),
  productionRep: z.string().optional().default(''),
  engineeringRep: z.string().optional().default(''),
  sponsor: z.string().optional().default(''),
  additionalMembers: z.string().optional().default(''),
})

// ─── Step 2: D2 Problem Description ─────────────────────────────────────────

export const d2Schema = z.object({
  what: z.string().min(10, 'Describe what happened (min 10 chars)'),
  where: z.string().min(3, 'Location is required'),
  when: z.string().min(3, 'Time/date is required'),
  howMany: z.string().min(1, 'Quantity affected is required'),
  detectionMethod: z.string().min(3, 'Detection method is required'),
  customerComplaintText: z.string().optional().default(''),
  additionalNotes: z.string().optional().default(''),
  // VDA 8D enhanced fields
  how: z.string().optional().default(''),
  whyProblem: z.string().optional().default(''),
  quantitativeDeviation: z.string().optional().default(''),
  qualitativeDescription: z.string().optional().default(''),
  customerImpact: z.string().optional().default(''),
  internalFailureCode: z.string().optional().default(''),
  // IS / IS NOT Analysis (structured per VDA 8D dimension)
  isAnalysis: z.object({
    what: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
    where: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
    when: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
    howMany: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
  }).default({
    what: { is: '', isNot: '' },
    where: { is: '', isNot: '' },
    when: { is: '', isNot: '' },
    howMany: { is: '', isNot: '' },
  }),
  isNotAnalysis: z.object({
    what: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
    where: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
    when: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
    howMany: z.object({ is: z.string().default(''), isNot: z.string().default('') }).default({ is: '', isNot: '' }),
  }).default({
    what: { is: '', isNot: '' },
    where: { is: '', isNot: '' },
    when: { is: '', isNot: '' },
    howMany: { is: '', isNot: '' },
  }),
})

// ─── Step 3: D3 Containment ──────────────────────────────────────────────────

export const containmentActionSchema = z.object({
  id: z.string(),
  action: z.string().min(1, 'Action description is required'),
  responsible: z.string().min(1, 'Responsible person is required'),
  dueDate: z.string().optional().default(''),
  effectiveness: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  // VDA 8D enhanced fields
  scope: z.enum(['finished_goods', 'wip', 'in_transit', 'customer_stock', 'all']).optional().default('all'),
  riskAssessment: z.string().optional().default(''),
})

export const d3Schema = z.object({
  actions: z.array(containmentActionSchema).min(1, 'At least one containment action is required'),
  effectivenessVerification: z.string().optional().default(''),
})

// ─── Step 4: D4 Root Cause + D5 Corrective Actions (AI-generated, editable)──

export const fiveWhySchema = z.object({
  possibleCause: z.string().optional().default(''),
  why1: z.string().min(1, 'Why 1 is required'),
  why2: z.string().min(1, 'Why 2 is required'),
  why3: z.string().min(1, 'Why 3 is required'),
  why4: z.string().optional().default(''),
  why5: z.string().optional().default(''),
  rootCause: z.string().min(1, 'Root cause is required'),
  rootCauseCode: z.string().optional().default(''),
  causeDomain: z.string().optional().default(''),
})

export const systemicCauseSchema = z.object({
  cause: z.string().min(1, 'Systemic cause is required'),
  causeCode: z.string().optional().default(''),
  derivedFrom: z.string().optional().default(''),
})

export const d4Schema = z.object({
  // VDA 8D structure: TUA, TUN, SUA, SUN
  tua: fiveWhySchema,
  tun: fiveWhySchema,
  sua: systemicCauseSchema,
  sun: systemicCauseSchema,

})

export const correctiveActionSchema = z.object({
  id: z.string(),
  action: z.string().min(1, 'Action is required'),
  relatedRootCause: z.string().optional().default(''),
  responsible: z.string().optional().default(''),
  targetDate: z.string().optional().default(''),
  verificationMethod: z.string().optional().default(''),
  // VDA 8D enhanced fields
  linkedCauseType: z.enum(['TUA', 'TUN', 'SUA', 'SUN']).optional(),
  linkedCauseCode: z.string().optional().default(''),
  actionCategory: z.enum(['technical', 'systemic']).optional(),
  notes: z.string().optional().default(''),
})

export const d5Schema = z.object({
  actions: z.array(correctiveActionSchema).min(1, 'At least one corrective action is required'),
  plannedVerification: z.string().optional().default(''),
})

// ─── Step 5: D6 + D7 + D8 ───────────────────────────────────────────────────

export const d6Schema = z.object({
  implementationStatus: z.string().optional().default(''),
  implementationDate: z.string().optional().default(''),
  responsible: z.string().optional().default(''),
  verificationResults: z.string().optional().default(''),
  containmentRemoved: z.string().optional().default(''),
})

const systemicMeasureItemSchema = z.object({
  actionRequired: z.string().optional().default(''),
  transfer: z.string().optional().default(''),
  responsible: z.string().optional().default(''),
  dueDate: z.string().optional().default(''),
})

const emptyMeasureItem = { actionRequired: '', transfer: '', responsible: '', dueDate: '' }

export const d7Schema = z.object({
  fmea: systemicMeasureItemSchema.default(emptyMeasureItem),
  controlPlan: systemicMeasureItemSchema.default(emptyMeasureItem),
  workInstructions: systemicMeasureItemSchema.default(emptyMeasureItem),
  testInspectionPlan: systemicMeasureItemSchema.default(emptyMeasureItem),
  otherDocuments: systemicMeasureItemSchema.default(emptyMeasureItem),
})

export const d8Schema = z.object({
  customerApproval: z.string().optional().default(''),
  closureDate: z.string().optional().default(''),
  approvedBy: z.string().optional().default(''),
  customerSignOff: z.string().optional().default(''),
  signOffDate: z.string().optional().default(''),
  lessonsLearned: z.string().optional().default(''),
  teamRecognition: z.string().optional().default(''),
})

// ─── Code Redemption ─────────────────────────────────────────────────────────

export const redeemSchema = z.object({
  code: z
    .string()
    .min(6, 'Access code must be at least 6 characters')
    .max(32, 'Invalid access code')
    .regex(/^[A-Z0-9\-]+$/i, 'Invalid access code format'),
})
