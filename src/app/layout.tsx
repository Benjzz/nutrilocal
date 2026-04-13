import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'NutriLocal',
  description: 'Suivi nutritionnel personnel',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8fafc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-slate-50">
        <AppProvider>
          <div className="max-w-lg mx-auto h-full flex flex-col">
            <main className="flex-1 overflow-y-auto pb-20">{children}</main>
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
