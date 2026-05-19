import { NextRequest, NextResponse } from 'next/server'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer'
import type { ReportData } from '@/modules/eightd/types/report'
import { reportDataSchema } from '@/modules/eightd/schemas/reportValidation'
import { getExportLabels } from '@/modules/eightd/lib/exportLabels'
import {
  localizeApprovalStatus,
  localizeImplementationStatus,
} from '@/modules/eightd/lib/reportValueLocalization'
import { isAuthenticatedFromRequest } from '@/lib/session/session'

export const maxDuration = 60

Font.registerHyphenationCallback((word) => {
  // Keep normal words intact; split long uninterrupted tokens so cells do not overflow.
  if (!word || word.length <= 18) return [word]

  const chunks: string[] = []
  for (let i = 0; i < word.length; i += 12) {
    chunks.push(word.slice(i, i + 12))
  }
  return chunks
})

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 40,
    paddingBottom: 58,
    border: '1 solid #cbd5e1',
    color: '#1a1a1a',
  },
  // Cover
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingRight: 60,
    paddingBottom: 78,
    paddingLeft: 60,
    border: '1 solid #cbd5e1',
    color: '#1a1a1a',
    justifyContent: 'flex-start',
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1d4ed8',
  },
  coverSubtitle: {
    fontSize: 14,
    marginBottom: 40,
    color: '#475569',
  },
  coverMeta: { marginTop: 32 },
  coverMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coverMetaLabel: {
    width: 120,
    fontFamily: 'Helvetica-Bold',
  },
  coverMetaValue: { flex: 1 },
  // Sections
  section: { marginBottom: 20 },
  sectionHeader: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    padding: '6 10',
    marginBottom: 8,
  },
  // Key-value pairs
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingBottom: 4,
    borderBottom: '1 solid #e2e8f0',
  },
  fieldLabel: {
    width: 150,
    paddingRight: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
  fieldValue: { flex: 1, lineHeight: 1.35 },
  // Tables
  table: { marginBottom: 4 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dbeafe',
    fontFamily: 'Helvetica-Bold',
    padding: '4 6',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '4 6',
    borderBottom: '1 solid #f1f5f9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '4 6',
    backgroundColor: '#f8fafc',
    borderBottom: '1 solid #f1f5f9',
  },
  tableCell: {
    lineHeight: 1.3,
    paddingRight: 6,
  },
  // Five-Why
  whyBlock: { marginBottom: 10 },
  whyTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#1d4ed8',
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
     paddingLeft: 8,
  },
  whyLabel: { width: 50, paddingRight: 6, fontFamily: 'Helvetica-Bold', color: '#64748b' },
  whyValue: { flex: 1, lineHeight: 1.3 },
  rootCauseBox: {
    backgroundColor: '#fef9c3',
    padding: '5 8',
    marginTop: 4,
    flexDirection: 'row',
  },
  rootCauseLabel: { fontFamily: 'Helvetica-Bold', width: 80 },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 7,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 4,
  },
  placeholder: {
    padding: 16,
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    textAlign: 'center',
    borderRadius: 4,
  },
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={S.fieldRow}>
      <Text style={S.fieldLabel}>{label}</Text>
      <Text style={S.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={S.sectionHeader}>{title}</Text>
}

