'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider 
} from '@/components/ui/tooltip'
import { 
  Printer, 
  Zap, 
  Package, 
  Megaphone, 
  Sparkles, 
  MessageCircle, 
  Store, 
  Globe, 
  ShoppingBag,
  Disc,
  Landmark,
  Wallet,
  TrendingUp,
  Layers,
  Box,
  Info,
  ArrowDownRight,
  Smartphone,
  ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  calcularDistribucionFinanciera, 
  ItemDistribucion, 
  ResumenDistribucionFinanciera 
} from '@/lib/distribucion'

function InstagramIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function getIconComponent(iconName: string) {
  switch (iconName) {
    case 'box':
      return Box
    case 'disc':
      return Disc
    case 'package':
      return Package
    case 'megaphone':
      return Megaphone
    case 'zap':
      return Zap
    case 'printer':
      return Printer
    case 'landmark':
      return Landmark
    case 'wallet':
      return Wallet
    case 'trending-up':
      return TrendingUp
    case 'store':
      return Store
    case 'globe':
      return Globe
    case 'instagram':
      return InstagramIcon
    case 'whatsapp':
      return MessageCircle
    case 'sparkles':
      return Sparkles
    default:
      return ShoppingBag
  }
}

interface CategoryFinancialBreakdownCardProps {
  ventas: any[]
  inversiones: any[]
  ingresosDirectos?: any[]
  ticketPromedio: number
  totalPedidos: number
  className?: string
}

