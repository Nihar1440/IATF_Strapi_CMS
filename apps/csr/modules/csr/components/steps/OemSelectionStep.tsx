'use client'

import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, X } from 'lucide-react'
import type { OemId, Language, OemInfo } from '../../types'
import { OEM_CATALOG } from '../../data'

interface Props {
  selectedOems: OemId[]
  language: Language
  onChangeOems: (oems: OemId[]) => void
  onChangeLanguage: (lang: Language) => void
  companyName: string
  companyLocation: string
  onChangeCompanyName: (v: string) => void
  onChangeCompanyLocation: (v: string) => void
  companyLogo?: string
  onChangeLogo: (logo: string | undefined) => void
  onNext: () => void
}

export function OemSelectionStep({
  selectedOems,
  language,
  onChangeOems,
  onChangeLanguage,
  companyName,
  companyLocation,
  onChangeCompanyName,
  onChangeCompanyLocation,
  companyLogo,
  onChangeLogo,
  onNext,
}: Props) {
  const t = useTranslations('csr')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [catalog, setCatalog] = useState<OemInfo[]>(OEM_CATALOG)

  useEffect(() => {
    let cancelled = false
    fetch('/api/csr/oems')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { oems: OemInfo[] } | null) => {
        if (!cancelled && data?.oems?.length) {
          setCatalog(data.oems)
        }
      })
      .catch(() => { /* keep local catalog */ })
    return () => { cancelled = true }
  }, [])

  function toggleOem(oemId: OemId) {
    if (selectedOems.includes(oemId)) {
      onChangeOems(selectedOems.filter((id) => id !== oemId))
    } else {
      onChangeOems([...selectedOems, oemId])
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return // 2 MB max
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeLogo(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const canProceed = selectedOems.length > 0

  return (
    <div className="r-space-y-section">
      <Card>
        <CardHeader>
          <CardTitle className="r-text-lg">{t('step1Title')}</CardTitle>
          <CardDescription className="r-text-sm">{t('step1Desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 r-gap-sm sm:grid-cols-2">
            {catalog.map((oem) => {
              const checked = selectedOems.includes(oem.id)
              return (
                <label
                  key={oem.id}
                  className={`flex cursor-pointer items-center r-gap-sm rounded-lg border r-p transition-colors ${checked
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOem(oem.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="r-text-sm font-medium text-neutral-900">
                      {oem.name}
                    </p>
                    <div className="r-mt-sm flex items-center r-gap-xs flex-wrap">
                      <Badge variant="outline" className="r-text-xs">
                        {oem.csrCount} {t('requirements')}
                      </Badge>
                      <span className="r-text-xs text-neutral-400">
                        {t('lastUpdate')}: {oem.lastUpdate}
                      </span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="r-text-lg">{t('optionalInfo')}</CardTitle>
          <CardDescription className="r-text-sm">{t('optionalInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="r-space-y">
          <div className="grid grid-cols-1 r-gap sm:grid-cols-2">
            <div className="r-space-y-sm">
              <Label htmlFor="companyName" className="r-text-sm">{t('companyName')}</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => onChangeCompanyName(e.target.value)}
                placeholder={t('companyNamePh')}
                className="r-text-sm"
              />
            </div>
            <div className="r-space-y-sm">
              <Label htmlFor="companyLocation" className="r-text-sm">{t('companyLocation')}</Label>
              <Input
                id="companyLocation"
                value={companyLocation}
                onChange={(e) => onChangeCompanyLocation(e.target.value)}
                placeholder={t('companyLocationPh')}
                className="r-text-sm"
              />
            </div>
          </div>

          {/* <div className="r-space-y-sm">
            <Label className="r-text-sm">{t('outputLanguage')}</Label>
            <Select value={language} onValueChange={(v) => onChangeLanguage(v as Language)}>
              <SelectTrigger className="w-full sm:w-48 r-text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          {/* Company Logo Upload */}
          <div className="r-space-y-sm">
            <Label className="r-text-sm">{t('companyLogo')}</Label>
            <p className="r-text-xs text-neutral-500">{t('companyLogoDesc')}</p>
            {companyLogo ? (
              <div className="flex items-center r-gap-sm">
                <Image
                  src={companyLogo}
                  alt="Company logo"
                  width={160}
                  height={48}
                  unoptimized
                  className="h-10 max-w-[120px] sm:h-12 sm:max-w-[160px] rounded border border-neutral-200 object-contain p-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChangeLogo(undefined)}
                  className="r-text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  {t('removeLogo')}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                className="r-gap-xs r-text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                {t('uploadLogo')}
              </Button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </CardContent>
      </Card>

      {!canProceed && (
        <p className="text-center r-text-sm text-red-500">{t('selectAtLeastOneOem')}</p>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} className="w-full sm:w-auto r-text-sm">
          {t('nextProcessMap')}
        </Button>
      </div>
    </div>
  )
}
