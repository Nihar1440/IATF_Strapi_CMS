import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import type { ReportData } from '@/modules/eightd/types/report'
import { reportDataSchema } from '@/modules/eightd/schemas/reportValidation'
import {
  localizeApprovalStatus,
  localizeImplementationStatus,
} from '@/modules/eightd/lib/reportValueLocalization'
import { isAuthenticatedFromRequest } from '@/lib/session/session'

export const maxDuration = 60

// ─── Styling constants ────────────────────────────────────────────────────────

const BLUE = 'FF1D4ED8'
const WHITE = 'FFFFFFFF'
const LIGHT_BLUE = 'FFDBEAFE'
const YELLOW_BG = 'FFFEF9C3'
const GRAY_BG = 'FFF8FAFC'
const DARK_GRAY = 'FF334155'
const COLS = 9 // A through I

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function merge(ws: ExcelJS.Worksheet, row: number, c1: number, c2: number) {
  ws.mergeCells(row, c1, row, c2)
}

function mergeRange(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  ws.mergeCells(r1, c1, r2, c2)
}

function fill(color: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
}

function estimateWrappedLines(value: string, span: number) {
  const text = (value || '').toString()
  if (!text) return 1

  const charsPerLine = Math.max(14, span * 14)
  return text
    .split(/\r?\n/)
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
}

function ensureRowHeight(ws: ExcelJS.Worksheet, row: number, requiredHeight: number) {
  const existingHeight = ws.getRow(row).height ?? 15
  ws.getRow(row).height = Math.max(existingHeight, requiredHeight)
}

/** Add a full-width section header (D0, D1, etc.) */
function sectionHeader(ws: ExcelJS.Worksheet, row: number, text: string) {
  ws.getRow(row).height = 26
  merge(ws, row, 1, COLS)
  const cell = ws.getCell(row, 1)
  cell.value = text
  cell.font = { bold: true, size: 11, color: { argb: WHITE } }
  cell.fill = fill(BLUE)
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = thinBorder
}

/** Add a sub-header row (e.g. 5-Why section title) */
function subHeader(ws: ExcelJS.Worksheet, row: number, text: string) {
  ws.getRow(row).height = 22
  merge(ws, row, 1, COLS)
  const cell = ws.getCell(row, 1)
  cell.value = text
  cell.font = { bold: true, size: 10, color: { argb: BLUE } }
  cell.fill = fill(LIGHT_BLUE)
  cell.alignment = { vertical: 'middle' }
  cell.border = thinBorder
}

/** Set a key-value pair: key in col c1, value merged from c2 to c3 */
function kvPair(
  ws: ExcelJS.Worksheet,
  row: number,
  c1: number,
  c2: number,
  c3: number,
  label: string,
  value: string,
) {
  if (c1 !== c2) merge(ws, row, c1, c1) // single cell for label
  merge(ws, row, c2, c3)

  const labelLines = estimateWrappedLines(label, 1)
  const valueLines = estimateWrappedLines(value || '—', Math.max(1, c3 - c2 + 1))
  ensureRowHeight(
    ws,
    row,
    Math.min(140, Math.max(18, 18 * Math.max(labelLines, valueLines))),
  )

  const labelCell = ws.getCell(row, c1)
  labelCell.value = label
  labelCell.font = { bold: true, size: 9, color: { argb: DARK_GRAY } }
  labelCell.alignment = { vertical: 'middle', wrapText: true }
  labelCell.border = thinBorder

  const valCell = ws.getCell(row, c2)
  valCell.value = value || '—'
  valCell.font = { size: 9 }
  valCell.alignment = { vertical: 'middle', wrapText: true }
  valCell.border = thinBorder
}

/** Table header row with blue background */
function tableHeader(ws: ExcelJS.Worksheet, row: number, headers: { col: number; endCol: number; text: string }[]) {
  ws.getRow(row).height = 20
  for (const h of headers) {
    if (h.col !== h.endCol) merge(ws, row, h.col, h.endCol)
    const cell = ws.getCell(row, h.col)
    cell.value = h.text
    cell.font = { bold: true, size: 9, color: { argb: WHITE } }
    cell.fill = fill(BLUE)
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder
  }
}