export function CategoryFinancialBreakdownCard({
  ventas = [],
  inversiones = [],
  ingresosDirectos = [],
  ticketPromedio,
  totalPedidos,
  className = ''
}: CategoryFinancialBreakdownCardProps) {
  // Pestaña Principal: 'ventas' (Ventas & Capital) | 'egresos' (Costos & Inversiones)
  const [vistaPrincipal, setVistaPrincipal] = useState<'ventas' | 'egresos'>('ventas')

  // Sub-filtro para Egresos: 'TODOS' | 'OPERATIVO' | 'FINANCIERO'
  const [subTipoEgresos, setSubTipoEgresos] = useState<'TODOS' | 'OPERATIVO' | 'FINANCIERO'>('TODOS')

  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // CÁLCULO CENTRALIZADO
  // =========================================================================
  const distribucion: ResumenDistribucionFinanciera = useMemo(() => {
    return calcularDistribucionFinanciera({
      ventas,
      inversiones,
      ingresosDirectos
    })
  }, [ventas, inversiones, ingresosDirectos])

  // Lista activa de Egresos según el sub-filtro seleccionado
  const activeEgresosList = useMemo(() => {
    if (subTipoEgresos === 'OPERATIVO') return distribucion.egresos.operativos
    if (subTipoEgresos === 'FINANCIERO') return distribucion.egresos.financieros
    return distribucion.egresos.todos
  }, [distribucion.egresos, subTipoEgresos])

  // Métricas proporcionales para la vista de ventas
  const totalBancos = distribucion.totales.totalIngresos || (distribucion.ventasReales.total + distribucion.inyeccionCapital.total)
  const pctVentasReales = totalBancos > 0 ? (distribucion.ventasReales.total / totalBancos) * 100 : 0
  const pctInyeccion = totalBancos > 0 ? (distribucion.inyeccionCapital.total / totalBancos) * 100 : 0

  return (
    <TooltipProvider delay={150}>
      <Card className={cn("bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[440px]", className)}>
        
        {/* ========================================================================= */}
        {/* 1. CABECERA & SEGMENTED CONTROLS                                         */}
        {/* ========================================================================= */}
        <CardHeader className="p-0 pb-3 space-y-2.5 border-b border-border/60">
          <div>
            <CardTitle className="text-sm font-bold text-foreground tracking-tight">
              {vistaPrincipal === 'ventas' 
                ? 'Ventas & Origen de Fondos'
                : 'Distribución de Egresos & Costos'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {vistaPrincipal === 'ventas'
                ? 'Facturación comercial a clientes vs. financiamiento y aportes'
                : 'Estructura operativa de insumos, envíos, pauta y compromisos fijos'}
            </CardDescription>
          </div>

          {/* Segmented Control Dual: Ventas & Fondos | Egresos & Costos */}
          <div className="bg-secondary/70 border border-border/60 p-1 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setVistaPrincipal('ventas')}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                vistaPrincipal === 'ventas' 
                  ? "bg-card text-foreground font-bold shadow-2xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>Ventas & Fondos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono text-muted-foreground shrink-0">
                {distribucion.ventasReales.items.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVistaPrincipal('egresos')}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                vistaPrincipal === 'egresos' 
                  ? "bg-card text-foreground font-bold shadow-2xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive shrink-0" />
              <span>Egresos & Costos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono text-muted-foreground shrink-0">
                {distribucion.egresos.todos.length}
              </span>
            </button>
          </div>

          {/* Sub-filtros para Egresos */}
          {vistaPrincipal === 'egresos' && (
            <div className="flex items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider mr-1">
                Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setSubTipoEgresos('TODOS')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  subTipoEgresos === 'TODOS'
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Todos</span>
                <span className="font-mono text-[10px] opacity-80">
                  {formatCurrency(distribucion.egresos.total)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSubTipoEgresos('OPERATIVO')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  subTipoEgresos === 'OPERATIVO'
                    ? "bg-amber-700 text-white font-bold shadow-2xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>⚙️ Operativos</span>
                <span className="font-mono text-[10px] opacity-80">
                  {formatCurrency(distribucion.egresos.totalOperativo)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSubTipoEgresos('FINANCIERO')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  subTipoEgresos === 'FINANCIERO'
                    ? "bg-indigo-700 text-white font-bold shadow-2xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🏛️ Financieros</span>
                <span className="font-mono text-[10px] opacity-80">
                  {formatCurrency(distribucion.egresos.totalFinanciero)}
                </span>
              </button>
            </div>
          )}
        </CardHeader>

        {/* ========================================================================= */}
        {/* 2. CONTENIDO PRINCIPAL                                                   */}
        {/* ========================================================================= */}
        <CardContent className="p-0 pt-3.5 flex-1 flex flex-col justify-between space-y-4">
          
          {/* ======================================================================= */}
          {/* VISTA 1: VENTAS & CAPITAL                                               */}
          {/* ======================================================================= */}
          {vistaPrincipal === 'ventas' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              
              {/* Tarjeta Ejecutiva de Composición de Fondos (Diseño Limpio sin cajas anidadas) */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Total Ingresado en Cuenta Bancaria
                  </span>
                  <span className="font-mono font-black text-foreground text-sm sm:text-base">
                    {formatCurrency(totalBancos)}
                  </span>
                </div>

                {/* Barra de Proporción Dual (Ventas vs Financiamiento) */}
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                  <div 
                    className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, pctVentasReales))}%` }}
                    title={`Ventas Comerciales: ${pctVentasReales.toFixed(1)}%`}
                  />
                  {pctInyeccion > 0 && (
                    <div 
                      className="h-full bg-sky-500 transition-all duration-500"
                      style={{ width: `${Math.max(1, Math.min(100, pctInyeccion))}%` }}
                      title={`Financiamiento: ${pctInyeccion.toFixed(1)}%`}
                    />
                  )}
                </div>

                {/* Leyenda concisa y limpia en una sola línea */}
                <div className="flex items-center justify-between text-[11px] font-mono flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>Ventas Comerciales: {formatCurrency(distribucion.ventasReales.total)}</span>
                    <span className="text-muted-foreground text-[10px]">({pctVentasReales.toFixed(1)}%)</span>
                  </div>

                  {distribucion.inyeccionCapital.total > 0 && (
                    <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                      <span>Financiamiento: {formatCurrency(distribucion.inyeccionCapital.total)}</span>
                      <span className="text-muted-foreground text-[10px]">
                        ({pctInyeccion < 0.1 ? '< 0.1%' : `${pctInyeccion.toFixed(1)}%`})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN A: VENTAS COMERCIALES POR FAMILIA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-0.5">
                  <div className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-foreground font-bold">
                    <Box className="w-3.5 h-3.5 text-primary" />
                    <span>Líneas de Producto</span>
                  </div>
                  <span className="text-[11px] font-medium font-mono text-muted-foreground">
                    {distribucion.ventasReales.totalUnidades} {distribucion.ventasReales.totalUnidades === 1 ? 'unidad vendida' : 'unidades vendidas'}
                  </span>
                </div>

                {distribucion.ventasReales.items.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground italic">
                    Sin ventas de catálogo registradas en el período.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {distribucion.ventasReales.items.map((item) => {
                      const avgUnit = item.count > 0 ? (item.monto / item.count) : 0
                      return (
                        <div 
                          key={item.id} 
                          className="p-2 -mx-2 rounded-xl hover:bg-secondary/40 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-foreground truncate">{item.nombre}</span>
                              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md font-mono shrink-0">
                                {item.count} {item.count === 1 ? 'ud' : 'uds'}
                              </span>
                              {avgUnit > 0 && (
                                <span className="text-[10px] text-muted-foreground/75 font-mono hidden sm:inline shrink-0">
                                  (~ {formatCurrency(avgUnit)}/ud)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="font-bold text-foreground">{formatCurrency(item.monto)}</span>
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md min-w-[42px] text-right">
                                {item.porcentaje.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Barra de progreso */}
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", item.colorBar || "bg-emerald-600")}
                              style={{ width: `${Math.max(3, Math.min(100, item.porcentaje))}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN B: FONDOS EXTERNOS & FINANCIAMIENTO (Tratamiento refinado y calibrado) */}
              {distribucion.inyeccionCapital.items.length > 0 && (
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                      <span className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        Financiamiento & Fondos Externos
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-sky-800 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                        Pasivo / No Comercial
                      </span>
                      <Tooltip>
                        <TooltipTrigger 
                          aria-label="Más información sobre inyección de capital"
                          className="text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center"
                        >
                          <Info className="w-3.5 h-3.5 opacity-70" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-card text-foreground border border-border text-xs max-w-xs p-2.5 rounded-xl shadow-lg">
                          Inyecciones de liquidez o créditos. No computan como margen operativo del taller.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {distribucion.inyeccionCapital.items.map((item) => {
                      // Proporción real respecto a la totalidad de fondos ingresados al taller
                      const pctOfTotal = totalBancos > 0 ? (item.monto / totalBancos) * 100 : 0
                      const isMicroAmount = item.monto < 1.0

                      return (
                        <div key={item.id} className="p-2 -mx-2 rounded-xl bg-sky-500/5 border border-sky-500/10 space-y-1.5">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-foreground truncate">{item.nombre}</span>
                              {item.extraBadge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 shrink-0">
                                  {item.extraBadge}
                                </span>
                              )}
                              {isMicroAmount && (
                                <span className="text-[9px] font-mono text-muted-foreground italic shrink-0">
                                  (ajuste bancario)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="font-bold text-foreground">
                                {formatCurrency(item.monto)}
                              </span>
                              <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded-md min-w-[42px] text-right">
                                {pctOfTotal < 0.1 ? '< 0.1%' : `${pctOfTotal.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>

                          {/* Barra de progreso calibrada al peso real en cuenta (sin inflar micro-montos) */}
                          <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.max(isMicroAmount ? 1 : 2, Math.min(100, pctOfTotal))}%`,
                                opacity: isMicroAmount ? 0.6 : 1
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================================= */}
          {/* VISTA 2: EGRESOS & COSTOS DEL TALLER                                    */}
          {/* ======================================================================= */}
          {vistaPrincipal === 'egresos' && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              {activeEgresosList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic space-y-1">
                  <Package className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                  <p>
                    {subTipoEgresos === 'FINANCIERO' 
                      ? 'Sin gastos financieros registrados en este período.'
                      : subTipoEgresos === 'OPERATIVO'
                      ? 'Sin egresos operativos en este período.'
                      : 'Sin gastos registrados en el período seleccionado.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEgresosList.map((item) => {
                    const Icon = getIconComponent(item.iconName)
                    const isFinanciero = item.tipo === 'FINANCIERO'

                    return (
                      <div 
                        key={item.id} 
                        className="p-2 -mx-2 rounded-xl hover:bg-secondary/40 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-bold text-foreground truncate">{item.nombre}</span>
                            
                            {subTipoEgresos === 'TODOS' && (
                              <span className={cn(
                                "text-[9px] font-semibold px-1 py-0.2 rounded shrink-0 uppercase tracking-wide",
                                isFinanciero 
                                  ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20" 
                                  : "bg-secondary text-muted-foreground"
                              )}>
                                {isFinanciero ? 'Financiero' : 'Operativo'}
                              </span>
                            )}

                            <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                              ({item.count} {item.count === 1 ? 'partida' : item.unidadLabel})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="font-bold text-foreground">{formatCurrency(item.monto)}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[38px] text-right",
                              isFinanciero 
                                ? "text-indigo-700 dark:text-indigo-300 bg-indigo-500/10" 
                                : "text-destructive bg-destructive/10"
                            )}>
                              {item.porcentaje.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", item.colorBar || "bg-destructive")}
                            style={{ width: `${Math.max(3, Math.min(100, item.porcentaje))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. FOOTER INTELIGENTE (SIN REPETICIONES REDUNDANTES)                       */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {vistaPrincipal === 'ventas' && (
              <div className="flex items-center justify-between w-full text-muted-foreground font-medium text-[11px]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {pctVentasReales >= 99.5 ? (
                    <span className="text-foreground font-medium">
                      100% de ingresos generados por facturación comercial directa
                    </span>
                  ) : (
                    <span>
                      Ventas: <strong className="text-foreground font-mono">{pctVentasReales.toFixed(1)}%</strong> • Financiamiento: <strong className="text-foreground font-mono">{pctInyeccion.toFixed(1)}%</strong>
                    </span>
                  )}
                </div>
                <div className="font-mono text-muted-foreground font-semibold">
                  Ticket prom: <span className="text-foreground font-bold">{formatCurrency(ticketPromedio)}</span>
                </div>
              </div>
            )}

            {vistaPrincipal === 'egresos' && (
              <div className="flex items-center justify-between w-full text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Gasto Total:</span>
                  <span className="font-mono font-extrabold text-destructive">
                    {formatCurrency(distribucion.egresos.total)}
                  </span>
                </div>
                <div className="text-muted-foreground text-[11px] font-medium flex items-center gap-2">
                  <span>
                    Operativos: <strong className="text-foreground font-mono">{formatCurrency(distribucion.egresos.totalOperativo)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Financieros: <strong className="text-foreground font-mono">{formatCurrency(distribucion.egresos.totalFinanciero)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
