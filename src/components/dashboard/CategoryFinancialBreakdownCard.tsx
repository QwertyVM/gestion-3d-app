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
  Info
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
  // Pestaña Principal: 'ventas' (Ventas & Capital) | 'egresos' | 'canales'
  const [vistaPrincipal, setVistaPrincipal] = useState<'ventas' | 'egresos' | 'canales'>('ventas')

  // Sub-filtro para Egresos: 'TODOS' | 'OPERATIVO' | 'FINANCIERO'
  const [subTipoEgresos, setSubTipoEgresos] = useState<'TODOS' | 'OPERATIVO' | 'FINANCIERO'>('TODOS')

  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // CÁLCULO CENTRALIZADO (Lógica Backend Compartida)
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

  return (
    <TooltipProvider delay={100}>
      <Card className={`bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[440px] ${className}`}>
        
        {/* ========================================================================= */}
        {/* 1. CABECERA DE LA TARJETA                                                 */}
        {/* ========================================================================= */}
        <CardHeader className="p-0 pb-3 border-b border-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {vistaPrincipal === 'ventas' 
                  ? 'Ventas del Taller & Inyección de Capital'
                  : vistaPrincipal === 'egresos'
                  ? 'Distribución de Egresos & Costos'
                  : 'Canales de Captación & Ventas'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {vistaPrincipal === 'ventas'
                  ? 'Desglose entre facturación comercial a clientes y fondos externos de financiamiento'
                  : vistaPrincipal === 'egresos'
                  ? 'Estructura operativa de insumos, logística, pauta y compromisos fijos'
                  : 'Rendimiento y concentración de facturación por canal comercial'}
              </CardDescription>
            </div>

            {/* Dos badges contrastados que dejan clara la diferencia contable */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
              <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono">
                Ventas: {formatCurrency(distribucion.ventasReales.total)}
              </span>
              <span className="bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ml-0 sm:ml-1 font-mono">
                Inyección BCP: {formatCurrency(distribucion.inyeccionCapital.total)}
              </span>
            </div>
          </div>

          {/* Selector de Pestañas Principales: Ventas & Capital | Egresos | Canales */}
          <div className="bg-secondary/80 border border-border/70 p-1 rounded-xl flex items-center gap-1 w-full sm:w-fit mt-3">
            <button
              onClick={() => setVistaPrincipal('ventas')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                vistaPrincipal === 'ventas' 
                  ? "bg-card text-foreground font-bold shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>🛍️ Ventas & Capital</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono">
                {distribucion.ventasReales.items.length + distribucion.inyeccionCapital.items.length}
              </span>
            </button>
            <button
              onClick={() => setVistaPrincipal('egresos')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                vistaPrincipal === 'egresos' 
                  ? "bg-card text-foreground font-bold shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>📦 Egresos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono">
                {distribucion.egresos.partidasCount}
              </span>
            </button>
            <button
              onClick={() => setVistaPrincipal('canales')}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer",
                vistaPrincipal === 'canales' 
                  ? "bg-card text-foreground font-bold shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>📱 Canales</span>
            </button>
          </div>

          {/* Sub-selector para pestaña de Egresos */}
          {vistaPrincipal === 'egresos' && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/40 text-[11px]">
              <span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider mr-1">
                Tipo:
              </span>
              <button
                onClick={() => setSubTipoEgresos('TODOS')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                  subTipoEgresos === 'TODOS'
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Todos</span>
                <span className="font-mono text-[10px] opacity-80">
                  ({formatCurrency(distribucion.egresos.total)})
                </span>
              </button>
              <button
                onClick={() => setSubTipoEgresos('OPERATIVO')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                  subTipoEgresos === 'OPERATIVO'
                    ? "bg-amber-600 text-white font-bold shadow-2xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>⚙️ Operativos</span>
                <span className="font-mono text-[10px] opacity-80">
                  ({formatCurrency(distribucion.egresos.totalOperativo)})
                </span>
              </button>
              <button
                onClick={() => setSubTipoEgresos('FINANCIERO')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                  subTipoEgresos === 'FINANCIERO'
                    ? "bg-[#4338CA] text-white font-bold shadow-2xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🏛️ Financieros</span>
                <span className="font-mono text-[10px] opacity-80">
                  ({formatCurrency(distribucion.egresos.totalFinanciero)})
                </span>
              </button>
            </div>
          )}
        </CardHeader>

        {/* ========================================================================= */}
        {/* 2. CUERPO DE LA TARJETA                                                   */}
        {/* ========================================================================= */}
        <CardContent className="p-0 pt-3.5 flex-1 flex flex-col justify-between space-y-4">
          
          {/* ======================================================================= */}
          {/* VISTA 1: VENTAS & CAPITAL (DOS BLOQUES CONTABLES INDEPENDIENTES)         */}
          {/* ======================================================================= */}
          {vistaPrincipal === 'ventas' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              
              {/* BLOQUE 1: VENTAS REALES DEL TALLER (EL PROTAGONISTA) */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>VENTAS POR FAMILIA DE PRODUCTO ({formatCurrency(distribucion.ventasReales.total)})</span>
                  <span className="text-[10px] text-muted-foreground font-medium lowercase italic hidden sm:inline">
                    (100% de la facturación comercial del taller)
                  </span>
                </div>

                {distribucion.ventasReales.items.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground italic">
                    Sin ventas de catálogo registradas en el período seleccionado.
                  </div>
                ) : (
                  distribucion.ventasReales.items.map((item) => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger className="w-full text-left cursor-pointer block border-0 p-0 bg-transparent">
                        <div className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Box className="w-3.5 h-3.5 text-primary shrink-0 transition-colors" />
                              <span className="font-bold text-foreground truncate">{item.nombre}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                ({item.count} {item.count === 1 ? 'ud' : 'uds'})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="font-extrabold text-foreground">{formatCurrency(item.monto)}</span>
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md min-w-[42px] text-right">
                                {item.porcentaje.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Barra de Progreso con Porcentaje Real sobre Ventas (100% base) */}
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full ${item.colorBar} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(4, Math.min(100, item.porcentaje))}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-card text-foreground border border-border p-2 rounded-xl shadow-lg text-xs max-w-xs">
                        <span>
                          <strong className="block">{item.nombre}</strong>
                          {item.count} unidades vendidas • {formatCurrency(item.monto)} ({item.porcentaje.toFixed(1)}% de las ventas comerciales)
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))
                )}
              </div>

              {/* BLOQUE 2: INYECCIÓN EXTERNA DE CAPITAL & PRÉSTAMOS */}
              <div className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 space-y-2.5">
                {/* Cabecera del Bloque 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                    <Landmark className="w-3.5 h-3.5 text-sky-700 mr-0.5 inline shrink-0" />
                    <span>INYECCIÓN DE CAPITAL & PRÉSTAMOS ({formatCurrency(distribucion.inyeccionCapital.total)})</span>
                  </div>
                  <span className="text-[9px] font-semibold text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-md shadow-2xs">
                    Deuda / Pasivo
                  </span>
                </div>

                {/* Filas de Financiamiento */}
                {distribucion.inyeccionCapital.items.length === 0 ? (
                  <div className="py-2 text-center text-xs text-muted-foreground italic">
                    Sin desembolsos de préstamos ni inyecciones de capital en este período.
                  </div>
                ) : (
                  distribucion.inyeccionCapital.items.map((item) => (
                    <div key={item.id} className="space-y-1 group">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-foreground truncate">{item.nombre}</span>
                          {item.extraBadge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 shrink-0">
                              {item.extraBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="font-bold text-sky-900 dark:text-sky-200">{formatCurrency(item.monto)}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            ({item.porcentaje.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* Barra sutil de inyección */}
                      <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                        <div
                          className={`h-full ${item.colorBar} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(4, Math.min(100, item.porcentaje))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}

                {/* Nota Aclaratoria al Pie del Bloque 2 */}
                <div className="text-[11px] text-muted-foreground italic flex items-center gap-1.5 pt-1 border-t border-border/50">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span>
                    Estos fondos son inyecciones de liquidez para maquinaria y capital de trabajo. No representan ventas comerciales ni margen del taller.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* VISTA 2: EGRESOS & COSTOS DEL TALLER                                    */}
          {/* ======================================================================= */}
          {vistaPrincipal === 'egresos' && (
            <div className="space-y-3 animate-in fade-in-50 duration-150">
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
                activeEgresosList.map((item) => {
                  const Icon = getIconComponent(item.iconName)
                  const isFinanciero = item.tipo === 'FINANCIERO'

                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger className="w-full text-left cursor-pointer block border-0 p-0 bg-transparent">
                        <div className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
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
                              <span className="font-extrabold text-foreground">{formatCurrency(item.monto)}</span>
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

                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full ${item.colorBar} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(4, Math.min(100, item.porcentaje))}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-card text-foreground border border-border p-2 rounded-xl shadow-lg text-xs max-w-xs">
                        <span>
                          <strong className="block">{item.nombre} ({item.tipo})</strong>
                          {item.count} {item.count === 1 ? 'partida' : item.unidadLabel} • {item.detalleDesc} ({formatCurrency(item.monto)})
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* VISTA 3: CANALES DE VENTA                                               */}
          {/* ======================================================================= */}
          {vistaPrincipal === 'canales' && (
            <div className="space-y-3 animate-in fade-in-50 duration-150">
              {distribucion.canales.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic space-y-1">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                  <p>Sin canales registrados en este período.</p>
                </div>
              ) : (
                distribucion.canales.map((item) => {
                  const Icon = getIconComponent(item.iconName)
                  return (
                    <Tooltip key={item.canal}>
                      <TooltipTrigger className="w-full text-left cursor-pointer block border-0 p-0 bg-transparent">
                        <div className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                              <span className="font-bold text-foreground truncate">{item.canal}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                ({item.count} {item.count === 1 ? 'pedido' : 'pedidos'})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="font-extrabold text-foreground">{formatCurrency(item.total)}</span>
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md min-w-[38px] text-right">
                                {item.porcentaje.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full ${item.colorBar} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(4, Math.min(100, item.porcentaje))}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-card text-foreground border border-border p-2 rounded-xl shadow-lg text-xs">
                        <span>{item.canal}: {item.count} pedidos captados ({formatCurrency(item.total)})</span>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SÍNTESIS CONTABLE EN EL FOOTER DE LA TARJETA                           */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {vistaPrincipal === 'ventas' && (
              <>
                <div className="font-semibold text-foreground">
                  Total Entradas en Cuenta Bancaria:{' '}
                  <span className="font-mono font-extrabold text-foreground">
                    {formatCurrency(distribucion.totales.totalIngresos)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    Ventas Reales: {formatCurrency(distribucion.ventasReales.total)}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sky-800 dark:text-sky-300 font-bold font-mono">
                    Deuda BCP: {formatCurrency(distribucion.inyeccionCapital.total)}
                  </span>
                </div>
              </>
            )}

            {vistaPrincipal === 'egresos' && (
              <>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-medium">Total Egresos:</span>
                  <span className="font-mono text-sm font-extrabold text-destructive">
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
              </>
            )}

            {vistaPrincipal === 'canales' && (
              <>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-medium">Ticket Promedio:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(ticketPromedio)}
                  </span>
                </div>
                <div className="text-muted-foreground text-[11px] font-medium">
                  Volumen: <span className="font-bold text-foreground">{totalPedidos} pedidos</span>
                </div>
              </>
            )}
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
