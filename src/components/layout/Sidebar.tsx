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
  Package,
  PackageSearch, 
  Layers, 
  CircleDot, 
  ChevronDown, 
  X,
  Hammer,
  Users,
  Store,
  Coins
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavLiveMetrics } from '@/actions/nav'
import { useBusiness } from '@/context/BusinessContext'
import { BusinessSwitcher } from '@/components/layout/BusinessSwitcher'

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { negocio, is3D, config } = useBusiness()

  // Dynamic live counters
  const [metrics, setMetrics] = useState<{ pedidosPendientes: number; filamentosCriticos: number; piezasTallerPendientes?: number }>({
    pedidosPendientes: 0,
    filamentosCriticos: 0,
    piezasTallerPendientes: 0
  })

  // Active section matchers
  const isDashboard = pathname === '/'
  const isPedidos = pathname.startsWith('/pedidos') || pathname.startsWith('/ventas')
  const isTaller = pathname.startsWith('/taller')
  
  const isHistorico = pathname.startsWith('/historico-mensual') || pathname.startsWith('/flujo-mensual')
  const isFinanzasSection = pathname.startsWith('/finanzas') || pathname.startsWith('/inversiones') || isHistorico
  
  const isClientes = pathname.startsWith('/clientes')
  const isPackaging = pathname.startsWith('/packaging')
  const isTiendaSection = pathname.startsWith('/catalogo') || pathname.startsWith('/inventario') || isPackaging

  // Collapsible Accordion states
  const [tiendaOpen, setTiendaOpen] = useState(true)
  const [finanzasOpen, setFinanzasOpen] = useState(true)

  // Fetch live metrics on mount and when pathname or negocio changes
  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      try {
        const data = await getNavLiveMetrics(negocio)
        if (mounted) {
          setMetrics(data)
        }
      } catch (err) {
        // fail silently
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 25000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pathname, negocio])

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside className={cn(
      'flex h-full flex-col bg-sidebar text-muted-foreground select-none transition-colors border-r border-border/60',
      isMobile ? 'w-full' : 'w-64'
    )}>
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO (BRAND HEADER / BUSINESS SWITCHER)                         */}
      {/* ========================================================================= */}
      <div className="p-3 border-b border-border/60 bg-sidebar flex-shrink-0 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <BusinessSwitcher />
        </div>

        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 transition-colors cursor-pointer shrink-0"
            title="Cerrar Menú"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LISTA DE NAVEGACIÓN REESTRUCTURADA                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 bg-sidebar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* ======================================================================= */}
        {/* PRIMERA JERARQUÍA: COMERCIAL & CRM (DASHBOARD, PEDIDOS, CLIENTES)        */}
        {/* ======================================================================= */}
        
        {/* DASHBOARD PRINCIPAL */}
        <Link
          href="/"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
            isDashboard
              ? 'bg-secondary text-foreground font-semibold border border-border/60'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <LayoutDashboard className={cn('h-4 w-4 shrink-0', isDashboard ? 'text-primary' : 'text-muted-foreground/70')} />
          <span>Dashboard</span>
        </Link>

        {/* PEDIDOS */}
        <Link
          href="/pedidos"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
            isPedidos
              ? 'bg-secondary text-foreground font-semibold border border-border/60'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <ShoppingBag className={cn('h-4 w-4 shrink-0', isPedidos ? 'text-primary' : 'text-muted-foreground/70')} />
          <span>Pedidos</span>

          {metrics.pedidosPendientes > 0 && (
            <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground tabular-nums border border-border/50">
              {metrics.pedidosPendientes}
            </span>
          )}
        </Link>

        {/* CLIENTES (CRM) */}
        <Link
          href="/clientes"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
            isClientes
              ? 'bg-secondary text-foreground font-semibold border border-border/60'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <Users className={cn('h-4 w-4 shrink-0', isClientes ? 'text-primary' : 'text-muted-foreground/70')} />
          <span>Clientes</span>
        </Link>

        {/* TALLER DE PRODUCCIÓN (3D EXCLUSIVO) */}
        {is3D && (
          <Link
            href="/taller"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
              isTaller
                ? 'bg-secondary text-foreground font-semibold border border-border/60'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Hammer className={cn('h-4 w-4 shrink-0', isTaller ? 'text-primary' : 'text-muted-foreground/70')} />
            <span>Taller de Producción</span>

            {(metrics.piezasTallerPendientes ?? 0) > 0 && (
              <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground tabular-nums border border-border/50">
                {metrics.piezasTallerPendientes} pzas
              </span>
            )}
          </Link>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN CATÁLOGO & INVENTARIO                                           */}
        {/* ======================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setTiendaOpen(!tiendaOpen)}
            className={cn(
              'w-full flex items-center justify-between rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150 cursor-pointer',
              isTiendaSection
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Store className={cn('h-4 w-4 shrink-0', isTiendaSection ? 'text-primary' : 'text-muted-foreground/70')} />
              <span>Tienda</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground/60',
                tiendaOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </button>

          {tiendaOpen && (
            <div className="pl-2 space-y-0.5 my-1 border-l border-border/60 ml-2.5 transition-all">
              {/* PRODUCTOS */}
              <Link
                href="/catalogo"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/catalogo'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <PackageSearch className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                <span>{is3D ? 'Productos 3D' : 'Juegos de Mesa'}</span>
              </Link>

              {/* CATEGORÍAS */}
              <Link
                href="/catalogo/categorias"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/catalogo/categorias'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                <span>Categorías</span>
              </Link>

              {/* INVENTARIO FILAMENTOS (3D) */}
              {is3D && (
                <Link
                  href="/catalogo/inventario"
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                    pathname === '/catalogo/inventario' || pathname === '/inventario'
                      ? 'bg-secondary text-foreground font-semibold border border-border/60'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <CircleDot className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Inventario Filamentos</span>

                  {metrics.filamentosCriticos > 0 && (
                    <span 
                      className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums"
                      title={`${metrics.filamentosCriticos} bobinas críticas`}
                    >
                      {metrics.filamentosCriticos}
                    </span>
                  )}
                </Link>
              )}

              {/* PACKAGING & CAJAS (3D) */}
              {is3D && (
                <Link
                  href="/packaging"
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                    isPackaging
                      ? 'bg-secondary text-foreground font-semibold border border-border/60'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Package className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Packaging & Cajas</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* SECCIÓN FINANZAS: CON HISTÓRICO MENSUAL DENTRO                           */}
        {/* ======================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setFinanzasOpen(!finanzasOpen)}
            className={cn(
              'w-full flex items-center justify-between rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150 cursor-pointer',
              isFinanzasSection
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Wallet className={cn('h-4 w-4 shrink-0', isFinanzasSection ? 'text-primary' : 'text-muted-foreground/70')} />
              <span>Finanzas</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground/60',
                finanzasOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </button>

          {finanzasOpen && (
            <div className="pl-2 space-y-0.5 my-1 border-l border-border/60 ml-2.5 transition-all">
              {/* FLUJO DE CAJA */}
              <Link
                href="/finanzas"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/finanzas' || pathname === '/finanzas/flujo-caja' || pathname === '/inversiones' || pathname === '/inversiones/flujo-caja'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Flujo de Caja</span>
              </Link>

              {/* RENTABILIDAD & SUELDOS */}
              <Link
                href="/finanzas/rentabilidad"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/finanzas/rentabilidad'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Coins className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Rentabilidad & Sueldos</span>
              </Link>

              {/* HISTÓRICO MENSUAL */}
              <Link
                href="/historico-mensual"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  isHistorico
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <History className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Histórico Mensual</span>
              </Link>

              {/* INGRESOS */}
              <Link
                href="/finanzas/ingresos"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/finanzas/ingresos'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Ingresos</span>
              </Link>

              {/* EGRESOS */}
              <Link
                href="/finanzas/egresos"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/finanzas/egresos'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Egresos</span>
              </Link>

              {/* TAGS DE GASTO */}
              <Link
                href="/finanzas/tags"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 h-8 text-[13px] font-medium transition-all duration-150',
                  pathname === '/finanzas/tags'
                    ? 'bg-secondary text-foreground font-semibold border border-border/60'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                <span>Tags de Gasto</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOOTER DEL NEGOCIO                                                     */}
      {/* ========================================================================= */}
      <div className="mt-auto p-3 border-t border-border/60 bg-sidebar flex-shrink-0">
        <div className="rounded-xl border border-border/60 p-2.5 flex items-center gap-2.5 bg-card shadow-none">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              is3D
                ? 'bg-amber-600/90 text-white'
                : 'bg-indigo-600/90 text-white'
            }`}
          >
            {is3D ? '3D' : 'BG'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-xs text-foreground truncate block leading-tight">
              {config.name}
            </span>
            <span className="text-[10px] text-muted-foreground truncate block leading-tight font-mono">
              {config.badge} • Activo
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="En línea" />
        </div>
      </div>
    </aside>
  )
}
