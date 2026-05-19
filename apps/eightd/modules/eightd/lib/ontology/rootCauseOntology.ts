/**
 * Root Cause Ontology for Automotive Processes
 * Version 1.0
 *
 * Based on VDA 8D methodology for IATF 16949 compliance.
 * Each root cause is classifiable by domain, code, label, and type:
 * - TUA = Technical cause of occurrence
 * - TUN = Technical cause of non-detection
 * - SUA = Systemic cause of occurrence
 * - SUN = Systemic cause of non-detection
 */

export type CauseType = 'TUA' | 'TUN' | 'SUA' | 'SUN'

export type CauseDomain =
  | 'PRM' // Process Parameters
  | 'TOL' // Tooling / Equipment Wear
  | 'MAT' // Material / Raw Material
  | 'SET' // Machine Setup / Changeover
  | 'MET' // Method / Work Standard
  | 'MSA' // Measurement System / MSA
  | 'CTL' // Inspection Planning / Control Plan
  | 'FME' // PFMEA / Risk Analysis
  | 'PFL' // Process Flow / Industrial Engineering
  | 'ENG' // Drawing / Specification / Engineering
  | 'REL' // Production Release / Process Approval
  | 'TRN' // Training / Competence
  | 'MNT' // Maintenance / TPM
  | 'SUP' // Supplier Management
  | 'TRC' // Traceability / Identification / Segregation
  | 'LOG' // Packaging / Handling / Logistics
  | 'CLN' // Cleanliness / Contamination / Environment
  | 'SWA' // Software / Automation / MES / PLC
  | 'CMP' // Complaint Handling / 8D / Feedback Loop
  | 'MGS' // Management System / Governance / Roles

export interface RootCause {
  code: string
  domain: CauseDomain
  domainLabel: string
  label: string
  type: CauseType
}

export const DOMAIN_LABELS: Record<CauseDomain, string> = {
  PRM: 'Process Parameters',
  TOL: 'Tooling / Equipment Wear',
  MAT: 'Material / Raw Material',
  SET: 'Machine Setup / Changeover',
  MET: 'Method / Work Standard',
  MSA: 'Measurement System / MSA',
  CTL: 'Inspection Planning / Control Plan',
  FME: 'PFMEA / Risk Analysis',
  PFL: 'Process Flow / Industrial Engineering',
  ENG: 'Drawing / Specification / Engineering',
  REL: 'Production Release / Process Approval',
  TRN: 'Training / Competence',
  MNT: 'Maintenance / TPM',
  SUP: 'Supplier Management',
  TRC: 'Traceability / Identification / Segregation',
  LOG: 'Packaging / Handling / Logistics',
  CLN: 'Cleanliness / Contamination / Environment',
  SWA: 'Software / Automation / MES / PLC',
  CMP: 'Complaint Handling / 8D / Feedback Loop',
  MGS: 'Management System / Governance / Roles',
}

