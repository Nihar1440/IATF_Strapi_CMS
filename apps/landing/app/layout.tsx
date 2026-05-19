import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '8D-Generator — IATF Solutions',
  description: 'KI-gestützter 8D-Berichtsgenerator für Qualitätsingenieure in der Automobilindustrie.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
