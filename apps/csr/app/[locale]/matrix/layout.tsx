import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE_NAME } from '@/lib/session/cookie'
import { verifyToken } from '@/lib/session/token'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function CsrMatrixLayout({ children, params }: Props) {
  const { locale } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token || !(await verifyToken(token))) {
    redirect(`/${locale}/unlock`)
  }

  return <>{children}</>
}
