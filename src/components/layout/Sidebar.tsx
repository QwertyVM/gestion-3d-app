'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  ShoppingCart, 
  Box, 
  ChevronDown, 
  FolderTree,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const isFinanzasSection = pathname.startsWith('/finanzas') || pathname.startsWith('/inversiones')
  const isCatalogoSection = pathname.startsWith('/catalogo')
  
  const [finanzasOpen, setFinanzasOpen] = useState(true)
  const [catalogoOpen, setCatalogoOpen] = useState(true)

  return (
    <aside className="flex h-screen w-64 flex-col bg-zinc-950 text-zinc-300 shadow-xl border-r border-zinc-900 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-900 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 text-white">
          <Box className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-white tracking-tight leading-tight">Gestión 3D</span>
          <span className="text-[10px] text-zinc-500 font-medium">Control de Taller</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/'
              ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-sm border border-blue-500/20'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Finanzas con Subdivisiones */}
        <div className="space-y-1 pt-1">
          <div
            onClick={() => setFinanzasOpen(!finanzasOpen)}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
              isFinanzasSection
                ? 'text-white font-semibold bg-zinc-900/40'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
            )}
          >
            <div className="flex items-center gap-3">
              <Wallet className={cn('h-4 w-4', isFinanzasSection ? 'text-emerald-400' : 'text-zinc-400')} />
              <span>Finanzas</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-zinc-500',
                finanzasOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </div>

          {/* Subitems Finanzas */}
          {finanzasOpen && (
            <div className="pl-4 pr-1 space-y-1 transition-all">
              {/* Subdivisión 1: Flujo de Caja */}
              <Link
                href="/finanzas/flujo-caja"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/flujo-caja' || pathname === '/finanzas' || pathname === '/inversiones' || pathname === '/inversiones/flujo-caja'
                    ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                )}
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span>Flujo de Caja</span>
              </Link>

              {/* Subdivisión 2: Caja Chica & Proyecciones */}
              <Link
                href="/finanzas/proyecciones"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/proyecciones' || pathname === '/finanzas/caja-chica'
                    ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                <span>Caja Chica & Proyecciones</span>
              </Link>

              {/* Subdivisión 3: Ingresos */}
              <Link
                href="/finanzas/ingresos"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/ingresos'
                    ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ingresos</span>
              </Link>

              {/* Subdivisión 4: Egresos */}
              <Link
                href="/finanzas/egresos"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/egresos'
                    ? 'bg-amber-600/20 text-amber-300 font-semibold border border-amber-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                )}
              >
                <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
                <span>Egresos</span>
              </Link>
            </div>
          )}
        </div>

        {/* Catálogo con Subdivisiones */}
        <div className="space-y-1 pt-1">
          <div
            onClick={() => setCatalogoOpen(!catalogoOpen)}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
              isCatalogoSection
                ? 'text-white font-semibold bg-zinc-900/40'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
            )}
          >
            <div className="flex items-center gap-3">
              <Package className={cn('h-4 w-4', isCatalogoSection ? 'text-blue-400' : 'text-zinc-400')} />
              <span>Catálogo</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-zinc-500',
                catalogoOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </div>

          {/* Subitems Catálogo */}
          {catalogoOpen && (
            <div className="pl-4 pr-1 space-y-1 transition-all">
              {/* Subdivision 1: Productos */}
              <Link
                href="/catalogo"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/catalogo'
                    ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                )}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Productos</span>
              </Link>

              {/* Subdivision 2: Categorías */}
              <Link
                href="/catalogo/categorias"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/catalogo/categorias'
                    ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                )}
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span>Categorías</span>
              </Link>
            </div>
          )}
        </div>

        {/* Ventas y Pedidos */}
        <Link
          href="/ventas"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/ventas'
              ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-sm border border-blue-500/20'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Ventas y Pedidos
        </Link>
      </div>

      {/* Footer info */}
      <div className="border-t border-zinc-900 p-4">
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 text-xs text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300 font-medium">Taller 3D</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">v1.2</span>
        </div>
      </div>
    </aside>
  )
}
