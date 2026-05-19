/* ------------------------------------------------------------------ */
/*  CSR Matrix – Core Types                                          */
/* ------------------------------------------------------------------ */

import { ParsedRequirement } from '../lib/conflictEngine'

export type Language = 'de' | 'en'

/** OEM identifiers supported at launch */
export type OemId =
  | 'BMW'
  | 'VW'
  | 'MERCEDES'
  | 'STELLANTIS'
  | 'FORD'
  | 'GM'
  | 'RENAULT'
  | 'TOYOTA'
  | 'HYUNDAI_KIA'
  | 'VOLVO'

/** Risk level for a CSR entry */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/** Change status for a CSR entry */
export type ChangeStatus = 'new' | 'updated' | 'unchanged' | 'deleted'

/** Severity of the CSR compared to the IATF baseline */
export type CsrSeverity = 'supplementary' | 'tightening' | 'replacing'

/** Implementation workflow status */
export type ImplementationStatus =
  | 'open'
  | 'in_review'
  | 'implemented'
  | 'validated'

/* ------------------------------------------------------------------ */
/*  Database-Level Types                                              */
/* ------------------------------------------------------------------ */

/** One CSR requirement row in the database */
export interface CsrRequirement {
  id: string
  /** IATF 16949 chapter reference, e.g. "8.5.1.1" */
  iatfChapter: string
  /** Short title of the requirement */
  title: string
  /** OEM this CSR belongs to (null = base IATF requirement) */
  oem: OemId | null
  /** Full text / description of the requirement */
  text: string
  /** CSR document version, e.g. "v4.0 (2024-06)" */
  version: string
  /** Whether this changed vs. prior version */
  changeStatus: ChangeStatus
  /** Risk classification */
  risk: RiskLevel
  /** Severity compared to IATF baseline */
  severity: CsrSeverity | null
  /** Source document name for attribution */
  sourceDoc: string
  /** True if this CSR conflicts with another OEM CSR on the same chapter */
  conflictFlag: boolean
  /** Whether the record is current (false = outdated/superseded) */
  active: boolean
  /** Date of the last update to this record */
  lastUpdated: string
  /** True if this CSR goes beyond / adds to the IATF baseline */
  overIatfFlag: boolean
  /** Tags for searchability */
  tags?: string[]
}

/** A company process from the user's process map */
export interface ProcessEntry {
  id: string
  name: string
  owner?: string
}

/** Mapping between a CSR requirement and an affected process */
export interface CsrProcessMapping {
  csrId: string
  processId: string
}

/** Full implementation tracking record */
export interface ImplementationRecord {
  csrId: string
  processId: string
  status: ImplementationStatus
  evidence?: string
  dueDate?: string
  assignee?: string
  processOwner?: string
  documentReference?: string
  evidenceLocation?: string
}

/* ------------------------------------------------------------------ */
/*  OEM Metadata                                                      */
/* ------------------------------------------------------------------ */

export interface OemInfo {
  id: OemId
  name: string
  /** Filename of logo in public/oem-logos/ */
  logo: string
  /** Last update date of CSR data in DB */
  lastUpdate: string
  /** Number of CSR entries currently in DB */
  csrCount: number
}

/* ------------------------------------------------------------------ */
/*  Form / Wizard State                                               */
/* ------------------------------------------------------------------ */

export type CsrFormStep =
  | 'oem-selection'
  | 'process-map'
  | 'matrix-preview'
  | 'export'

export interface CsrFormState {
  /** Selected OEMs */
  selectedOems: OemId[]
  /** User's process map entries */
  processes: ProcessEntry[]
  /** Optional company metadata */
  companyName: string
  companyLocation: string
  /** Output language */
  language: Language
  /** Generated matrix rows (populated after generation) */
  matrixRows: MatrixRow[]
  /** Current wizard step */
  currentStep: CsrFormStep
  /** Optional process map image as base64 data URL */
  processMapImage?: string
  /** Implementation tracking records keyed by csrId */
  implementationRecords: Record<string, ImplementationRecord>
  /** Company logo as base64 data URL */
  companyLogo?: string
  /** Conflicts detected during generation */
  conflicts?: ConflictInfo[]
  /** AI Insights generated */
  insights?: string[]
  /** Whether the generation was AI powered */
  aiPowered?: boolean
}

/** Conflict between OEM requirements on the same IATF chapter */
export interface ConflictInfo {
  iatfChapter: string
  oems: OemId[]
  csrIds: string[]
  description: string
  strictestOem?: OemId
  decision?: string
  reason?: string
  evaluatedRequirements?: ParsedRequirement[]
}

/** A single row in the generated CSR matrix */
export interface MatrixRow {
  csrId: string
  iatfChapter: string
  title: string
  oem: string
  text: string
  version: string
  changeStatus: ChangeStatus
  risk: RiskLevel
  severity: CsrSeverity | null
  sourceDoc: string
  active: boolean
  lastUpdated: string
  /** Process IDs this CSR affects (x mapping) */
  affectedProcessIds: string[]
  /** Whether this row has a conflict with another OEM */
  conflictFlag: boolean
}

/* ------------------------------------------------------------------ */
/*  API Types                                                         */
/* ------------------------------------------------------------------ */

export interface GenerateMatrixRequest {
  oems: OemId[]
  processes: ProcessEntry[]
  companyName?: string
  companyLocation?: string
  language: Language
}

export interface GenerateMatrixResponse {
  matrixId: string
  rows: number
  matrixRows: MatrixRow[]
  conflicts: ConflictInfo[]
}

export interface DeltaRequest {
  oems: OemId[]
  previousVersion?: string
}

export interface DeltaResponse {
  newRequirements: CsrRequirement[]
  changedRequirements: CsrRequirement[]
  removedRequirements: CsrRequirement[]
}

/* ------------------------------------------------------------------ */
/*  Empty defaults                                                    */
/* ------------------------------------------------------------------ */

export const EMPTY_CSR_FORM: CsrFormState = {
  selectedOems: [],
  processes: [],
  companyName: '',
  companyLocation: '',
  language: 'de',
  matrixRows: [],
  currentStep: 'oem-selection',
  implementationRecords: {},
}

export const CSR_STEP_ORDER: CsrFormStep[] = [
  'oem-selection',
  'process-map',
  'matrix-preview',
  'export',
]
