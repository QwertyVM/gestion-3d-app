'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  ShoppingCart, 
  ChevronDown, 
  FolderTree,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Tag,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const isFinanzasSection = pathname.startsWith('/finanzas') || pathname.startsWith('/inversiones')
  const isCatalogoSection = pathname.startsWith('/catalogo')
  const isEgresosSection = pathname.startsWith('/finanzas/egresos') || pathname.startsWith('/finanzas/tags')
  
  const [finanzasOpen, setFinanzasOpen] = useState(true)
  const [egresosOpen, setEgresosOpen] = useState(true)
  const [catalogoOpen, setCatalogoOpen] = useState(true)

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#FFFFFF] text-[#75695D] shadow-md border-r border-[#E2D9CC] select-none transition-colors">
      {/* NOVA Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[#E2D9CC] px-6 bg-[#FDFBF7]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#A36F4C] to-[#C48C68] shadow-sm text-white">
          <span className="font-extrabold text-sm tracking-tighter text-white">N</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold text-[#241C15] tracking-wide leading-tight">
            NOVA <span className="text-[#A36F4C] font-semibold text-xs">3D</span>
          </span>
          <span className="text-[10px] text-[#75695D] font-medium">Taller & Gestión</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 bg-[#FFFFFF]">
        {/* 1. Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/'
              ? 'bg-[#EFE5D8] text-[#633E20] font-semibold shadow-sm border border-[#D4BEA7]'
              : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* 2. Ventas y Pedidos */}
        <Link
          href="/ventas"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/ventas'
              ? 'bg-[#EFE5D8] text-[#633E20] font-semibold shadow-sm border border-[#D4BEA7]'
              : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Ventas y Pedidos
        </Link>

        {/* 3. Finanzas con Subdivisiones */}
        <div className="space-y-1 pt-1">
          <div
            onClick={() => setFinanzasOpen(!finanzasOpen)}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
              isFinanzasSection
                ? 'text-[#241C15] font-semibold bg-[#F4EFEA]'
                : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
            )}
          >
            <div className="flex items-center gap-3">
              <Wallet className={cn('h-4 w-4', isFinanzasSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
              <span>Finanzas</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
                finanzasOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </div>

          {/* Subitems Finanzas */}
          {finanzasOpen && (
            <div className="pl-3 pr-1 space-y-1 transition-all">
              {/* Flujo de Caja */}
              <Link
                href="/finanzas/flujo-caja"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/flujo-caja' || pathname === '/finanzas' || pathname === '/inversiones' || pathname === '/inversiones/flujo-caja'
                    ? 'bg-[#EFE5D8] text-[#633E20] font-semibold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                )}
              >
                <DollarSign className="h-3.5 w-3.5 text-[#1E5E3A]" />
                <span>Flujo de Caja</span>
              </Link>

              {/* Caja Chica & Proyecciones */}
              <Link
                href="/finanzas/proyecciones"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/proyecciones' || pathname === '/finanzas/caja-chica'
                    ? 'bg-[#EFE5D8] text-[#633E20] font-semibold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 text-[#A36F4C]" />
                <span>Caja Chica & Proyecciones</span>
              </Link>

              {/* Ingresos */}
              <Link
                href="/finanzas/ingresos"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/finanzas/ingresos'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                    : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                <span>Ingresos</span>
              </Link>

              {/* Egresos como Grupo con Subcategoría Tags */}
              <div className="space-y-0.5 pt-0.5">
                <div
                  onClick={() => setEgresosOpen(!egresosOpen)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer',
                    isEgresosSection
                      ? 'text-[#241C15] font-semibold bg-[#F4EFEA]'
                      : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowDownRight className={cn('h-3.5 w-3.5', isEgresosSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
                    <span>Egresos</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      'h-3 w-3 transition-transform duration-200 text-[#75695D]',
                      egresosOpen ? 'rotate-0' : '-rotate-90'
                    )} 
                  />
                </div>

                {/* Sub-elementos de Egresos */}
                {egresosOpen && (
                  <div className="pl-4 space-y-0.5 border-l-2 border-[#E2D9CC] ml-4 my-1">
                    {/* Registro de Egresos */}
                    <Link
                      href="/finanzas/egresos"
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150',
                        pathname === '/finanzas/egresos'
                          ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                          : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                      )}
                    >
                      <Receipt className="h-3 w-3" />
                      <span>Registro de Egresos</span>
                    </Link>

                    {/* Tags / Subcategorías de Insumos */}
                    <Link
                      href="/finanzas/tags"
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150',
                        pathname === '/finanzas/tags'
                          ? 'bg-[#EFE5D8] text-[#633E20] font-bold border border-[#D4BEA7]'
                          : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                      )}
                    >
                      <Tag className="h-3 w-3" />
                      <span>Tags & Subcategorías</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Catálogo con Subdivisiones */}
        <div className="space-y-1 pt-1">
          <div
            onClick={() => setCatalogoOpen(!catalogoOpen)}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
              isCatalogoSection
                ? 'text-[#241C15] font-semibold bg-[#F4EFEA]'
                : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
            )}
          >
            <div className="flex items-center gap-3">
              <Package className={cn('h-4 w-4', isCatalogoSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
              <span>Catálogo</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
                catalogoOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </div>

          {/* Subitems Catálogo */}
          {catalogoOpen && (
            <div className="pl-4 pr-1 space-y-1 transition-all">
              <Link
                href="/catalogo"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/catalogo'
                    ? 'bg-[#EFE5D8] text-[#633E20] font-semibold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                )}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Productos</span>
              </Link>

              <Link
                href="/catalogo/categorias"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  pathname === '/catalogo/categorias'
                    ? 'bg-[#EFE5D8] text-[#633E20] font-semibold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F4EFEA] hover:text-[#241C15]'
                )}
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span>Categorías</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-[#E2D9CC] p-4 bg-[#FDFBF7]">
        <div className="rounded-xl bg-[#FFFFFF] border border-[#E2D9CC] p-3 text-xs text-[#75695D] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1E5E3A] animate-pulse"></span>
            <span className="text-[#241C15] font-semibold">NOVA Workshop</span>
          </div>
          <span className="text-[10px] text-[#75695D] font-mono">v1.2</span>
        </div>
      </div>
    </aside>
  )
}
