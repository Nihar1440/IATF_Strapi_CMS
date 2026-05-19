'use client'

import type { ReportData } from '@/modules/eightd/types/report'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { SystemicMeasureItem } from '@/modules/eightd/types/report'
import {
  localizeApprovalStatus,
  localizeImplementationStatus,
  localizePriority,
  localizeReportStatus,
} from '@/modules/eightd/lib/reportValueLocalization'

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap">{value}</span>
    </div>
  )
}

function formatMeasure(item: Partial<SystemicMeasureItem> | undefined) {
  if (!item) return ''
  return [item.actionRequired, item.transfer, item.responsible, item.dueDate]
    .filter((value): value is string => Boolean(value))
    .join(' | ')
}

function formatIsIsNotValue(
  language: 'en' | 'de',
  isValue: string,
  isNotValue: string,
) {
  const cleanedIs = isValue.trim()
  const cleanedIsNot = isNotValue.trim()
  if (!cleanedIs && !cleanedIsNot) return ''

  const isPrefix = language === 'de' ? 'IST' : 'IS'
  const isNotPrefix = language === 'de' ? 'IST NICHT' : 'IS NOT'
  const parts = []
  if (cleanedIs) parts.push(`${isPrefix}: ${cleanedIs}`)
  if (cleanedIsNot) parts.push(`${isNotPrefix}: ${cleanedIsNot}`)
  return parts.join(' | ')
}

/* ─── PreviewScreen ───────────────────────────────────────────────────── */

interface PreviewScreenProps {
  report: ReportData
  onBack: () => void
  onNext: () => void
}

