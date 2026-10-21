'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  Search, 
  Plus, 
  Sparkles,
  Layers, 
  ShoppingBag, 
  Users, 
  Hammer,
  Store,
  Wallet
} from 'lucide-react'
import { useBusiness } from '@/context/BusinessContext'
import { Button } from '@/components/ui/button'

import { GlobalCommandPalette } from './GlobalCommandPalette'

interface TopbarProps {
  onOpenMobileMenu: () => void
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { config, is3D } = useBusiness()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Determine section hierarchy and title
  const getContextualInfo = () => {
    if (pathname === '/') {
      return { section: 'Comercial', title: 'Dashboard General', actionLabel: 'Nuevo Pedido', actionHref: '/pedidos?new=true' }
    }
    if (pathname.startsWith('/pedidos')) {
      return { section: 'Comercial', title: 'Gestión de Pedidos', actionLabel: 'Nuevo Pedido', actionHref: '/pedidos?new=true' }
    }
    if (pathname.startsWith('/clientes')) {
      return { section: 'Comercial', title: 'Directorio de Clientes', actionLabel: 'Nuevo Cliente', actionHref: '/clientes?new=true' }
    }
    if (pathname.startsWith('/taller')) {
      return { section: 'Producción', title: 'Taller 3D', actionLabel: 'Nueva Impresión', actionHref: '/taller' }
    }
    if (pathname.startsWith('/packaging')) {
      return { section: 'Logística', title: 'Packaging & Cajas', actionLabel: 'Nuevo Lote', actionHref: '/packaging?new=true' }
    }
    if (pathname.startsWith('/catalogo/inventario') || pathname.startsWith('/inventario')) {
      return { section: 'Almacén', title: 'Inventario de Filamentos', actionLabel: 'Nueva Bobina', actionHref: '/catalogo/inventario' }
    }
    if (pathname.startsWith('/catalogo')) {
      return { section: 'Catálogo', title: is3D ? 'Modelos 3D' : 'Juegos de Mesa', actionLabel: 'Nuevo Producto', actionHref: '/catalogo' }
    }
    if (pathname.startsWith('/finanzas')) {
      return { section: 'Finanzas', title: 'Control Financiero', actionLabel: 'Nuevo Movimiento', actionHref: '/finanzas' }
    }
    return { section: 'Sistema', title: config.name, actionLabel: 'Nuevo Pedido', actionHref: '/pedidos?new=true' }
  }

  const { section, title, actionLabel, actionHref } = getContextualInfo()

  // Keyboard shortcut listener for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur-md px-3.5 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-20 transition-colors">
        {/* Left: Mobile hamburger + Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/60 transition-colors cursor-pointer shrink-0"
            aria-label="Abrir Menú Lateral"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* CRM Contextual Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            <span className="hidden sm:inline text-muted-foreground/70 font-normal">
              {section}
            </span>
            <span className="hidden sm:inline text-muted-foreground/50">/</span>
            <span className="font-semibold text-foreground truncate text-xs sm:text-sm tracking-tight">
              {title}
            </span>
          </div>
        </div>

        {/* Center: Global Quick Search Button (Linear / Attio style) */}
        <div className="flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full h-8 px-3 text-xs bg-muted/40 hover:bg-muted/70 border border-border/60 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-between transition-colors cursor-pointer shadow-none group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
              <span className="truncate hidden sm:inline">Buscar o tipea &apos;120g 4h&apos; para cotizar...</span>
              <span className="truncate sm:hidden">Buscar o cotizar...</span>
            </div>
            <kbd className="hidden lg:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

      {/* Right: Quick Action Button & Business Indicator */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Business Branch Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 text-[11px] font-medium text-muted-foreground">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${is3D ? 'bg-amber-500' : 'bg-indigo-500'}`} />
          <span className="font-mono">{config.id}</span>
        </div>

        {/* Global Primary Action Button */}
        {actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-none transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">{actionLabel}</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        )}
      </div>
    </header>

    <GlobalCommandPalette
      isOpen={isCommandPaletteOpen}
      onClose={() => setIsCommandPaletteOpen(false)}
    />
  </>
  )
}
