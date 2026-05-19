'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { checkAuth } from '@/lib/session/client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const locale = useLocale()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (!authenticated) {
        router.replace(`/${locale}/unlock`)
      } else {
        setReady(true)
      }
    })
  }, [router, locale])

  if (!ready) return null
  return <>{children}</>
}
