import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import type { MatrixRow, ProcessEntry, ConflictInfo, ImplementationRecord, ImplementationStatus } from '@/modules/csr/types'

export const maxDuration = 60

/* ─── Styling constants ─────────────────────────────────────────── */

const BLUE = 'FF1D4ED8'
const DARK_BLUE = 'FF1E3A5F'
const WHITE = 'FFFFFFFF'
const LIGHT_BLUE = 'FFDBEAFE'
const RED_BG = 'FFF44336'
const ORANGE_BG = 'FFFF9800'
const YELLOW_BG = 'FFFFC107'
const GREEN_BG = 'FF4CAF50'
const GRAY_BG = 'FFF8FAFC'
const CONFLICT_BG = 'FFFFF3CD'

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
}

function fill(color: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
}

function headerStyle(cell: ExcelJS.Cell, rotate = false) {
  cell.font = { bold: true, size: 9, color: { argb: WHITE } }
  cell.fill = fill(BLUE)
  cell.border = thinBorder
  cell.alignment = {
    horizontal: 'center',
    vertical: 'bottom',
    wrapText: true,
    textRotation: rotate ? 90 : 0,
  }
}

/* ─── Request schema ────────────────────────────────────────────── */

interface ExportRequest {
  matrixRows: MatrixRow[]
  processes: ProcessEntry[]
  selectedOems: string[]
  companyName?: string
  companyLocation?: string
  language: 'de' | 'en'
  conflicts?: ConflictInfo[]
  implementationRecords?: Record<string, ImplementationRecord>
  companyLogo?: string
  processMapImage?: string
}

/* ─── Labels ────────────────────────────────────────────────────── */