function Footer({
  reportId,
  title,
  pageLabel,
}: {
  reportId: string
  title: string
  pageLabel: string
}) {
  return (
    <View style={S.footer} fixed>
      <Text>{title}</Text>
      <Text>{reportId || '—'}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageLabel} ${pageNumber} / ${totalPages}`} />
    </View>
  )
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function EightDDocument({ report, lang }: { report: ReportData; lang: 'en' | 'de' }) {
  const isDE = lang === 'de'
  const { metadata, d1, d2, d3, d4, d5, d6, d7, d8 } = report
  const labels = getExportLabels(lang)
  const localizedImplementationStatus = localizeImplementationStatus(d6.implementationStatus, lang)
  const localizedCustomerApproval = localizeApprovalStatus(d8.customerApproval, lang)
  const localizedCustomerSignOff = localizeApprovalStatus(d8.customerSignOff, lang)
  const pageLabel = isDE ? 'Seite' : 'Page'

  const whyLabels = isDE
    ? ['Warum 1', 'Warum 2', 'Warum 3', 'Warum 4', 'Warum 5']
    : ['Why 1', 'Why 2', 'Why 3', 'Why 4', 'Why 5']

  return (
    <Document title={`${labels.reportTitle} - ${metadata.reportId}`} author="IATF Solutions">
      {/* Cover Page */}
      <Page size="A4" style={S.coverPage}>
        <Text style={S.coverTitle}>{labels.reportTitle}</Text>
        <Text style={S.coverSubtitle}>{labels.iatfLabel}</Text>
        <View style={{ height: 2, backgroundColor: '#1d4ed8', marginBottom: 32 }} />
        <View style={S.coverMeta}>
          {[
            [labels.reportId, metadata.reportId],
            [labels.customer, metadata.customer],
            [labels.supplier, metadata.supplier],
            [labels.product, metadata.productName],
            [labels.partNumber, metadata.partNumber],
            [labels.customerComplaintNumber, metadata.customerComplaintNumber],
            [labels.customerPartNumber, metadata.customerPartNumber],
            [labels.supplierPartNumber, metadata.supplierPartNumber],
            [labels.reportDate, metadata.reportDate],
          ].map(([lbl, val]) => (
            <View style={S.coverMetaRow} key={lbl}>
              <Text style={S.coverMetaLabel}>{lbl}:</Text>
              <Text style={S.coverMetaValue}>{val || '—'}</Text>
            </View>
          ))}
        </View>
        <Footer reportId={metadata.reportId} title={labels.reportTitle} pageLabel={pageLabel} />
      </Page>

      {/* D1 + D2 */}
      <Page size="A4" style={S.page}>
        <View style={S.section}>
          <SectionHeader title={labels.team} />
          <Field label={isDE ? 'Teamleiter' : 'Team Leader'} value={d1.teamLeader} />
          <Field label={isDE ? 'QualitÃ¤t' : 'Quality Rep.'} value={d1.qualityRep} />
          <Field label={isDE ? 'Produktion' : 'Production Rep.'} value={d1.productionRep} />
          <Field label={isDE ? 'Engineering' : 'Engineering Rep.'} value={d1.engineeringRep} />
          <Field label={isDE ? 'Weitere Mitglieder' : 'Additional Members'} value={d1.additionalMembers} />
        </View>

        <View style={S.section}>
          <SectionHeader title={labels.problem} />
          <Field label={labels.what} value={d2.what} />
          <Field label={labels.where} value={d2.where} />
          <Field label={labels.when} value={d2.when} />
          <Field label={labels.howMany} value={d2.howMany} />
          <Field label={labels.detection} value={d2.detectionMethod} />
          <Field label={labels.customerText} value={d2.customerComplaintText} />
          <Field label={labels.notes} value={d2.additionalNotes} />
        </View>
        <Footer reportId={metadata.reportId} title={labels.reportTitle} pageLabel={pageLabel} />
      </Page>

      {/* D3 Containment */}
      <Page size="A4" style={S.page}>
        <View style={S.section}>
          <SectionHeader title={labels.containment} />
          {d3.actions.length === 0 ? (
            <Text style={S.placeholder}>{labels.noData}</Text>
          ) : (
            <View style={S.table}>
              <View style={S.tableHeader}>
                <Text style={[S.tableCell, { flex: 3 }]}>{labels.action}</Text>
                <Text style={[S.tableCell, { flex: 2 }]}>{labels.responsible}</Text>
                <Text style={[S.tableCell, { flex: 1 }]}>{labels.dueDate}</Text>
              </View>
              {d3.actions.map((a, i) => (
                <View style={i % 2 === 0 ? S.tableRow : S.tableRowAlt} key={a.id || i}>
                  <Text style={[S.tableCell, { flex: 3 }]}>{a.action || '—'}</Text>
                  <Text style={[S.tableCell, { flex: 2 }]}>{a.responsible || '—'}</Text>
                  <Text style={[S.tableCell, { flex: 1 }]}>{a.dueDate || '—'}</Text>
                </View>
              ))}
            </View>
          )}
          <Field label={labels.cleanpointDeliveryOn} value={d3.cleanpointDeliveryOn} />
          <Field label={labels.deliveryNoteNumber} value={d3.deliveryNoteNumber} />
          <Field label={labels.deliveredOn} value={d3.deliveredOn} />
          <Field label={labels.quantityCorrect} value={d3.quantityCorrect} />
          <Field label={labels.quantityIncorrect} value={d3.quantityIncorrect} />
        </View>
        <Footer reportId={metadata.reportId} title={labels.reportTitle} pageLabel={pageLabel} />
      </Page>

      {/* D4 Root Cause (VDA 8D: TUA/TUN/SUA/SUN) */}
      <Page size="A4" style={S.page}>
        <View style={S.section}>
          <SectionHeader title={labels.rootCause} />

          {/* TUA chain */}
          <View style={S.whyBlock}>
            <Text style={S.whyTitle}>{labels.tua}</Text>
            {whyLabels.map((lbl, i) => {
              const val = d4.tua[`why${i + 1}` as keyof typeof d4.tua]
              return (
                <View style={S.whyRow} key={lbl}>
                  <Text style={S.whyLabel}>{lbl}:</Text>
                  <Text style={S.whyValue}>{(val as string) || '—'}</Text>
                </View>
              )
            })}
            <View style={S.rootCauseBox}>
              <Text style={S.rootCauseLabel}>{labels.rootCauseLabel}:</Text>
              <Text style={{ flex: 1 }}>{d4.tua.rootCause || '—'}</Text>
            </View>
          </View>

          {/* TUN chain */}
          <View style={S.whyBlock}>
            <Text style={S.whyTitle}>{labels.tun}</Text>
            {whyLabels.map((lbl, i) => {
              const val = d4.tun[`why${i + 1}` as keyof typeof d4.tun]
              return (
                <View style={S.whyRow} key={lbl}>
                  <Text style={S.whyLabel}>{lbl}:</Text>
                  <Text style={S.whyValue}>{(val as string) || '—'}</Text>
                </View>
              )
            })}
            <View style={S.rootCauseBox}>
              <Text style={S.rootCauseLabel}>{labels.rootCauseLabel}:</Text>
              <Text style={{ flex: 1 }}>{d4.tun.rootCause || '—'}</Text>
            </View>
          </View>

          {/* SUA */}
          <View style={S.whyBlock}>
            <Text style={S.whyTitle}>{labels.sua}</Text>
            <View style={S.whyRow}>
              <Text style={S.whyLabel}>{labels.systemicCause}:</Text>
              <Text style={S.whyValue}>{d4.sua.cause || '—'}</Text>
            </View>
            <View style={S.whyRow}>
              <Text style={S.whyLabel}>{labels.derivedFrom}:</Text>
              <Text style={S.whyValue}>{d4.sua.derivedFrom || '—'}</Text>
            </View>
          </View>

          {/* SUN */}
          <View style={S.whyBlock}>
            <Text style={S.whyTitle}>{labels.sun}</Text>
            <View style={S.whyRow}>
              <Text style={S.whyLabel}>{labels.systemicCause}:</Text>
              <Text style={S.whyValue}>{d4.sun.cause || '—'}</Text>
            </View>
            <View style={S.whyRow}>
              <Text style={S.whyLabel}>{labels.derivedFrom}:</Text>
              <Text style={S.whyValue}>{d4.sun.derivedFrom || '—'}</Text>
            </View>
          </View>
        </View>
        <Footer reportId={metadata.reportId} title={labels.reportTitle} pageLabel={pageLabel} />
      </Page>

      {/* D5 Corrective Actions */}
      <Page size="A4" style={[S.page, { paddingLeft: 30, paddingRight: 30 }]} orientation="landscape">
        <View style={S.section}>
          <SectionHeader title={labels.corrective} />
          {d5.actions.length === 0 ? (
            <Text style={S.placeholder}>{labels.noData}</Text>
          ) : (
            <View style={S.table}>
              <View style={S.tableHeader}>
                <Text style={[S.tableCell, { flex: 4 }]}>{labels.action}</Text>
                <Text style={[S.tableCell, { flex: 2 }]}>{labels.relatedCause}</Text>
                <Text style={[S.tableCell, { flex: 2 }]}>{labels.responsible}</Text>
                <Text style={[S.tableCell, { flex: 1 }]}>{labels.targetDate}</Text>
                <Text style={[S.tableCell, { flex: 2 }]}>{labels.verification}</Text>
              </View>
              {d5.actions.map((a, i) => (
                <View style={i % 2 === 0 ? S.tableRow : S.tableRowAlt} key={a.id || i}>
                  <Text style={[S.tableCell, { flex: 4 }]}>{a.action || '—'}</Text>
                  <Text style={[S.tableCell, { flex: 2 }]}>{a.relatedRootCause || '—'}</Text>
                  <Text style={[S.tableCell, { flex: 2 }]}>{a.responsible || '—'}</Text>
                  <Text style={[S.tableCell, { flex: 1 }]}>{a.targetDate || '—'}</Text>
                  <Text style={[S.tableCell, { flex: 2 }]}>{a.verificationMethod || '—'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Footer reportId={metadata.reportId} title={labels.reportTitle} pageLabel={pageLabel} />
      </Page>

      {/* D6 – D8 */}
      <Page size="A4" style={S.page}>
        <View style={S.section}>
          <SectionHeader title={labels.implementation} />
          <Field label={labels.implStatus} value={localizedImplementationStatus} />
          <Field label={labels.implDate} value={d6.implementationDate} />
          <Field label={labels.implResp} value={d6.responsible} />
          <Field label={labels.implVerif} value={d6.verificationResults} />
        </View>

        <View style={S.section}>
          <SectionHeader title={labels.prevention} />
          <Field label={labels.preventMeasures} value={d7.fmea.actionRequired} />
          <Field
            label={labels.processDoc}
            value={[
              `FMEA: ${d7.fmea.actionRequired}`,
              `${isDE ? 'Kontrollplan' : 'Control Plan'}: ${d7.controlPlan.actionRequired}`,
              `${isDE ? 'Arbeitsanweisungen' : 'Work Instructions'}: ${d7.workInstructions.actionRequired}`,
              `${isDE ? 'Prüf-/Inspektionsplan' : 'Test/Inspection Plan'}: ${d7.testInspectionPlan.actionRequired}`,
              `${isDE ? 'Sonstige' : 'Other'}: ${d7.otherDocuments.actionRequired}`,
            ].join('\n')}
          />
          <Field
            label={labels.training}
            value={[
              `FMEA ${isDE ? 'Verantw.' : 'Resp'}: ${d7.fmea.responsible} (${d7.fmea.dueDate})`,
              `${isDE ? 'Kontrollplan' : 'Control Plan'} ${isDE ? 'Verantw.' : 'Resp'}: ${d7.controlPlan.responsible} (${d7.controlPlan.dueDate})`,
              `${isDE ? 'Arbeitsanweisungen' : 'Work Instructions'} ${isDE ? 'Verantw.' : 'Resp'}: ${d7.workInstructions.responsible} (${d7.workInstructions.dueDate})`,
              `${isDE ? 'Prüfplan' : 'Test Plan'} ${isDE ? 'Verantw.' : 'Resp'}: ${d7.testInspectionPlan.responsible} (${d7.testInspectionPlan.dueDate})`,
              `${isDE ? 'Sonstige' : 'Other'} ${isDE ? 'Verantw.' : 'Resp'}: ${d7.otherDocuments.responsible} (${d7.otherDocuments.dueDate})`,
            ].join('\n')}
          />
        </View>

        <View style={S.section}>
          <SectionHeader title={labels.closure} />
          <Field
            label={labels.custApproval}
            value={`${localizedCustomerApproval}${localizedCustomerSignOff ? ` | ${isDE ? 'Kundenabnahme' : 'Sign-off'}: ${localizedCustomerSignOff}` : ''}`}
          />
          <Field
            label={labels.closureDate}
            value={`${d8.closureDate}${d8.signOffDate ? ` | ${isDE ? 'Abnahmedatum' : 'Sign-off Date'}: ${d8.signOffDate}` : ''}`}
          />
          <Field label={labels.implResp} value={d8.approvedBy} />
          <Field label={labels.lessons} value={d8.lessonsLearned} />
          <Field label={labels.recognition} value={d8.teamRecognition} />
        </View>
        <Footer reportId={metadata.reportId} title={labels.reportTitle} pageLabel={pageLabel} />
      </Page>
    </Document>
  )
}

async function renderPdfBuffer(report: ReportData, language: 'en' | 'de') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(<EightDDocument report={report} lang={language} /> as any)
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

    const buffer = await renderPdfBuffer(report, language)

    const filename = `8D-Report-${report.metadata.reportId || 'draft'}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (err) {
    console.error('[export/pdf] Error:', err)
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 },
    )
  }
}