export const ROOT_CAUSE_ONTOLOGY: RootCause[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // A. PROCESS PARAMETERS (PRM)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'PRM-TUA-001', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter limit not defined', type: 'TUA' },
  { code: 'PRM-TUA-002', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter range too wide', type: 'TUA' },
  { code: 'PRM-TUA-003', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter setpoint incorrect', type: 'TUA' },
  { code: 'PRM-TUA-004', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter change not approved', type: 'TUA' },
  { code: 'PRM-TUA-005', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter drift not compensated', type: 'TUA' },
  { code: 'PRM-TUA-006', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Machine recipe incorrect', type: 'TUA' },
  { code: 'PRM-TUA-007', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Start-up parameter unstable', type: 'TUA' },
  { code: 'PRM-TUA-008', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Changeover setting incorrect', type: 'TUA' },
  { code: 'PRM-TUA-009', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter dependency not understood', type: 'TUA' },
  { code: 'PRM-TUA-010', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Cycle time too short for stable process', type: 'TUA' },
  { code: 'PRM-TUA-011', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Process window not validated', type: 'TUA' },
  { code: 'PRM-TUA-012', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Critical parameter not controlled', type: 'TUA' },
  { code: 'PRM-SUA-013', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Standard parameter management not defined', type: 'SUA' },
  { code: 'PRM-SUA-014', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter release process missing', type: 'SUA' },
  { code: 'PRM-SUN-015', domain: 'PRM', domainLabel: 'Process Parameters', label: 'Parameter monitoring escalation not implemented', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // B. TOOLING / EQUIPMENT WEAR (TOL)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'TOL-TUA-001', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool wear limit not defined', type: 'TUA' },
  { code: 'TOL-TUA-002', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool change interval exceeded', type: 'TUA' },
  { code: 'TOL-TUA-003', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool condition not assessed before run', type: 'TUA' },
  { code: 'TOL-TUA-004', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool damage not detected in setup', type: 'TUA' },
  { code: 'TOL-TUA-005', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Fixture wear affects part geometry', type: 'TUA' },
  { code: 'TOL-TUA-006', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Clamping force insufficient', type: 'TUA' },
  { code: 'TOL-TUA-007', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Clamping position unstable', type: 'TUA' },
  { code: 'TOL-TUA-008', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool alignment incorrect', type: 'TUA' },
  { code: 'TOL-TUA-009', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Preventive maintenance overdue', type: 'TUA' },
  { code: 'TOL-TUA-010', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Equipment backlash exceeds tolerance', type: 'TUA' },
  { code: 'TOL-TUN-011', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool wear indicator not checked', type: 'TUN' },
  { code: 'TOL-TUN-012', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Fixture condition not included in inspection routine', type: 'TUN' },
  { code: 'TOL-SUA-013', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Tool life management not established', type: 'SUA' },
  { code: 'TOL-SUA-014', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Maintenance planning not risk-based', type: 'SUA' },
  { code: 'TOL-SUN-015', domain: 'TOL', domainLabel: 'Tooling / Equipment Wear', label: 'Equipment deterioration trend not monitored', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // C. MATERIAL / RAW MATERIAL (MAT)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'MAT-TUA-001', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Material specification not fully defined', type: 'TUA' },
  { code: 'MAT-TUA-002', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Wrong material batch used', type: 'TUA' },
  { code: 'MAT-TUA-003', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Material mix-up occurred', type: 'TUA' },
  { code: 'MAT-TUA-004', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Material property outside specification', type: 'TUA' },
  { code: 'MAT-TUA-005', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Shelf life exceeded', type: 'TUA' },
  { code: 'MAT-TUA-006', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Storage condition inappropriate', type: 'TUA' },
  { code: 'MAT-TUA-007', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Moisture sensitivity not controlled', type: 'TUA' },
  { code: 'MAT-TUA-008', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Supplier batch variability too high', type: 'TUA' },
  { code: 'MAT-TUA-009', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Regrind ratio not controlled', type: 'TUA' },
  { code: 'MAT-TUA-010', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Incoming material damaged', type: 'TUA' },
  { code: 'MAT-TUN-011', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Incoming inspection characteristic missing', type: 'TUN' },
  { code: 'MAT-TUN-012', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Material certificate not verified', type: 'TUN' },
  { code: 'MAT-SUA-013', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Material release criteria not standardized', type: 'SUA' },
  { code: 'MAT-SUA-014', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Supplier change communication ineffective', type: 'SUA' },
  { code: 'MAT-SUN-015', domain: 'MAT', domainLabel: 'Material / Raw Material', label: 'Material risk review not implemented', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // D. MACHINE SETUP / CHANGEOVER (SET)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'SET-TUA-001', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup instruction incomplete', type: 'TUA' },
  { code: 'SET-TUA-002', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup reference value incorrect', type: 'TUA' },
  { code: 'SET-TUA-003', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'First-piece approval not robust', type: 'TUA' },
  { code: 'SET-TUA-004', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Changeover sequence not standardized', type: 'TUA' },
  { code: 'SET-TUA-005', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Part-specific setup data missing', type: 'TUA' },
  { code: 'SET-TUA-006', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup verification incomplete', type: 'TUA' },
  { code: 'SET-TUA-007', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Wrong tooling installed', type: 'TUA' },
  { code: 'SET-TUA-008', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Wrong program loaded', type: 'TUA' },
  { code: 'SET-TUA-009', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup trial too short', type: 'TUA' },
  { code: 'SET-TUA-010', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Warm-up condition not considered', type: 'TUA' },
  { code: 'SET-TUN-011', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup approval characteristic not checked', type: 'TUN' },
  { code: 'SET-TUN-012', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Changeover checklist not used', type: 'TUN' },
  { code: 'SET-SUA-013', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'SMED / changeover standard not defined', type: 'SUA' },
  { code: 'SET-SUA-014', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup release authority unclear', type: 'SUA' },
  { code: 'SET-SUN-015', domain: 'SET', domainLabel: 'Machine Setup / Changeover', label: 'Setup deviations not trended', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // E. METHOD / WORK STANDARD (MET)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'MET-TUA-001', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Work instruction missing', type: 'TUA' },
  { code: 'MET-TUA-002', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Work instruction outdated', type: 'TUA' },
  { code: 'MET-TUA-003', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Work sequence undefined', type: 'TUA' },
  { code: 'MET-TUA-004', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Standard work not feasible in actual cycle', type: 'TUA' },
  { code: 'MET-TUA-005', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Special characteristic handling unclear', type: 'TUA' },
  { code: 'MET-TUA-006', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Rework method not standardized', type: 'TUA' },
  { code: 'MET-TUA-007', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Cleaning method ineffective', type: 'TUA' },
  { code: 'MET-TUA-008', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Labeling method inconsistent', type: 'TUA' },
  { code: 'MET-TUA-009', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Packaging method unsuitable', type: 'TUA' },
  { code: 'MET-TUA-010', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Manual operation step ambiguous', type: 'TUA' },
  { code: 'MET-TUN-011', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Compliance to work standard not verified', type: 'TUN' },
  { code: 'MET-TUN-012', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Layered process audit not focused on standard adherence', type: 'TUN' },
  { code: 'MET-SUA-013', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Document control process ineffective', type: 'SUA' },
  { code: 'MET-SUA-014', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Standard work development process missing', type: 'SUA' },
  { code: 'MET-SUN-015', domain: 'MET', domainLabel: 'Method / Work Standard', label: 'Method adherence audits not systematic', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // F. MEASUREMENT SYSTEM / MSA (MSA)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'MSA-TUN-001', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Measurement method not capable', type: 'TUN' },
  { code: 'MSA-TUN-002', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Gauge resolution insufficient', type: 'TUN' },
  { code: 'MSA-TUN-003', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Gauge bias not assessed', type: 'TUN' },
  { code: 'MSA-TUN-004', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Gauge repeatability poor', type: 'TUN' },
  { code: 'MSA-TUN-005', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Gauge reproducibility poor', type: 'TUN' },
  { code: 'MSA-TUN-006', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Measurement fixture unstable', type: 'TUN' },
  { code: 'MSA-TUN-007', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Measurement environment influences result', type: 'TUN' },
  { code: 'MSA-TUN-008', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Measurement method not standardized', type: 'TUN' },
  { code: 'MSA-TUN-009', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Zero point not verified', type: 'TUN' },
  { code: 'MSA-TUN-010', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Calibration expired', type: 'TUN' },
  { code: 'MSA-TUN-011', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Attribute inspection criteria subjective', type: 'TUN' },
  { code: 'MSA-TUN-012', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Automated measurement program incorrect', type: 'TUN' },
  { code: 'MSA-SUA-013', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'MSA planning not linked to risk', type: 'SUA' },
  { code: 'MSA-SUA-014', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Gauge management process incomplete', type: 'SUA' },
  { code: 'MSA-SUN-015', domain: 'MSA', domainLabel: 'Measurement System / MSA', label: 'Measurement system performance not reviewed periodically', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // G. INSPECTION PLANNING / CONTROL PLAN (CTL)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'CTL-TUN-001', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Characteristic not included in control plan', type: 'TUN' },
  { code: 'CTL-TUN-002', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Inspection frequency too low', type: 'TUN' },
  { code: 'CTL-TUN-003', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Sampling plan insufficient', type: 'TUN' },
  { code: 'CTL-TUN-004', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Reaction plan missing', type: 'TUN' },
  { code: 'CTL-TUN-005', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Special characteristic not identified', type: 'TUN' },
  { code: 'CTL-TUN-006', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Inspection point placed too late in process', type: 'TUN' },
  { code: 'CTL-TUN-007', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Incoming inspection scope inadequate', type: 'TUN' },
  { code: 'CTL-TUN-008', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'First-off inspection scope incomplete', type: 'TUN' },
  { code: 'CTL-TUN-009', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Final inspection criterion unclear', type: 'TUN' },
  { code: 'CTL-TUN-010', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Control plan not updated after change', type: 'TUN' },
  { code: 'CTL-TUA-011', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Process control characteristic not linked to defect mode', type: 'TUA' },
  { code: 'CTL-TUA-012', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Monitoring method not preventive', type: 'TUA' },
  { code: 'CTL-SUA-013', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Control plan governance not defined', type: 'SUA' },
  { code: 'CTL-SUA-014', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'FMEA-to-control-plan linkage missing', type: 'SUA' },
  { code: 'CTL-SUN-015', domain: 'CTL', domainLabel: 'Inspection Planning / Control Plan', label: 'Control plan effectiveness not reviewed', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // H. PFMEA / RISK ANALYSIS (FME)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'FME-SUA-001', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Failure mode not identified in PFMEA', type: 'SUA' },
  { code: 'FME-SUA-002', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Cause chain incomplete in PFMEA', type: 'SUA' },
  { code: 'FME-SUA-003', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Detection control not defined in PFMEA', type: 'SUA' },
  { code: 'FME-SUA-004', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Prevention control not defined in PFMEA', type: 'SUA' },
  { code: 'FME-SUA-005', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Severity assessment unrealistic', type: 'SUA' },
  { code: 'FME-SUA-006', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Occurrence assessment not evidence-based', type: 'SUA' },
  { code: 'FME-SUA-007', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Detection assessment overestimated', type: 'SUA' },
  { code: 'FME-SUA-008', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'PFMEA not updated after complaint', type: 'SUA' },
  { code: 'FME-SUA-009', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'PFMEA not linked to process flow', type: 'SUA' },
  { code: 'FME-SUA-010', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'PFMEA team competence incomplete', type: 'SUA' },
  { code: 'FME-SUN-011', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'FMEA review cycle not implemented', type: 'SUN' },
  { code: 'FME-SUN-012', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Lessons learned not fed back into PFMEA', type: 'SUN' },
  { code: 'FME-SUN-013', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Customer complaints not used as FMEA input', type: 'SUN' },
  { code: 'FME-SUN-014', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Cross-functional review not effective', type: 'SUN' },
  { code: 'FME-SUN-015', domain: 'FME', domainLabel: 'PFMEA / Risk Analysis', label: 'Action follow-up from PFMEA incomplete', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // I. PROCESS FLOW / INDUSTRIAL ENGINEERING (PFL)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'PFL-TUA-001', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Process step sequence incorrect', type: 'TUA' },
  { code: 'PFL-TUA-002', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Unnecessary handling damages part', type: 'TUA' },
  { code: 'PFL-TUA-003', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Bottleneck causes unstable process conditions', type: 'TUA' },
  { code: 'PFL-TUA-004', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Buffer logic causes part mix-up', type: 'TUA' },
  { code: 'PFL-TUA-005', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Material flow path not protected', type: 'TUA' },
  { code: 'PFL-TUA-006', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'FIFO not maintained', type: 'TUA' },
  { code: 'PFL-TUA-007', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'WIP identification unclear', type: 'TUA' },
  { code: 'PFL-TUA-008', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Routing version incorrect', type: 'TUA' },
  { code: 'PFL-TUA-009', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Process interface undefined', type: 'TUA' },
  { code: 'PFL-TUA-010', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Part family complexity not segregated', type: 'TUA' },
  { code: 'PFL-TUN-011', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Inspection step not aligned with process risk', type: 'TUN' },
  { code: 'PFL-TUN-012', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Handover point control missing', type: 'TUN' },
  { code: 'PFL-SUA-013', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Process flow ownership unclear', type: 'SUA' },
  { code: 'PFL-SUA-014', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Layout / flow risk analysis not performed', type: 'SUA' },
  { code: 'PFL-SUN-015', domain: 'PFL', domainLabel: 'Process Flow / Industrial Engineering', label: 'Process interface review not standardized', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // J. DRAWING / SPECIFICATION / ENGINEERING (ENG)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'ENG-TUA-001', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Drawing requirement ambiguous', type: 'TUA' },
  { code: 'ENG-TUA-002', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Specification revision not communicated', type: 'TUA' },
  { code: 'ENG-TUA-003', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Tolerance stack-up not assessed', type: 'TUA' },
  { code: 'ENG-TUA-004', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Datum concept misunderstood', type: 'TUA' },
  { code: 'ENG-TUA-005', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'CTQ definition incomplete', type: 'TUA' },
  { code: 'ENG-TUA-006', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Technical change not implemented in production', type: 'TUA' },
  { code: 'ENG-TUA-007', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Part variant differentiation unclear', type: 'TUA' },
  { code: 'ENG-TUA-008', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Acceptance criteria incomplete', type: 'TUA' },
  { code: 'ENG-TUA-009', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Surface requirement misinterpreted', type: 'TUA' },
  { code: 'ENG-TUA-010', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Material requirement not translated to process', type: 'TUA' },
  { code: 'ENG-TUN-011', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Engineering change not reflected in inspection plan', type: 'TUN' },
  { code: 'ENG-TUN-012', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Specification review before launch incomplete', type: 'TUN' },
  { code: 'ENG-SUA-013', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Change management process ineffective', type: 'SUA' },
  { code: 'ENG-SUA-014', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Engineering-to-production transfer incomplete', type: 'SUA' },
  { code: 'ENG-SUN-015', domain: 'ENG', domainLabel: 'Drawing / Specification / Engineering', label: 'Specification conflict escalation missing', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // K. PRODUCTION RELEASE / PROCESS APPROVAL (REL)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'REL-SUA-001', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Process release incomplete', type: 'SUA' },
  { code: 'REL-SUA-002', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Run-at-rate evidence missing', type: 'SUA' },
  { code: 'REL-SUA-003', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Capability evidence insufficient before release', type: 'SUA' },
  { code: 'REL-SUA-004', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Open issues accepted without risk assessment', type: 'SUA' },
  { code: 'REL-SUA-005', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Temporary deviation not tracked', type: 'SUA' },
  { code: 'REL-SUA-006', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Launch readiness review incomplete', type: 'SUA' },
  { code: 'REL-SUA-007', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Serial release criteria unclear', type: 'SUA' },
  { code: 'REL-SUA-008', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Product/process validation incomplete', type: 'SUA' },
  { code: 'REL-SUN-009', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Release gate audit not effective', type: 'SUN' },
  { code: 'REL-SUN-010', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Escalation of launch risks missing', type: 'SUN' },
  { code: 'REL-SUN-011', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Evidence retention for release incomplete', type: 'SUN' },
  { code: 'REL-TUN-012', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'First serial production not intensified for inspection', type: 'TUN' },
  { code: 'REL-TUA-013', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Production started with unstable process', type: 'TUA' },
  { code: 'REL-SUA-014', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Customer-specific release requirements not integrated', type: 'SUA' },
  { code: 'REL-SUN-015', domain: 'REL', domainLabel: 'Production Release / Process Approval', label: 'Approval deviations not periodically reviewed', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // L. TRAINING / COMPETENCE (TRN)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'TRN-SUA-001', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Competence requirement not defined', type: 'SUA' },
  { code: 'TRN-SUA-002', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Training matrix incomplete', type: 'SUA' },
  { code: 'TRN-SUA-003', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Qualification status not verified before assignment', type: 'SUA' },
  { code: 'TRN-SUA-004', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Refresher training not planned', type: 'SUA' },
  { code: 'TRN-SUA-005', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Training content outdated', type: 'SUA' },
  { code: 'TRN-SUA-006', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Competence evaluation ineffective', type: 'SUA' },
  { code: 'TRN-SUA-007', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Special process qualification missing', type: 'SUA' },
  { code: 'TRN-SUA-008', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Complaint learning not transferred into training', type: 'SUA' },
  { code: 'TRN-SUN-009', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Training effectiveness not monitored', type: 'SUN' },
  { code: 'TRN-SUN-010', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Skill-gap escalation missing', type: 'SUN' },
  { code: 'TRN-TUA-011', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Task execution requires tacit knowledge not standardized', type: 'TUA' },
  { code: 'TRN-TUN-012', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Inspection judgment varies due to missing calibration of inspectors', type: 'TUN' },
  { code: 'TRN-SUA-013', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Role-specific training ownership unclear', type: 'SUA' },
  { code: 'TRN-SUN-014', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Multi-shift training consistency not ensured', type: 'SUN' },
  { code: 'TRN-SUN-015', domain: 'TRN', domainLabel: 'Training / Competence', label: 'Temporary staff qualification process inadequate', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // M. MAINTENANCE / TPM (MNT)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'MNT-TUA-001', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Preventive maintenance interval inadequate', type: 'TUA' },
  { code: 'MNT-TUA-002', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Maintenance task scope incomplete', type: 'TUA' },
  { code: 'MNT-TUA-003', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Condition-based maintenance not used for critical equipment', type: 'TUA' },
  { code: 'MNT-TUA-004', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Lubrication standard missing', type: 'TUA' },
  { code: 'MNT-TUA-005', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Spare part condition poor', type: 'TUA' },
  { code: 'MNT-TUA-006', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Sensor drift not corrected', type: 'TUA' },
  { code: 'MNT-TUA-007', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Machine calibration not performed', type: 'TUA' },
  { code: 'MNT-TUA-008', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Utility condition unstable', type: 'TUA' },
  { code: 'MNT-TUN-009', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Maintenance-induced changes not revalidated', type: 'TUN' },
  { code: 'MNT-TUN-010', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Equipment health indicators not reviewed', type: 'TUN' },
  { code: 'MNT-SUA-011', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Criticality-based maintenance planning missing', type: 'SUA' },
  { code: 'MNT-SUA-012', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Breakdown analysis not systematic', type: 'SUA' },
  { code: 'MNT-SUA-013', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Maintenance feedback loop to quality missing', type: 'SUA' },
  { code: 'MNT-SUN-014', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'Chronic equipment issues not escalated', type: 'SUN' },
  { code: 'MNT-SUN-015', domain: 'MNT', domainLabel: 'Maintenance / TPM', label: 'TPM governance not established', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // N. SUPPLIER MANAGEMENT (SUP)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'SUP-TUA-001', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier process capability insufficient', type: 'TUA' },
  { code: 'SUP-TUA-002', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier change not disclosed', type: 'TUA' },
  { code: 'SUP-TUA-003', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier packaging inadequate', type: 'TUA' },
  { code: 'SUP-TUA-004', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier incoming defect containment ineffective', type: 'TUA' },
  { code: 'SUP-TUA-005', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Sub-tier variation uncontrolled', type: 'TUA' },
  { code: 'SUP-TUA-006', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier traceability incomplete', type: 'TUA' },
  { code: 'SUP-TUN-007', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier monitoring criterion incomplete', type: 'TUN' },
  { code: 'SUP-TUN-008', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Receiving inspection based on outdated risk level', type: 'TUN' },
  { code: 'SUP-TUN-009', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier deviation not blocked internally', type: 'TUN' },
  { code: 'SUP-SUA-010', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier development process ineffective', type: 'SUA' },
  { code: 'SUP-SUA-011', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier APQP oversight insufficient', type: 'SUA' },
  { code: 'SUP-SUA-012', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier escalation path unclear', type: 'SUA' },
  { code: 'SUP-SUN-013', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier complaint recurrence not tracked', type: 'SUN' },
  { code: 'SUP-SUN-014', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Sub-tier risk visibility missing', type: 'SUN' },
  { code: 'SUP-SUN-015', domain: 'SUP', domainLabel: 'Supplier Management', label: 'Supplier performance review not linked to defect modes', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // O. TRACEABILITY / IDENTIFICATION / SEGREGATION (TRC)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'TRC-TUA-001', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Part identification unclear', type: 'TUA' },
  { code: 'TRC-TUA-002', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Batch label missing', type: 'TUA' },
  { code: 'TRC-TUA-003', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Variant mix-up possible by design', type: 'TUA' },
  { code: 'TRC-TUA-004', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Nonconforming material not physically segregated', type: 'TUA' },
  { code: 'TRC-TUA-005', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Rework part identification missing', type: 'TUA' },
  { code: 'TRC-TUA-006', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Container labeling inconsistent', type: 'TUA' },
  { code: 'TRC-TUA-007', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Serialization logic broken', type: 'TUA' },
  { code: 'TRC-TUN-008', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Traceability record incomplete', type: 'TUN' },
  { code: 'TRC-TUN-009', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Lot genealogy cannot be reconstructed', type: 'TUN' },
  { code: 'TRC-TUN-010', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Blocked stock status not visible in system', type: 'TUN' },
  { code: 'TRC-SUA-011', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Traceability concept not risk-based', type: 'SUA' },
  { code: 'TRC-SUA-012', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Segregation rules not standardized', type: 'SUA' },
  { code: 'TRC-SUA-013', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'ERP / MES status flow inconsistent', type: 'SUA' },
  { code: 'TRC-SUN-014', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Traceability audits not performed', type: 'SUN' },
  { code: 'TRC-SUN-015', domain: 'TRC', domainLabel: 'Traceability / Identification / Segregation', label: 'Mix-up near-misses not analyzed', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // P. PACKAGING / HANDLING / LOGISTICS (LOG)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'LOG-TUA-001', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Packaging specification inadequate', type: 'TUA' },
  { code: 'LOG-TUA-002', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Protection against transport damage insufficient', type: 'TUA' },
  { code: 'LOG-TUA-003', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Loading sequence causes damage', type: 'TUA' },
  { code: 'LOG-TUA-004', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Handling device unsuitable', type: 'TUA' },
  { code: 'LOG-TUA-005', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Storage orientation wrong', type: 'TUA' },
  { code: 'LOG-TUA-006', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Cleanliness protection insufficient', type: 'TUA' },
  { code: 'LOG-TUA-007', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Returnable container condition poor', type: 'TUA' },
  { code: 'LOG-TUA-008', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'ESD protection inadequate', type: 'TUA' },
  { code: 'LOG-TUN-009', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Damage inspection before shipment ineffective', type: 'TUN' },
  { code: 'LOG-TUN-010', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Packaging verification criterion incomplete', type: 'TUN' },
  { code: 'LOG-SUA-011', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Logistics risk analysis missing', type: 'SUA' },
  { code: 'LOG-SUA-012', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Packaging approval process incomplete', type: 'SUA' },
  { code: 'LOG-SUA-013', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Customer-specific logistics requirements not integrated', type: 'SUA' },
  { code: 'LOG-SUN-014', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Transport damage trend not monitored', type: 'SUN' },
  { code: 'LOG-SUN-015', domain: 'LOG', domainLabel: 'Packaging / Handling / Logistics', label: 'Warehouse deviation escalation missing', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Q. CLEANLINESS / CONTAMINATION / ENVIRONMENT (CLN)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'CLN-TUA-001', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Cleaning step ineffective', type: 'TUA' },
  { code: 'CLN-TUA-002', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Cleanliness limit not defined', type: 'TUA' },
  { code: 'CLN-TUA-003', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Contamination source not isolated', type: 'TUA' },
  { code: 'CLN-TUA-004', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Environmental condition out of range', type: 'TUA' },
  { code: 'CLN-TUA-005', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Temperature control unstable', type: 'TUA' },
  { code: 'CLN-TUA-006', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Humidity control insufficient', type: 'TUA' },
  { code: 'CLN-TUA-007', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Particle ingress during handling', type: 'TUA' },
  { code: 'CLN-TUA-008', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Cross-contamination between variants', type: 'TUA' },
  { code: 'CLN-TUN-009', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Cleanliness inspection method inadequate', type: 'TUN' },
  { code: 'CLN-TUN-010', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Environmental alarm not reviewed', type: 'TUN' },
  { code: 'CLN-SUA-011', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Contamination control strategy missing', type: 'SUA' },
  { code: 'CLN-SUA-012', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Environmental specification not process-linked', type: 'SUA' },
  { code: 'CLN-SUA-013', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Housekeeping standard insufficient for product risk', type: 'SUA' },
  { code: 'CLN-SUN-014', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Contamination trend review missing', type: 'SUN' },
  { code: 'CLN-SUN-015', domain: 'CLN', domainLabel: 'Cleanliness / Contamination / Environment', label: 'Cleanliness audit scope incomplete', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // R. SOFTWARE / AUTOMATION / MES / PLC (SWA)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'SWA-TUA-001', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'PLC logic incorrect', type: 'TUA' },
  { code: 'SWA-TUA-002', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Robot path causes damage', type: 'TUA' },
  { code: 'SWA-TUA-003', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Program version mismatch', type: 'TUA' },
  { code: 'SWA-TUA-004', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Error-proofing logic bypassed', type: 'TUA' },
  { code: 'SWA-TUA-005', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Sensor threshold incorrect', type: 'TUA' },
  { code: 'SWA-TUA-006', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Vision system recipe wrong', type: 'TUA' },
  { code: 'SWA-TUA-007', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'MES data mapping incorrect', type: 'TUA' },
  { code: 'SWA-TUA-008', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Interlock condition incomplete', type: 'TUA' },
  { code: 'SWA-TUN-009', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Alarm generated but not escalated', type: 'TUN' },
  { code: 'SWA-TUN-010', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Automatic reject logic ineffective', type: 'TUN' },
  { code: 'SWA-TUN-011', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Error logs not reviewed', type: 'TUN' },
  { code: 'SWA-SUA-012', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Software change control ineffective', type: 'SUA' },
  { code: 'SWA-SUA-013', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Validation of automation changes incomplete', type: 'SUA' },
  { code: 'SWA-SUN-014', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Digital failure monitoring not systematic', type: 'SUN' },
  { code: 'SWA-SUN-015', domain: 'SWA', domainLabel: 'Software / Automation / MES / PLC', label: 'Backup / restore governance incomplete', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // S. COMPLAINT HANDLING / 8D / FEEDBACK LOOP (CMP)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'CMP-SUA-001', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Complaint process not consistently implemented', type: 'SUA' },
  { code: 'CMP-SUA-002', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Response timing standard unclear', type: 'SUA' },
  { code: 'CMP-SUA-003', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Root cause methodology not standardized', type: 'SUA' },
  { code: 'CMP-SUA-004', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: '8D ownership unclear', type: 'SUA' },
  { code: 'CMP-SUA-005', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Customer complaint categorization inconsistent', type: 'SUA' },
  { code: 'CMP-SUA-006', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Evidence retention for complaints incomplete', type: 'SUA' },
  { code: 'CMP-SUA-007', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Complaint-to-FMEA feedback missing', type: 'SUA' },
  { code: 'CMP-SUA-008', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Complaint-to-control-plan feedback missing', type: 'SUA' },
  { code: 'CMP-SUN-009', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Repeat complaint analysis not performed', type: 'SUN' },
  { code: 'CMP-SUN-010', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Complaint closure without effectiveness verification', type: 'SUN' },
  { code: 'CMP-SUN-011', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Lessons learned not transferred cross-functionally', type: 'SUN' },
  { code: 'CMP-SUN-012', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Internal complaints not linked to customer complaints', type: 'SUN' },
  { code: 'CMP-TUN-013', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Escape point analysis not performed', type: 'TUN' },
  { code: 'CMP-SUN-014', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'Management review of complaints too superficial', type: 'SUN' },
  { code: 'CMP-SUN-015', domain: 'CMP', domainLabel: 'Complaint Handling / 8D / Feedback Loop', label: 'KPI-based complaint escalation missing', type: 'SUN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // T. MANAGEMENT SYSTEM / GOVERNANCE / ROLES (MGS)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'MGS-SUA-001', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Process ownership unclear', type: 'SUA' },
  { code: 'MGS-SUA-002', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Role responsibility not defined', type: 'SUA' },
  { code: 'MGS-SUA-003', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Escalation threshold not defined', type: 'SUA' },
  { code: 'MGS-SUA-004', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Cross-functional governance weak', type: 'SUA' },
  { code: 'MGS-SUA-005', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Decision authority unclear', type: 'SUA' },
  { code: 'MGS-SUA-006', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Resource planning not aligned to risk', type: 'SUA' },
  { code: 'MGS-SUA-007', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Internal audit focus not risk-based', type: 'SUA' },
  { code: 'MGS-SUA-008', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'KPI system does not reveal process weakness', type: 'SUA' },
  { code: 'MGS-SUA-009', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Management review does not address defect mechanisms', type: 'SUA' },
  { code: 'MGS-SUA-010', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Change management not embedded in IMS', type: 'SUA' },
  { code: 'MGS-SUN-011', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Recurring deviations not escalated to management', type: 'SUN' },
  { code: 'MGS-SUN-012', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Systemic weakness not translated into action plan', type: 'SUN' },
  { code: 'MGS-SUN-013', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Prevention logic weaker than reaction logic', type: 'SUN' },
  { code: 'MGS-SUN-014', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Cross-site learning mechanism missing', type: 'SUN' },
  { code: 'MGS-SUN-015', domain: 'MGS', domainLabel: 'Management System / Governance / Roles', label: 'Integrated management system not fully established', type: 'SUN' },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get root causes by type (TUA, TUN, SUA, SUN)
 */
export function getRootCausesByType(type: CauseType): RootCause[] {
  return ROOT_CAUSE_ONTOLOGY.filter((cause) => cause.type === type)
}

/**
 * Get root causes by domain
 */
export function getRootCausesByDomain(domain: CauseDomain): RootCause[] {
  return ROOT_CAUSE_ONTOLOGY.filter((cause) => cause.domain === domain)
}

/**
 * Get a specific root cause by code
 */
export function getRootCauseByCode(code: string): RootCause | undefined {
  return ROOT_CAUSE_ONTOLOGY.find((cause) => cause.code === code)
}

/**
 * Search root causes by keyword (searches in label)
 */
export function searchRootCauses(keyword: string): RootCause[] {
  const lowerKeyword = keyword.toLowerCase()
  return ROOT_CAUSE_ONTOLOGY.filter((cause) =>
    cause.label.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * Get all technical causes (TUA + TUN)
 */
export function getTechnicalCauses(): RootCause[] {
  return ROOT_CAUSE_ONTOLOGY.filter(
    (cause) => cause.type === 'TUA' || cause.type === 'TUN'
  )
}

/**
 * Get all systemic causes (SUA + SUN)
 */
export function getSystemicCauses(): RootCause[] {
  return ROOT_CAUSE_ONTOLOGY.filter(
    (cause) => cause.type === 'SUA' || cause.type === 'SUN'
  )
}

/**
 * Get occurrence causes (TUA + SUA)
 */
export function getOccurrenceCauses(): RootCause[] {
  return ROOT_CAUSE_ONTOLOGY.filter(
    (cause) => cause.type === 'TUA' || cause.type === 'SUA'
  )
}

/**
 * Get non-detection/escape causes (TUN + SUN)
 */
export function getNonDetectionCauses(): RootCause[] {
  return ROOT_CAUSE_ONTOLOGY.filter(
    (cause) => cause.type === 'TUN' || cause.type === 'SUN'
  )
}

/**
 * Format ontology data for AI prompt context
 */
export function formatOntologyForAI(causes: RootCause[]): string {
  return causes
    .map((c) => `[${c.code}] ${c.label} (${c.type})`)
    .join('\n')
}
