'use client'

import { useState } from 'react'
import type { Metadata, D1Team } from '@/modules/eightd/types/report'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FormField } from '@/modules/eightd/components/shared/FormField'
import { StepCardHeader } from '@/modules/eightd/components/shared/StepCardHeader'
import { StepNavigation } from '@/modules/eightd/components/shared/StepNavigation'
import { TemplateSection } from '@/modules/eightd/components/steps/TemplateSection'

interface Step1FormProps {
  metadata: Metadata
  d1: D1Team
  onChangeMetadata: (m: Metadata) => void
  onChangeD1: (d: D1Team) => void
  onNext: () => void
}

export function Step1Form({
  metadata,
  d1,
  onChangeMetadata,
  onChangeD1,
  onNext,
}: Step1FormProps) {
  const t = useTranslations('s1')
  const tVal = useTranslations('validation')
  const [attempted, setAttempted] = useState(false)

  const updateMeta = (field: keyof Metadata, value: string) =>
    onChangeMetadata({ ...metadata, [field]: value })

  const updateD1 = (field: keyof D1Team, value: string) =>
    onChangeD1({ ...d1, [field]: value })

  const canProceed =
    metadata.reportId.trim() !== '' &&
    metadata.customer.trim() !== '' &&
    metadata.supplier.trim() !== '' &&
    metadata.productName.trim() !== '' &&
    metadata.partNumber.trim() !== '' &&
    metadata.complaintDate.trim() !== '' &&
    metadata.reportDate.trim() !== '' &&
    d1.teamLeader.trim() !== ''

  const handleNext = () => {
    if (!canProceed) {
      setAttempted(true)
      return
    }
    onNext()
  }

  /** Returns an error string if the field is empty and validation has been attempted */
  const reqErr = (value: string) =>
    attempted && value.trim() === '' ? tVal('required') : undefined

  return (
    <div className="space-y-6">
      <Card>
        <StepCardHeader
          title={t('metaTitle')}
          description={t('metaDesc')}
          templateFlow={t('templateFlow')}
        />
        <CardContent className="space-y-5">
          <TemplateSection title={t('idSectionTitle')} description={t('idSectionDesc')}>
            <div className="grid gap-4 xl:grid-cols-4">
              <FormField
                type="input"
                id="reportId"
                label={t('reportId')}
                placeholder={t('reportIdPh')}
                value={metadata.reportId}
                onChange={(v) => updateMeta('reportId', v)}
                className="space-y-1.5 xl:col-span-1"
                error={reqErr(metadata.reportId)}
              />
              <FormField
                type="date"
                label={t('reportDate')}
                value={metadata.reportDate}
                onChange={(v) => updateMeta('reportDate', v)}
                placeholder={t('reportDate')}
                className="space-y-1.5 xl:col-span-1"
                error={reqErr(metadata.reportDate)}
              />
              <FormField
                type="input"
                id="location"
                label={t('location')}
                placeholder={t('locationPh')}
                value={metadata.location}
                onChange={(v) => updateMeta('location', v)}
                className="space-y-1.5 xl:col-span-1"
              />
              <FormField
                type="input"
                id="internalReference"
                label={t('internalRef')}
                placeholder={t('optional')}
                value={metadata.internalReference}
                onChange={(v) => updateMeta('internalReference', v)}
                className="space-y-1.5 xl:col-span-1"
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('contextSectionTitle')} description={t('contextSectionDesc')}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FormField
                type="input"
                id="customer"
                label={t('customer')}
                placeholder={t('customerPh')}
                value={metadata.customer}
                onChange={(v) => updateMeta('customer', v)}
                className="space-y-1.5 xl:col-span-1"
                error={reqErr(metadata.customer)}
              />
              <FormField
                type="input"
                id="productName"
                label={t('productName')}
                placeholder={t('productNamePh')}
                value={metadata.productName}
                onChange={(v) => updateMeta('productName', v)}
                className="space-y-1.5 xl:col-span-1"
                error={reqErr(metadata.productName)}
              />
              <FormField
                type="input"
                id="partNumber"
                label={t('partNumber')}
                placeholder={t('partNumberPh')}
                value={metadata.partNumber}
                onChange={(v) => updateMeta('partNumber', v)}
                className="space-y-1.5 xl:col-span-1"
                error={reqErr(metadata.partNumber)}
              />
              <FormField
                type="input"
                id="supplier"
                label={t('supplier')}
                placeholder={t('supplierPh')}
                value={metadata.supplier}
                onChange={(v) => updateMeta('supplier', v)}
                className="space-y-1.5 xl:col-span-1"
                error={reqErr(metadata.supplier)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FormField
                type="input"
                id="customerComplaintNumber"
                label={t('customerComplaintNumber')}
                placeholder={t('customerComplaintNumberPh')}
                value={metadata.customerComplaintNumber}
                onChange={(v) => updateMeta('customerComplaintNumber', v)}
              />
              <FormField
                type="input"
                id="customerPartNumber"
                label={t('customerPartNumber')}
                placeholder={t('customerPartNumberPh')}
                value={metadata.customerPartNumber}
                onChange={(v) => updateMeta('customerPartNumber', v)}
              />
              <FormField
                type="input"
                id="supplierPartNumber"
                label={t('supplierPartNumber')}
                placeholder={t('supplierPartNumberPh')}
                value={metadata.supplierPartNumber}
                onChange={(v) => updateMeta('supplierPartNumber', v)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FormField
                type="date"
                label={t('complaintDate')}
                value={metadata.complaintDate}
                onChange={(v) => updateMeta('complaintDate', v)}
                placeholder={t('complaintDate')}
                error={reqErr(metadata.complaintDate)}
              />
              <FormField
                type="input"
                id="batchLotNumber"
                label={t('batchLot')}
                placeholder={t('optional')}
                value={metadata.batchLotNumber}
                onChange={(v) => updateMeta('batchLotNumber', v)}
              />
              <FormField
                type="date"
                label={t('deadline')}
                value={metadata.deadline}
                onChange={(v) => updateMeta('deadline', v)}
                placeholder={t('deadline')}
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('controlSectionTitle')} description={t('controlSectionDesc')}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FormField
                type="select"
                label={t('priority')}
                value={metadata.priority}
                onChange={(v) => updateMeta('priority', v)}
                placeholder={t('optional')}
                options={[
                  { value: 'low', label: t('priorityLow') },
                  { value: 'medium', label: t('priorityMedium') },
                  { value: 'high', label: t('priorityHigh') },
                  { value: 'critical', label: t('priorityCritical') },
                ]}
              />
              <FormField
                type="input"
                id="createdBy"
                label={t('createdBy')}
                placeholder={t('fullName')}
                value={metadata.createdBy}
                onChange={(v) => updateMeta('createdBy', v)}
              />
              <FormField
                type="input"
                id="department"
                label={t('department')}
                placeholder={t('departmentPh')}
                value={metadata.department}
                onChange={(v) => updateMeta('department', v)}
              />
              <FormField
                type="select"
                label={t('reportStatus')}
                value={metadata.reportStatus}
                onChange={(v) => updateMeta('reportStatus', v)}
                placeholder={t('optional')}
                options={[
                  { value: 'open', label: t('statusOpen') },
                  { value: 'in-progress', label: t('statusInProgress') },
                  { value: 'closed', label: t('statusClosed') },
                ]}
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('symptomSectionTitle')} description={t('symptomSectionDesc')}>
            <FormField
              type="textarea"
              id="symptomDescription"
              label={t('symptomDesc')}
              placeholder={t('symptomDescPh')}
              rows={4}
              value={metadata.symptomDescription}
              onChange={(v) => updateMeta('symptomDescription', v)}
            />
          </TemplateSection>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <StepCardHeader title={t('d1Title')} description={t('d1Desc')} />
        <CardContent className="space-y-5">
          <TemplateSection title={t('teamCoreTitle')} description={t('teamCoreDesc')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                type="input"
                id="teamLeader"
                label={t('teamLeader')}
                placeholder={t('fullName')}
                value={d1.teamLeader}
                onChange={(v) => updateD1('teamLeader', v)}
                error={reqErr(d1.teamLeader)}
              />
              <FormField
                type="input"
                id="qualityRep"
                label={t('qualityRep')}
                placeholder={t('fullName')}
                value={d1.qualityRep}
                onChange={(v) => updateD1('qualityRep', v)}
              />
              <FormField
                type="input"
                id="productionRep"
                label={t('productionRep')}
                placeholder={t('fullName')}
                value={d1.productionRep}
                onChange={(v) => updateD1('productionRep', v)}
              />
              <FormField
                type="input"
                id="engineeringRep"
                label={t('engineeringRep')}
                placeholder={t('fullName')}
                value={d1.engineeringRep}
                onChange={(v) => updateD1('engineeringRep', v)}
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('teamSupportTitle')} description={t('teamSupportDesc')}>
            <FormField
              type="input"
              id="sponsor"
              label={t('sponsor')}
              placeholder={t('fullName')}
              value={d1.sponsor}
              onChange={(v) => updateD1('sponsor', v)}
            />
            <div className="space-y-1.5">
              <Label htmlFor="additionalMembers">{t('additionalMembers')}</Label>
              <Textarea
                id="additionalMembers"
                placeholder={t('additionalMembersPh')}
                rows={4}
                value={d1.additionalMembers}
                onChange={(e) => updateD1('additionalMembers', e.target.value)}
              />
            </div>
          </TemplateSection>
        </CardContent>
      </Card>

      <StepNavigation
        onNext={handleNext}
        nextDisabled={false}
        nextLabel={t('nextBtn')}
      />
    </div>
  )
}