const LABELS = {
  en: {
    summarySheet: 'Summary',
    masterSheet: 'Master Matrix',
    conflictsSheet: 'Overlaps & Conflicts',
    justificationSuffix: 'Justification',
    title: 'Customer-Specific Requirements Matrix',
    generated: 'Generated',
    company: 'Company',
    location: 'Location',
    oems: 'OEMs',
    totalReqs: 'Total Requirements',
    oemReqs: 'OEM-Specific Requirements',
    baseReqs: 'Base IATF Requirements',
    conflictsCount: 'Conflicts Detected',
    chapter: 'IATF Chapter',
    reqTitle: 'Requirement',
    oem: 'OEM / Source',
    description: 'Description',
    version: 'Version',
    change: 'Change Status',
    risk: 'Risk',
    severity: 'Severity',
    sourceDoc: 'Source Document',
    lastUpdated: 'Last Updated',
    status: 'Status',
    processHeader: 'Affected Processes',
    conflict: 'Conflict',
    conflictingOems: 'Conflicting OEMs',
    conflictDescription: 'Conflict Description',
    impactColumn: 'Impact / Need for Adjustment',
    evidenceColumn: 'Adjustment Evidence',
    legend: 'Legend',
    legendBase: 'IATF 16949 = Base standard requirement',
    legendOem: 'OEM column = Customer-specific requirement on top of IATF',
    legendX: 'x = Process is affected by this requirement',
    legendRisk: 'Risk: critical / high / medium / low',
    legendSeverity: 'Severity: supplementary / tightening / replacing',
    legendConflict: '⚠ = Conflict with another OEM on same chapter',
    implStatus: 'Implementation Status',
    implOpen: 'Open',
    implInReview: 'In Review',
    implImplemented: 'Implemented',
    implValidated: 'Validated',
    implAssignee: 'Process Owner',
    implDueDate: 'Due Date',
    implEvidence: 'Evidence',
    implDocRef: 'Document Reference (SOP/WI/Form)',
    implEvidenceLocation: 'Document Path',
    summaryDecisionRule: 'Conflict Recommendation Rule',
    summaryEscalation: 'Escalation / Approval Rule',
    summaryDecisionRuleVal: 'Most stringent CSR requirement should be applied where OEM requirements overlap.',
    summaryEscalationVal: 'Any deviation requires customer-specific approval and quality management sign-off.',
    conflictsRisk: 'Risk Level',
    conflictsDecision: 'Final Recommendation Rule',
    conflictsApproval: 'Approval Authority',
    conflictsDecisionVal: 'Apply stricter requirement and document rationale in controlled change record.',
    traceabilitySheet: 'Process Traceability',
    traceReq: 'Requirement (Chapter + Title)',
    traceProcesses: 'Linked Processes',
    traceOwner: 'Process Owner',
    traceDoc: 'Document Reference',
    traceEvidenceLoc: 'Evidence Location',
    justApplies: 'Why Applies / Not Applies',
    justAlternative: 'Alternative Control (if not applicable)',
    justApprovedBy: 'Approved By',
    processMapSheet: 'Process Map',
    riskCritical: 'Critical',
    riskHigh: 'High',
    riskMedium: 'Medium',
    riskLow: 'Low',
    sevSupplementary: 'Supplementary',
    sevTightening: 'Tightening',
    sevReplacing: 'Replacing',
    new: 'New',
    updated: 'Updated',
    unchanged: 'Unchanged',
    deleted: 'Deleted',
    active: 'Active',
    outdated: 'Outdated',
    disclaimer: 'This matrix was generated by IATF Solutions CSR Matrix Tool. It is based on publicly available IATF 16949 and OEM CSR requirements. Always verify against the latest OEM source documents.',
    logoPlaceholder: '[Company Logo]',
  },
  de: {
    summarySheet: 'Zusammenfassung',
    masterSheet: 'Gesamtmatrix',
    conflictsSheet: 'Überschneidungen & Konflikte',
    justificationSuffix: 'Begründung',
    title: 'Kundenspezifische Anforderungsmatrix',
    generated: 'Erstellt am',
    company: 'Unternehmen',
    location: 'Standort',
    oems: 'OEMs',
    totalReqs: 'Anforderungen gesamt',
    oemReqs: 'OEM-spezifische Anforderungen',
    baseReqs: 'IATF Basisanforderungen',
    conflictsCount: 'Erkannte Konflikte',
    chapter: 'IATF Kapitel',
    reqTitle: 'Anforderung',
    oem: 'OEM / Quelle',
    description: 'Beschreibung',
    version: 'Version',
    change: 'Änderungsstatus',
    risk: 'Risiko',
    severity: 'Schweregrad',
    sourceDoc: 'Quelldokument',
    lastUpdated: 'Letzte Aktualisierung',
    status: 'Status',
    processHeader: 'Betroffene Prozesse',
    conflict: 'Konflikt',
    conflictingOems: 'Betroffene OEMs',
    conflictDescription: 'Konfliktbeschreibung',
    impactColumn: 'Auswirkung / Anpassungsbedarf',
    evidenceColumn: 'Anpassungsnachweis',
    legend: 'Legende',
    legendBase: 'IATF 16949 = Grundanforderung des Standards',
    legendOem: 'OEM-Spalte = Kundenspezifische Anforderung über IATF hinaus',
    legendX: 'x = Prozess ist von dieser Anforderung betroffen',
    legendRisk: 'Risiko: kritisch / hoch / mittel / niedrig',
    legendSeverity: 'Schweregrad: ergänzend / verschärfend / ersetzend',
    legendConflict: '⚠ = Konflikt mit anderem OEM zum selben Kapitel',
    implStatus: 'Umsetzungsstatus',
    implOpen: 'Offen',
    implInReview: 'In Prüfung',
    implImplemented: 'Umgesetzt',
    implValidated: 'Validiert',
    implAssignee: 'Prozessverantwortlicher',
    implDueDate: 'Fälligkeitsdatum',
    implEvidence: 'Nachweis',
    implDocRef: 'Dokumentenreferenz (SOP/AA/Formular)',
    implEvidenceLocation: 'Dokumentenpfad',
    summaryDecisionRule: 'Konflikt-Empfehlungsregel',
    summaryEscalation: 'Eskalations- / Freigaberegel',
    summaryDecisionRuleVal: 'Bei überlappenden OEM-Anforderungen gilt die jeweils strengste CSR-Anforderung.',
    summaryEscalationVal: 'Jede Abweichung erfordert kundenspezifische Freigabe und QM-Genehmigung.',
    conflictsRisk: 'Risikostufe',
    conflictsDecision: 'Finale Empfehlungsregel',
    conflictsApproval: 'Freigabeverantwortung',
    conflictsDecisionVal: 'Strengere Anforderung anwenden und Begründung im gelenkten Änderungsnachweis dokumentieren.',
    traceabilitySheet: 'Prozessrückverfolgbarkeit',
    traceReq: 'Anforderung (Kapitel + Titel)',
    traceProcesses: 'Verknüpfte Prozesse',
    traceOwner: 'Prozessverantwortlicher',
    traceDoc: 'Dokumentenreferenz',
    traceEvidenceLoc: 'Nachweisort',
    justApplies: 'Warum anwendbar / nicht anwendbar',
    justAlternative: 'Alternativmaßnahme (falls nicht anwendbar)',
    justApprovedBy: 'Freigegeben von',
    processMapSheet: 'Prozesslandkarte',
    riskCritical: 'Kritisch',
    riskHigh: 'Hoch',
    riskMedium: 'Mittel',
    riskLow: 'Niedrig',
    sevSupplementary: 'Ergänzend',
    sevTightening: 'Verschärfend',
    sevReplacing: 'Ersetzend',
    new: 'Neu',
    updated: 'Aktualisiert',
    unchanged: 'Unverändert',
    deleted: 'Entfernt',
    active: 'Aktiv',
    outdated: 'Veraltet',
    disclaimer: 'Diese Matrix wurde mit dem IATF Solutions CSR Matrix Tool erstellt. Sie basiert auf öffentlich verfügbaren IATF 16949 und OEM CSR-Anforderungen. Bitte stets mit den aktuellen OEM-Quelldokumenten abgleichen.',
    logoPlaceholder: '[Firmenlogo]',
  },
} as const

