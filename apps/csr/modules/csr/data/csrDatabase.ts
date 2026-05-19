/* ------------------------------------------------------------------ */
/*  CSR Database – IATF 16949 Base Requirements + OEM CSRs            */
/*                                                                    */
/*  This is the SEED data for launch.  In production the records will */
/*  be loaded from Redis / admin JSON import.  The static array lets  */
/*  the tool work without an external DB during development.          */
/*                                                                    */
/*  Coverage: IATF 16949 chapters 4–10 with OEM-specific additions    */
/*  for the 10 priority OEMs.                                         */
/* ------------------------------------------------------------------ */

import type { CsrRequirement, OemId, RiskLevel, ChangeStatus, CsrSeverity } from '../types'

interface CsrOverrides {
  severity?: CsrSeverity | null
  sourceDoc?: string
  conflictFlag?: boolean
  active?: boolean
  lastUpdated?: string
  overIatfFlag?: boolean
}

// Helper to create entries concisely
function csr(
  id: string,
  iatfChapter: string,
  title: string,
  oem: OemId | null,
  text: string,
  risk: RiskLevel = 'medium',
  changeStatus: ChangeStatus = 'unchanged',
  version = 'IATF 16949:2016',
  overrides: CsrOverrides = {},
): CsrRequirement {
  return {
    id,
    iatfChapter,
    title,
    oem,
    text,
    version,
    changeStatus,
    risk,
    severity: overrides.severity ?? (oem ? 'supplementary' : null),
    sourceDoc: overrides.sourceDoc ?? version,
    conflictFlag: overrides.conflictFlag ?? false,
    active: overrides.active ?? true,
    lastUpdated: overrides.lastUpdated ?? '2025-01-01',
    overIatfFlag: overrides.overIatfFlag ?? (oem !== null),
  }
}

/* ================================================================== */
/*  IATF 16949 BASE REQUIREMENTS (oem = null)                         */
/* ================================================================== */