/** Data row in a table */
function tableRow(
  ws: ExcelJS.Worksheet,
  row: number,
  cells: { col: number; endCol: number; value: string }[],
  alt = false,
  minHeight = 20,
) {
  // Estimate wrapped lines to avoid cramped multiline content.
  let maxEstimatedLines = 1
  for (const c of cells) {
    const value = (c.value || '').toString()
    const span = Math.max(1, c.endCol - c.col + 1)
    const charsPerLine = Math.max(18, span * 14)
    const explicitLines = value.split(/\r?\n/)
    let estimatedLines = 0
    for (const line of explicitLines) {
      estimatedLines += Math.max(1, Math.ceil(line.length / charsPerLine))
    }
    maxEstimatedLines = Math.max(maxEstimatedLines, estimatedLines)
  }

  ws.getRow(row).height = Math.max(minHeight, Math.min(140, 18 * maxEstimatedLines))
  for (const c of cells) {
    if (c.col !== c.endCol) merge(ws, row, c.col, c.endCol)
    const cell = ws.getCell(row, c.col)
    cell.value = c.value || ''
    cell.font = { size: 9 }
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = thinBorder
    if (alt) cell.fill = fill(GRAY_BG)
  }
}

/** Full-width text area spanning all columns across rowCount rows */
function textArea(ws: ExcelJS.Worksheet, startRow: number, rowCount: number, value: string) {
  mergeRange(ws, startRow, 1, startRow + rowCount - 1, COLS)
  const cell = ws.getCell(startRow, 1)
  cell.value = value || ''
  cell.font = { size: 9 }
  cell.alignment = { vertical: 'top', wrapText: true }
  cell.border = thinBorder
  ws.getRow(startRow).height = 30 * rowCount
}

/** Full-width label + text area below it */
function labeledTextArea(ws: ExcelJS.Worksheet, labelRow: number, label: string, value: string, areaRows = 2) {
  merge(ws, labelRow, 1, COLS)
  const lbl = ws.getCell(labelRow, 1)
  lbl.value = label
  lbl.font = { bold: true, size: 9, color: { argb: DARK_GRAY } }
  lbl.fill = fill(LIGHT_BLUE)
  lbl.alignment = { vertical: 'middle' }
  lbl.border = thinBorder
  ws.getRow(labelRow).height = 18
  textArea(ws, labelRow + 1, areaRows, value)
}

// ─── Build the single-sheet 8D Report ─────────────────────────────────────────