type L = (typeof LABELS)[keyof typeof LABELS]

/* ─── Helpers ───────────────────────────────────────────────────── */

function riskLabel(risk: string, L: L) {
  return risk === 'critical' ? L.riskCritical
    : risk === 'high' ? L.riskHigh
      : risk === 'medium' ? L.riskMedium
        : L.riskLow
}

function riskBg(risk: string) {
  return risk === 'critical' ? RED_BG
    : risk === 'high' ? ORANGE_BG
      : risk === 'medium' ? YELLOW_BG
        : GREEN_BG
}

function changeLabel(status: string, L: L) {
  return status === 'new' ? L.new
    : status === 'updated' ? L.updated
      : status === 'deleted' ? L.deleted
        : L.unchanged
}

function severityLabel(sev: string | null | undefined, L: L) {
  if (!sev) return '—'
  return sev === 'tightening' ? L.sevTightening
    : sev === 'replacing' ? L.sevReplacing
      : L.sevSupplementary
}

function implStatusLabel(status: ImplementationStatus | undefined, L: L) {
  if (!status || status === 'open') return L.implOpen
  if (status === 'in_review') return L.implInReview
  if (status === 'implemented') return L.implImplemented
  if (status === 'validated') return L.implValidated
  return L.implOpen
}

function implStatusBg(status: ImplementationStatus | undefined) {
  if (status === 'validated') return GREEN_BG
  if (status === 'implemented') return 'FFD1FAE5'
  if (status === 'in_review') return YELLOW_BG
  return 'FFFAFAFA'
}

function sortByChapter(rows: MatrixRow[]) {
  return [...rows].sort((a, b) =>
    a.iatfChapter.localeCompare(b.iatfChapter, undefined, { numeric: true }),
  )
}

function riskRank(risk: string) {
  if (risk === 'critical') return 4
  if (risk === 'high') return 3
  if (risk === 'medium') return 2
  return 1
}

function chapterMaxRisk(chapter: string, rows: MatrixRow[]): MatrixRow['risk'] {
  const onChapter = rows.filter((r) => r.iatfChapter === chapter)
  if (onChapter.length === 0) return 'low'
  return onChapter.sort((a, b) => riskRank(b.risk) - riskRank(a.risk))[0].risk
}

/* ─── write data rows into a worksheet ──────────────────────────── */

