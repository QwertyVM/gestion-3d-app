'use client'

import React, { useState } from 'react'
import {
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StockCajasResumen, LoteCajaItem } from '@/actions/cajas'

interface BoxStockCardProps {
  stockCajas: StockCajasResumen
  onOpenLotsModal?: () => void
  onFilterSinCaja?: () => void
  pedidosSinCajaCount?: number
}

export function BoxStockCard({
  stockCajas,
  onOpenLotsModal,
  onFilterSinCaja,
  pedidosSinCajaCount = 0
}: BoxStockCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isLowStock = stockCajas.totalStockDisponible < 10
  const isOutOfStock = stockCajas.totalStockDisponible <= 0

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Izquierdo: Título y Stock Principal */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
            isOutOfStock
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : isLowStock
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Package className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                Inventario de Cajas de Packaging
              </h3>
              {stockCajas.loteReciente50 && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Lote 50 uds activo (S/ {stockCajas.loteReciente50.costoUnitario.toFixed(2)} c/u)
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control de existencias y asignación a pedidos para cálculo de rentabilidad neta real.
            </p>
          </div>
        </div>

        {/* Lado Derecho: KPIs Clave y Acciones */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Badge / Pill de Stock Disponible */}
          <div className="bg-secondary/60 border border-border px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Stock Disponible
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-black font-mono tabular-nums ${
                  isOutOfStock ? 'text-destructive' : isLowStock ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {stockCajas.totalStockDisponible}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  / {stockCajas.totalCajasCompradas} uds
                </span>
              </div>
            </div>
          </div>

          {/* Badge de Cajas Asignadas */}
          <div className="bg-secondary/60 border border-border px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Asignadas en Pedidos
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono tabular-nums text-foreground">
                  {stockCajas.totalCajasAsignadas}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  cajas
                </span>
              </div>
            </div>
          </div>

          {/* Botón Ver Desglose / Lotes */}
          {onOpenLotsModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLotsModal}
              className="border-border text-foreground hover:bg-muted text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Ver Lotes Registrados</span>
            </Button>
          )}

          {/* Botón Toggle Desglose Rápido */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground text-xs h-9 px-2 rounded-xl flex items-center gap-1 cursor-pointer"
            title={expanded ? 'Ocultar desglose' : 'Mostrar desglose'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* ALERTA DE PEDIDOS PENDIENTES DE ASIGNAR CAJA */}
      {pedidosSinCajaCount > 0 && (
        <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl p-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Hay <strong>{pedidosSinCajaCount} pedidos</strong> sin caja asignada. Asigna sus cajas para calcular el margen neto real exacto.
            </span>
          </div>
          {onFilterSinCaja && (
            <button
              type="button"
              onClick={onFilterSinCaja}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer shrink-0 self-end sm:self-auto"
            >
              Ver pedidos sin caja →
            </button>
          )}
        </div>
      )}

      {/* DESGLOSE EXPANDIDO DE LOTES PRINCIPALES */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Lotes de Cajas Registrados en Egresos ({stockCajas.lotes.length})
            </span>
            <span className="text-[11px] text-muted-foreground">
              Costo Unit. Promedio: <strong>S/ {stockCajas.costoUnitarioPromedio.toFixed(2)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stockCajas.lotes.slice(0, 6).map((lote) => {
              const pctUsed = lote.cantidadComprada > 0
                ? Math.round((lote.cajasAsignadasCount / lote.cantidadComprada) * 100)
                : 0

              return (
                <div
                  key={lote.id}
                  className="bg-card border border-border/70 rounded-xl p-3 flex flex-col justify-between gap-2 shadow-2xs hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate" title={lote.concepto}>
                        {lote.concepto}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {lote.fecha.slice(0, 10)} • S/ {lote.costoUnitario.toFixed(2)} c/u
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono font-bold shrink-0 ${
                        lote.stockDisponible > 0
                          ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                          : 'border-muted text-muted-foreground bg-muted/40'
                      }`}
                    >
                      {lote.stockDisponible} disp.
                    </Badge>
                  </div>

                  {/* Barra de progreso de consumo del lote */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Usadas: {lote.cajasAsignadasCount} / {lote.cantidadComprada}</span>
                      <span>{pctUsed}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pctUsed >= 100
                            ? 'bg-muted-foreground/40'
                            : pctUsed > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pctUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {stockCajas.lotes.length > 6 && onOpenLotsModal && (
            <div className="text-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenLotsModal}
                className="text-xs text-primary font-medium hover:underline cursor-pointer h-8"
              >
                Ver todos los {stockCajas.lotes.length} lotes de cajas →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