function build8DReport(wb: ExcelJS.Workbook, r: ReportData, isDE: boolean) {
  const ws = wb.addWorksheet(isDE ? '8D-Bericht' : '8D Report')
  const language = isDE ? 'de' : 'en'
  const localizedImplementationStatus = localizeImplementationStatus(r.d6.implementationStatus, language)
  const localizedCustomerSignOff = localizeApprovalStatus(r.d8.customerSignOff, language)

  // Column widths (A-I) — total ~130 units to match template
  ws.columns = [
    { width: 16 }, // A
    { width: 16 }, // B
    { width: 14 }, // C
    { width: 14 }, // D
    { width: 14 }, // E
    { width: 14 }, // F
    { width: 12 }, // G
    { width: 12 }, // H
    { width: 14 }, // I
  ]

  let row = 1

  // ── Row 1–2: Title ────────────────────────────────────────────────────
  merge(ws, row, 1, COLS)
  const titleCell = ws.getCell(row, 1)
  titleCell.value = '8D-Report'
  titleCell.font = { bold: true, size: 16, color: { argb: BLUE } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(row).height = 32
  row++

  merge(ws, row, 1, COLS)
  const subCell = ws.getCell(row, 1)
  subCell.value = isDE
    ? '8 Disziplinen | Strukturierte Problemlösung & Korrekturmaßnahmen'
    : '8 Disciplines | Structured Problem Solving & Corrective Action'
  subCell.font = { italic: true, size: 10, color: { argb: DARK_GRAY } }
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(row).height = 20
  row++
  row++ // blank row

  // ── D0 — Report Identification & Symptom Description ──────────────────
  sectionHeader(ws, row, isDE
    ? 'D0  –  BERICHTSIDENTIFIKATION & SYMPTOMBESCHREIBUNG'
    : 'D0  –  REPORT IDENTIFICATION & SYMPTOM DESCRIPTION')
  row++

  // Row: Report No | Report Date | Priority | Deadline
  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 2, isDE ? 'Berichts-Nr.' : 'Report No.', r.metadata.reportId)
  kvPair(ws, row, 3, 4, 4, isDE ? 'Berichtsdatum:' : 'Report Date:', r.metadata.reportDate)
  kvPair(ws, row, 5, 6, 6, isDE ? 'Standort:' : 'Location:', r.metadata.location)
  kvPair(ws, row, 7, 8, 9, isDE ? 'Interne Ref.:' : 'Internal Ref. No.:', r.metadata.internalReference)
  row++

  // Row: Customer | Product/Part | Affected Qty | Batch/Lot
  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 2, isDE ? 'Kunde:' : 'Customer:', r.metadata.customer)
  kvPair(ws, row, 3, 4, 4, isDE ? 'Produkt / Teilenr.:' : 'Product / Part No.:', `${r.metadata.productName} / ${r.metadata.partNumber}`)
  kvPair(ws, row, 5, 6, 6, isDE ? 'Lieferant:' : 'Supplier:', r.metadata.supplier)
  kvPair(ws, row, 7, 8, 9, isDE ? 'Chargen-/Losnr.:' : 'Batch / Lot No.:', r.metadata.batchLotNumber)
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 2, isDE ? 'Kundenrekl.-Nr.:' : 'Customer Complaint No.:', r.metadata.customerComplaintNumber)
  kvPair(ws, row, 3, 4, 4, isDE ? 'Kundenteilenr.:' : 'Customer Part No.:', r.metadata.customerPartNumber)
  kvPair(ws, row, 5, 6, 6, isDE ? 'Lieferantenteilenr.:' : 'Supplier Part No.:', r.metadata.supplierPartNumber)
  merge(ws, row, 7, 9)
  row++

  // Row: Complaint Date
  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Beanstandungsdatum:' : 'Complaint Date:', r.metadata.complaintDate)
  merge(ws, row, 5, COLS)
  row++

  // Symptom description
  labeledTextArea(ws, row,
    isDE ? 'Symptombeschreibung (Was wurde beobachtet? Wann? Wo?)' : 'Symptom Description (What was observed? When? Where?)',
    `${r.d2.what}\n${isDE ? 'Wo' : 'Where'}: ${r.d2.where}\n${isDE ? 'Wann' : 'When'}: ${r.d2.when}\n${isDE ? 'Wie viele' : 'How many'}: ${r.d2.howMany}`,
    2)
  row += 3
  row++ // blank

  // ── D1 — Team Formation ───────────────────────────────────────────────
  sectionHeader(ws, row, isDE ? 'D1  –  TEAMBILDUNG' : 'D1  –  TEAM FORMATION')
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Teamleiter:' : 'Team Leader:', r.d1.teamLeader)
  kvPair(ws, row, 5, 6, 9, isDE ? 'Qualitätsvertreter:' : 'Quality Representative:', r.d1.qualityRep)
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Produktionsvertreter:' : 'Production Representative:', r.d1.productionRep)
  kvPair(ws, row, 5, 6, 9, isDE ? 'Entwicklungsvertreter:' : 'Engineering Representative:', r.d1.engineeringRep)
  row++

  labeledTextArea(ws, row,
    isDE ? 'Weitere Teammitglieder (Name | Abteilung | Rolle):' : 'Additional Team Members (Name | Department | Role):',
    r.d1.additionalMembers, 1)
  row += 2
  row++ // blank

  // ── D2 — Problem Description ──────────────────────────────────────────
  sectionHeader(ws, row, isDE ? 'D2  –  PROBLEMBESCHREIBUNG' : 'D2  –  PROBLEM DESCRIPTION')
  row++

  // Customer Complaint
  labeledTextArea(ws, row,
    isDE ? 'Kundenbeanstandung (Originaltext):' : 'Customer Complaint (verbatim):',
    r.d2.customerComplaintText, 1)
  row += 2

  // IS / IS NOT table
  ws.getRow(row).height = 20
  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: isDE ? 'IST / IST-NICHT Analyse' : 'IS / IS NOT Analysis' },
    { col: 2, endCol: 5, text: isDE ? 'IST  (Bestätigt)' : 'IS  (Confirmed)' },
    { col: 6, endCol: 9, text: isDE ? 'IST NICHT  (Ausgeschlossen)' : 'IS NOT  (Excluded)' },
  ])
  row++

  const isisRows = [
    { label: isDE ? 'WAS  (Objekt / Fehler)' : 'WHAT  (Object / Defect)', is: r.d2.isAnalysis?.what?.is, isNot: r.d2.isNotAnalysis?.what?.isNot },
    { label: isDE ? 'WO  (Ort / Bereich)' : 'WHERE  (Location / Region)', is: r.d2.isAnalysis?.where?.is, isNot: r.d2.isNotAnalysis?.where?.isNot },
    { label: isDE ? 'WANN  (Zeit / Auftreten)' : 'WHEN  (Time / Occurrence)', is: r.d2.isAnalysis?.when?.is, isNot: r.d2.isNotAnalysis?.when?.isNot },
    { label: isDE ? 'WIE VIEL  (Ausmaß / Menge)' : 'HOW MUCH  (Extent / Quantity)', is: r.d2.isAnalysis?.howMany?.is, isNot: r.d2.isNotAnalysis?.howMany?.isNot },
  ]
  for (const ir of isisRows) {
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: ir.label },
      { col: 2, endCol: 5, value: ir.is || '' },
      { col: 6, endCol: 9, value: ir.isNot || '' },
    ])
    ws.getCell(row, 1).font = { bold: true, size: 9, color: { argb: DARK_GRAY } }
    row++
  }

  // Detection method & additional notes
  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 5, isDE ? 'Erkennungsmethode:' : 'Detection Method:', r.d2.detectionMethod)
  kvPair(ws, row, 6, 7, 9, isDE ? 'Zusätzliche Hinweise:' : 'Additional Notes:', r.d2.additionalNotes)
  row++
  row++ // blank

  // ── D3 — Containment Actions ──────────────────────────────────────────
  sectionHeader(ws, row, isDE
    ? 'D3  –  SOFORTMASSNAHMEN  (Unmittelbar / Kurzfristig)'
    : 'D3  –  CONTAINMENT ACTIONS  (Immediate / Short-Term)')
  row++

  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: '#' },
    { col: 2, endCol: 5, text: isDE ? 'Beschreibung der Sofortmaßnahme' : 'Containment Action Description' },
    { col: 6, endCol: 7, text: isDE ? 'Verantwortlicher' : 'Responsible' },
    { col: 8, endCol: 8, text: isDE ? 'Fällig' : 'Due Date' },
    { col: 9, endCol: 9, text: isDE ? 'Wirksamkeit' : 'Effectiveness' },
  ])
  row++

  const d3Actions = r.d3.actions.length > 0 ? r.d3.actions : [null, null, null]
  for (let i = 0; i < Math.max(d3Actions.length, 3); i++) {
    const a = d3Actions[i]
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: String(i + 1) },
      { col: 2, endCol: 5, value: a?.action || '' },
      { col: 6, endCol: 7, value: a?.responsible || '' },
      { col: 8, endCol: 8, value: a?.dueDate || '' },
      { col: 9, endCol: 9, value: a?.effectiveness || '' },
    ], i % 2 === 1)
    row++
  }

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Cleanpoint Lieferung am:' : 'Cleanpoint Delivery On:', r.d3.cleanpointDeliveryOn)
  kvPair(ws, row, 5, 6, 9, isDE ? 'Lieferscheinnummer:' : 'Delivery Note Number:', r.d3.deliveryNoteNumber)
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Geliefert am:' : 'Delivered On:', r.d3.deliveredOn)
  kvPair(ws, row, 5, 6, 7, isDE ? 'Menge i.O.:' : 'Quantity Correct:', r.d3.quantityCorrect)
  kvPair(ws, row, 8, 9, 9, isDE ? 'Menge n.i.O.:' : 'Quantity Incorrect:', r.d3.quantityIncorrect)
  row++

  // Effectiveness verification
  labeledTextArea(ws, row,
    isDE ? 'Wirksamkeitsnachweis der Sofortmaßnahmen:' : 'Effectiveness Verification of Containment Actions:',
    r.d3.effectivenessVerification || '', 1)
  row += 2
  row++ // blank

  // ── D4 — Root Cause Analysis ──────────────────────────────────────────
  sectionHeader(ws, row, isDE
    ? 'D4  –  URSACHENANALYSE  (5-Why: Entstehung | Nichterkennung | Systemisch)'
    : 'D4  –  ROOT CAUSE ANALYSIS  (5-Why: Occurrence | Escape | Systemic)')
  row++

  // --- TUA: 5-Why Occurrence ---
  subHeader(ws, row, isDE
    ? '5-Why Analyse  –  ENTSTEHUNG (TUA)  (Warum ist der Fehler entstanden?)'
    : '5-Why Analysis  –  OCCURRENCE (TUA)  (Why did the defect occur?)')
  row++

  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: isDE ? 'Schritt' : 'Step' },
    { col: 2, endCol: 5, text: isDE ? 'Warum?' : 'Why?  (Question)' },
    { col: 6, endCol: 9, text: isDE ? 'Antwort / Nachweis' : 'Answer / Evidence' },
  ])
  row++

  for (let n = 1; n <= 5; n++) {
    const whyVal = r.d4.tua[`why${n}` as keyof typeof r.d4.tua] as string
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: `Why ${n}` },
      { col: 2, endCol: 5, value: whyVal || '' },
      { col: 6, endCol: 9, value: '' },
    ], n % 2 === 0)
    row++
  }

  // Root Cause row highlighted
  tableRow(ws, row, [
    { col: 1, endCol: 1, value: isDE ? 'Grundursache' : 'Root Cause' },
    { col: 2, endCol: 9, value: r.d4.tua.rootCause || '' },
  ])
  ws.getCell(row, 1).fill = fill(YELLOW_BG)
  ws.getCell(row, 1).font = { bold: true, size: 9 }
  ws.getCell(row, 2).fill = fill(YELLOW_BG)
  row++
  row++ // blank

  // --- TUN: 5-Why Escape ---
  subHeader(ws, row, isDE
    ? '5-Why Analyse  –  NICHTERKENNUNG (TUN)  (Warum wurde der Fehler nicht erkannt?)'
    : '5-Why Analysis  –  ESCAPE (TUN)  (Why was the defect not detected?)')
  row++

  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: isDE ? 'Schritt' : 'Step' },
    { col: 2, endCol: 5, text: isDE ? 'Warum?' : 'Why?  (Question)' },
    { col: 6, endCol: 9, text: isDE ? 'Antwort / Nachweis' : 'Answer / Evidence' },
  ])
  row++

  for (let n = 1; n <= 5; n++) {
    const whyVal = r.d4.tun[`why${n}` as keyof typeof r.d4.tun] as string
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: `Why ${n}` },
      { col: 2, endCol: 5, value: whyVal || '' },
      { col: 6, endCol: 9, value: '' },
    ], n % 2 === 0)
    row++
  }

  tableRow(ws, row, [
    { col: 1, endCol: 1, value: isDE ? 'Grundursache' : 'Root Cause' },
    { col: 2, endCol: 9, value: r.d4.tun.rootCause || '' },
  ])
  ws.getCell(row, 1).fill = fill(YELLOW_BG)
  ws.getCell(row, 1).font = { bold: true, size: 9 }
  ws.getCell(row, 2).fill = fill(YELLOW_BG)
  row++
  row++ // blank

  // --- Systemic (SUA/SUN) ---
  subHeader(ws, row, isDE
    ? '5-Why Analyse  –  SYSTEMISCH  (Warum hat das System dies zugelassen?)'
    : '5-Why Analysis  –  SYSTEMIC  (Why did the system allow this to happen?)')
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 5, isDE ? 'SUA – Systemursache Entstehung:' : 'SUA – Systemic Cause (Occurrence):', r.d4.sua.cause)
  kvPair(ws, row, 6, 7, 9, isDE ? 'Abgeleitet von:' : 'Derived From:', r.d4.sua.derivedFrom)
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 5, isDE ? 'SUN – Systemursache Nichterkennung:' : 'SUN – Systemic Cause (Non-Detection):', r.d4.sun.cause)
  kvPair(ws, row, 6, 7, 9, isDE ? 'Abgeleitet von:' : 'Derived From:', r.d4.sun.derivedFrom)
  row++
  row++ // blank

  // ── D5 — Corrective Actions ───────────────────────────────────────────
  sectionHeader(ws, row, isDE
    ? 'D5  –  KORREKTURMASSNAHMEN  (Auswahl & Planung)'
    : 'D5  –  CORRECTIVE ACTIONS  (Selection & Planning)')
  row++

  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: '#' },
    { col: 2, endCol: 4, text: isDE ? 'Beschreibung der Korrekturmaßnahme' : 'Corrective Action Description' },
    { col: 5, endCol: 6, text: isDE ? 'Bezug Ursache' : 'Addresses Root Cause' },
    { col: 7, endCol: 8, text: isDE ? 'Verantwortlicher' : 'Responsible' },
    { col: 9, endCol: 9, text: isDE ? 'Zieldatum' : 'Target Date' },
  ])
  row++

  const d5Actions = r.d5.actions.length > 0 ? r.d5.actions : [null, null, null]
  for (let i = 0; i < Math.max(d5Actions.length, 3); i++) {
    const a = d5Actions[i]
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: String(i + 1) },
      { col: 2, endCol: 4, value: a?.action || '' },
      { col: 5, endCol: 6, value: a ? `${a.linkedCauseType} – ${a.relatedRootCause}` : '' },
      { col: 7, endCol: 8, value: a?.responsible || '' },
      { col: 9, endCol: 9, value: a?.targetDate || '' },
    ], i % 2 === 1, 28)
    row++
  }

  // Verification methods
  labeledTextArea(ws, row,
    isDE ? 'Geplante Wirksamkeitsverifizierung (Methode & KPI):' : 'Planned Effectiveness Verification (method & KPI):',
    r.d5.plannedVerification || '', 1)
  row += 2
  row++ // blank

  // ── D6 — Implementation ───────────────────────────────────────────────
  sectionHeader(ws, row, isDE
    ? 'D6  –  UMSETZUNG DER KORREKTURMASSNAHMEN'
    : 'D6  –  IMPLEMENTATION OF CORRECTIVE ACTIONS')
  row++

  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: '#' },
    { col: 2, endCol: 3, text: isDE ? 'Maßnahme' : 'Action' },
    { col: 4, endCol: 5, text: isDE ? 'Nachweis der Umsetzung' : 'Evidence of Implementation' },
    { col: 6, endCol: 7, text: isDE ? 'Verantwortlicher' : 'Responsible' },
    { col: 8, endCol: 8, text: isDE ? 'Datum' : 'Impl. Date' },
    { col: 9, endCol: 9, text: isDE ? 'Wirksamkeit' : 'Effectiveness' },
  ])
  row++

  // Use D6 fields as single row
  tableRow(ws, row, [
    { col: 1, endCol: 1, value: '1' },
    { col: 2, endCol: 3, value: localizedImplementationStatus || '' },
    { col: 4, endCol: 5, value: r.d6.verificationResults || '' },
    { col: 6, endCol: 7, value: r.d6.responsible || '' },
    { col: 8, endCol: 8, value: r.d6.implementationDate || '' },
    { col: 9, endCol: 9, value: '' },
  ])
  row++
  // Empty rows 2+3
  for (let i = 2; i <= 3; i++) {
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: String(i) },
      { col: 2, endCol: 3, value: '' },
      { col: 4, endCol: 5, value: '' },
      { col: 6, endCol: 7, value: '' },
      { col: 8, endCol: 8, value: '' },
      { col: 9, endCol: 9, value: '' },
    ], i % 2 === 1)
    row++
  }

  labeledTextArea(ws, row,
    isDE ? 'Sofortmaßnahmen aufgehoben? (Datum & Bestätigung):' : 'Containment Actions Removed? (Date & Confirmation):',
    r.d6.containmentRemoved || '', 1)
  row += 2
  row++ // blank

  // ── D7 — Systemic Measures ────────────────────────────────────────────
  sectionHeader(ws, row, isDE
    ? 'D7  –  SYSTEMISCHE MASSNAHMEN & WIEDERHOLUNGSPRÄVENTION'
    : 'D7  –  SYSTEMIC MEASURES & RECURRENCE PREVENTION')
  row++

  tableHeader(ws, row, [
    { col: 1, endCol: 1, text: isDE ? 'Dokument / System' : 'Document / System' },
    { col: 2, endCol: 4, text: isDE ? 'Maßnahme / Aktualisierung' : 'Action / Update Required' },
    { col: 5, endCol: 6, text: isDE ? 'Übertragung' : 'Transfer to Similar Products / Processes' },
    { col: 7, endCol: 8, text: isDE ? 'Verantwortlicher' : 'Responsible' },
    { col: 9, endCol: 9, text: isDE ? 'Fällig' : 'Due Date' },
  ])
  row++

  const d7Rows = [
    { label: 'FMEA', data: r.d7.fmea },
    { label: isDE ? 'Kontrollplan' : 'Control Plan', data: r.d7.controlPlan },
    { label: isDE ? 'Arbeitsanweisungen' : 'Work Instructions', data: r.d7.workInstructions },
    { label: isDE ? 'Prüfplan' : 'Test / Inspection Plan', data: r.d7.testInspectionPlan },
    { label: isDE ? 'Sonstige Dokumente' : 'Other Documents', data: r.d7.otherDocuments },
  ]
  for (let i = 0; i < d7Rows.length; i++) {
    const rowData = d7Rows[i]
    tableRow(ws, row, [
      { col: 1, endCol: 1, value: rowData.label },
      { col: 2, endCol: 4, value: rowData.data.actionRequired || '' },
      { col: 5, endCol: 6, value: rowData.data.transfer || '' },
      { col: 7, endCol: 8, value: rowData.data.responsible || '' },
      { col: 9, endCol: 9, value: rowData.data.dueDate || '' },
    ], i % 2 === 1)
    ws.getCell(row, 1).font = { bold: true, size: 9 }
    row++
  }
  row++ // blank

  // ── D8 — Closure ──────────────────────────────────────────────────────
  sectionHeader(ws, row, isDE
    ? 'D8  –  BERICHTSABSCHLUSS & TEAMERKENNUNG'
    : 'D8  –  REPORT CLOSURE & TEAM RECOGNITION')
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Abschlussdatum:' : 'Closure Date:', r.d8.closureDate)
  kvPair(ws, row, 5, 6, 9, isDE ? 'Genehmigt von:' : 'Approved By:', r.d8.approvedBy)
  row++

  ws.getRow(row).height = 18
  kvPair(ws, row, 1, 2, 4, isDE ? 'Kundenfreigabe:' : 'Customer Sign-Off:', localizedCustomerSignOff)
  kvPair(ws, row, 5, 6, 9, isDE ? 'Freigabedatum:' : 'Sign-Off Date:', r.d8.signOffDate)
  row++

  labeledTextArea(ws, row, isDE ? 'Lessons Learned:' : 'Lessons Learned:', r.d8.lessonsLearned, 1)
  row += 2

  labeledTextArea(ws, row, isDE ? 'Teamerkennung & Würdigung:' : 'Team Recognition & Acknowledgement:', r.d8.teamRecognition, 1)
  row += 2
  row++ // blank

  // ── Footer ──────────────────────────────────────────────────────────────
  merge(ws, row, 1, COLS)
  const footer = ws.getCell(row, 1)
  footer.value = isDE
    ? '8D-Bericht  |  Strukturierte Problemlösung  |  IATF Solutions'
    : '8D Report  |  Structured Problem Solving  |  IATF Solutions'
  footer.font = { italic: true, size: 8, color: { argb: 'FF94A3B8' } }
  footer.alignment = { horizontal: 'center' }

  // Print setup
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
  }

  ws.views = [{ state: 'frozen', ySplit: 3 }]
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await isAuthenticatedFromRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validate report payload
    const parsed = reportDataSchema.safeParse(body.report)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid report data', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const report = parsed.data as unknown as ReportData
    const language: 'en' | 'de' = body.language ?? 'en'
    const isDE = language === 'de'

    const wb = new ExcelJS.Workbook()
    wb.creator = 'IATF Solutions'
    wb.created = new Date()

    build8DReport(wb, report, isDE)

    const buffer = await wb.xlsx.writeBuffer()
    const filename = `8D-Report-${report.metadata.reportId || 'draft'}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export/xlsx] Error:', err)
    return NextResponse.json(
      { error: 'XLSX generation failed' },
      { status: 500 },
    )
  }
}
