import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NOVA 3D - Gestión de Taller',
  description: 'Panel de gestión financiera e insumos para impresión 3D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} flex h-screen w-full bg-[#F8F6F2] overflow-hidden text-[#241C15]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-[#F8F6F2] p-8 text-[#241C15]">
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
