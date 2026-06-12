import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/i18n/context'
import './globals.css'
import './styles/jeepney.css'

export const metadata: Metadata = {
  title: 'DSC FMS Portal',
  description: 'DSC Mannur Facility Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
// Trigger rebuild - Tue Jun  9 13:45:00 KST 2026
