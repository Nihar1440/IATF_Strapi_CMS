'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'

interface Props {
  planId: string
  label: string
  className?: string
}

export function RequestQuoteButton({ planId, label, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const locale = useLocale()
  const t = useTranslations('landing.requestQuote')
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(false)
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function handleOpen() {
    setEmail('')
    setEmailError('')
    setOpen(true)
  }

  async function handleSubmit() {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(t('invalidEmail'))
      return
    }
    setEmailError('')
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch('/api/contact/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, locale, email: trimmed }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to send request')
      }

      toast.success(t('success'))
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : t('error')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={loading}
        variant={className ? "default" : "outline"}
        className={cn("w-full transition-all", className || "mt-2 border-dashed border-2 bg-neutral-50 hover:bg-neutral-100")}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('sending')}
          </>
        ) : label}
      </Button>

      {open && (
        <div
          ref={backdropRef}
          onClick={(e) => { if (e.target === backdropRef.current) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 14, padding: '28px 24px',
              width: '100%', maxWidth: 400, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 12, right: 12, background: 'none',
                border: 'none', cursor: 'pointer', padding: 4,
              }}
            >
              <X size={18} color="#888" />
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111' }}>
              {t('title')}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666' }}>
              {t('description')}
            </p>
            <Input
              type="email"
              placeholder={t('placeholder')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              aria-invalid={!!emailError}
              autoFocus
              style={{ marginBottom: emailError ? 4 : 16 }}
            />
            {emailError && (
              <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{emailError}</p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSubmit}>
                {t('submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
