'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useBusiness } from '@/context/BusinessContext'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { config, is3D } = useBusiness()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full bg-background overflow-hidden text-foreground relative">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (>= lg)                                                   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex h-full w-64 flex-shrink-0 z-30 border-r border-border/60 bg-sidebar">
        <Sidebar isMobile={false} />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER / SHEET (< lg)                                              */}
      {/* ========================================================================= */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="p-0 w-72 max-w-[85vw] border-r border-border/60 bg-sidebar shadow-xl"
          showCloseButton={false}
        >
          <Sidebar isMobile={true} onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTAINER (TOPBAR + SCROLLABLE MAIN CONTENT)                */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Universal Contextual Topbar (Desktop & Mobile) */}
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Scrollable Main Content (Strictly Mobile-First & Overflow protected) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-3.5 sm:p-5 lg:p-6 pb-12 sm:pb-8 text-foreground overscroll-y-contain">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
