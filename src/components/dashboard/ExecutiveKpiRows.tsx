'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  Target, 
  SlidersHorizontal,
  Workflow
} from 'lucide-react'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import { MicroSparkline } from '@/components/ui/MicroSparkline'
import { FinancialWaterfallModal } from '@/components/dashboard/FinancialWaterfallModal'
import { FinancialWhatIfModal } from '@/components/dashboard/FinancialWhatIfModal'
import { cn } from '@/lib/utils'

interface DynamicKpis {
  ingresosVentas: number
  totalCobradoVentas: number
  saldoPorCobrar: number
  tasaCobranza: number
  gananciaNeta: number
  costoDirectoTotal?: number
  margenPorcentaje: number
  markupPorcentaje?: number
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
  sparklineData?: {
    ventas: number[]
    margen: number[]
    caja: number[]
    cobertura: number[]
  }
  capitalInmovilizado?: number
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
  sparklineData,
  capitalInmovilizado = 0,
  className
}: ExecutiveKpiRowsProps) {
  const [isWaterfallOpen, setIsWaterfallOpen] = useState(false)
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false)

  // 1. Cálculo de Pista de Despegue (Runway)
  const fijosMensuales = gasto.totalBlindadoMes || 1377.68
  const runwayDias = fijosMensuales > 0 
    ? Math.max(0, Math.round((gasto.saldoActualCaja / fijosMensuales) * 30)) 
    : 999
  const runwayMeses = fijosMensuales > 0 
    ? (gasto.saldoActualCaja / fijosMensuales).toFixed(1) 
    : '∞'

  // 2. Semáforo de Salud Financiera Global
  const isHealthOptimal = breakEven.cobertura >= 100 && runwayDias >= 30
  const isHealthCritical = runwayDias < 15 || gasto.saldoActualCaja <= 0
  const healthStatus = isHealthOptimal
    ? { 
        label: 'Salud Financiera Sólida', 
        badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20', 
        dotClass: 'bg-emerald-500' 
      }
    : isHealthCritical
    ? { 
        label: 'Tensión de Liquidez', 
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20', 
        dotClass: 'bg-rose-500' 
      }
    : { 
        label: 'Vigilancia Operativa', 
        badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20', 
        dotClass: 'bg-amber-500' 
      }

  const kpis = [
    {
      id: 'facturacion',
      title: 'Facturación Neta',
      infoKey: 'facturacion_periodo',
      icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      value: formatCurrency(dynamicKpis.ingresosVentas),
      valueColor: 'text-foreground',
      primaryContext: `${filteredVentasCount} pedidos (${totalPiezasPeriodo} uds) · Ticket prom: ${formatCurrency(dynamicKpis.ticketPromedio)}`,
      sparkline: sparklineData?.ventas,
      sparklineColor: '#059669',
      badge: dynamicKpis.saldoPorCobrar > 0 ? {
        text: `Por cobrar: ${formatCurrency(dynamicKpis.saldoPorCobrar)}`,
        className: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
      } : {
        text: `${dynamicKpis.tasaCobranza.toFixed(0)}% cobrado`,
        className: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
      }
    },
    {
      id: 'margen',
      title: 'Margen Bruto Real',
      infoKey: 'utilidad_operativa',
      icon: <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      value: `+${formatCurrency(dynamicKpis.gananciaNeta)}`,
      valueColor: dynamicKpis.gananciaNeta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400',
      primaryContext: `Ganancia unit: +${formatCurrency(dynamicKpis.margenUnitarioPromedio)} / ped · Insumos: ${formatCurrency(dynamicKpis.costoDirectoTotal || 0)}`,
      sparkline: sparklineData?.margen,
      sparklineColor: '#10b981',
      badge: {
        text: `${dynamicKpis.margenPorcentaje.toFixed(1)}% margen`,
        className: dynamicKpis.margenPorcentaje >= 20
          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
      }
    },
    {
      id: 'caja',
      title: 'Caja Líquida Libre',
      infoKey: 'gasto_libre_disponible',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      value: formatCurrency(gasto.gastoDisponibleHoy),
      valueColor: gasto.gastoDisponibleHoy > 0 ? 'text-foreground' : 'text-amber-700 dark:text-amber-400',
      primaryContext: `Saldo: ${formatCurrency(gasto.saldoActualCaja)} · Fijos: ${formatCurrency(gasto.totalBlindadoMes)}${capitalInmovilizado > 0 ? ` · Stock: ${formatCurrency(capitalInmovilizado)}` : ''}`,
      sparkline: sparklineData?.caja,
      sparklineColor: '#0284c7',
      badge: {
        text: `Runway: ${runwayDias}d (~${runwayMeses}m)`,
        className: gasto.gastoDisponibleHoy > 0
          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
      }
    },
    {
      id: 'break_even',
      title: 'Punto de Equilibrio',
      infoKey: 'break_even',
      icon: <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      value: `${breakEven.cobertura.toFixed(0)}% cubierto`,
      valueColor: breakEven.superavit >= 0 ? 'text-foreground' : 'text-amber-700 dark:text-amber-400',
      primaryContext: breakEven.superavit >= 0
        ? `+${formatCurrency(breakEven.superavit)} sobre fijos de ${formatCurrency(breakEven.totalFijos)}`
        : `Faltan ${formatCurrency(Math.abs(breakEven.superavit))} (~${breakEven.pedidosFaltantes} peds)`,
      sparkline: sparklineData?.cobertura,
      sparklineColor: '#d97706',
      badge: {
        text: breakEven.superavit >= 0 ? 'Fijos Cubiertos' : `Faltan ~${breakEven.pedidosFaltantes} peds`,
        className: breakEven.superavit >= 0
          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
      }
    }
  ]

  return (
    <>
      <div className={cn('space-y-2.5', className)}>
        {/* Barra Superior Esbelta: Estado de Salud + Accesos Rápidos */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
              Rendimiento Ejecutivo
            </span>
            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border', healthStatus.badgeClass)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', healthStatus.dotClass)} />
              <span>{healthStatus.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsWaterfallOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-card hover:bg-muted text-foreground border border-border/60 transition-colors cursor-pointer shadow-2xs"
              title="Abrir visualización de Cascada Financiera (Waterfall)"
            >
              <Workflow className="w-3.5 h-3.5 text-primary" />
              <span>Cascada</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatIfOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-card hover:bg-muted text-foreground border border-border/60 transition-colors cursor-pointer shadow-2xs"
              title="Abrir simulador de sensibilidad What-If"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Simulador</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards Ejecutivas en Grid Equilibrado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs hover:border-border transition-all flex flex-col justify-between gap-2.5 group"
            >
              {/* Header de la Card: Ícono + Título + Sparkline */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 border', kpi.iconBg)}>
                    {kpi.icon}
                  </div>
                  <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                    {kpi.title}
                  </span>
                  <KpiInfoTrigger
                    onClick={() => onInfoClick(kpi.infoKey)}
                    title={`Ver desglose de ${kpi.title}`}
                  />
                </div>

                {kpi.sparkline && kpi.sparkline.length > 1 && (
                  <MicroSparkline
                    data={kpi.sparkline}
                    color={kpi.sparklineColor}
                    width={48}
                    height={16}
                  />
                )}
              </div>

              {/* Métrica Central + Badge */}
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className={cn('text-xl font-mono font-bold tracking-tight tabular-nums', kpi.valueColor)}>
                  {kpi.value}
                </span>

                <span className={cn('text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border whitespace-nowrap', kpi.badge.className)}>
                  {kpi.badge.text}
                </span>
              </div>

              {/* Contexto Inferior */}
              <p className="text-[11px] text-muted-foreground truncate border-t border-border/40 pt-1.5">
                {kpi.primaryContext}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modales Estratégicos */}
      <FinancialWaterfallModal
        open={isWaterfallOpen}
        onOpenChange={setIsWaterfallOpen}
        ingresosVentas={dynamicKpis.ingresosVentas}
        costoDirectoTotal={dynamicKpis.costoDirectoTotal || 0}
        gananciaNeta={dynamicKpis.gananciaNeta}
        totalFijos={breakEven.totalFijos}
        superavit={breakEven.superavit}
        filteredVentasCount={filteredVentasCount}
      />

      <FinancialWhatIfModal
        open={isWhatIfOpen}
        onOpenChange={setIsWhatIfOpen}
        currentIngresos={dynamicKpis.ingresosVentas}
        currentCostoDirecto={dynamicKpis.costoDirectoTotal || 0}
        currentGanancia={dynamicKpis.gananciaNeta}
        currentFijos={breakEven.totalFijos}
        currentVentasCount={filteredVentasCount}
        currentSaldoCaja={gasto.saldoActualCaja}
      />
    </>
  )
}