const BASE: CsrRequirement[] = [
  // Chapter 4 – Context of the Organization
  csr('IATF-4.3.1', '4.3.1', 'Determining the scope — supplemental', null,
    'The scope of the QMS shall include all on-site and remote supporting functions. Outsourced processes must be included.', 'low'),
  csr('IATF-4.3.2', '4.3.2', 'Customer-specific requirements', null,
    'Customer-specific requirements shall be evaluated and included in the scope of the QMS.', 'high'),
  csr('IATF-4.4.1.1', '4.4.1.1', 'Product and process conformance', null,
    'The organization shall ensure conformance of all products and processes, including service parts and those that are outsourced.', 'high'),
  csr('IATF-4.4.1.2', '4.4.1.2', 'Product safety', null,
    'Documented processes for the management of product-safety-related products and manufacturing processes.', 'critical'),

  // Chapter 5 – Leadership
  csr('IATF-5.1.1.1', '5.1.1.1', 'Corporate responsibility', null,
    'Top management shall define and implement corporate responsibility policies, including anti-bribery, code of conduct, and ethics escalation.', 'medium'),
  csr('IATF-5.1.1.2', '5.1.1.2', 'Process effectiveness and efficiency', null,
    'Top management shall review product realization processes and support processes for effectiveness and efficiency.', 'medium'),
  csr('IATF-5.1.1.3', '5.1.1.3', 'Process owners', null,
    'Top management shall identify process owners who are competent to manage their assigned processes.', 'medium'),
  csr('IATF-5.3.1', '5.3.1', 'Organizational roles — supplemental', null,
    'Top management shall assign personnel with responsibility and authority for ensuring customer requirements are met, including selection of special characteristics, quality objectives, training, corrective/preventive actions, product design, and capacity analysis.', 'medium'),
  csr('IATF-5.3.2', '5.3.2', 'Responsibility and authority for product requirements and corrective actions', null,
    'Personnel responsible for product conformity have authority to stop shipment and production to correct quality problems.', 'high'),

  // Chapter 6 – Planning
  csr('IATF-6.1.2.1', '6.1.2.1', 'Risk analysis', null,
    'The organization shall include at a minimum lessons learned from product recalls, product audits, field returns and repairs, complaints, scrap, and rework.', 'high'),
  csr('IATF-6.1.2.2', '6.1.2.2', 'Preventive action', null,
    'The organization shall determine and implement actions to eliminate the causes of potential nonconformities in order to prevent their occurrence. Preventive actions shall be appropriate to the severity of the potential issues.', 'medium'),
  csr('IATF-6.1.2.3', '6.1.2.3', 'Contingency plans', null,
    'Identify and evaluate internal and external risks to all manufacturing processes, maintain contingency plans, include notification to customer about extent and duration of any condition affecting customer operations, and periodically test contingency plans.', 'high'),
  csr('IATF-6.2.2.1', '6.2.2.1', 'Quality objectives — supplemental', null,
    'Top management shall ensure quality objectives to meet customer requirements are defined, established, and maintained for relevant functions, processes, and levels.', 'low'),

  // Chapter 7 – Support
  csr('IATF-7.1.3.1', '7.1.3.1', 'Plant, facility, and equipment planning', null,
    'The organization shall use a multidisciplinary approach including risk identification and risk mitigation methods for developing and improving plant, facility, and equipment plans.', 'medium'),
  csr('IATF-7.1.5.1.1', '7.1.5.1.1', 'Measurement system analysis', null,
    'Statistical studies shall be conducted to analyze the variation present in the results of each type of inspection, measurement, and test system identified in the control plan.', 'high'),
  csr('IATF-7.1.5.2.1', '7.1.5.2.1', 'Calibration/verification records', null,
    'The organization shall have a documented process for managing calibration/verification records, including tracing to national/international standards.', 'medium'),
  csr('IATF-7.1.5.3.1', '7.1.5.3.1', 'Internal laboratory', null,
    'Internal laboratory facility shall have a defined scope including capability to perform required inspection, test, or calibration services.', 'medium'),
  csr('IATF-7.1.5.3.2', '7.1.5.3.2', 'External laboratory', null,
    'External laboratory facilities shall have a defined scope, be accredited to ISO/IEC 17025 or national equivalent, and be accepted by the customer.', 'medium'),
  csr('IATF-7.2.1', '7.2.1', 'Competence — supplemental', null,
    'The organization shall establish and maintain documented processes for identifying training needs including awareness and achieving competence for all personnel performing work affecting product quality.', 'medium'),
  csr('IATF-7.2.3', '7.2.3', 'Internal auditor competency', null,
    'The organization shall have documented processes to verify internal auditors are competent per customer-specific requirements.', 'medium'),
  csr('IATF-7.2.4', '7.2.4', 'Second-party auditor competency', null,
    'The organization shall demonstrate competency of auditors who perform second-party audits.', 'low'),
  csr('IATF-7.5.3.2.2', '7.5.3.2.2', 'Engineering specifications', null,
    'The organization shall have a documented process for the review, distribution, and implementation of all customer engineering standards/specifications and related revisions.', 'high'),

  // Chapter 8 – Operation
  csr('IATF-8.1.1', '8.1.1', 'Operational planning and control — supplemental', null,
    'When planning for product realization, topics shall include customer product requirements and technical specifications, logistics requirements, manufacturing feasibility, project planning, and acceptance criteria.', 'medium'),
  csr('IATF-8.1.2', '8.1.2', 'Confidentiality', null,
    'The organization shall ensure the confidentiality of customer-contracted products, projects under development, and related product information.', 'medium'),
  csr('IATF-8.2.1.1', '8.2.1.1', 'Customer communication — supplemental', null,
    'Communication shall be in the language agreed upon with the customer in written or verbal form, including the ability to communicate necessary information in the specified computer language and format.', 'low'),
  csr('IATF-8.2.3.1.1', '8.2.3.1.1', 'Review of requirements — supplemental', null,
    'The organization shall retain evidence of a waiver authorized by the customer for review of requirements stated in 8.2.3.1.', 'low'),
  csr('IATF-8.2.3.1.2', '8.2.3.1.2', 'Customer-designated special characteristics', null,
    'The organization shall conform with customer requirements for designation, approval documentation, and control of special characteristics.', 'critical'),
  csr('IATF-8.2.3.1.3', '8.2.3.1.3', 'Organization manufacturing feasibility', null,
    'The organization shall utilize a multidisciplinary approach to conduct an analysis to determine if it is feasible that the manufacturing processes are capable of consistently producing product conforming to all customer requirements.', 'medium'),
  csr('IATF-8.3.2.1', '8.3.2.1', 'Design and development planning — supplemental', null,
    'The organization shall ensure that design and development planning includes all affected stakeholders within the organization and, as appropriate, its supply chain, including the use of multidisciplinary approach.', 'medium'),
  csr('IATF-8.3.3.1', '8.3.3.1', 'Product design input', null,
    'Identify, document, and review product design input requirements as a result of contract review including special characteristics, boundary and interface requirements, identification, traceability, and packaging.', 'medium'),
  csr('IATF-8.3.3.2', '8.3.3.2', 'Manufacturing process design input', null,
    'Identify, document, and review manufacturing process design input requirements, including product design output data including special characteristics, targets for productivity, process capability, timing, and costs.', 'medium'),
  csr('IATF-8.3.3.3', '8.3.3.3', 'Special characteristics', null,
    'The organization shall use a multidisciplinary approach to establish, document, and implement processes for identification of special characteristics, including those determined by the customer and risk analysis.', 'critical'),
  csr('IATF-8.3.4.4', '8.3.4.4', 'Product approval process', null,
    'The organization shall establish, implement, and maintain a product and manufacturing process approval procedure conforming to a product approval process recognized by the customer (e.g. PPAP/PPA).', 'high'),
  csr('IATF-8.4.1.2', '8.4.1.2', 'Supplier selection process', null,
    'The organization shall have a documented supplier selection process. The selection process shall include quality risk assessment, quality performance, QMS audits, and product delivery assessment.', 'medium'),
  csr('IATF-8.4.2.1', '8.4.2.1', 'Type and extent of control — supplemental', null,
    'The organization shall have a documented process for identifying outsourced processes and selecting the type and extent of controls used to verify the conformity of externally provided outputs.', 'medium'),
  csr('IATF-8.4.2.3', '8.4.2.3', 'Statutory and regulatory requirements', null,
    'The organization shall document its process to assure that purchased products, processes, and services conform to current applicable statutory and regulatory requirements in the country of receipt, country of shipment, and customer-identified destination.', 'high'),
  csr('IATF-8.4.2.4', '8.4.2.4', 'Supplier monitoring', null,
    'The organization shall have a documented process and criteria to evaluate supplier performance to ensure conformity of externally provided products, processes, and services to internal and external customer requirements.', 'medium'),
  csr('IATF-8.4.2.5', '8.4.2.5', 'Supplier development', null,
    'The organization shall determine the priority, type, extent, and timing of required supplier development actions for its active suppliers, using pertinent information such as performance risk, audit results, and customer status.', 'medium'),
  csr('IATF-8.5.1.1', '8.5.1.1', 'Control plan', null,
    'The organization shall develop control plans at the system, subsystem, component, and/or material level for the relevant manufacturing site and all product supplied, including those for processes producing bulk materials as well as parts.', 'critical'),
  csr('IATF-8.5.1.2', '8.5.1.2', 'Standardized work — operator instructions and visual standards', null,
    'The organization shall ensure standardized work documents are communicated to and understood by the employees responsible for performing the work.', 'medium'),
  csr('IATF-8.5.1.3', '8.5.1.3', 'Verification of job setups', null,
    'The organization shall verify job set-ups when performed, to include start-up of job, material changeover, or job change, maintain documentation for set-up personnel, and use statistical verification methods where applicable.', 'medium'),
  csr('IATF-8.5.1.5', '8.5.1.5', 'Total productive maintenance', null,
    'The organization shall develop, implement, and maintain a documented total productive maintenance system. At a minimum, the system shall include: identification of process equipment necessary to produce conforming product at the required volume, availability of replacement parts.', 'medium'),
  csr('IATF-8.5.1.6', '8.5.1.6', 'Management of production tooling and manufacturing, test, inspection tooling and equipment', null,
    'The organization shall provide resources for tool and gauge design, fabrication, and verification activities, including tool maintenance and repair facilities and personnel.', 'medium'),
  csr('IATF-8.5.2.1', '8.5.2.1', 'Identification and traceability — supplemental', null,
    'The purpose of traceability is to support identification of clear start and stop points for product received by the customer or field that may contain manufacturing and/or design nonconformities.', 'high'),
  csr('IATF-8.5.4.1', '8.5.4.1', 'Preservation — supplemental', null,
    'Preservation shall include identification, handling, contamination control, packaging, storage, transmission or transportation, and protection.', 'low'),
  csr('IATF-8.5.6.1', '8.5.6.1', 'Control of changes — supplemental', null,
    'The organization shall have a documented process to control and react to changes that impact product realization. The effects of any change, including those caused by the organization, the customer, or any supplier, shall be assessed.', 'high'),
  csr('IATF-8.5.6.1.1', '8.5.6.1.1', 'Temporary change of process controls', null,
    'The organization shall identify, document, and maintain a list of process controls, including inspection, measurement, test, and error-proofing, that includes the primary process control and the approved back-up or alternate methods.', 'high'),
  csr('IATF-8.6.1', '8.6.1', 'Release of products and services — supplemental', null,
    'The requirements specified in ISO 9001, Section 8.6 shall be extended to include the acceptance criteria as defined is included in and per the control plan requirements.', 'medium'),
  csr('IATF-8.6.2', '8.6.2', 'Layout inspection and functional testing', null,
    'A layout inspection and functional verification to applicable customer engineering material and performance standards shall be performed for each product as specified in the control plans.', 'medium'),
  csr('IATF-8.6.4', '8.6.4', 'Verification and acceptance of externally provided products and services', null,
    'The organization shall have a process to assure the quality of externally provided processes, products, and services utilizing one or more of the methods outlined.', 'medium'),
  csr('IATF-8.7.1.1', '8.7.1.1', 'Customer authorization for concession', null,
    'The organization shall obtain a customer concession or deviation permit prior to further processing whenever the product or manufacturing process is different from that which is currently approved.', 'high'),
  csr('IATF-8.7.1.4', '8.7.1.4', 'Control of reworked product', null,
    'The organization shall utilize risk analysis (such as FMEA) methodology to assess risks in the rework process prior to a decision to rework the product.', 'medium'),
  csr('IATF-8.7.1.7', '8.7.1.7', 'Disposition of nonconforming product', null,
    'The organization shall have a documented process for disposition of nonconforming product not subject to rework or repair.', 'medium'),

  // Chapter 9 – Performance Evaluation
  csr('IATF-9.1.1.1', '9.1.1.1', 'Monitoring and measurement of manufacturing processes', null,
    'The organization shall perform process studies on all new manufacturing processes to verify process capability and provide additional input for process control. Minimum Cpk of 1.33 for stable processes.', 'high'),
  csr('IATF-9.1.1.2', '9.1.1.2', 'Identification of statistical tools', null,
    'The organization shall determine appropriate use of statistical tools. Statistical tools shall be included in the advanced quality planning process and in the design risk analysis.', 'medium'),
  csr('IATF-9.1.1.3', '9.1.1.3', 'Application of statistical concepts', null,
    'Statistical concepts such as variation, control (stability), process capability, and the consequences of over-adjustment shall be understood and used by employees involved in the collection, analysis, and management of statistical data.', 'medium'),
  csr('IATF-9.1.2.1', '9.1.2.1', 'Customer satisfaction — supplemental', null,
    'Customer satisfaction with the organization shall be monitored through continual evaluation of internal and external performance indicators.', 'medium'),
  csr('IATF-9.2.2.1', '9.2.2.1', 'Internal audit programme', null,
    'The organization shall have a documented internal audit process. The process shall include the development and implementation of an internal audit program that covers the complete quality management system including QMS audits, manufacturing process audits, and product audits.', 'high'),
  csr('IATF-9.2.2.2', '9.2.2.2', 'Quality management system audit', null,
    'The organization shall audit all QMS processes over each three calendar year period, according to an annual programme, using the process approach to verify compliance with this Automotive QMS Standard.', 'medium'),
  csr('IATF-9.2.2.3', '9.2.2.3', 'Manufacturing process audit', null,
    'The organization shall audit all manufacturing processes over each three calendar year period to determine their effectiveness and efficiency. Each manufacturing process shall be audited on each shift where it occurs.', 'medium'),
  csr('IATF-9.2.2.4', '9.2.2.4', 'Product audit', null,
    'The organization shall audit products at appropriate stages of production and delivery to verify conformity to all specified requirements, at a defined frequency. Customer-specific requirements are included.', 'medium'),
  csr('IATF-9.3.1.1', '9.3.1.1', 'Management review — supplemental', null,
    'Management review shall be conducted at least annually. Frequency shall be increased based on risks to conformity related to internal/external changes impacting the QMS and performance-related issues.', 'low'),
  csr('IATF-9.3.2.1', '9.3.2.1', 'Management review inputs — supplemental', null,
    'Input to management review shall include cost of poor quality (internal and external failure costs), measures of process effectiveness and efficiency, product conformance, feasibility assessments, and customer satisfaction.', 'medium'),

  // Chapter 10 – Improvement
  csr('IATF-10.2.3', '10.2.3', 'Problem solving', null,
    'Documented process(es) for problem solving, including root cause analysis, use verified corrective actions and implementation. Where customer-prescribed, the approaches to problem solving shall be used (e.g. 8D).', 'high'),
  csr('IATF-10.2.4', '10.2.4', 'Error-proofing', null,
    'The organization shall have a documented process for error-proofing device determination. Details shall be documented in process FMEA and test frequencies in the control plan.', 'high'),
  csr('IATF-10.2.5', '10.2.5', 'Warranty management systems', null,
    'When the organization is required to provide warranty for their products, the organization shall implement a warranty management process. The organization shall include in the process a method for warranty part analysis, including NTF.', 'medium'),
  csr('IATF-10.2.6', '10.2.6', 'Customer complaints and field failure test analysis', null,
    'The organization shall perform analysis of customer complaints and field failures, including returned parts, and shall initiate problem solving and corrective action to prevent recurrence.', 'high'),
  csr('IATF-10.3.1', '10.3.1', 'Continual improvement — supplemental', null,
    'The organization shall have a documented process for continual improvement. The organization shall identify the manufacturing process that produce the highest amount of scrap and the highest cost of poor quality.', 'medium'),
]

