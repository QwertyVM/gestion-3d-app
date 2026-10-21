'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  Target, 
  Rows3, 
  Columns2
} from 'lucide-react'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import { cn } from '@/lib/utils'

interface DynamicKpis {
  ingresosVentas: number
  totalCobradoVentas: number
  saldoPorCobrar: number
  tasaCobranza: number
  gananciaNeta: number
  costoDirectoTotal?: number
  margenPorcentaje: number
  ticketPromedio: number
  margenUnitarioPromedio: number
  [key: string]: any
}

interface GastoState {
  gastoDisponibleHoy: number
  saldoActualCaja: number
  totalBlindadoMes: number
}

interface BreakEvenState {
  cobertura: number
  superavit: number
  pedidosFaltantes: number
  totalFijos: number
}

interface ExecutiveKpiRowsProps {
  dynamicKpis: DynamicKpis
  gasto: GastoState
  breakEven: BreakEvenState
  filteredVentasCount: number
  totalPiezasPeriodo: number
  onInfoClick: (key: string) => void
  formatCurrency: (val: number) => string
  className?: string
}

export function ExecutiveKpiRows({
  dynamicKpis,
  gasto,
  breakEven,
  filteredVentasCount,
  totalPiezasPeriodo,
  onInfoClick,
  formatCurrency,
  className
}: ExecutiveKpiRowsProps) {
  // Modo de visualización: 'rows' (4 renglones ejecutivos completos) o 'compact' (2 columnas x 2 renglones)
  const [layoutMode, setLayoutMode] = useState<'rows' | 'compact'>('rows')

  const items = [
    {
      id: 'facturacion',
      title: 'Facturación Neta',
      infoKey: 'facturacion_periodo',
      icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      value: formatCurrency(dynamicKpis.ingresosVentas),
      valueColor: 'text-foreground',
      primaryContext: `${filteredVentasCount} pedidos (${totalPiezasPeriodo} uds) · Ticket prom: ${formatCurrency(dynamicKpis.ticketPromedio)} / ped`,
      secondaryContext: `Cobrado: ${formatCurrency(dynamicKpis.totalCobradoVentas)} (${dynamicKpis.tasaCobranza.toFixed(0)}%)`,
      badge: dynamicKpis.saldoPorCobrar > 0 ? {
        text: `Por cobrar: ${formatCurrency(dynamicKpis.saldoPorCobrar)}`,
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      } : {
        text: '100% Cobrado',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      }
    },
    {
      id: 'margen',
      title: 'Margen Bruto Taller',
      infoKey: 'utilidad_operativa',
      icon: <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      value: `+${formatCurrency(dynamicKpis.gananciaNeta)}`,
      valueColor: dynamicKpis.gananciaNeta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      primaryContext: `Insumos & Envíos: ${formatCurrency(dynamicKpis.costoDirectoTotal || 0)} · Ganancia: +${formatCurrency(dynamicKpis.margenUnitarioPromedio)} / ped`,
      secondaryContext: 'Unit Economics Real',
      badge: {
        text: `${dynamicKpis.margenPorcentaje.toFixed(1)}% margen`,
        className: dynamicKpis.margenPorcentaje >= 30
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      }
    },
    {
      id: 'caja',
      title: 'Caja Líquida Libre',
      infoKey: 'gasto_libre_disponible',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      value: formatCurrency(gasto.gastoDisponibleHoy),
      valueColor: gasto.gastoDisponibleHoy > 0 ? 'text-foreground' : 'text-amber-600 dark:text-amber-400',
      primaryContext: `Saldo en Cuenta: ${formatCurrency(gasto.saldoActualCaja)} · Blindado Fijos: ${formatCurrency(gasto.totalBlindadoMes)}`,
      secondaryContext: 'Tesorería disponible para operar',
      badge: {
        text: gasto.gastoDisponibleHoy > 0 ? 'Liquidez Segura' : 'Alerta de Caja',
        className: gasto.gastoDisponibleHoy > 0
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      }
    },
    {
      id: 'break_even',
      title: 'Punto de Equilibrio',
      infoKey: 'break_even',
      icon: <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      value: `${breakEven.cobertura.toFixed(0)}% cubierto`,
      valueColor: breakEven.superavit >= 0 ? 'text-foreground' : 'text-amber-600 dark:text-amber-400',
      primaryContext: breakEven.superavit >= 0
        ? `+${formatCurrency(breakEven.superavit)} superávit sobre fijos (${formatCurrency(breakEven.totalFijos)})`
        : `Faltan ${formatCurrency(Math.abs(breakEven.superavit))} para fijos (${formatCurrency(breakEven.totalFijos)})`,
      secondaryContext: 'Cobertura de costos fijos del mes',
      badge: {
        text: breakEven.superavit >= 0 ? 'Fijos Cubiertos' : `~${breakEven.pedidosFaltantes} peds faltan`,
        className: breakEven.superavit >= 0
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      }
    }
  ]

  return (
    <div className={cn('bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs', className)}>
      {/* Micro-Barra Superior Opcional: Selector de Densidad / Renglones */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-muted/20 border-b border-border/50 text-[11px] text-muted-foreground select-none">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/80">
          Salud Financiera & Comercial
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLayoutMode('rows')}
            title="Ver en renglones completos"
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer',
              layoutMode === 'rows'
                ? 'bg-background text-foreground shadow-2xs border border-border/60'
                : 'hover:text-foreground text-muted-foreground'
            )}
          >
            <Rows3 className="w-3 h-3" />
            <span className="hidden sm:inline">Renglones</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('compact')}
            title="Ver en 2 columnas compactas"
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer',
              layoutMode === 'compact'
                ? 'bg-background text-foreground shadow-2xs border border-border/60'
                : 'hover:text-foreground text-muted-foreground'
            )}
          >
            <Columns2 className="w-3 h-3" />
            <span className="hidden sm:inline">2 Columnas</span>
          </button>
        </div>
      </div>

      {/* Contenedor de Renglones */}
      {layoutMode === 'rows' ? (
        /* Modo 1: 4 Renglones Ejecutivos Continuos */
        <div className="divide-y divide-border/60">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-4 py-2.5 gap-2 hover:bg-muted/30 transition-colors"
            >
              {/* Lado Izquierdo: Ícono, Título, Info Trigger y Contexto Primario */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 border', item.iconBg)}>
                  {item.icon}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">
                      {item.title}
                    </span>
                    <KpiInfoTrigger
                      onClick={() => onInfoClick(item.infoKey)}
                      title={`Ver detalles y fórmula de ${item.title}`}
                    />
                    <span className="text-muted-foreground/40 hidden md:inline">•</span>
                    <span className="text-[11px] text-muted-foreground truncate hidden md:inline">
                      {item.primaryContext}
                    </span>
                  </div>
                  {/* Contexto visible en pantallas chicas */}
                  <p className="text-[10px] text-muted-foreground truncate md:hidden">
                    {item.primaryContext}
                  </p>
                </div>
              </div>

              {/* Lado Derecho: Desglose Secundario, Badge y Métrica Principal */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <span className="text-[11px] font-mono text-muted-foreground hidden lg:inline">
                  {item.secondaryContext}
                </span>

                <span className={cn('text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border whitespace-nowrap', item.badge.className)}>
                  {item.badge.text}
                </span>

                <span className={cn('text-sm sm:text-base font-mono font-bold tracking-tight tabular-nums min-w-[90px] text-right', item.valueColor)}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Modo 2: 2 Columnas x 2 Renglones Compactos */
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Columna Izquierda: Facturación y Caja Líquida */}
          <div className="divide-y divide-border/60">
            {[items[0], items[2]].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 gap-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 border', item.iconBg)}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">
                        {item.title}
                      </span>
                      <KpiInfoTrigger
                        onClick={() => onInfoClick(item.infoKey)}
                        title={`Ver detalles de ${item.title}`}
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      {item.primaryContext}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={cn('text-sm sm:text-base font-mono font-bold tracking-tight tabular-nums', item.valueColor)}>
                    {item.value}
                  </span>
                  <span className={cn('text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border mt-0.5 whitespace-nowrap', item.badge.className)}>
                    {item.badge.text}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Columna Derecha: Margen Bruto y Punto de Equilibrio */}
          <div className="divide-y divide-border/60">
            {[items[1], items[3]].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 gap-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 border', item.iconBg)}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">
                        {item.title}
                      </span>
                      <KpiInfoTrigger
                        onClick={() => onInfoClick(item.infoKey)}
                        title={`Ver detalles de ${item.title}`}
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      {item.primaryContext}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={cn('text-sm sm:text-base font-mono font-bold tracking-tight tabular-nums', item.valueColor)}>
                    {item.value}
                  </span>
                  <span className={cn('text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border mt-0.5 whitespace-nowrap', item.badge.className)}>
                    {item.badge.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
