'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
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
      // Excluye micro-ingresos por intereses de cuenta que corresponden a operación
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

      // REGLA ESTRICTA: categoria === 'Maquinaria & Equipos' ➔ Activos Fijos
      // También mapea enum 'ACTIVO_FIJO' y subcategorías de maquinaria
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

  // Métricas activas según perspectiva financiera
  const isOperativo = perspective === 'OPERATIVO'
  const activeIngresos = isOperativo ? ventasOperativas : totalIngresos
  const activeEgresos = isOperativo ? costosOperativos : totalEgresos
  const netFlow = activeIngresos - activeEgresos

  // Porcentajes relativos dentro de su estructura
  const pctVentas = totalIngresos > 0 ? Math.round((ventasOperativas / totalIngresos) * 100) : 0
  const pctFinanciamiento = totalIngresos > 0 ? Math.round((financiamiento / totalIngresos) * 100) : 0
  const pctCostosOperativos = totalEgresos > 0 ? Math.round((costosOperativos / totalEgresos) * 100) : 0
  const pctActivosFijos = totalEgresos > 0 ? Math.round((activosFijos / totalEgresos) * 100) : 0

  // Segmentos proporcionales desglosados del Donut Multicapa
  const donutSegments = useMemo(() => {
    if (isOperativo) {
      return [
        {
          name: 'Ventas de Catálogo',
          value: ventasOperativas,
          color: '#059669', // emerald-600
          porcentaje: ventasOperativas + costosOperativos > 0
            ? Math.round((ventasOperativas / (ventasOperativas + costosOperativos)) * 100)
            : 0,
        },
        {
          name: 'Costos Operativos',
          value: costosOperativos,
          color: '#A34335', // destructive oficial NOVA
          porcentaje: ventasOperativas + costosOperativos > 0
            ? Math.round((costosOperativos / (ventasOperativas + costosOperativos)) * 100)
            : 0,
        },
      ].filter((s) => s.value > 0)
    }

    return [
      {
        name: 'Ventas de Catálogo',
        value: ventasOperativas,
        color: '#059669', // emerald-600
        porcentaje: pctVentas,
      },
      {
        name: 'Préstamo BCP',
        value: financiamiento,
        color: '#0284c7', // sky-600
        porcentaje: pctFinanciamiento,
      },
      {
        name: 'Costos Operativos',
        value: costosOperativos,
        color: '#A34335', // destructive oficial NOVA
        porcentaje: pctCostosOperativos,
      },
      {
        name: 'Inversión en Máquinas',
        value: activosFijos,
        color: '#A36F4C', // primary oficial NOVA
        porcentaje: pctActivosFijos,
      },
    ].filter((s) => s.value > 0)
  }, [
    isOperativo,
    ventasOperativas,
    financiamiento,
    costosOperativos,
    activosFijos,
    pctVentas,
    pctFinanciamiento,
    pctCostosOperativos,
    pctActivosFijos,
  ])

  // Centro del Donut según la especificación
  const centerLabel = isOperativo
    ? 'UTILIDAD OPERATIVA'
    : netFlow >= 0
    ? 'SUPERÁVIT EN CAJA'
    : 'DÉFICIT EN CAJA'

  return (
    <div className={`bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5 ${className}`}>
      {/* 1. Cabecera con Switch de Perspectiva Financiera */}
      <div>
        <h2 className="text-base font-bold text-foreground">
          Estructura de Flujo & Balance
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Compara ventas reales vs. financiamiento y gastos operativos vs. inversión
        </p>

        {/* Fila 3: Selector de Modo (Segmented control a ancho completo) */}
        <div className="bg-secondary/80 border border-border/70 p-1 rounded-xl flex items-center gap-1 w-full mt-3">
          <button
            type="button"
            onClick={() => setPerspective('TOTAL')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center ${
              perspective === 'TOTAL'
                ? 'bg-card text-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            Caja Total (Integral)
          </button>
          <button
            type="button"
            onClick={() => setPerspective('OPERATIVO')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center ${
              perspective === 'OPERATIVO'
                ? 'bg-card text-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            Operativo Puro (Ventas)
          </button>
        </div>
      </div>

      {/* 2. Gráfico de Donut Multicapa (No Binario) */}
      <div className="relative w-full h-[210px] flex items-center justify-center">
        {donutSegments.length === 0 ? (
          <div className="text-xs text-muted-foreground italic text-center">
            Sin movimientos registrados en este período.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {donutSegments.map((entry, index) => (
                    <Cell key={`donut-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0]
                      return (
                        <div className="bg-card/95 backdrop-blur-md border border-border p-2.5 rounded-xl shadow-lg text-xs min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: d.payload.color }}
                            />
                            <span className="font-bold text-foreground">{d.name}</span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-muted-foreground font-mono">
                            <span>Monto:</span>
                            <span className="font-bold text-foreground">
                              {formatCurrency(Number(d.value))}
                            </span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {centerLabel}
              </span>
              <span className="text-xl font-extrabold text-foreground font-mono tabular-nums mt-0.5">
                {formatSignedCurrency(netFlow)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. Panel Inferior de Desglose Contable (2 Bloques Verticales Estructurados) */}
      <div className="space-y-4 pt-4 border-t border-border/70 w-full">
        {/* Bloque Ingresos */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Ingresos & Entradas ({formatCurrency(activeIngresos)})
          </span>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              Ventas de Catálogo
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(ventasOperativas)}{' '}
              <span className="text-muted-foreground font-normal text-[11px]">
                ({isOperativo ? '100%' : `${pctVentas}%`})
              </span>
            </span>
          </div>
          <div className={`flex items-center justify-between text-xs py-1 ${isOperativo ? 'opacity-40' : ''}`}>
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
              Préstamo BCP
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(financiamiento)}{' '}
              <span className="text-muted-foreground font-normal text-[11px]">
                ({isOperativo ? '—' : `${pctFinanciamiento}%`})
              </span>
            </span>
          </div>
        </div>

        {/* Bloque Egresos */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Egresos & Salidas ({formatCurrency(activeEgresos)})
          </span>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
              Costos Operativos
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(costosOperativos)}{' '}
              <span className="text-muted-foreground font-normal text-[11px]">
                ({isOperativo ? '100%' : `${pctCostosOperativos}%`})
              </span>
            </span>
          </div>
          <div className={`flex items-center justify-between text-xs py-1 ${isOperativo ? 'opacity-40' : ''}`}>
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              Inversión en Máquinas
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(activosFijos)}{' '}
              <span className="text-muted-foreground font-normal text-[11px]">
                ({isOperativo ? '—' : `${pctActivosFijos}%`})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Fila de Síntesis y Flujo Neto */}
      <div className="bg-secondary/40 rounded-xl p-3 flex items-center justify-between text-xs font-semibold mt-3">
        <span className="text-muted-foreground">
          Flujo Neto Real del Período:
        </span>
        <span className="text-sm font-extrabold text-foreground font-mono tabular-nums">
          {formatSignedCurrency(netFlow)}
        </span>
      </div>
    </div>
  )
}

export default CashFlowAnalyticsCard
