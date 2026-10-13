'use client'

import { useState, useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { EgresoItem, VentaItem, IngresoDirectoItem } from './FlujoCajaClient'

export type FinancialPerspective = 'TOTAL' | 'OPERATIVO'

export interface CashFlowAnalyticsCardProps {
  ventas: VentaItem[]
  egresos: EgresoItem[]
  ingresosDirectos?: IngresoDirectoItem[]
  className?: string
}

function formatCurrency(val: number) {
  return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCompactCurrency(val: number) {
  return `S/ ${Math.round(val).toLocaleString('es-PE')}`
}

function formatSignedCurrency(val: number) {
  const sign = val >= 0 ? '+' : '-'
  return `${sign}S/ ${Math.abs(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CashFlowAnalyticsCard({
  ventas,
  egresos,
  ingresosDirectos = [],
  className = '',
}: CashFlowAnalyticsCardProps) {
  const [perspective, setPerspective] = useState<FinancialPerspective>('TOTAL')

  // 1. Clasificación automatizada de Ingresos
  const { ventasOperativas, financiamiento, totalIngresos } = useMemo(() => {
    let salesTotal = 0
    ventas.forEach((v) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p) => {
          if (p.monto > 0) salesTotal += p.monto
        })
      } else if (v.montoPagado > 0) {
        salesTotal += v.montoPagado
      }
    })

    let loanTotal = 0
    let otherDirectSales = 0

    ingresosDirectos.forEach((i) => {
      const monto = Number(i.monto || 0)
      if (monto <= 0) return

      const cat = (i.categoria || '').trim()
      const catLower = cat.toLowerCase()
      const conLower = (i.concepto || '').toLowerCase()

      // REGLA ESTRICTA: categoria === 'Deuda / Préstamo' ➔ Financiamiento
      // También mapea la categoría existente en BD 'Préstamo Bancario / Financiamiento'
      const isFinanciamiento =
        cat === 'Deuda / Préstamo' ||
        ((cat === 'Préstamo Bancario / Financiamiento' ||
          catLower.includes('préstamo') ||
          catLower.includes('prestamo')) &&
          !conLower.includes('interes') &&
          !conLower.includes('intereses'))

      if (isFinanciamiento) {
        loanTotal += monto
      } else {
        otherDirectSales += monto
      }
    })

    const totalOperativo = salesTotal + otherDirectSales
    return {
      ventasOperativas: totalOperativo,
      financiamiento: loanTotal,
      totalIngresos: totalOperativo + loanTotal,
    }
  }, [ventas, ingresosDirectos])

  // 2. Clasificación automatizada de Egresos
  const { costosOperativos, activosFijos, totalEgresos } = useMemo(() => {
    let afTotal = 0
    let opTotal = 0

    egresos.forEach((e) => {
      const monto = Number(e.costoTotal || 0)
      if (monto <= 0) return

      const cat = (e.categoria || '').trim()
      const sub = (e.subcategoria || '').toLowerCase()

      // REGLA ESTRICTA: categoria === 'Maquinaria & Equipos' o 'ACTIVO_FIJO' ➔ Activos Fijos
      const isActivoFijo =
        cat === 'Maquinaria & Equipos' ||
        cat === 'ACTIVO_FIJO' ||
        sub.includes('maquinaria') ||
        sub.includes('activo fijo')

      if (isActivoFijo) {
        afTotal += monto
      } else {
        opTotal += monto
      }
    })

    return {
      costosOperativos: opTotal,
      activosFijos: afTotal,
      totalEgresos: opTotal + afTotal,
    }
  }, [egresos])

  // Métricas según perspectiva financiera
  const isOperativo = perspective === 'OPERATIVO'
  const activeIngresos = isOperativo ? ventasOperativas : totalIngresos
  const activeEgresos = isOperativo ? costosOperativos : totalEgresos
  const netFlow = activeIngresos - activeEgresos

  // Porcentajes relativos dentro de cada bloque
  const pctVentas = totalIngresos > 0 ? Math.round((ventasOperativas / totalIngresos) * 100) : 0
  const pctFinanciamiento = totalIngresos > 0 ? Math.max(0, 100 - pctVentas) : 0

  const pctCostosOperativos = totalEgresos > 0 ? Math.round((costosOperativos / totalEgresos) * 100) : 0
  const pctActivosFijos = totalEgresos > 0 ? Math.max(0, 100 - pctCostosOperativos) : 0

  // Porcentajes para mostrar en UI
  const displayPctVentas = isOperativo ? (ventasOperativas > 0 ? 100 : 0) : pctVentas
  const displayPctFinanciamiento = isOperativo ? 0 : pctFinanciamiento
  const displayPctOperativos = isOperativo ? (costosOperativos > 0 ? 100 : 0) : pctCostosOperativos
  const displayPctMaquinas = isOperativo ? 0 : pctActivosFijos

  // Ancho exacto de las barras (0 a 100%)
  const widthVentas = isOperativo
    ? (ventasOperativas > 0 ? 100 : 0)
    : (totalIngresos > 0 ? (ventasOperativas / totalIngresos) * 100 : 0)
  const widthFinanciamiento = isOperativo
    ? 0
    : (totalIngresos > 0 ? (financiamiento / totalIngresos) * 100 : 0)

  const widthOperativos = isOperativo
    ? (costosOperativos > 0 ? 100 : 0)
    : (totalEgresos > 0 ? (costosOperativos / totalEgresos) * 100 : 0)
  const widthMaquinas = isOperativo
    ? 0
    : (totalEgresos > 0 ? (activosFijos / totalEgresos) * 100 : 0)

  return (
    <TooltipProvider delay={100}>
      <div
        className={`bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[300px] ${className}`}
      >
        {/* Cabecera: Título y Selector de Modo Compacto */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              Estructura de Capital & Flujo
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {isOperativo ? 'Vista operativa pura sin endeudamiento' : 'Balance integral de caja y financiamiento'}
            </p>
          </div>

          <div className="bg-secondary p-0.5 rounded-xl border border-border flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setPerspective('TOTAL')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                perspective === 'TOTAL'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              Caja Total
            </button>
            <button
              type="button"
              onClick={() => setPerspective('OPERATIVO')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                perspective === 'OPERATIVO'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              Operativo
            </button>
          </div>
        </div>

        {/* Cuerpo: Barras de Composición Proporcional */}
        <div className="space-y-4 my-auto">
          {/* Bloque Ingresos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Ingresos ({formatCurrency(activeIngresos)})
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 shrink-0" />
                  Ventas: <strong className="font-bold">{formatCompactCurrency(ventasOperativas)}</strong> ({displayPctVentas}%)
                </span>
                <span className={`flex items-center gap-1 font-medium text-sky-700 dark:text-sky-400 ${isOperativo ? 'opacity-30' : ''}`}>
                  <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                  Préstamo: <strong className="font-bold">{formatCompactCurrency(financiamiento)}</strong> ({displayPctFinanciamiento}%)
                </span>
              </div>
            </div>

            {/* Barra apilada Ingresos */}
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-secondary border border-border/50">
              {widthVentas > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    style={{ width: `${widthVentas}%` }}
                    className="bg-emerald-700 h-full transition-all duration-300 hover:brightness-110 cursor-pointer block border-0 p-0"
                  />
                  <TooltipContent className="bg-card text-foreground border border-border p-2.5 rounded-xl shadow-lg text-xs">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">Ventas Catálogo</p>
                    <p className="text-muted-foreground font-mono mt-0.5">
                      {formatCurrency(ventasOperativas)} ({displayPctVentas}%)
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Ingresos cobrados de clientes y pedidos</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {widthFinanciamiento > 0 && !isOperativo && (
                <Tooltip>
                  <TooltipTrigger
                    style={{ width: `${widthFinanciamiento}%` }}
                    className="bg-sky-600 h-full transition-all duration-300 hover:brightness-110 cursor-pointer block border-0 p-0"
                  />
                  <TooltipContent className="bg-card text-foreground border border-border p-2.5 rounded-xl shadow-lg text-xs">
                    <p className="font-bold text-sky-600 dark:text-sky-400">Préstamo BCP</p>
                    <p className="text-muted-foreground font-mono mt-0.5">
                      {formatCurrency(financiamiento)} ({displayPctFinanciamiento}%)
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Capital de trabajo extraordinario</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Bloque Egresos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Egresos ({formatCurrency(activeEgresos)})
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 font-medium text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                  Operativo: <strong className="font-bold">{formatCompactCurrency(costosOperativos)}</strong> ({displayPctOperativos}%)
                </span>
                <span className={`flex items-center gap-1 font-medium text-primary ${isOperativo ? 'opacity-30' : ''}`}>
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  Máquinas: <strong className="font-bold">{formatCompactCurrency(activosFijos)}</strong> ({displayPctMaquinas}%)
                </span>
              </div>
            </div>

            {/* Barra apilada Egresos */}
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-secondary border border-border/50">
              {widthOperativos > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    style={{ width: `${widthOperativos}%` }}
                    className="bg-destructive h-full transition-all duration-300 hover:brightness-110 cursor-pointer block border-0 p-0"
                  />
                  <TooltipContent className="bg-card text-foreground border border-border p-2.5 rounded-xl shadow-lg text-xs">
                    <p className="font-bold text-destructive">Costos Operativos</p>
                    <p className="text-muted-foreground font-mono mt-0.5">
                      {formatCurrency(costosOperativos)} ({displayPctOperativos}%)
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Insumos, filamento, servicios y fletes</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {widthMaquinas > 0 && !isOperativo && (
                <Tooltip>
                  <TooltipTrigger
                    style={{ width: `${widthMaquinas}%` }}
                    className="bg-primary h-full transition-all duration-300 hover:brightness-110 cursor-pointer block border-0 p-0"
                  />
                  <TooltipContent className="bg-card text-foreground border border-border p-2.5 rounded-xl shadow-lg text-xs">
                    <p className="font-bold text-primary">Máquinas & Equipamiento</p>
                    <p className="text-muted-foreground font-mono mt-0.5">
                      {formatCurrency(activosFijos)} ({displayPctMaquinas}%)
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Inversión en activos fijos de producción</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Pie de Superávit */}
        <div className="bg-secondary/50 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs border border-border/40">
          <span className="text-muted-foreground font-medium">
            {isOperativo ? 'Utilidad Operativa del Período:' : 'Superávit Neto del Período:'}
          </span>
          <span
            className={`text-sm font-extrabold font-mono tabular-nums ${
              netFlow >= 0 ? 'text-foreground' : 'text-destructive'
            }`}
          >
            {formatSignedCurrency(netFlow)}
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default CashFlowAnalyticsCard