function writeMatrixRows(
  ws: ExcelJS.Worksheet,
  sorted: MatrixRow[],
  processes: ProcessEntry[],
  L: L,
  startRow: number,
  preProcessCols: number,
  showConflict = true,
  implRecords: Record<string, ImplementationRecord> = {},
) {
  let row = startRow
  for (let i = 0; i < sorted.length; i++) {
    const mr = sorted[i]
    const isAlt = i % 2 === 1
    const bgColor = isAlt ? GRAY_BG : undefined
    const impl = implRecords[mr.csrId]

    const values: (string | number)[] = [
      mr.iatfChapter,
      mr.title,
      mr.oem,
      mr.text,
      mr.version,
      changeLabel(mr.changeStatus, L),
      riskLabel(mr.risk, L),
      severityLabel(mr.severity, L),
      mr.sourceDoc || '—',
      mr.lastUpdated || '—',
      mr.active === false ? L.outdated : L.active,
    ]

    if (showConflict) {
      values.push(mr.conflictFlag ? '⚠' : '')
    }

    const preColsCount = values.length

    for (const p of processes) {
      values.push(mr.affectedProcessIds.includes(p.id) ? 'x' : '')
    }

    const implColStartIndex = values.length

    // Implementation tracking columns
    values.push(implStatusLabel(impl?.status, L))
    const firstAffectedOwner = processes.find((p) => mr.affectedProcessIds.includes(p.id))?.owner ?? ''
    values.push(impl?.processOwner ?? impl?.assignee ?? firstAffectedOwner)
    values.push(impl?.dueDate ?? '')
    values.push(impl?.evidence ?? '')
    values.push(impl?.documentReference ?? '')
    values.push(impl?.evidenceLocation ?? '')

    for (let c = 0; c < values.length; c++) {
      const cell = ws.getCell(row, c + 1)
      cell.value = values[c]
      cell.font = { size: 8 }
      cell.border = thinBorder

      const isProcessCol = c >= preColsCount && c < implColStartIndex

      cell.alignment = {
        vertical: 'top',
        wrapText: true,
        horizontal: isProcessCol ? 'center' : 'left',
      }

      if (c === 6) {
        cell.fill = fill(riskBg(mr.risk))
      } else if (showConflict && c === 11 && mr.conflictFlag) {
        cell.fill = fill(CONFLICT_BG)
        cell.font = { size: 10 }
      } else if (c === implColStartIndex) {
        // Implementation status column
        cell.fill = fill(implStatusBg(impl?.status))
      } else if (isProcessCol && values[c] === 'x') {
        cell.font = { bold: true, size: 9, color: { argb: BLUE } }
        cell.fill = fill(LIGHT_BLUE)
      } else if (bgColor) {
        cell.fill = fill(bgColor)
      }
    }


    row++
  }
  return row
}

