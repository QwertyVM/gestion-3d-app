import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestión 3D',
  description: 'Panel de gestión para impresión 3D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-900/50 p-8 text-zinc-900 dark:text-zinc-100">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
