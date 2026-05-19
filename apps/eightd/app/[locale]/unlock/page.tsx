'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { redeemSchema } from '@/modules/eightd/schemas/formSchemas'
import type { z } from 'zod'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/language-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type RedeemFormData = z.infer<typeof redeemSchema>

export default function UnlockPage() {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const t = useTranslations('unlock')
  const tApp = useTranslations('app')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedeemFormData>({
    resolver: zodResolver(redeemSchema),
  })

  // Auto-redirect removed to ensure users always enter their code

  async function onSubmit(data: RedeemFormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.code, toolId: 'tool_8d' }),
        credentials: 'include',
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error ?? t('errorInvalid'))
        return
      }

      // Save active code for isolated session storage
      localStorage.setItem('EIGHTD_ACTIVE_CODE', data.code)
      toast.success(t('success'))
      router.push(`/${locale}/generator`)
    } catch {
      toast.error(t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-neutral-50 to-neutral-50 px-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-100/30 blur-[120px]" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-neutral-200/50 blur-[120px]" />

      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>

      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
          {tApp('brand')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
          {t('heading')}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t('subtitle')}
        </p>
      </div>

      <Card className="relative w-full max-w-sm border-neutral-200/60 shadow-xl shadow-neutral-200/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-neutral-300/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('cardTitle')}</CardTitle>
          <CardDescription>
            {t('cardDesc')}{' '}
            <a
              href="https://iatf-solutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              iatf-solutions.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">{t('label')}</Label>
              <Input
                id="code"
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                autoFocus
                {...register('code')}
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-full transition-all active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('button')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link 
          href={`/${locale}/info`}
          className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 underline underline-offset-4"
        >
          {tApp('learnMore') || 'Learn more about the 8D Generator'}
        </Link>
      </div>
    </main>
  )
}