/* ─── Route handler ─────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const authed = await isAuthenticatedFromRequest(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ExportRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { matrixRows, processes, selectedOems, companyName, companyLocation, language, conflicts = [], implementationRecords = {}, companyLogo, processMapImage } = body

  if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
    return NextResponse.json({ error: 'No matrix data' }, { status: 400 })
  }

  const L = LABELS[language] ?? LABELS.en

  try {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'IATF Solutions'
    wb.created = new Date()

    const sorted = sortByChapter(matrixRows)
    const baseRows = sorted.filter((r) => r.oem === 'IATF 16949')
    const oemRows = sorted.filter((r) => r.oem !== 'IATF 16949')

    /* ================================================================ */
    /*  TAB 1: Summary                                                  */
    /* ================================================================ */
    const wsSummary = wb.addWorksheet(L.summarySheet)
    wsSummary.columns = [{ width: 48 }, { width: 80 }]

    let row = 1

    // Company logo (real image if provided, fallback to text placeholder)
    if (companyLogo) {
      try {
        const base64Match = companyLogo.match(/^data:image\/(png|jpeg|svg\+xml|webp);base64,(.+)$/)
        if (base64Match) {
          const ext = base64Match[1] === 'svg+xml' ? 'png' : base64Match[1] as 'png' | 'jpeg'
          const logoId = wb.addImage({ base64: companyLogo, extension: ext })
          wsSummary.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 200, height: 50 },
          })
          wsSummary.getRow(row).height = 50
        }
      } catch {
        // Fallback to text if image fails
        wsSummary.mergeCells(row, 1, row, 2)
        wsSummary.getCell(row, 1).value = L.logoPlaceholder
        wsSummary.getCell(row, 1).font = { size: 11, italic: true, color: { argb: 'FF94A3B8' } }
        wsSummary.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' }
        wsSummary.getRow(row).height = 40
      }
    } else {
      wsSummary.mergeCells(row, 1, row, 2)
      wsSummary.getCell(row, 1).value = L.logoPlaceholder
      wsSummary.getCell(row, 1).font = { size: 11, italic: true, color: { argb: 'FF94A3B8' } }
      wsSummary.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' }
      wsSummary.getRow(row).height = 40
    }
    row += 2

    // Title
    wsSummary.mergeCells(row, 1, row, 2)
    const titleCell = wsSummary.getCell(row, 1)
    titleCell.value = L.title
    titleCell.font = { bold: true, size: 16, color: { argb: WHITE } }
    titleCell.fill = fill(BLUE)
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    wsSummary.getRow(row).height = 36
    row += 2

    const summaryItems: [string, string][] = [
      [L.generated, new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB')],
      [L.company, companyName || '—'],
      [L.location, companyLocation || '—'],
      [L.oems, selectedOems.join(', ')],
      [L.totalReqs, String(matrixRows.length)],
      [L.baseReqs, String(baseRows.length)],
      [L.oemReqs, String(oemRows.length)],
      [L.conflictsCount, String(conflicts.length)],
    ]
    for (const [label, val] of summaryItems) {
      wsSummary.getCell(row, 1).value = label
      wsSummary.getCell(row, 1).font = { bold: true, size: 10, color: { argb: 'FF475569' } }
      wsSummary.getCell(row, 1).border = thinBorder
      wsSummary.getCell(row, 2).value = val
      wsSummary.getCell(row, 2).font = { size: 10 }
      wsSummary.getCell(row, 2).border = thinBorder
      row++
    }

    // Per-OEM breakdown
    row += 1
    for (const oem of selectedOems) {
      const oemCount = matrixRows.filter((r) => r.oem === oem).length
      wsSummary.getCell(row, 1).value = oem
      wsSummary.getCell(row, 1).font = { bold: true, size: 9 }
      wsSummary.getCell(row, 2).value = `${oemCount} CSR`
      wsSummary.getCell(row, 2).font = { size: 9 }
      row++
    }

    row += 1
    wsSummary.getCell(row, 1).value = L.summaryDecisionRule
    wsSummary.getCell(row, 1).font = { bold: true, size: 10, color: { argb: 'FF475569' } }
    wsSummary.getCell(row, 1).border = thinBorder
    wsSummary.getCell(row, 2).value = L.summaryDecisionRuleVal
    wsSummary.getCell(row, 2).font = { size: 10 }
    wsSummary.getCell(row, 2).alignment = { wrapText: true }
    wsSummary.getCell(row, 2).border = thinBorder
    wsSummary.getRow(row).height = 40
    row++

    wsSummary.getCell(row, 1).value = L.summaryEscalation
    wsSummary.getCell(row, 1).font = { bold: true, size: 10, color: { argb: 'FF475569' } }
    wsSummary.getCell(row, 1).border = thinBorder
    wsSummary.getCell(row, 2).value = L.summaryEscalationVal
    wsSummary.getCell(row, 2).font = { size: 10 }
    wsSummary.getCell(row, 2).alignment = { wrapText: true }
    wsSummary.getCell(row, 2).border = thinBorder
    wsSummary.getRow(row).height = 40

    row += 2
    wsSummary.mergeCells(row, 1, row, 2)
    wsSummary.getCell(row, 1).value = L.disclaimer
    wsSummary.getCell(row, 1).font = { size: 7, italic: true, color: { argb: 'FF94A3B8' } }
    wsSummary.getCell(row, 1).alignment = { wrapText: true }
    wsSummary.getRow(row).height = 30

    /* ================================================================ */
    /*  TAB 2: Master Matrix (all OEMs combined)                        */
    /* ================================================================ */
    const wsMaster = wb.addWorksheet(L.masterSheet)

    // Fixed columns: Chapter, Title, OEM, Description, Version, Change, Risk, Severity, Source, LastUpdated, Status, Conflict
    const preProcessCols = 12
    const postProcessCols = 6
    const processCols = processes.length
    const totalCols = preProcessCols + processCols + postProcessCols

    const masterCols: Partial<ExcelJS.Column>[] = [
      { width: 14 },  // Chapter
      { width: 28 },  // Title
      { width: 16 },  // OEM
      { width: 48 },  // Description
      { width: 14 },  // Version
      { width: 12 },  // Change
      { width: 10 },  // Risk
      { width: 12 },  // Severity
      { width: 20 },  // Source Doc
      { width: 12 },  // Last Updated
      { width: 10 },  // Status
      { width: 8 },   // Conflict
    ]
    for (let i = 0; i < processCols; i++) {
      masterCols.push({ width: 6 })
    }
    masterCols.push(
      { width: 14 },  // Impl Status
      { width: 18 },  // Process Owner
      { width: 12 },  // Due Date
      { width: 20 },  // Evidence
      { width: 24 },  // Document Reference
      { width: 28 },  // Evidence Location
    )
    wsMaster.columns = masterCols

    row = 1

    // Title bar
    wsMaster.mergeCells(row, 1, row, totalCols)
    const masterTitle = wsMaster.getCell(row, 1)
    masterTitle.value = L.title
    masterTitle.font = { bold: true, size: 14, color: { argb: WHITE } }
    masterTitle.fill = fill(BLUE)
    masterTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    wsMaster.getRow(row).height = 32
    row += 2

    // Header row
    const masterHeaders = [
      L.chapter, L.reqTitle, L.oem, L.description, L.version, L.change,
      L.risk, L.severity, L.sourceDoc, L.lastUpdated, L.status, L.conflict,
      ...processes.map((p) => p.name),
      L.implStatus, L.implAssignee, L.implDueDate, L.implEvidence, L.implDocRef, L.implEvidenceLocation,
    ]

    const hdrRow = wsMaster.getRow(row)
    hdrRow.height = processCols > 0 ? 80 : 24
    for (let c = 0; c < masterHeaders.length; c++) {
      const cell = wsMaster.getCell(row, c + 1)
      cell.value = masterHeaders[c]
      const isProcessCol = c >= preProcessCols && c < preProcessCols + processCols
      headerStyle(cell, isProcessCol)
    }

    // Freeze panes — keep header visible when scrolling
    wsMaster.views = [{ state: 'frozen', xSplit: 0, ySplit: row, topLeftCell: `A${row + 1}` }]

    // AutoFilter on header row
    wsMaster.autoFilter = {
      from: { row, column: 1 },
      to: { row, column: totalCols },
    }

    row++

    row = writeMatrixRows(wsMaster, sorted, processes, L, row, preProcessCols, true, implementationRecords)
    row++

    // Legend
    wsMaster.mergeCells(row, 1, row, totalCols)
    wsMaster.getCell(row, 1).value = L.legend
    wsMaster.getCell(row, 1).font = { bold: true, size: 10, color: { argb: WHITE } }
    wsMaster.getCell(row, 1).fill = fill(BLUE)
    row++
    const legendItems = [L.legendBase, L.legendOem, L.legendX, L.legendRisk, L.legendSeverity, L.legendConflict]
    for (const item of legendItems) {
      wsMaster.mergeCells(row, 1, row, totalCols)
      wsMaster.getCell(row, 1).value = item
      wsMaster.getCell(row, 1).font = { size: 8, italic: true }
      row++
    }
    row++
    wsMaster.mergeCells(row, 1, row, totalCols)
    wsMaster.getCell(row, 1).value = L.disclaimer
    wsMaster.getCell(row, 1).font = { size: 7, italic: true, color: { argb: 'FF94A3B8' } }
    wsMaster.getCell(row, 1).alignment = { wrapText: true }

    /* ================================================================ */
    /*  TAB 3+: Per-OEM Filter Tabs                                     */
    /* ================================================================ */
    // Implementation tracking columns to merge (1-indexed)
    const implStartIdx = preProcessCols + processCols + 1
    const implMergeCols = [
      implStartIdx,
      implStartIdx + 1,
      implStartIdx + 2,
      implStartIdx + 3,
      implStartIdx + 4,
      implStartIdx + 5,
    ]

    for (const oem of selectedOems) {
      const oemFiltered = sorted.filter(
        (r) => r.oem === oem || r.oem === 'IATF 16949',
      )
      if (oemFiltered.length === 0) continue

      const wsOem = wb.addWorksheet(oem)
      wsOem.columns = masterCols

      row = 1
      wsOem.mergeCells(row, 1, row, totalCols)
      const oemTitle = wsOem.getCell(row, 1)
      oemTitle.value = `${oem} — ${L.title}`
      oemTitle.font = { bold: true, size: 13, color: { argb: WHITE } }
      oemTitle.fill = fill(DARK_BLUE)
      oemTitle.alignment = { horizontal: 'center', vertical: 'middle' }
      wsOem.getRow(row).height = 30
      row += 2

      const oemHdrRow = wsOem.getRow(row)
      oemHdrRow.height = processCols > 0 ? 80 : 24
      for (let c = 0; c < masterHeaders.length; c++) {
        const cell = wsOem.getCell(row, c + 1)
        cell.value = masterHeaders[c]
        const isProcessCol = c >= preProcessCols && c < preProcessCols + processCols
        headerStyle(cell, isProcessCol)
      }
      const dataStartRow = row + 1
      row++

      const oemSorted = sortByChapter(oemFiltered)
      writeMatrixRows(wsOem, oemSorted, processes, L, row, preProcessCols, true, implementationRecords)
    }

    /* ================================================================ */
    /*  TAB 4+: Per-OEM Justification Tabs                              */
    /* ================================================================ */
    // Justification columns to merge (1-indexed): Chapter(1), WhyApplies(7), Alternative(8), ApprovedBy(9)
    const justMergeCols = [1, 7, 8, 9]

    for (const oem of selectedOems) {
      const oemSpecific = sorted.filter((r) => r.oem === oem)
      if (oemSpecific.length === 0) continue

      const wsJust = wb.addWorksheet(`${oem} ${L.justificationSuffix}`)
      wsJust.columns = [
        { width: 14 },  // Chapter
        { width: 28 },  // Title
        { width: 48 },  // Description
        { width: 10 },  // Risk
        { width: 12 },  // Severity
        { width: 20 },  // Source Doc
        { width: 34 },  // Why applies / not applies
        { width: 34 },  // Alternative control
        { width: 22 },  // Approved by
      ]

      row = 1
      const justTotalCols = 9
      wsJust.mergeCells(row, 1, row, justTotalCols)
      const justTitle = wsJust.getCell(row, 1)
      justTitle.value = `${oem} — ${L.justificationSuffix}`
      justTitle.font = { bold: true, size: 13, color: { argb: WHITE } }
      justTitle.fill = fill(DARK_BLUE)
      justTitle.alignment = { horizontal: 'center', vertical: 'middle' }
      wsJust.getRow(row).height = 30
      row += 2

      const justHeaders = [
        L.chapter, L.reqTitle, L.description, L.risk, L.severity, L.sourceDoc,
        L.justApplies, L.justAlternative, L.justApprovedBy,
      ]
      for (let c = 0; c < justHeaders.length; c++) {
        const cell = wsJust.getCell(row, c + 1)
        cell.value = justHeaders[c]
        headerStyle(cell)
      }
      row++

      const justDataStartRow = row
      const justChapters: string[] = []

      for (let i = 0; i < oemSpecific.length; i++) {
        const mr = oemSpecific[i]
        const isAlt = i % 2 === 1
        justChapters.push(mr.iatfChapter)
        const vals = [
          mr.iatfChapter,
          mr.title,
          mr.text,
          riskLabel(mr.risk, L),
          severityLabel(mr.severity, L),
          mr.sourceDoc || '—',
          '', // Why applies / not applies
          '', // Alternative control
          '', // Approved by
        ]

        for (let c = 0; c < vals.length; c++) {
          const cell = wsJust.getCell(row, c + 1)
          cell.value = vals[c]
          cell.font = { size: 8 }
          cell.border = thinBorder
          cell.alignment = { vertical: 'top', wrapText: true }

          if (c === 3) {
            cell.fill = fill(riskBg(mr.risk))
          } else if (c >= 6) {
            // Editable columns highlighted
            cell.fill = fill('FFFFFDE7')
          } else if (isAlt) {
            cell.fill = fill(GRAY_BG)
          }
        }

        row++
      }

      // Justification chapter merging removed to prevent connected cells.
    }

    /* ================================================================ */
    /*  TAB: Overlaps & Conflicts                                       */
    /* ================================================================ */
    const wsConflicts = wb.addWorksheet(L.conflictsSheet)
    wsConflicts.columns = [
      { width: 14 },  // Chapter
      { width: 24 },  // Conflicting OEMs
      { width: 12 },  // Risk Level
      { width: 50 },  // Description
      { width: 45 },  // Final Decision Rule
      { width: 24 },  // Approval Authority
      { width: 20 },  // CSR IDs
    ]

    row = 1
    wsConflicts.mergeCells(row, 1, row, 7)
    const conflictTitle = wsConflicts.getCell(row, 1)
    conflictTitle.value = L.conflictsSheet
    conflictTitle.font = { bold: true, size: 13, color: { argb: WHITE } }
    conflictTitle.fill = fill(BLUE)
    conflictTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    wsConflicts.getRow(row).height = 30
    row += 2

    const conflictHeaders = [L.chapter, L.conflictingOems, L.conflictsRisk, L.conflictDescription, L.conflictsDecision, L.conflictsApproval, 'CSR IDs']
    for (let c = 0; c < conflictHeaders.length; c++) {
      const cell = wsConflicts.getCell(row, c + 1)
      cell.value = conflictHeaders[c]
      headerStyle(cell)
    }
    row++

    if (conflicts.length === 0) {
      wsConflicts.mergeCells(row, 1, row, 7)
      wsConflicts.getCell(row, 1).value = language === 'de'
        ? 'Keine Konflikte erkannt.'
        : 'No conflicts detected.'
      wsConflicts.getCell(row, 1).font = { size: 10, italic: true, color: { argb: 'FF6B7280' } }
    } else {
      for (let i = 0; i < conflicts.length; i++) {
        const c = conflicts[i]
        const isAlt = i % 2 === 1
        const vals = [
          c.iatfChapter,
          c.oems.join(', '),
          riskLabel(chapterMaxRisk(c.iatfChapter, sorted), L),
          c.description,
          c.decision ? `${c.decision}\n\n${c.reason}` : L.conflictsDecisionVal,
          '',
          c.csrIds.join(', '),
        ]
        for (let col = 0; col < vals.length; col++) {
          const cell = wsConflicts.getCell(row, col + 1)
          cell.value = vals[col]
          cell.font = { size: 8 }
          cell.border = thinBorder
          cell.alignment = { vertical: 'top', wrapText: true }
          if (col === 2) {
            cell.fill = fill(riskBg(chapterMaxRisk(c.iatfChapter, sorted)))
          } else if (col === 5) {
            // Approval authority is intentionally editable by quality management
            cell.fill = fill('FFFFFDE7')
          } else if (isAlt) {
            cell.fill = fill(GRAY_BG)
          }
        }

        row++
      }
    }

    /* ================================================================ */
    /*  TAB: Requirement ↔ Process Traceability                         */
    /* ================================================================ */
    const wsTrace = wb.addWorksheet(L.traceabilitySheet)
    wsTrace.columns = [
      { width: 42 },  // Requirement
      { width: 36 },  // Linked processes
      { width: 22 },  // Process owner
      { width: 26 },  // Document reference
      { width: 34 },  // Evidence location
    ]

    row = 1
    wsTrace.mergeCells(row, 1, row, 5)
    const traceTitle = wsTrace.getCell(row, 1)
    traceTitle.value = L.traceabilitySheet
    traceTitle.font = { bold: true, size: 13, color: { argb: WHITE } }
    traceTitle.fill = fill(BLUE)
    traceTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    wsTrace.getRow(row).height = 30
    row += 2

    const traceHeaders = [L.traceReq, L.traceProcesses, L.traceOwner, L.traceDoc, L.traceEvidenceLoc]
    for (let c = 0; c < traceHeaders.length; c++) {
      const cell = wsTrace.getCell(row, c + 1)
      cell.value = traceHeaders[c]
      headerStyle(cell)
    }
    row++

    for (let i = 0; i < sorted.length; i++) {
      const mr = sorted[i]
      const impl = implementationRecords[mr.csrId]
      const linkedProcesses = mr.affectedProcessIds
        .map((pid) => processes.find((p) => p.id === pid)?.name ?? pid)
        .join(', ')
      const fallbackOwner = processes.find((p) => mr.affectedProcessIds.includes(p.id))?.owner ?? ''

      const vals = [
        `${mr.iatfChapter} — ${mr.title}`,
        linkedProcesses || '—',
        impl?.processOwner ?? impl?.assignee ?? fallbackOwner,
        impl?.documentReference ?? '',
        impl?.evidenceLocation ?? impl?.evidence ?? '',
      ]

      for (let c = 0; c < vals.length; c++) {
        const cell = wsTrace.getCell(row, c + 1)
        cell.value = vals[c]
        cell.font = { size: 8 }
        cell.border = thinBorder
        cell.alignment = { vertical: 'top', wrapText: true }
        if (i % 2 === 1) cell.fill = fill(GRAY_BG)
      }
      wsTrace.getRow(row).height = 22
      row++
    }

    /* ================================================================ */
    /*  TAB: Process Map (image if provided)                            */
    /* ================================================================ */
    if (processMapImage) {
      try {
        const imgMatch = processMapImage.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/)
        if (imgMatch) {
          const ext = imgMatch[1] as 'png' | 'jpeg'
          const wsProcessMap = wb.addWorksheet(L.processMapSheet)
          wsProcessMap.columns = [{ width: 120 }]
          wsProcessMap.mergeCells(1, 1, 1, 1)
          const pmTitle = wsProcessMap.getCell(1, 1)
          pmTitle.value = L.processMapSheet
          pmTitle.font = { bold: true, size: 13, color: { argb: WHITE } }
          pmTitle.fill = fill(BLUE)
          pmTitle.alignment = { horizontal: 'center', vertical: 'middle' }
          wsProcessMap.getRow(1).height = 30

          const imgId = wb.addImage({ base64: processMapImage, extension: ext })
          wsProcessMap.addImage(imgId, {
            tl: { col: 0, row: 1 },
            ext: { width: 800, height: 500 },
          })
        }
      } catch {
        // Silently skip if image embedding fails
      }
    }

    /* ─── Generate buffer ─────────────────────────────────────────── */
    const buffer = await wb.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="CSR_Matrix.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[CSR Export] Excel generation failed:', err)
    return NextResponse.json({ error: 'Excel generation failed' }, { status: 500 })
  }
}
