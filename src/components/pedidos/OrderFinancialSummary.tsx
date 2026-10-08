'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface OrderFinancialSummaryProps {
  costoEnvio: string
  setCostoEnvio: (val: string) => void
  subtotalItems: number
  nuevoTotal: number
  saldoPendiente: number
  montoPagado: number
  totalPagosCount: number
  formatCurrency: (val: number) => string
}

export function OrderFinancialSummary({
  costoEnvio,
  setCostoEnvio,
  subtotalItems,
  nuevoTotal,
  saldoPendiente,
  montoPagado,
  totalPagosCount,
  formatCurrency
}: OrderFinancialSummaryProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1.5 shadow-2xs">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 text-xs">
        {/* Izquierda: Costo de Envío / Flete */}
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-foreground shrink-0">
            Envío / Flete:
          </Label>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-muted-foreground text-xs">S/</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={costoEnvio}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setCostoEnvio(e.target.value)}
              className="w-20 h-7 text-xs font-mono font-bold bg-background border-input rounded-md px-2 text-right focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Centro: Abonos registrados */}
        <div className="flex items-center gap-1.5">
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border text-[11px] font-mono">
            Abonos registrados ({totalPagosCount}): {formatCurrency(montoPagado)}
          </span>
        </div>

        {/* Derecha: Balance contable en 1 sola línea compacta */}
        <div className="flex items-center gap-2 font-mono text-xs flex-wrap md:flex-nowrap">
          <span className="text-muted-foreground">
            Subtotal: <strong className="text-foreground font-semibold">{formatCurrency(subtotalItems)}</strong>
          </span>
          <span className="text-border hidden sm:inline">•</span>
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground font-semibold">{formatCurrency(nuevoTotal)}</strong>
          </span>
          <span className="text-border hidden sm:inline">•</span>
          <span className="text-foreground font-bold">
            Saldo: <strong className="text-primary font-black">{formatCurrency(saldoPendiente)}</strong>
          </span>
        </div>
      </div>

      {/* Leyenda micro-copy tenue de 1 sola línea */}
      <p className="text-[10px] text-muted-foreground text-center md:text-right">
        Los abonos previos se conservan; el saldo se recalcula automáticamente si cambia el total.
      </p>
    </div>
  )
}
