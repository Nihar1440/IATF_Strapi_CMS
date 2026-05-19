import { AuthGuard } from '@/components/AuthGuard'

type Props = {
  children: React.ReactNode
}

export default function GeneratorLayout({ children }: Props) {
  return <AuthGuard>{children}</AuthGuard>
}