export function PreviewScreen({ report, onBack, onNext }: PreviewScreenProps) {
  const t = useTranslations('preview')
  const locale = useLocale()
  const { metadata, d1, d2, d3, d4, d5, d6, d7, d8 } = report
  const language = locale === 'de' ? 'de' : 'en'
  const localizedPriority = localizePriority(metadata.priority, language)
  const localizedReportStatus = localizeReportStatus(metadata.reportStatus, language)
  const localizedImplementationStatus = localizeImplementationStatus(d6.implementationStatus, language)
  const localizedCustomerApproval = localizeApprovalStatus(d8.customerApproval, language)
  const localizedCustomerSignOff = localizeApprovalStatus(d8.customerSignOff, language)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
      </div>

      {/* Report Info */}
      <Section title={t('reportInfo')}>
        <Row label={t('reportId')} value={metadata.reportId} />
        <Row label={t('customer')} value={metadata.customer} />
        <Row label={t('supplier')} value={metadata.supplier} />
        <Row label={t('product')} value={metadata.productName} />
        <Row label={t('partNumber')} value={metadata.partNumber} />
        <Row label={t('customerComplaintNumber')} value={metadata.customerComplaintNumber} />
        <Row label={t('customerPartNumber')} value={metadata.customerPartNumber} />
        <Row label={t('supplierPartNumber')} value={metadata.supplierPartNumber} />
        <Row label={t('complaintDate')} value={metadata.complaintDate} />
        <Row label={t('reportDate')} value={metadata.reportDate} />
        <Row label={t('priority')} value={localizedPriority} />
        <Row label={t('deadline')} value={metadata.deadline} />
        <Row label={t('createdBy')} value={metadata.createdBy} />
        <Row label={t('department')} value={metadata.department} />
        <Row label={t('reportStatus')} value={localizedReportStatus} />
        <Row label={t('location')} value={metadata.location} />
        <Row label={t('internalRef')} value={metadata.internalReference} />
        <Row label={t('batchLot')} value={metadata.batchLotNumber} />
        <Row label={t('symptomDesc')} value={metadata.symptomDescription} />
      </Section>

      {/* D1 — Team */}
      <Section title={t('d1')}>
        <Row label={t('teamLeader')} value={d1.teamLeader} />
        <Row label={t('qualityRep')} value={d1.qualityRep} />
        <Row label={t('productionRep')} value={d1.productionRep} />
        <Row label={t('engineeringRep')} value={d1.engineeringRep} />
        <Row label={t('sponsor')} value={d1.sponsor} />
        <Row label={t('additional')} value={d1.additionalMembers} />
      </Section>

      {/* D2 — Problem */}
      <Section title={t('d2')}>
        <Row label={t('what')} value={d2.what} />
        <Row label={t('where')} value={d2.where} />
        <Row label={t('when')} value={d2.when} />
        <Row label={t('howMany')} value={d2.howMany} />
        <Row label={t('detection')} value={d2.detectionMethod} />
        <Row label={t('complaint')} value={d2.customerComplaintText} />
        <Row label={t('failureCode')} value={d2.internalFailureCode} />
        <Row
          label={t('isWhat')}
          value={formatIsIsNotValue(language, d2.isAnalysis.what.is, d2.isNotAnalysis.what.isNot)}
        />
        <Row
          label={t('isWhere')}
          value={formatIsIsNotValue(language, d2.isAnalysis.where.is, d2.isNotAnalysis.where.isNot)}
        />
        <Row
          label={t('isWhen')}
          value={formatIsIsNotValue(language, d2.isAnalysis.when.is, d2.isNotAnalysis.when.isNot)}
        />
        <Row
          label={t('isHowMany')}
          value={formatIsIsNotValue(language, d2.isAnalysis.howMany.is, d2.isNotAnalysis.howMany.isNot)}
        />
        <Row label={t('notes')} value={d2.additionalNotes} />
      </Section>

      {/* D3 — Containment */}
      <Section title={t('d3')}>
        {d3.actions.length === 0 ? (
          <p className="text-muted-foreground">{t('noContainment')}</p>
        ) : (
          d3.actions.map((a, i) => (
            <div key={a.id} className="space-y-1">
              {i > 0 && <Separator className="my-2" />}
              <p className="font-medium">
                {t('action')} {i + 1}: {a.action}
              </p>
              <Row label={t('responsible')} value={a.responsible} />
              <Row label={t('dueDate')} value={a.dueDate} />
              <Row label={t('effectiveness')} value={a.effectiveness} />
              <Row label={t('notes')} value={a.notes} />
            </div>
          ))
        )}
        <Row label={t('cleanpointDeliveryOn')} value={d3.cleanpointDeliveryOn} />
        <Row label={t('deliveryNoteNumber')} value={d3.deliveryNoteNumber} />
        <Row label={t('deliveredOn')} value={d3.deliveredOn} />
        <Row label={t('quantityCorrect')} value={d3.quantityCorrect} />
        <Row label={t('quantityIncorrect')} value={d3.quantityIncorrect} />
        <Row label={t('effectivenessVerification')} value={d3.effectivenessVerification} />
      </Section>

      {/* D4 — Root Cause (VDA 8D: TUA/TUN/SUA/SUN) */}
      <Section title={t('d4')}>
        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
          {t('tuaChain')}
        </p>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const val = d4.tua[`why${n}` as keyof typeof d4.tua]
          return val ? (
            <Row key={n} label={t('why', { n })} value={val as string} />
          ) : null
        })}
        <Row label={t('rootCause')} value={d4.tua.rootCause} />

        <Separator className="my-2" />

        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
          {t('tunChain')}
        </p>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const val = d4.tun[`why${n}` as keyof typeof d4.tun]
          return val ? (
            <Row key={n} label={t('why', { n })} value={val as string} />
          ) : null
        })}
        <Row label={t('rootCause')} value={d4.tun.rootCause} />

        <Separator className="my-2" />

        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
          {t('suaLabel')}
        </p>
        <Row label={t('systemicCause')} value={d4.sua.cause} />
        <Row label={t('derivedFrom')} value={d4.sua.derivedFrom} />

        <Separator className="my-2" />

        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
          {t('sunLabel')}
        </p>
        <Row label={t('systemicCause')} value={d4.sun.cause} />
        <Row label={t('derivedFrom')} value={d4.sun.derivedFrom} />
      </Section>

      {/* D5 — Corrective Actions */}
      <Section title={t('d5')}>
        {d5.actions.length === 0 ? (
          <p className="text-muted-foreground">{t('noCorrective')}</p>
        ) : (
          d5.actions.map((a, i) => (
            <div key={a.id} className="space-y-1">
              {i > 0 && <Separator className="my-2" />}
              <p className="font-medium">{a.action}</p>
              <Row label={t('responsible')} value={a.responsible} />
              <Row label={t('targetDate')} value={a.targetDate} />
              <Row
                label={t('verificationLabel')}
                value={a.verificationMethod}
              />
            </div>
          ))
        )}
        <Row label={t('plannedVerification')} value={d5.plannedVerification} />
      </Section>

      {/* D6 — Implementation */}
      <Section title={t('d6')}>
        <Row label={t('status')} value={localizedImplementationStatus} />
        <Row label={t('date')} value={d6.implementationDate} />
        <Row label={t('responsible')} value={d6.responsible} />
        <Row label={t('verification')} value={d6.verificationResults} />
        <Row label={t('containmentRemoved')} value={d6.containmentRemoved} />
      </Section>

      {/* D7 — Prevention */}
      <Section title={t('d7')}>
        <Row label={t('docFmea')} value={formatMeasure(d7?.fmea)} />
        <Row label={t('docControlPlan')} value={formatMeasure(d7?.controlPlan)} />
        <Row label={t('docWorkInstructions')} value={formatMeasure(d7?.workInstructions)} />
        <Row label={t('docTestInspectionPlan')} value={formatMeasure(d7?.testInspectionPlan)} />
        <Row label={t('docOtherDocuments')} value={formatMeasure(d7?.otherDocuments)} />
      </Section>

      {/* D8 — Closure */}
      <Section title={t('d8')}>
        <Row label={t('status')} value={localizedCustomerApproval} />
        <Row label={t('closureDate')} value={d8.closureDate} />
        <Row label={t('approvedBy')} value={d8.approvedBy} />
        <Row label={t('customerSignOff')} value={localizedCustomerSignOff} />
        <Row label={t('signOffDate')} value={d8.signOffDate} />
        <Row label={t('lessons')} value={d8.lessonsLearned} />
        <Row label={t('recognition')} value={d8.teamRecognition} />
      </Section>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t('backBtn')}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button />}>
            {t('nextBtn')}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirmExportTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmExportDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('confirmExportCancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onNext}>
                {t('confirmExportProceed')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