/* ================================================================== */
/*  OEM-SPECIFIC CSR REQUIREMENTS                                     */
/*  Mapped on top of the base requirements per OEM                    */
/* ================================================================== */

const BMW_CSR: CsrRequirement[] = [
  csr('BMW-4.4.1.2', '4.4.1.2', 'Product safety — BMW special requirements', 'BMW',
    'BMW requires use of the BMW Group Product Safety Representative concept. PSB (Produktsicherheitsbeauftragter) must be named. Annual product safety audits mandatory.', 'critical', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-7.1.5.1.1', '7.1.5.1.1', 'MSA — BMW requirements', 'BMW',
    'BMW requires MSA per AIAG/VDA MSA standard. Attribute MSA using signal-detection approach. Variable MSA minimum Cg/Cgk ≥ 1.33.', 'high', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — BMW classification', 'BMW',
    'BMW uses classification: S (Safety), Z (Certification), F (Function), P (Process). Each requires specific documentation in FMEA and control plan.', 'critical', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.3.4.4', '8.3.4.4', 'PPAP — BMW product approval', 'BMW',
    'BMW requires PPA per VDA Volume 2 (Production Process and Product Approval). Initial sample inspection report (ISIR) per VDA Volume 2. BMW approval required before SOP.', 'high', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.4.2.4', '8.4.2.4', 'Supplier monitoring — BMW requirements', 'BMW',
    'BMW requires monitoring via SupplyOn platform. Scorecard evaluation (quality, logistics, innovation). Escalation levels: 0–4 per BMW escalation strategy.', 'medium', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.5.1.1', '8.5.1.1', 'Control plan — BMW specifics', 'BMW',
    'BMW requires control plans per AIAG/VDA APQP standard. Control plan must reference FMEA action priorities (AP). Reaction plan mandatory for each characteristic.', 'high', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.5.2.1', '8.5.2.1', 'Traceability — BMW requirements', 'BMW',
    'BMW requires component traceability via DMC (DataMatrix Code) per BMW standard GS-0006. Traceability of safety-relevant parts must be maintained for 15 years.', 'high', 'updated', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.5.6.1', '8.5.6.1', 'Change management — BMW requirements', 'BMW',
    'All product and process changes require BMW approval via change management process. Changes must be reported via SupplyOn (8D Q-issues, Change, Initial Sample).', 'high', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-8.7.1.1', '8.7.1.1', 'Concession — BMW requirements', 'BMW',
    'BMW concession process via SupplyOn Deviation Management. Concession request must include root cause and containment actions. Maximum duration: 3 months.', 'medium', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-9.1.1.1', '9.1.1.1', 'Process capability — BMW requirements', 'BMW',
    'BMW requires Pp/Ppk ≥ 1.67 (preliminary) and Cp/Cpk ≥ 1.33 (series). For safety characteristics: Cp/Cpk ≥ 1.67. Machine capability: Cm/Cmk ≥ 1.67.', 'high', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
  csr('BMW-10.2.3', '10.2.3', 'Problem solving — BMW 8D requirements', 'BMW',
    'BMW requires 8D method per VDA Volume 8D when ppm > target or ≥ W2 reclamation. 8D report required within 24h (D0-D3), full report within 14 calendar days.', 'high', 'unchanged', 'BMW CSR v6.0 (2025-01)'),
]

const VW_CSR: CsrRequirement[] = [
  csr('VW-4.4.1.2', '4.4.1.2', 'Product safety — VW Formel-Q requirements', 'VW',
    'VW Group requires product safety management per Formel-Q Konkret. Product safety officer (PSB) designation mandatory. Annual product safety audit using VW internal checklist.', 'critical', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-7.1.5.1.1', '7.1.5.1.1', 'MSA — VW requirements', 'VW',
    'VW requires MSA per Formel-Q Capability chapter. Type 1, 2, and 3 studies. Cg/Cgk ≥ 1.33 for variable gauges. Attribute study per VDA 5.', 'high', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — VW D/TLD classification', 'VW',
    'VW uses D-marking (documentation-relevant) and TLD (Technischer Liefertermin Durchsprache). D-parts per VW 101 06. Critical characteristics identified via risk assessment.', 'critical', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-8.3.4.4', '8.3.4.4', 'PPAP — VW PPA requirements', 'VW',
    'VW requires Production Process and Product Approval per VDA Volume 2 / Formel-Q provisions. 2-day production run for initial sample. Self-assessment via BeOn platform.', 'high', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-8.4.1.2', '8.4.1.2', 'Supplier selection — VW Formel-Q Capability', 'VW',
    'VW requires supplier potential analysis per Formel-Q Capability. QPN (Quality Performance Norm) process. A/B/C rating system with min. B required.', 'medium', 'unchanged', 'Formel-Q Capability 5th Ed. (2024)'),
  csr('VW-8.4.2.4', '8.4.2.4', 'Supplier monitoring — VW Q-KPI', 'VW',
    'VW monitors suppliers via Quality Capability (Q-Fähigkeit). KPIs: ppm, 0-km failures, field failures, audit results. Supplier cockpit in Group Business Platform (GBP).', 'medium', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-8.5.1.1', '8.5.1.1', 'Control plan — VW requirements', 'VW',
    'Control plans per Formel-Q Konkret with link to FMEA. Must contain D/TLD characteristics marking. Reaction plan for each monitored characteristic. Production control plan mandatory before SOP.', 'high', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-8.5.6.1', '8.5.6.1', 'Change management — VW requirements', 'VW',
    'All changes require VW approval via 2TP (2-Tages-Produktion) process. Changes communicated via BeOn. Unauthorized changes lead to automatic Q-capability downgrade.', 'high', 'updated', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-9.1.1.1', '9.1.1.1', 'Process capability — VW Formel-Q', 'VW',
    'VW requires Cmk ≥ 1.67 (machine), Ppk ≥ 1.67 (short-term), Cpk ≥ 1.33 (long-term). For safety/critical: Cpk ≥ 1.67. Per Formel-Q Konkret capability chapter.', 'high', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
  csr('VW-9.2.2.1', '9.2.2.1', 'Audit programme — VW Formel-Q Audit', 'VW',
    'VW requires internal audit per Formel-Q Audit standard. VDA 6.3 process audit methodology. Supplier self-assessment and on-site audit results tracked in GBP.', 'medium', 'unchanged', 'Formel-Q Audit 4th Ed. (2024)'),
  csr('VW-10.2.3', '10.2.3', 'Problem solving — VW 8D requirements', 'VW',
    'VW requires 8D per VDA 8D standard. Reports submitted via QPN in the Group Business Platform. D3 (containment) within 48h. Full 8D within 20 working days. Use of Ishikawa/5-Why mandatory.', 'high', 'unchanged', 'Formel-Q Konkret 9th Ed. (2024)'),
]

const MERCEDES_CSR: CsrRequirement[] = [
  csr('MB-4.4.1.2', '4.4.1.2', 'Product safety — Mercedes-Benz requirements', 'MERCEDES',
    'Mercedes-Benz requires product safety organization per MBN 11011. Safety-critical parts (S-parts) require special documentation and approval. PSB (Product Safety Officer) mandatory.', 'critical', 'unchanged', 'MB CSR v5.0 (2025-02)'),
  csr('MB-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — MB classification', 'MERCEDES',
    'MB uses S (Safety), A (Legal/certification), B (Function), C (Fit/appearance) classification. S-characteristics require 100% inspection or error-proofing. Documented per MBN 11011.', 'critical', 'unchanged', 'MB CSR v5.0 (2025-02)'),
  csr('MB-8.3.4.4', '8.3.4.4', 'PPAP — MB PPA requirements', 'MERCEDES',
    'MB requires PPA per VDA Volume 2 with MB-specific supplements. Initial sample submission via SupplyOn. Self-assessment and on-site audit before SOP.', 'high', 'unchanged', 'MB CSR v5.0 (2025-02)'),
  csr('MB-8.4.2.4', '8.4.2.4', 'Supplier monitoring — MB performance management', 'MERCEDES',
    'MB monitors suppliers via Quality Performance Rating (QPR). Monthly ppm tracking and field return analysis. Escalation via New Parts Quality partnership (NQP).', 'medium', 'unchanged', 'MB CSR v5.0 (2025-02)'),
  csr('MB-8.5.1.1', '8.5.1.1', 'Control plan — MB requirements', 'MERCEDES',
    'Control plan must reference S/A/B/C characteristic classification. S-characteristics require error-proofing or 100% SPC. Reaction plan and escalation path mandatory.', 'high', 'unchanged', 'MB CSR v5.0 (2025-02)'),
  csr('MB-8.5.2.1', '8.5.2.1', 'Traceability — MB requirements', 'MERCEDES',
    'MB requires traceability per MBN 11022. S-parts: 15-year retention. DMC per MB standard. Lot traceability for process materials.', 'high', 'unchanged', 'MB CSR v5.0 (2025-02)'),
  csr('MB-10.2.3', '10.2.3', 'Problem solving — MB 8D requirements', 'MERCEDES',
    'MB requires 8D report per VDA 8D. Submission via SupplyOn Quality Issue Management. D3 (containment) within 24h. Full 8D within 15 working days. Root cause analysis with 5-Why and Ishikawa.', 'high', 'unchanged', 'MB CSR v5.0 (2025-02)'),
]

const STELLANTIS_CSR: CsrRequirement[] = [
  csr('STLA-4.4.1.2', '4.4.1.2', 'Product safety — Stellantis requirements', 'STELLANTIS',
    'Stellantis requires formal product safety management process. Safety-critical characteristics per CC/SC classification. Compliance with QR.00007 (Stellantis Supplier Quality Manual).', 'critical', 'unchanged', 'Stellantis SQM Rev. 8 (2024)'),
  csr('STLA-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — Stellantis CC/SC', 'STELLANTIS',
    'Stellantis uses CC (Critical Characteristics) and SC (Significant Characteristics). CC requires 100% error-proofing. SC requires SPC or increased sampling. Per QR.00007.', 'critical', 'unchanged', 'Stellantis SQM Rev. 8 (2024)'),
  csr('STLA-8.3.4.4', '8.3.4.4', 'PPAP — Stellantis requirements', 'STELLANTIS',
    'Stellantis PPAP per AIAG PPAP Manual with Stellantis-specific supplements. Submission via SQP (Supplier Quality Portal). Run@Rate required for capacity verification.', 'high', 'unchanged', 'Stellantis SQM Rev. 8 (2024)'),
  csr('STLA-8.4.2.4', '8.4.2.4', 'Supplier monitoring — Stellantis Q+ rating', 'STELLANTIS',
    'Stellantis monitors via Q+ supplier rating system. Quality, delivery, and cost KPIs. Controlled shipping (CS1/CS2) escalation process. New Model Quality (NMQ) reviews.', 'medium', 'unchanged', 'Stellantis SQM Rev. 8 (2024)'),
  csr('STLA-8.5.1.1', '8.5.1.1', 'Control plan — Stellantis requirements', 'STELLANTIS',
    'Control plans must be AIAG APQP compliant with Stellantis PQ sheets. Pre-launch and production control plans. Reference to PFMEA with risk-based inspection frequencies.', 'high', 'unchanged', 'Stellantis SQM Rev. 8 (2024)'),
  csr('STLA-10.2.3', '10.2.3', 'Problem solving — Stellantis 8D/CQI requirements', 'STELLANTIS',
    'Stellantis requires 8D per Stellantis format. Submission via SQP. Interim containment within 24h. Root cause analysis using FMEA-based approach. Verification of corrective actions required.', 'high', 'unchanged', 'Stellantis SQM Rev. 8 (2024)'),
]

const FORD_CSR: CsrRequirement[] = [
  csr('FORD-4.4.1.2', '4.4.1.2', 'Product safety — Ford requirements', 'FORD',
    'Ford requires Critical Characteristic (CC) management per Ford FCSD. Safety-critical items require PPAP Level 3 minimum. Ford-specified Global 8D for safety issues.', 'critical', 'unchanged', 'Ford CSR Rev. 11 (2025)'),
  csr('FORD-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — Ford CC/SC', 'FORD',
    'Ford uses CC (Critical Characteristics – safety/regulatory) and SC (Significant Characteristics – fit/function/appearance). CC requires error-proofing and 100% inspection/monitoring.', 'critical', 'unchanged', 'Ford CSR Rev. 11 (2025)'),
  csr('FORD-8.3.4.4', '8.3.4.4', 'PPAP — Ford requirements', 'FORD',
    'Ford requires PPAP per AIAG PPAP Manual 4th Edition. Default submission level: Level 3. Parts may require Ford-specific capacity verification (Run@Rate). Submission via GSCP.', 'high', 'unchanged', 'Ford CSR Rev. 11 (2025)'),
  csr('FORD-8.5.1.1', '8.5.1.1', 'Control plan — Ford requirements', 'FORD',
    'Ford requires AIAG APQP Control Plan format. Must include all CC/SC characteristics with specific monitoring methods. Dynamic control plan updates per Ford STA requirements.', 'high', 'unchanged', 'Ford CSR Rev. 11 (2025)'),
  csr('FORD-8.5.6.1', '8.5.6.1', 'Change management — Ford requirements', 'FORD',
    'Ford requires prior written approval for all product/process changes via SREA (Supplier Request for Engineering Approval). Changes without approval = automatic Controlled Shipping Level 2.', 'high', 'unchanged', 'Ford CSR Rev. 11 (2025)'),
  csr('FORD-10.2.3', '10.2.3', 'Problem solving — Ford Global 8D', 'FORD',
    'Ford requires Global 8D methodology for all quality issues. Reports submitted via GSCP within Ford timelines. G8D training certification required for QE staff.', 'high', 'unchanged', 'Ford CSR Rev. 11 (2025)'),
]

const GM_CSR: CsrRequirement[] = [
  csr('GM-4.4.1.2', '4.4.1.2', 'Product safety — GM requirements', 'GM',
    'GM requires safety critical characteristics per GM1927 standard. KCDS (Key Characteristic Designation System) for classification. Annual self-assessment of product safety system mandatory.', 'critical', 'unchanged', 'GM CSR Rev. 9 (2025)'),
  csr('GM-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — GM KCDS', 'GM',
    'GM uses KCDS: KPC (Key Product Characteristic), KCC (Key Control Characteristic), PQC (Product Quality Characteristic). KPC/KCC require SPC monitoring with Cpk ≥ 1.33.', 'critical', 'unchanged', 'GM CSR Rev. 9 (2025)'),
  csr('GM-8.3.4.4', '8.3.4.4', 'PPAP — GM requirements', 'GM',
    'GM requires PPAP per AIAG PPAP Manual. Default level: Level 3. GP-12 Early Production Containment mandatory for new launches. Submission via SupplierConnect.', 'high', 'unchanged', 'GM CSR Rev. 9 (2025)'),
  csr('GM-8.4.2.4', '8.4.2.4', 'Supplier monitoring — GM Supplier Quality', 'GM',
    'GM monitors via GSQA (Global Supplier Quality Audit). Scorecard: Disruption, Warranty, Launch Quality. PRR (Problem Resolution Report) within 24h of issue.', 'medium', 'unchanged', 'GM CSR Rev. 9 (2025)'),
  csr('GM-8.5.1.1', '8.5.1.1', 'Control plan — GM requirements', 'GM',
    'GM requires AIAG control plan format. GP-12 overlay during launch phase. KPC/KCC characteristics require enhanced monitoring. Annual control plan reviews.', 'high', 'unchanged', 'GM CSR Rev. 9 (2025)'),
  csr('GM-10.2.3', '10.2.3', 'Problem solving — GM PRR/8D requirements', 'GM',
    'GM requires PRR (Problem Resolution Report) for customer issues. 8D methodology using AIAG CQI-20. PRR submission within 24h, closure within 55 business days.', 'high', 'unchanged', 'GM CSR Rev. 9 (2025)'),
]

const RENAULT_CSR: CsrRequirement[] = [
  csr('REN-4.4.1.2', '4.4.1.2', 'Product safety — Renault requirements', 'RENAULT',
    'Renault requires Conformity of Production (COP) trials for Safety and Regulatory Characteristics.', 'critical', 'updated', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-5.1.1.1', '5.1.1.1', 'Corporate responsibility — Renault additions', 'RENAULT',
    'No child labor, no forced work, working conditions, health and safety, and environmental protection must be ensured.', 'high', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-5.1.2', '5.1.2', 'Customer focus', 'RENAULT',
    'Suppliers must use ASES, PESES, or SHC evaluation tools. Minimum C rank required, sometimes B rank depending on the project.', 'high', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-5.3.1', '5.3.1', 'Organizational roles', 'RENAULT',
    'SCQR (Supplier Customer Quality Representative) is responsible for deploying RGPQP (Renault Group Parts Quality Process).', 'medium', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-6.1.2.2', '6.1.2.2', 'Preventive actions', 'RENAULT',
    'Implement continuous action plans to ensure zero non-conforming parts delivered to the customer.', 'high', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-7.2.1', '7.2.1', 'Competence', 'RENAULT',
    'SCQR must undergo RGPQP training at least every two years to maintain competence.', 'medium', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-7.2.2', '7.2.2', 'Competence on-the-job training', 'RENAULT',
    'Must specifically qualify workers on workstations that are handling Safety or Regulatory characteristics.', 'high', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-8.3.4.4', '8.3.4.4', 'Product approval process', 'RENAULT',
    'Sub-suppliers PSW (or equivalent) shall be fully validated by the supplier before the supplier submits their own PSW to Renault.', 'high', 'updated', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-8.3.5.2', '8.3.5.2', 'Manufacturing process design output', 'RENAULT',
    'Use Reverse FMEA (R-FMEA) methodology systematically to review and update the FMEA and control plan.', 'high', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-8.4.2.4', '8.4.2.4', 'Sub-Contractor management process', 'RENAULT',
    'Tier 1 supplier shall explicitly deploy the same Renault quality requirements to all their sub-suppliers.', 'high', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-8.5.1.1', '8.5.1.1', 'Control Plan', 'RENAULT',
    'Control plans must include explicit controls designed to detect failures caused by external products and services.', 'high', 'updated', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-8.5.6.1', '8.5.6.1', 'Control of changes', 'RENAULT',
    'Any unapproved changes by the supplier will be strictly classified as a Trust Disruption.', 'critical', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-9.1.2.1', '9.1.2.1', 'Customer Satisfaction', 'RENAULT',
    'Complaint management via IATF CMS. Supplier must look for systemic issues in the QMS causing the complaint.', 'medium', 'new', 'Renault CSR Version 5.0 (April 2026)'),
  csr('REN-10.2.6', '10.2.6', 'Customer complaints and field failure test analysis', 'RENAULT',
    'Tier 1 supplier must share its local Proxi resources, facilities, and laboratories with sub-suppliers in case of a quality alert or crisis.', 'high', 'updated', 'Renault CSR Version 5.0 (April 2026)'),
]

const TOYOTA_CSR: CsrRequirement[] = [
  csr('TOY-4.4.1.2', '4.4.1.2', 'Product safety — Toyota requirements', 'TOYOTA',
    'Toyota requires compliance with TSM (Toyota Supplier Manual). Safety-related parts identified via TSA (Toyota Safety Assessment). Jidoka principle for safety defect prevention.', 'critical', 'unchanged', 'Toyota SQM v8 (2024)'),
  csr('TOY-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — Toyota A/B/C classification', 'TOYOTA',
    'Toyota uses A (Safety/regulatory), B (Important function), C (General). A-rank items: 100% inspection + error-proofing. Documented in QC process chart.', 'critical', 'unchanged', 'Toyota SQM v8 (2024)'),
  csr('TOY-8.3.4.4', '8.3.4.4', 'PPAP — Toyota ISIR requirements', 'TOYOTA',
    'Toyota requires ISIR (Initial Sample Inspection Report) per Toyota format. Trial production (TP) and mass production (MP) qualification steps. Hansei (reflection) at each gate.', 'high', 'unchanged', 'Toyota SQM v8 (2024)'),
  csr('TOY-8.5.1.1', '8.5.1.1', 'Control plan — Toyota QC process chart', 'TOYOTA',
    'Toyota requires QC Process Chart format (distinct from AIAG). Yokoten (horizontal deployment) of learnings across similar processes. Key characteristic monitoring per A/B/C rank.', 'high', 'unchanged', 'Toyota SQM v8 (2024)'),
  csr('TOY-10.2.3', '10.2.3', 'Problem solving — Toyota practical problem solving', 'TOYOTA',
    'Toyota requires Toyota Practical Problem Solving (PPS) method. A3 report format. 5-Why root cause analysis mandatory. Countermeasure verification per PDCA cycle.', 'high', 'unchanged', 'Toyota SQM v8 (2024)'),
]

const HYUNDAI_KIA_CSR: CsrRequirement[] = [
  csr('HK-4.4.1.2', '4.4.1.2', 'Product safety — Hyundai/Kia requirements', 'HYUNDAI_KIA',
    'Hyundai/Kia requires special management of safety-related parts per SQ (Supplier Quality) standard. ISIR/PPAP for all safety items. Annual product safety self-assessment.', 'critical', 'unchanged', 'HMG SQ Rev. 7 (2024)'),
  csr('HK-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — Hyundai/Kia classification', 'HYUNDAI_KIA',
    'Hyundai/Kia uses S (Safety), A (Important), B (Standard) classification. S-class: 100% inspection + error-proofing. A-class: SPC monitoring required. Documented in FMEA and control plan.', 'critical', 'unchanged', 'HMG SQ Rev. 7 (2024)'),
  csr('HK-8.3.4.4', '8.3.4.4', 'PPAP — Hyundai/Kia requirements', 'HYUNDAI_KIA',
    'Hyundai/Kia requires PPAP per AIAG standards with HMG supplements. Prototype/ISIR/Production qualification stages. Submission via VAATZ (quality portal).', 'high', 'unchanged', 'HMG SQ Rev. 7 (2024)'),
  csr('HK-10.2.3', '10.2.3', 'Problem solving — Hyundai/Kia 8D', 'HYUNDAI_KIA',
    'Hyundai/Kia requires 8D per AIAG CQI-20 standard. Submission via VAATZ within 24h (initial response), full 8D within 10 business days. 5-Why root cause analysis mandatory.', 'high', 'unchanged', 'HMG SQ Rev. 7 (2024)'),
]

const VOLVO_CSR: CsrRequirement[] = [
  csr('VOL-4.4.1.2', '4.4.1.2', 'Product safety — Volvo requirements', 'VOLVO',
    'Volvo requires product safety per VGCS (Volvo Group Certification Standard). Safety-critical parts (SCP) require Volvo-specific PPA. Product safety officer designation mandatory.', 'critical', 'unchanged', 'Volvo SQE Rev. 5 (2024)'),
  csr('VOL-8.2.3.1.2', '8.2.3.1.2', 'Special characteristics — Volvo classification', 'VOLVO',
    'Volvo uses I (Safety/regulatory critical) and II (Function critical) classification. Class I: error-proofing + 100% inspection. Class II: SPC with Cpk ≥ 1.33.', 'critical', 'unchanged', 'Volvo SQE Rev. 5 (2024)'),
  csr('VOL-8.3.4.4', '8.3.4.4', 'PPAP — Volvo requirements', 'VOLVO',
    'Volvo requires PPA per VDA Volume 2 with Volvo supplements. Initial Sample Approval (ISA) process. Prototype and serial validation stages.', 'high', 'unchanged', 'Volvo SQE Rev. 5 (2024)'),
  csr('VOL-10.2.3', '10.2.3', 'Problem solving — Volvo requirements', 'VOLVO',
    'Volvo requires 8D or A3 problem solving methodology. Quality Issue Management via Volvo Supplier Portal. Containment within 24h, root cause within 5 business days.', 'high', 'unchanged', 'Volvo SQE Rev. 5 (2024)'),
]

/* ================================================================== */
/*  Consolidated catalogue                                            */
/* ================================================================== */

export const CSR_DATABASE: CsrRequirement[] = [
  ...BASE,
  ...BMW_CSR,
  ...VW_CSR,
  ...MERCEDES_CSR,
  ...STELLANTIS_CSR,
  ...FORD_CSR,
  ...GM_CSR,
  ...RENAULT_CSR,
  ...TOYOTA_CSR,
  ...HYUNDAI_KIA_CSR,
  ...VOLVO_CSR,
]

/** Get all CSR entries for a set of OEMs (includes base IATF rows) */
export function getCsrForOems(oemIds: string[]): CsrRequirement[] {
  return CSR_DATABASE.filter(
    (r) => r.oem === null || oemIds.includes(r.oem),
  )
}

/** Get only OEM-specific CSR entries (no base) */
export function getOemSpecificCsr(oemIds: string[]): CsrRequirement[] {
  return CSR_DATABASE.filter(
    (r) => r.oem !== null && oemIds.includes(r.oem),
  )
}

/** Get base IATF requirements only */
export function getBaseRequirements(): CsrRequirement[] {
  return CSR_DATABASE.filter((r) => r.oem === null)
}

/** Get delta: requirements that are new or updated */
export function getDeltaRequirements(oemIds: string[]): {
  newReqs: CsrRequirement[]
  updatedReqs: CsrRequirement[]
} {
  const filtered = getCsrForOems(oemIds)
  return {
    newReqs: filtered.filter((r) => r.changeStatus === 'new'),
    updatedReqs: filtered.filter((r) => r.changeStatus === 'updated'),
  }
}
