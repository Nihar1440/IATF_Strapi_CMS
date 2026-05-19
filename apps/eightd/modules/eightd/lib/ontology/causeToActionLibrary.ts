/**
 * Cause-to-Action Library for Automotive Processes
 * Version 1.0
 *
 * Maps root causes from the ontology to their typical corrective actions,
 * verification methods, and evidence requirements.
 *
 * Based on VDA 8D methodology for IATF 16949 compliance.
 */

import type { CauseType } from './rootCauseOntology'

export interface CorrectiveActionPattern {
  causeCode: string
  causeLabel: string
  causeType: CauseType
  correctiveActions: string[]
  verificationMethods: string[]
  evidence: string[]
  standards?: string[]
}

export const CAUSE_TO_ACTION_LIBRARY: CorrectiveActionPattern[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESS PARAMETERS (PRM)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'PRM-TUA-001',
    causeLabel: 'Parameter limit not defined',
    causeType: 'TUA',
    correctiveActions: [
      'define process parameter limits',
      'update process specification',
      'implement parameter monitoring',
      'revise control plan',
    ],
    verificationMethods: [
      'process capability study (Cp/Cpk)',
      'SPC trend monitoring',
    ],
    evidence: [
      'updated process specification',
      'control plan revision',
      'capability report',
    ],
    standards: ['IATF 16949 8.5.1', 'VDA Volume 4'],
  },
  {
    causeCode: 'PRM-TUA-002',
    causeLabel: 'Parameter range too wide',
    causeType: 'TUA',
    correctiveActions: [
      'narrow process parameter range',
      'validate reduced parameter window',
      'update process specification',
    ],
    verificationMethods: [
      'process capability study (Cp/Cpk)',
      'DOE validation',
    ],
    evidence: [
      'process specification revision',
      'capability report',
    ],
  },
  {
    causeCode: 'PRM-TUA-003',
    causeLabel: 'Parameter setpoint incorrect',
    causeType: 'TUA',
    correctiveActions: [
      'adjust process parameter setpoint',
      'validate parameter window',
      'update machine recipe',
    ],
    verificationMethods: [
      'process capability study',
      'first article inspection',
    ],
    evidence: [
      'machine parameter log',
      'validation protocol',
    ],
  },
  {
    causeCode: 'PRM-TUA-004',
    causeLabel: 'Parameter change not approved',
    causeType: 'TUA',
    correctiveActions: [
      'implement parameter change approval process',
      'define parameter authorization matrix',
      'revert to approved parameter set',
    ],
    verificationMethods: [
      'process audit',
      'change log review',
    ],
    evidence: [
      'parameter change approval form',
      'authorization matrix',
    ],
  },
  {
    causeCode: 'PRM-TUA-005',
    causeLabel: 'Parameter drift not compensated',
    causeType: 'TUA',
    correctiveActions: [
      'implement parameter drift monitoring',
      'define compensation algorithm',
      'introduce SPC control limits',
    ],
    verificationMethods: [
      'SPC trend analysis',
      'process audit',
    ],
    evidence: [
      'SPC charts',
      'drift compensation procedure',
    ],
  },
  {
    causeCode: 'PRM-SUA-013',
    causeLabel: 'Parameter management process not defined',
    causeType: 'SUA',
    correctiveActions: [
      'establish parameter governance process',
      'define parameter approval workflow',
      'implement parameter change documentation',
    ],
    verificationMethods: [
      'process audit',
      'document review',
    ],
    evidence: [
      'parameter management procedure',
      'audit report',
    ],
  },
  {
    causeCode: 'PRM-SUA-014',
    causeLabel: 'Parameter release process missing',
    causeType: 'SUA',
    correctiveActions: [
      'define parameter release procedure',
      'implement parameter validation gate',
      'establish parameter ownership',
    ],
    verificationMethods: [
      'process audit',
      'management review',
    ],
    evidence: [
      'parameter release procedure',
      'validation records',
    ],
  },
  {
    causeCode: 'PRM-SUN-015',
    causeLabel: 'Parameter monitoring escalation not implemented',
    causeType: 'SUN',
    correctiveActions: [
      'define parameter monitoring escalation rules',
      'implement alert notification system',
      'establish escalation response procedure',
    ],
    verificationMethods: [
      'process audit',
      'escalation test',
    ],
    evidence: [
      'escalation procedure',
      'alert system logs',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOLING / EQUIPMENT WEAR (TOL)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'TOL-TUA-001',
    causeLabel: 'Tool wear limit not defined',
    causeType: 'TUA',
    correctiveActions: [
      'define tool wear limit',
      'implement tool life monitoring',
      'update maintenance plan',
    ],
    verificationMethods: [
      'defect rate monitoring',
      'tool condition assessment',
    ],
    evidence: [
      'tool life specification',
      'maintenance schedule',
    ],
  },
  {
    causeCode: 'TOL-TUA-002',
    causeLabel: 'Tool change interval exceeded',
    causeType: 'TUA',
    correctiveActions: [
      'define tool life limit',
      'implement tool change monitoring',
      'update preventive maintenance plan',
    ],
    verificationMethods: [
      'defect rate monitoring',
      'maintenance audit',
    ],
    evidence: [
      'maintenance schedule',
      'tool change record',
    ],
  },
  {
    causeCode: 'TOL-TUA-003',
    causeLabel: 'Tool condition not assessed before run',
    causeType: 'TUA',
    correctiveActions: [
      'implement pre-run tool inspection',
      'define tool condition checklist',
      'introduce tool condition documentation',
    ],
    verificationMethods: [
      'layered process audit',
      'first piece inspection',
    ],
    evidence: [
      'tool inspection checklist',
      'inspection records',
    ],
  },
  {
    causeCode: 'TOL-TUA-004',
    causeLabel: 'Tool damage not detected during setup',
    causeType: 'TUA',
    correctiveActions: [
      'introduce tool inspection checklist',
      'implement setup verification step',
    ],
    verificationMethods: [
      'layered process audit',
      'first piece approval',
    ],
    evidence: [
      'setup checklist',
      'audit results',
    ],
  },
  {
    causeCode: 'TOL-TUN-011',
    causeLabel: 'Tool wear indicator not checked',
    causeType: 'TUN',
    correctiveActions: [
      'add tool wear check to inspection routine',
      'implement automated tool monitoring',
      'define tool wear inspection criteria',
    ],
    verificationMethods: [
      'process audit',
      'inspection record review',
    ],
    evidence: [
      'inspection procedure update',
      'tool monitoring records',
    ],
  },
  {
    causeCode: 'TOL-SUA-013',
    causeLabel: 'Tool life management not established',
    causeType: 'SUA',
    correctiveActions: [
      'implement tool life management system',
      'integrate tool monitoring into MES',
    ],
    verificationMethods: [
      'process audit',
      'KPI review',
    ],
    evidence: [
      'tool life management procedure',
      'MES monitoring reports',
    ],
  },
  {
    causeCode: 'TOL-SUA-014',
    causeLabel: 'Maintenance planning not risk-based',
    causeType: 'SUA',
    correctiveActions: [
      'implement risk-based maintenance planning',
      'define equipment criticality classification',
      'align maintenance intervals to risk levels',
    ],
    verificationMethods: [
      'maintenance audit',
      'risk assessment review',
    ],
    evidence: [
      'risk-based maintenance procedure',
      'equipment criticality matrix',
    ],
  },
  {
    causeCode: 'TOL-SUN-015',
    causeLabel: 'Equipment deterioration trend not monitored',
    causeType: 'SUN',
    correctiveActions: [
      'implement equipment health monitoring',
      'define deterioration trending KPIs',
      'establish equipment review cycle',
    ],
    verificationMethods: [
      'trend analysis review',
      'management review',
    ],
    evidence: [
      'equipment health reports',
      'trending charts',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIAL / RAW MATERIAL (MAT)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'MAT-TUA-002',
    causeLabel: 'Wrong material batch used',
    causeType: 'TUA',
    correctiveActions: [
      'implement material batch verification',
      'introduce barcode scanning',
    ],
    verificationMethods: [
      'traceability audit',
      'inventory check',
    ],
    evidence: [
      'material traceability records',
      'barcode scan logs',
    ],
  },
  {
    causeCode: 'MAT-TUA-003',
    causeLabel: 'Material mix-up occurred',
    causeType: 'TUA',
    correctiveActions: [
      'implement poka-yoke for material identification',
      'introduce visual differentiation',
      'define material segregation rules',
    ],
    verificationMethods: [
      'process audit',
      'error-proofing validation',
    ],
    evidence: [
      'poka-yoke verification report',
      'segregation procedure',
    ],
  },
  {
    causeCode: 'MAT-TUN-011',
    causeLabel: 'Incoming inspection characteristic missing',
    causeType: 'TUN',
    correctiveActions: [
      'update incoming inspection plan',
      'include missing material characteristic',
    ],
    verificationMethods: [
      'incoming inspection audit',
    ],
    evidence: [
      'updated inspection plan',
    ],
  },
  {
    causeCode: 'MAT-TUN-012',
    causeLabel: 'Material certificate not verified',
    causeType: 'TUN',
    correctiveActions: [
      'implement certificate verification step',
      'define certificate acceptance criteria',
      'update incoming inspection procedure',
    ],
    verificationMethods: [
      'incoming inspection audit',
      'certificate verification check',
    ],
    evidence: [
      'inspection procedure revision',
      'certificate verification records',
    ],
  },
  {
    causeCode: 'MAT-SUA-013',
    causeLabel: 'Material release criteria not standardized',
    causeType: 'SUA',
    correctiveActions: [
      'define material release criteria',
      'update supplier specification',
    ],
    verificationMethods: [
      'supplier audit',
    ],
    evidence: [
      'supplier specification revision',
    ],
  },
  {
    causeCode: 'MAT-SUA-014',
    causeLabel: 'Supplier change communication ineffective',
    causeType: 'SUA',
    correctiveActions: [
      'implement supplier change notification requirement',
      'define change communication procedure',
      'establish supplier change review gate',
    ],
    verificationMethods: [
      'supplier audit',
      'process audit',
    ],
    evidence: [
      'supplier change notification procedure',
      'supplier agreement update',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MACHINE SETUP / CHANGEOVER (SET)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'SET-TUA-001',
    causeLabel: 'Setup instruction incomplete',
    causeType: 'TUA',
    correctiveActions: [
      'revise setup instruction',
      'define setup checklist',
    ],
    verificationMethods: [
      'layered process audit',
    ],
    evidence: [
      'updated setup instruction',
    ],
  },
  {
    causeCode: 'SET-TUA-003',
    causeLabel: 'First-piece approval not robust',
    causeType: 'TUA',
    correctiveActions: [
      'revise first-piece approval criteria',
      'expand first-piece inspection scope',
      'define approval authority',
    ],
    verificationMethods: [
      'first article inspection audit',
      'process audit',
    ],
    evidence: [
      'first-piece approval procedure',
      'approval records',
    ],
  },
  {
    causeCode: 'SET-TUN-011',
    causeLabel: 'Setup verification not performed',
    causeType: 'TUN',
    correctiveActions: [
      'implement setup verification step',
      'introduce first piece approval',
    ],
    verificationMethods: [
      'first article inspection',
    ],
    evidence: [
      'setup verification record',
    ],
  },
  {
    causeCode: 'SET-TUN-012',
    causeLabel: 'Changeover checklist not used',
    causeType: 'TUN',
    correctiveActions: [
      'mandate changeover checklist usage',
      'implement checklist completion verification',
      'train operators on checklist requirements',
    ],
    verificationMethods: [
      'layered process audit',
      'checklist completion review',
    ],
    evidence: [
      'completed checklists',
      'audit records',
    ],
  },
  {
    causeCode: 'SET-SUA-013',
    causeLabel: 'Standard changeover process not defined',
    causeType: 'SUA',
    correctiveActions: [
      'establish SMED process standard',
      'define setup ownership',
    ],
    verificationMethods: [
      'process audit',
    ],
    evidence: [
      'changeover standard',
    ],
  },
  {
    causeCode: 'SET-SUA-014',
    causeLabel: 'Setup release authority unclear',
    causeType: 'SUA',
    correctiveActions: [
      'define setup release authority matrix',
      'implement setup approval workflow',
      'train on authorization requirements',
    ],
    verificationMethods: [
      'process audit',
      'authorization review',
    ],
    evidence: [
      'authorization matrix',
      'setup release procedure',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEASUREMENT SYSTEM / MSA (MSA)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'MSA-TUN-001',
    causeLabel: 'Measurement method not capable',
    causeType: 'TUN',
    correctiveActions: [
      'validate measurement method',
      'improve measurement resolution',
      'perform MSA study',
    ],
    verificationMethods: [
      'MSA (GRR study)',
    ],
    evidence: [
      'MSA report',
    ],
    standards: ['IATF 16949 7.1.5'],
  },
  {
    causeCode: 'MSA-TUN-002',
    causeLabel: 'Gauge resolution insufficient',
    causeType: 'TUN',
    correctiveActions: [
      'replace measurement equipment with higher resolution',
      'perform MSA study',
      'update measurement procedure',
    ],
    verificationMethods: [
      'MSA (GRR study)',
      'resolution verification',
    ],
    evidence: [
      'MSA report',
      'equipment specification',
    ],
  },
  {
    causeCode: 'MSA-TUN-010',
    causeLabel: 'Calibration expired',
    causeType: 'TUN',
    correctiveActions: [
      'recalibrate measurement equipment',
      'implement calibration monitoring',
    ],
    verificationMethods: [
      'calibration audit',
    ],
    evidence: [
      'calibration certificate',
    ],
  },
  {
    causeCode: 'MSA-SUA-013',
    causeLabel: 'MSA planning not linked to risk',
    causeType: 'SUA',
    correctiveActions: [
      'link MSA planning to PFMEA risk levels',
      'prioritize MSA for high-risk characteristics',
      'update MSA procedure',
    ],
    verificationMethods: [
      'MSA planning review',
      'process audit',
    ],
    evidence: [
      'MSA plan linked to risk matrix',
      'updated MSA procedure',
    ],
  },
  {
    causeCode: 'MSA-SUA-014',
    causeLabel: 'Gauge management process incomplete',
    causeType: 'SUA',
    correctiveActions: [
      'implement gauge management process',
      'introduce calibration planning',
    ],
    verificationMethods: [
      'internal audit',
    ],
    evidence: [
      'gauge management procedure',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSPECTION PLANNING / CONTROL PLAN (CTL)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'CTL-TUN-001',
    causeLabel: 'Characteristic missing in control plan',
    causeType: 'TUN',
    correctiveActions: [
      'update control plan',
      'add inspection step',
    ],
    verificationMethods: [
      'process audit',
    ],
    evidence: [
      'revised control plan',
    ],
  },
  {
    causeCode: 'CTL-TUN-002',
    causeLabel: 'Inspection frequency too low',
    causeType: 'TUN',
    correctiveActions: [
      'increase inspection frequency',
      'revise sampling plan',
      'update control plan',
    ],
    verificationMethods: [
      'defect rate monitoring',
      'process audit',
    ],
    evidence: [
      'control plan revision',
      'sampling plan update',
    ],
  },
  {
    causeCode: 'CTL-TUN-003',
    causeLabel: 'Sampling plan insufficient',
    causeType: 'TUN',
    correctiveActions: [
      'revise sampling plan',
      'increase inspection frequency',
    ],
    verificationMethods: [
      'defect rate monitoring',
    ],
    evidence: [
      'sampling plan revision',
    ],
  },
  {
    causeCode: 'CTL-TUN-004',
    causeLabel: 'Reaction plan missing',
    causeType: 'TUN',
    correctiveActions: [
      'define reaction plan for out-of-control conditions',
      'update control plan with reaction requirements',
      'train operators on reaction procedures',
    ],
    verificationMethods: [
      'process audit',
      'reaction plan drill',
    ],
    evidence: [
      'control plan with reaction plan',
      'training records',
    ],
  },
  {
    causeCode: 'CTL-TUN-005',
    causeLabel: 'Special characteristic not identified',
    causeType: 'TUN',
    correctiveActions: [
      'review and identify special characteristics',
      'update control plan with special characteristic designation',
      'link to PFMEA',
    ],
    verificationMethods: [
      'PFMEA review',
      'control plan audit',
    ],
    evidence: [
      'updated control plan',
      'PFMEA revision',
    ],
  },
  {
    causeCode: 'CTL-SUA-013',
    causeLabel: 'Control plan governance missing',
    causeType: 'SUA',
    correctiveActions: [
      'define control plan ownership',
      'integrate control plan review into APQP',
    ],
    verificationMethods: [
      'internal audit',
    ],
    evidence: [
      'updated APQP procedure',
    ],
  },
  {
    causeCode: 'CTL-SUA-014',
    causeLabel: 'FMEA-to-control-plan linkage missing',
    causeType: 'SUA',
    correctiveActions: [
      'establish PFMEA-to-control-plan linkage process',
      'update control plan with PFMEA references',
      'implement linkage verification step',
    ],
    verificationMethods: [
      'PFMEA/control plan cross-reference audit',
      'process audit',
    ],
    evidence: [
      'linked PFMEA and control plan',
      'linkage procedure',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PFMEA / RISK ANALYSIS (FME)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'FME-SUA-001',
    causeLabel: 'Failure mode missing in PFMEA',
    causeType: 'SUA',
    correctiveActions: [
      'update PFMEA',
      'include failure mode',
    ],
    verificationMethods: [
      'FMEA review',
    ],
    evidence: [
      'PFMEA revision',
    ],
  },
  {
    causeCode: 'FME-SUA-002',
    causeLabel: 'Cause chain incomplete in PFMEA',
    causeType: 'SUA',
    correctiveActions: [
      'complete cause chain analysis in PFMEA',
      'add missing cause factors',
      'verify cause-effect relationships',
    ],
    verificationMethods: [
      'PFMEA review',
      'cross-functional review',
    ],
    evidence: [
      'PFMEA revision',
      'review meeting minutes',
    ],
  },
  {
    causeCode: 'FME-SUA-003',
    causeLabel: 'Detection control not defined in PFMEA',
    causeType: 'SUA',
    correctiveActions: [
      'define detection controls in PFMEA',
      'link detection controls to control plan',
      'verify detection effectiveness',
    ],
    verificationMethods: [
      'PFMEA review',
      'control plan cross-reference',
    ],
    evidence: [
      'PFMEA revision with detection controls',
      'control plan linkage',
    ],
  },
  {
    causeCode: 'FME-SUA-008',
    causeLabel: 'PFMEA not updated after complaint',
    causeType: 'SUA',
    correctiveActions: [
      'revise PFMEA',
      'update occurrence and detection ratings',
      'add lessons learned',
    ],
    verificationMethods: [
      'PFMEA review',
      'complaint closure audit',
    ],
    evidence: [
      'PFMEA revision record',
      '8D to PFMEA linkage',
    ],
  },
  {
    causeCode: 'FME-SUN-011',
    causeLabel: 'FMEA review cycle not implemented',
    causeType: 'SUN',
    correctiveActions: [
      'establish PFMEA review cycle',
      'define review triggers',
      'implement review tracking',
    ],
    verificationMethods: [
      'PFMEA review audit',
      'management review',
    ],
    evidence: [
      'PFMEA review schedule',
      'review records',
    ],
  },
  {
    causeCode: 'FME-SUN-012',
    causeLabel: 'Lessons learned not transferred to PFMEA',
    causeType: 'SUN',
    correctiveActions: [
      'implement complaint feedback loop to PFMEA',
      'update FMEA review process',
    ],
    verificationMethods: [
      'management review',
    ],
    evidence: [
      'PFMEA update records',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // METHOD / WORK STANDARD (MET)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'MET-TUA-001',
    causeLabel: 'Work instruction missing',
    causeType: 'TUA',
    correctiveActions: [
      'create work instruction',
      'define process steps',
      'train operators',
    ],
    verificationMethods: [
      'layered process audit',
      'training verification',
    ],
    evidence: [
      'work instruction document',
      'training records',
    ],
  },
  {
    causeCode: 'MET-TUA-002',
    causeLabel: 'Work instruction outdated',
    causeType: 'TUA',
    correctiveActions: [
      'revise work instruction',
      'implement document review cycle',
      'retrain operators',
    ],
    verificationMethods: [
      'document review audit',
      'layered process audit',
    ],
    evidence: [
      'updated work instruction',
      'training records',
    ],
  },
  {
    causeCode: 'MET-TUN-011',
    causeLabel: 'Compliance to work standard not verified',
    causeType: 'TUN',
    correctiveActions: [
      'implement work standard compliance verification',
      'add compliance check to audit scope',
      'define compliance criteria',
    ],
    verificationMethods: [
      'layered process audit',
      'compliance check results',
    ],
    evidence: [
      'audit procedure update',
      'compliance verification records',
    ],
  },
  {
    causeCode: 'MET-SUA-013',
    causeLabel: 'Document control process ineffective',
    causeType: 'SUA',
    correctiveActions: [
      'revise document control process',
      'implement document management system',
      'define document review and approval workflow',
    ],
    verificationMethods: [
      'document control audit',
      'internal audit',
    ],
    evidence: [
      'document control procedure revision',
      'document management system logs',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAINING / COMPETENCE (TRN)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'TRN-SUA-001',
    causeLabel: 'Competence requirement not defined',
    causeType: 'SUA',
    correctiveActions: [
      'define competence requirements per role',
      'create competence matrix',
      'link competence to process requirements',
    ],
    verificationMethods: [
      'competence matrix review',
      'internal audit',
    ],
    evidence: [
      'competence matrix',
      'role requirements document',
    ],
  },
  {
    causeCode: 'TRN-SUA-002',
    causeLabel: 'Training matrix incomplete',
    causeType: 'SUA',
    correctiveActions: [
      'complete training matrix',
      'define training requirements per role',
      'implement training tracking',
    ],
    verificationMethods: [
      'training matrix audit',
      'competence verification',
    ],
    evidence: [
      'complete training matrix',
      'training records',
    ],
  },
  {
    causeCode: 'TRN-SUA-008',
    causeLabel: 'Complaint learning not transferred into training',
    causeType: 'SUA',
    correctiveActions: [
      'implement complaint-to-training feedback process',
      'update training content based on complaints',
      'conduct lessons learned training',
    ],
    verificationMethods: [
      'training content review',
      'complaint closure audit',
    ],
    evidence: [
      'training material updates',
      'training records',
    ],
  },
  {
    causeCode: 'TRN-TUN-012',
    causeLabel: 'Inspection judgment varies due to missing calibration of inspectors',
    causeType: 'TUN',
    correctiveActions: [
      'implement inspector calibration program',
      'define attribute agreement criteria',
      'conduct periodic calibration exercises',
    ],
    verificationMethods: [
      'attribute agreement analysis',
      'inspector certification audit',
    ],
    evidence: [
      'inspector calibration records',
      'attribute agreement results',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLAINT HANDLING / 8D / FEEDBACK LOOP (CMP)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'CMP-SUA-001',
    causeLabel: 'Complaint process not consistently implemented',
    causeType: 'SUA',
    correctiveActions: [
      'standardize complaint handling process',
      'define response timeline',
    ],
    verificationMethods: [
      'process audit',
    ],
    evidence: [
      'complaint process procedure',
    ],
  },
  {
    causeCode: 'CMP-SUA-007',
    causeLabel: 'Complaint-to-FMEA feedback missing',
    causeType: 'SUA',
    correctiveActions: [
      'implement complaint-to-PFMEA feedback process',
      'define feedback triggers',
      'include PFMEA update in 8D closure criteria',
    ],
    verificationMethods: [
      'complaint closure audit',
      'PFMEA review',
    ],
    evidence: [
      'feedback process procedure',
      'PFMEA update records',
    ],
  },
  {
    causeCode: 'CMP-SUN-009',
    causeLabel: 'Repeat complaint analysis not performed',
    causeType: 'SUN',
    correctiveActions: [
      'implement repeat complaint analysis process',
      'define recurrence criteria',
      'establish escalation for repeat complaints',
    ],
    verificationMethods: [
      'complaint trend analysis',
      'management review',
    ],
    evidence: [
      'repeat complaint analysis reports',
      'escalation records',
    ],
  },
  {
    causeCode: 'CMP-SUN-010',
    causeLabel: 'Complaint closed without effectiveness verification',
    causeType: 'SUN',
    correctiveActions: [
      'implement effectiveness verification step',
      'define closure criteria',
    ],
    verificationMethods: [
      'complaint audit',
    ],
    evidence: [
      '8D closure checklist',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAINTENANCE / TPM (MNT)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'MNT-TUA-001',
    causeLabel: 'Preventive maintenance interval inadequate',
    causeType: 'TUA',
    correctiveActions: [
      'revise maintenance interval',
      'align interval to equipment condition data',
      'update maintenance schedule',
    ],
    verificationMethods: [
      'defect rate monitoring',
      'equipment availability KPI',
    ],
    evidence: [
      'maintenance schedule revision',
      'interval analysis report',
    ],
  },
  {
    causeCode: 'MNT-TUA-009',
    causeLabel: 'Preventive maintenance overdue',
    causeType: 'TUA',
    correctiveActions: [
      'perform overdue maintenance',
      'implement maintenance schedule adherence monitoring',
      'define escalation for overdue maintenance',
    ],
    verificationMethods: [
      'maintenance audit',
      'schedule adherence KPI',
    ],
    evidence: [
      'maintenance completion records',
      'adherence reports',
    ],
  },
  {
    causeCode: 'MNT-SUA-011',
    causeLabel: 'Criticality-based maintenance planning missing',
    causeType: 'SUA',
    correctiveActions: [
      'implement equipment criticality classification',
      'align maintenance planning to criticality',
      'prioritize maintenance resources',
    ],
    verificationMethods: [
      'maintenance planning audit',
      'criticality assessment review',
    ],
    evidence: [
      'equipment criticality matrix',
      'criticality-based maintenance plan',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MANAGEMENT SYSTEM / GOVERNANCE / ROLES (MGS)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'MGS-SUA-001',
    causeLabel: 'Process ownership unclear',
    causeType: 'SUA',
    correctiveActions: [
      'define process owner roles',
      'update process governance',
    ],
    verificationMethods: [
      'management review',
    ],
    evidence: [
      'process ownership matrix',
    ],
  },
  {
    causeCode: 'MGS-SUA-002',
    causeLabel: 'Role responsibility not defined',
    causeType: 'SUA',
    correctiveActions: [
      'define role responsibilities',
      'create RACI matrix',
      'communicate responsibilities',
    ],
    verificationMethods: [
      'management review',
      'internal audit',
    ],
    evidence: [
      'RACI matrix',
      'role descriptions',
    ],
  },
  {
    causeCode: 'MGS-SUA-003',
    causeLabel: 'Escalation threshold not defined',
    causeType: 'SUA',
    correctiveActions: [
      'define escalation thresholds',
      'implement escalation matrix',
      'train on escalation requirements',
    ],
    verificationMethods: [
      'escalation process audit',
      'management review',
    ],
    evidence: [
      'escalation matrix',
      'escalation procedure',
    ],
  },
  {
    causeCode: 'MGS-SUN-011',
    causeLabel: 'Recurring deviations not escalated to management',
    causeType: 'SUN',
    correctiveActions: [
      'implement deviation escalation process',
      'define recurrence criteria',
      'establish management escalation triggers',
    ],
    verificationMethods: [
      'deviation trend review',
      'management review',
    ],
    evidence: [
      'escalation procedure',
      'deviation analysis reports',
    ],
  },
  {
    causeCode: 'MGS-SUN-014',
    causeLabel: 'Cross-site learning mechanism missing',
    causeType: 'SUN',
    correctiveActions: [
      'implement lessons learned database',
      'establish cross-site quality review',
    ],
    verificationMethods: [
      'KPI review',
    ],
    evidence: [
      'lessons learned register',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLIER MANAGEMENT (SUP)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'SUP-TUA-001',
    causeLabel: 'Supplier process capability insufficient',
    causeType: 'TUA',
    correctiveActions: [
      'request supplier capability improvement',
      'increase incoming inspection',
      'issue supplier corrective action request',
    ],
    verificationMethods: [
      'supplier capability review',
      'incoming inspection data',
    ],
    evidence: [
      'supplier capability reports',
      'SCAR records',
    ],
  },
  {
    causeCode: 'SUP-SUA-010',
    causeLabel: 'Supplier development process ineffective',
    causeType: 'SUA',
    correctiveActions: [
      'revise supplier development process',
      'define supplier improvement targets',
      'implement supplier performance reviews',
    ],
    verificationMethods: [
      'supplier audit',
      'supplier performance KPI review',
    ],
    evidence: [
      'supplier development procedure',
      'supplier performance reports',
    ],
  },
  {
    causeCode: 'SUP-SUN-013',
    causeLabel: 'Supplier complaint recurrence not tracked',
    causeType: 'SUN',
    correctiveActions: [
      'implement supplier complaint trending',
      'define recurrence escalation criteria',
      'link supplier quality to sourcing decisions',
    ],
    verificationMethods: [
      'supplier quality review',
      'management review',
    ],
    evidence: [
      'supplier complaint trend reports',
      'supplier scorecard',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACEABILITY / IDENTIFICATION / SEGREGATION (TRC)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    causeCode: 'TRC-TUA-001',
    causeLabel: 'Part identification unclear',
    causeType: 'TUA',
    correctiveActions: [
      'improve part identification method',
      'implement clear labeling requirements',
      'introduce error-proof identification',
    ],
    verificationMethods: [
      'process audit',
      'traceability audit',
    ],
    evidence: [
      'identification procedure update',
      'labeling standards',
    ],
  },
  {
    causeCode: 'TRC-TUA-004',
    causeLabel: 'Nonconforming material not physically segregated',
    causeType: 'TUA',
    correctiveActions: [
      'implement physical segregation area',
      'define segregation rules',
      'introduce visual identification',
    ],
    verificationMethods: [
      'layered process audit',
      'nonconforming material audit',
    ],
    evidence: [
      'segregation procedure',
      'designated area documentation',
    ],
  },
  {
    causeCode: 'TRC-SUA-012',
    causeLabel: 'Segregation rules not standardized',
    causeType: 'SUA',
    correctiveActions: [
      'standardize segregation rules',
      'define segregation procedure',
      'train on segregation requirements',
    ],
    verificationMethods: [
      'process audit',
      'training verification',
    ],
    evidence: [
      'segregation procedure',
      'training records',
    ],
  },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get corrective action pattern by cause code
 */
export function getActionsByCauseCode(causeCode: string): CorrectiveActionPattern | undefined {
  return CAUSE_TO_ACTION_LIBRARY.find((pattern) => pattern.causeCode === causeCode)
}

/**
 * Get all corrective action patterns by cause type
 */
export function getActionsByCauseType(causeType: CauseType): CorrectiveActionPattern[] {
  return CAUSE_TO_ACTION_LIBRARY.filter((pattern) => pattern.causeType === causeType)
}

/**
 * Search corrective actions by keyword
 */
export function searchCorrectiveActions(keyword: string): CorrectiveActionPattern[] {
  const lowerKeyword = keyword.toLowerCase()
  return CAUSE_TO_ACTION_LIBRARY.filter(
    (pattern) =>
      pattern.causeLabel.toLowerCase().includes(lowerKeyword) ||
      pattern.correctiveActions.some((action) => action.toLowerCase().includes(lowerKeyword))
  )
}

/**
 * Get verification methods for a cause code
 */
export function getVerificationMethods(causeCode: string): string[] {
  const pattern = getActionsByCauseCode(causeCode)
  return pattern?.verificationMethods ?? []
}

/**
 * Get evidence requirements for a cause code
 */
export function getEvidenceRequirements(causeCode: string): string[] {
  const pattern = getActionsByCauseCode(causeCode)
  return pattern?.evidence ?? []
}

/**
 * Format cause-to-action data for AI prompt context
 */
export function formatCauseToActionForAI(patterns: CorrectiveActionPattern[]): string {
  return patterns
    .map((p) => {
      const actions = p.correctiveActions.map((a) => `• ${a}`).join('\n')
      const verification = p.verificationMethods.map((v) => `• ${v}`).join('\n')
      return `[${p.causeCode}] ${p.causeLabel}
Actions:
${actions}
Verification:
${verification}`
    })
    .join('\n\n')
}

/**
 * Build AI context from ontology matching keywords
 */
export function buildActionContextForAI(keywords: string[]): string {
  const matchedPatterns: CorrectiveActionPattern[] = []
  
  for (const keyword of keywords) {
    const matches = searchCorrectiveActions(keyword)
    for (const match of matches) {
      if (!matchedPatterns.some((p) => p.causeCode === match.causeCode)) {
        matchedPatterns.push(match)
      }
    }
  }

  return formatCauseToActionForAI(matchedPatterns.slice(0, 10))
}
