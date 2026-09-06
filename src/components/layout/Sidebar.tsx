'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  History, 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Tag, 
  TrendingUp, 
  Package, 
  PackageSearch, 
  Layers, 
  CircleDot, 
  ChevronDown, 
  X,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavLiveMetrics } from '@/actions/nav'

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  // Dynamic live counters
  const [metrics, setMetrics] = useState<{ pedidosPendientes: number; filamentosCriticos: number }>({
    pedidosPendientes: 0,
    filamentosCriticos: 0
  })

  // Active section matchers
  const isDashboard = pathname === '/'
  const isPedidos = pathname.startsWith('/pedidos') || pathname.startsWith('/ventas')
  const isHistorico = pathname.startsWith('/historico-mensual') || pathname.startsWith('/flujo-mensual')
  
  const isFinanzasSection = pathname.startsWith('/finanzas') || pathname.startsWith('/inversiones')
  const isCatalogoSection = pathname.startsWith('/catalogo') || pathname.startsWith('/inventario')

  // Collapsible Accordion states (default open for smooth navigation)
  const [finanzasOpen, setFinanzasOpen] = useState(true)
  const [catalogoOpen, setCatalogoOpen] = useState(true)

  // Fetch live metrics on mount and when pathname changes
  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      try {
        const data = await getNavLiveMetrics()
        if (mounted) {
          setMetrics(data)
        }
      } catch (err) {
        // fail silently
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 20000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pathname])

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside className={cn(
      'flex h-full flex-col bg-[#F8F6F2] text-[#75695D] select-none transition-colors border-r border-[#E2D9CC]',
      isMobile ? 'w-full' : 'w-64 shadow-xs'
    )}>
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO (BRAND HEADER)                                              */}
      {/* ========================================================================= */}
      <div className="flex h-20 items-center justify-between px-5 py-4 border-b border-[#E2D9CC] bg-[#F8F6F2] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar Estilizado 'N' Terracota */}
          <div className="h-10 w-10 bg-[#A36F4C] text-[#FFFFFF] rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 border border-[#8E5E3E]/20">
            N
          </div>

          {/* Textos de Marca */}
          <div className="flex flex-col min-w-0">
            <span className="text-base font-black text-[#241C15] tracking-tight leading-tight truncate">
              NOVA 3D
            </span>
            <span className="text-xs text-[#75695D] font-semibold leading-tight truncate mt-0.5">
              Taller & Gestión
            </span>
          </div>
        </div>

        {/* Botón de cierre móvil */}
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8] transition-colors cursor-pointer"
            title="Cerrar Menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LISTA DE NAVEGACIÓN APLANADA (MENU ITEMS & 1-LEVEL ACCORDIONS)         */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 bg-[#F8F6F2] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* DASHBOARD PRINCIPAL */}
        <Link
          href="/"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 min-h-[44px]',
            isDashboard
              ? 'bg-[#EFE5D8] text-[#241C15] font-bold shadow-2xs border border-[#D4BEA7]'
              : 'text-[#75695D] font-semibold hover:bg-[#F1ECE4] hover:text-[#241C15]'
          )}
        >
          <LayoutDashboard className={cn('h-4 w-4 shrink-0', isDashboard ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
          <span>Dashboard</span>
        </Link>

        {/* PEDIDOS (CON BADGE INTERACTIVO EN TIEMPO REAL) */}
        <Link
          href="/pedidos"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 min-h-[44px]',
            isPedidos
              ? 'bg-[#EFE5D8] text-[#241C15] font-bold shadow-2xs border border-[#D4BEA7]'
              : 'text-[#75695D] font-semibold hover:bg-[#F1ECE4] hover:text-[#241C15]'
          )}
        >
          <ShoppingBag className={cn('h-4 w-4 shrink-0', isPedidos ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
          <span>Pedidos</span>

          {/* Badge de Pedidos Pendientes */}
          {metrics.pedidosPendientes > 0 ? (
            <span className="ml-auto text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] shadow-2xs">
              {metrics.pedidosPendientes} pend.
            </span>
          ) : (
            <span className="ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]">
              Al día
            </span>
          )}
        </Link>

        {/* HISTÓRICO MENSUAL */}
        <Link
          href="/historico-mensual"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 min-h-[44px]',
            isHistorico
              ? 'bg-[#EFE5D8] text-[#241C15] font-bold shadow-2xs border border-[#D4BEA7]'
              : 'text-[#75695D] font-semibold hover:bg-[#F1ECE4] hover:text-[#241C15]'
          )}
        >
          <History className={cn('h-4 w-4 shrink-0', isHistorico ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
          <span>Histórico Mensual</span>
        </Link>

        {/* ======================================================================= */}
        {/* GRUPO FINANZAS (ACORDEÓN LIMPIO DE 1 NIVEL)                             */}
        {/* ======================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setFinanzasOpen(!finanzasOpen)}
            className={cn(
              'w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-all duration-150 cursor-pointer min-h-[40px]',
              isFinanzasSection
                ? 'text-[#241C15] bg-[#F1ECE4]'
                : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
            )}
          >
            <div className="flex items-center gap-3">
              <Wallet className={cn('h-4 w-4 shrink-0', isFinanzasSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
              <span>Finanzas</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
                finanzasOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </button>

          {finanzasOpen && (
            <div className="pl-3.5 space-y-1 my-1 border-l-2 border-[#E2D9CC] ml-3.5 transition-all">
              {/* Flujo de Caja */}
              <Link
                href="/finanzas/flujo-caja"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/finanzas/flujo-caja' || pathname === '/finanzas' || pathname === '/inversiones' || pathname === '/inversiones/flujo-caja'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-[#1E5E3A]" />
                <span>Flujo de Caja</span>
              </Link>

              {/* Ingresos */}
              <Link
                href="/finanzas/ingresos"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/finanzas/ingresos'
                    ? 'bg-[#EBF7EE] text-[#1E5E3A] font-bold border border-[#B4E3C0]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#1E5E3A]" />
                <span>Ingresos</span>
              </Link>

              {/* Egresos */}
              <Link
                href="/finanzas/egresos"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/finanzas/egresos'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Egresos</span>
              </Link>

              {/* Tags de Gasto */}
              <Link
                href="/finanzas/tags"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/finanzas/tags'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>Tags de Gasto</span>
              </Link>

              {/* Proyecciones & Presupuesto */}
              <Link
                href="/finanzas/proyecciones"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/finanzas/proyecciones' || pathname === '/finanzas/caja-chica'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Proyecciones & Presupuesto</span>
              </Link>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* GRUPO CATÁLOGO & TALLER (ACORDEÓN LIMPIO DE 1 NIVEL)                    */}
        {/* ======================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCatalogoOpen(!catalogoOpen)}
            className={cn(
              'w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-all duration-150 cursor-pointer min-h-[40px]',
              isCatalogoSection
                ? 'text-[#241C15] bg-[#F1ECE4]'
                : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
            )}
          >
            <div className="flex items-center gap-3">
              <Package className={cn('h-4 w-4 shrink-0', isCatalogoSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
              <span>Catálogo & Taller</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
                catalogoOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </button>

          {catalogoOpen && (
            <div className="pl-3.5 space-y-1 my-1 border-l-2 border-[#E2D9CC] ml-3.5 transition-all">
              {/* Productos */}
              <Link
                href="/catalogo"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/catalogo'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <PackageSearch className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>Productos</span>
              </Link>

              {/* Categorías */}
              <Link
                href="/catalogo/categorias"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/catalogo/categorias'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <Layers className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>Categorías</span>
              </Link>

              {/* Inventario de Filamentos */}
              <Link
                href="/catalogo/inventario"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[36px]',
                  pathname === '/catalogo/inventario' || pathname === '/inventario'
                    ? 'bg-[#EFE5D8] text-[#241C15] font-bold border border-[#D4BEA7]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <CircleDot className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Inventario de Filamentos</span>

                {/* Dot de advertencia ámbar dinámico si hay bobinas < 300g */}
                {metrics.filamentosCriticos > 0 && (
                  <span 
                    className="ml-auto flex items-center gap-1 text-[10px] font-extrabold text-[#854D0E] bg-[#FEF9C3] border border-[#FDE047] px-1.5 py-0.2 rounded-md shadow-2xs"
                    title={`${metrics.filamentosCriticos} bobinas con stock crítico (<300g)`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#854D0E] animate-pulse shrink-0" />
                    <span>{metrics.filamentosCriticos}</span>
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOOTER DEL TALLER (TARJETA BLANCA CON PADDING SIMÉTRICO GAP-3)          */}
      {/* ========================================================================= */}
      <div className="mt-auto p-3.5 border-t border-[#E2D9CC] bg-[#F8F6F2] flex-shrink-0">
        <div className="rounded-2xl border border-[#E2D9CC] p-3 flex items-center gap-3 bg-[#FFFFFF] shadow-xs">
          {/* Avatar '#1E1E1E' con 'N' blanca */}
          <div className="h-9 w-9 bg-[#1E1E1E] text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            N
          </div>

          {/* Labels con padding protegido para que jamás se monten sobre el avatar ni el dot */}
          <div className="flex-1 min-w-0 pr-1">
            <span className="font-bold text-xs text-[#241C15] truncate block leading-tight">
              NOVA Workshop
            </span>
            <span className="text-[11px] text-[#75695D] truncate block leading-tight mt-0.5">
              Taller Activo
            </span>
          </div>

          {/* Dot verde esmeralda con pulso de sincronización */}
          <div className="relative flex h-2.5 w-2.5 shrink-0 ml-auto" title="Sincronización en tiempo real">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E5E3A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1E5E3A]"></span>
          </div>
        </div>
      </div>
    </aside>
  )
}
