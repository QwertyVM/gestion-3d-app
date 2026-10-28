'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  History, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package,
  PackageSearch, 
  Layers, 
  CircleDot, 
  X,
  Hammer,
  Users,
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

  const [metrics, setMetrics] = useState<{ pedidosPendientes: number; filamentosCriticos: number; piezasTallerPendientes?: number }>({
    pedidosPendientes: 0,
    filamentosCriticos: 0,
    piezasTallerPendientes: 0
  })

  useEffect(() => {
    let mounted = true
    const fetchMetrics = async () => {
      try {
        const data = await getNavLiveMetrics(negocio)
        if (mounted) setMetrics(data)
      } catch (err) {}
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pathname, negocio])

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose()
  }

  const navItem = (href: string, label: string, icon: React.ReactNode, count?: number, isWarning?: boolean) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

    return (
      <Link
        href={href}
        onClick={handleLinkClick}
        className={cn(
          'flex items-center justify-between rounded-lg px-2.5 h-8 text-xs font-medium transition-all group select-none',
          isActive
            ? 'bg-muted text-foreground font-semibold shadow-2xs'
            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn('shrink-0 transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground')}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>

        {count !== undefined && count > 0 && (
          <span className={cn(
            'text-[10px] font-mono px-1.5 py-0.2 rounded border tabular-nums',
            isWarning 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold'
              : 'bg-muted/60 text-muted-foreground border-border/40'
          )}>
            {count}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className={cn(
      'flex h-full flex-col bg-sidebar text-muted-foreground select-none transition-colors border-r border-border/40',
      isMobile ? 'w-full' : 'w-64'
    )}>
      {/* Brand Header */}
      <div className="p-3 border-b border-border/40 bg-sidebar flex-shrink-0 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <BusinessSwitcher />
        </div>

        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List - Clean & Categorized */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 [&::-webkit-scrollbar]:hidden">
        
        {/* OPERACIONES */}
        <div className="space-y-0.5">
          <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 font-medium block pb-1">
            Operaciones
          </span>
          {navItem('/', 'Dashboard', <LayoutDashboard className="h-3.5 w-3.5" />)}
          {navItem('/pedidos', 'Pedidos', <ShoppingBag className="h-3.5 w-3.5" />, metrics.pedidosPendientes)}
          {is3D && navItem('/taller', 'Taller 3D', <Hammer className="h-3.5 w-3.5" />, metrics.piezasTallerPendientes)}
          {navItem('/clientes', 'Clientes', <Users className="h-3.5 w-3.5" />)}
        </div>

        {/* CATÁLOGO & INVENTARIO */}
        <div className="space-y-0.5">
          <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 font-medium block pb-1">
            Catálogo & Stock
          </span>
          {navItem('/catalogo', is3D ? 'Modelos 3D' : 'Juegos de Mesa', <PackageSearch className="h-3.5 w-3.5" />)}
          {is3D && navItem('/catalogo/inventario', 'Filamentos', <CircleDot className="h-3.5 w-3.5" />, metrics.filamentosCriticos, true)}
          {is3D && navItem('/packaging', 'Packaging & Cajas', <Package className="h-3.5 w-3.5" />)}
          {navItem('/catalogo/categorias', 'Categorías', <Layers className="h-3.5 w-3.5" />)}
        </div>

        {/* FINANZAS & SUELDOS */}
        <div className="space-y-0.5">
          <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 font-medium block pb-1">
            Finanzas & Socios
          </span>
          {navItem('/finanzas/rentabilidad', 'Rentabilidad & Sueldos', <Coins className="h-3.5 w-3.5" />)}
          {navItem('/finanzas', 'Flujo de Caja', <DollarSign className="h-3.5 w-3.5" />)}
          {navItem('/historico-mensual', 'Histórico Mensual', <History className="h-3.5 w-3.5" />)}
          {navItem('/finanzas/ingresos', 'Ingresos', <ArrowUpRight className="h-3.5 w-3.5" />)}
          {navItem('/finanzas/egresos', 'Egresos', <ArrowDownLeft className="h-3.5 w-3.5" />)}
        </div>

      </div>

      {/* Footer Minimalista */}
      <div className="mt-auto p-3 border-t border-border/40 bg-sidebar/50">
        <div className="flex items-center justify-between text-xs px-2 py-1 text-muted-foreground">
          <span className="font-mono text-[10px] uppercase tracking-wider">{config.name}</span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
      </div>
    </aside>
  )
}
