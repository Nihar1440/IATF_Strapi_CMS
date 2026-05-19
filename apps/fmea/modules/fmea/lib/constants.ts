/**
 * PFMEA Module Constants
 * 
 * Header mappings, synonyms, and field definitions for Process FMEA (PFMEA)
 * 
 * Process FMEA (PFMEA) per AIAG/VDA focuses on:
 * - Manufacturing and production processes
 * - Process failure modes and their causes
 * - Prevention controls to avoid occurrence
 * - Detection controls to catch failures before shipment
 * - S×O×D risk assessment with Action Priority (AP)
 * 
 * Key PFMEA fields in this module:
 * - process_step: Production step or manufacturing station
 * - function: Process function at that step
 * - failure_mode: What can go wrong in the process
 * - failure_cause: Why it can go wrong
 * - failure_effect: What happens if it goes wrong
 * - severity (S): 1–10, impact on personnel/production/customer
 * - occurrence (O): 1–10, likelihood of failure cause
 * - detection (D): 1–10, ability to detect before shipment
 * - ap_current: Current Action Priority from S×O×D lookup
 * - prevention_control: Control to prevent occurrence
 * - detection_control: Control to detect failure
 * - action_recommended: Recommended improvement action
 * 
 * Source: AIAG/VDA Process FMEA Handbook
 */

/* ── Mandatory Fields ───────────────────────────────────────────── */

export const MANDATORY_FIELDS = [
  'failure_mode',
  'failure_cause',
  'severity',
  'occurrence',
  'detection',
  'ap_current'
] as const

export const REQUIRED_HEADER_FIELDS = [
  'process_step',
  'failure_mode',
  'failure_effect',
  'failure_cause',
  'severity',
  'occurrence',
  'detection',
  'prevention_control',
  'detection_control',
  'ap_current',
  'action_recommended',
  'responsible',
  'target_date'
] as const

/* ── Exact Header Match (English) ───────────────────────────────– */

export const EXACT_HEADER_MATCHES: Record<string, string> = {
  // English
  'failure_mode': 'failure_mode',
  'failure_effect': 'failure_effect',
  'effect_of_failure': 'failure_effect',
  'effects_of_failure': 'failure_effect',
  'potential_effect_of_failure': 'failure_effect',
  'potential_effects_of_failure': 'failure_effect',
  'severity': 'severity',
  'occurrence': 'occurrence',
  'detection': 'detection',
  'ap_current': 'ap_current',
  'action_priority': 'ap_current',
  'action_recommended': 'action_recommended',
  'failure_cause': 'failure_cause',
  'cause_of_failure': 'failure_cause',
  'causes_of_failure': 'failure_cause',
  'potential_cause_of_failure': 'failure_cause',
  'potential_causes_of_failure': 'failure_cause',
  'prevention_control': 'prevention_control',
  'detection_control': 'detection_control',
  'current_design_controls_prevention': 'prevention_control',
  'current_design_controls_detection': 'detection_control',
  'responsible': 'responsible',
  'target_date': 'target_date',
  'process_step': 'process_step',
  'function': 'function',
  'classification': 'classification',
  'special_characteristic': 'special_characteristic'
}

/* ── Multilingual Synonyms ──────────────────────────────────────– */

export const SYNONYM_MAP: Record<string, string[]> = {
  // Failure Mode
  'failure_mode': [
    'FM',
    'Fehlerart',
    'Mode de défaillance',
    'Fehler',
    'Failure mode',
    'failure mode',
    'FAILURE MODE',
    'mode_of_failure',
    'modeoffailure'
  ],
  // Severity
  'severity': [
    'S',
    'SEV',
    'Schweregrad',
    'Gravité',
    'Severity',
    'severity',
    'SEVERITY'
  ],
  // Occurrence
  'occurrence': [
    'O',
    'OCC',
    'Häufigkeit',
    'Occurrence',
    'occurrence',
    'OCCURRENCE'
  ],
  // Detection
  'detection': [
    'D',
    'DET',
    'Erkennung',
    'Detection',
    'detection',
    'DETECTION'
  ],
  // Action Priority
  'ap_current': [
    'AP',
    'Action Priority',
    'action priority',
    'AP current',
    'AP_current',
    'Action_Priority',
    'Massnahmenprioritaet',
    'Priorité d\'action'
  ],
  // Failure Effect
  'failure_effect': [
    'FE',
    'Effect',
    'Auswirkung',
    'Effets',
    'Failure effect',
    'failure effect',
    'Potential Effects of Failure',
    'Effects of Failure',
    'Effect of Failure',
  ],
  // Failure Cause
  'failure_cause': [
    'FC',
    'Cause',
    'Fehlerursache',
    'Cause de défaillance',
    'failure cause',
    'Potential Causes of Failure',
    'Potential Cause of Failure',
    'Causes of Failure',
    'Cause of Failure',
  ],
  // Action Recommended
  'action_recommended': [
    'Recommended action',
    'Action',
    'Massnahme',
    'Action recommandée',
    'recommended action',
    'Action Recommendation'
  ],
  // Responsible
  'responsible': [
    'Responsible party',
    'Owner',
    'Responsible',
    'responsible',
    'Verantwortlich'
  ],
  // Target Date
  'target_date': [
    'Target date',
    'target date',
    'Due date',
    'Fälligkeitsdatum',
    'Date cible',
    'target_date',
    'date due',
    'due date',
    'target completion date',
    'Due date',
    'Due Date',
    'DueDate',
    'TargetDate'
  ],
  // Prevention Control
  'prevention_control': [
    'Prevention',
    'Preventive control',
    'Präventive Kontrolle',
    'prevention_control'
  ],
  // Detection Control
  'detection_control': [
    'Detection',
    'Detective control',
    'Detektive Kontrolle',
    'detection_control'
  ],
  // Process Step
  'process_step': [
    'Process step',
    'Process',
    'Process number',
    'Prozessschritt',
    'Étape du processus',
    'process_step'
  ],
  // Function
  'function': [
    'Function',
    'Funktion',
    'Fonction',
    'function'
  ],
  // Classification
  'classification': [
    'Classification',
    'Klassifizierung',
    'Classification'
  ],
  // Special Characteristic
  'special_characteristic': [
    'Special characteristic',
    'Special char',
    'Spezielle Eigenschaft',
    'Caractéristique spéciale',
    'special_characteristic'
  ]
}

/* ── Fuzzy Matcher Threshold ────────────────────────────────────– */

export const FUZZY_MATCH_THRESHOLD = 0.6 // 60% similarity = Medium confidence

/* ── Common Field Prefixes ─────────────────────────────────────– */

export const KNOWN_PREFIXES: Record<string, string[]> = {
  'failure_mode': ['fm', 'failure', 'mode'],
  'severity': ['sev', 'severity'],
  'occurrence': ['occ', 'occur'],
  'detection': ['det', 'detect'],
  'ap_current': ['ap', 'action', 'priority']
}
