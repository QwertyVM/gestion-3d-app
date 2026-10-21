'use client'

import React from 'react'
import { DollarSign, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface OrderFinancialSummaryProps {
  costoEnvio: string
  setCostoEnvio: (val: string) => void
  formMontoPagado: string
  setFormMontoPagado: (val: string) => void
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
  formMontoPagado,
  setFormMontoPagado,
  subtotalItems,
  nuevoTotal,
  saldoPendiente,
  montoPagado,
  totalPagosCount,
  formatCurrency
}: OrderFinancialSummaryProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Costo de Envío (3 cols) */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">
            Envío:
          </Label>
          <div className="flex items-center gap-1 font-mono flex-1">
            <span className="text-muted-foreground text-xs">S/</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={costoEnvio}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setCostoEnvio(e.target.value)}
              className="h-8 text-xs font-mono font-bold bg-background border-input rounded-lg px-2 text-right focus-visible:ring-1 focus-visible:ring-primary w-full"
            />
          </div>
        </div>

        {/* Abono / Monto Pagado (4 cols) */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground shrink-0 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-primary" />
            Pagado:
          </Label>
          <div className="flex items-center gap-1 font-mono flex-1">
            <span className="text-muted-foreground text-xs">S/</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formMontoPagado}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setFormMontoPagado(e.target.value)}
              className="h-8 text-xs font-mono font-bold text-primary bg-background border-input rounded-lg px-2 text-right focus-visible:ring-1 focus-visible:ring-primary w-full"
            />
          </div>
        </div>

        {/* Balance contable (5 cols) */}
        <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-2 font-mono text-xs flex-wrap">
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

      {/* Chips de Acción Rápida: [ 50% Anticipo ], [ Pago 100% Total ], [ S/ 0 Contraentrega ] */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Atajos de Pago:
          </span>
          <button
            type="button"
            title={`50% Anticipo (S/ ${(nuevoTotal * 0.5).toFixed(2)})`}
            onClick={() => setFormMontoPagado((nuevoTotal * 0.5).toFixed(2))}
            className="text-xs py-1 px-2.5 rounded-lg font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer"
          >
            50% Anticipo
          </button>
          <button
            type="button"
            title={`Pago 100% Total (S/ ${nuevoTotal.toFixed(2)})`}
            onClick={() => setFormMontoPagado(nuevoTotal.toFixed(2))}
            className="text-xs py-1 px-2.5 rounded-lg font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer"
          >
            Pago 100% Total
          </button>
          <button
            type="button"
            title="S/ 0 Contraentrega"
            onClick={() => setFormMontoPagado('0')}
            className="text-xs py-1 px-2.5 rounded-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors cursor-pointer"
          >
            S/ 0 Contraentrega
          </button>
        </div>

        {totalPagosCount > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {totalPagosCount} {totalPagosCount === 1 ? 'abono registrado' : 'abonos registrados'} en historial ({formatCurrency(montoPagado)})
          </span>
        )}
      </div>
    </div>
  )
}
