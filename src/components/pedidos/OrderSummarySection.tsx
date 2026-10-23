'use client'

import React from 'react'
import { DollarSign, Truck, CreditCard, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface OrderSummarySectionProps {
  formCostoEnvio: string
  setFormCostoEnvio: (val: string) => void
  formMontoPagado: string
  setFormMontoPagado: (val: string) => void
  formMetodoPago: string
  setFormMetodoPago: (val: string) => void
  subtotal: number
  total: number
  saldoPendiente: number
  formatCurrency: (val: number) => string
}

export function OrderSummarySection({
  formCostoEnvio,
  setFormCostoEnvio,
  formMontoPagado,
  setFormMontoPagado,
  formMetodoPago,
  setFormMetodoPago,
  subtotal,
  total,
  saldoPendiente,
  formatCurrency
}: OrderSummarySectionProps) {
  const montoEnvio = Number(formCostoEnvio) || 0
  const montoAnticipo = Number(formMontoPagado) || 0

  return (
    <div className="space-y-4">
      {/* Encabezado Minimalista */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-border/50">
        <span className="text-[11px] font-mono text-muted-foreground">03.</span>
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Totales &amp; Liquidación
        </span>
      </div>

      {/* Grid de 2 Bloques: Inputs Financieros vs Resumen Contable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Bloque Izquierdo: Inputs de Envío, Método y Anticipo */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Costo de Envío */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Truck className="h-3 w-3 text-muted-foreground" />
                Costo de Envío (S/)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formCostoEnvio}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormCostoEnvio(e.target.value)}
                className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs font-mono font-medium focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
              />
            </div>

            {/* Método de Pago */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-muted-foreground" />
                Método de Pago
              </Label>
              <select
                value={formMetodoPago}
                onChange={(e) => setFormMetodoPago(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/70 bg-background text-foreground text-xs font-medium px-2.5 focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="BCP">Transferencia BCP</option>
                <option value="BBVA">Transferencia BBVA</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </div>
          </div>

          {/* Abono / Anticipo con atajos mínimos */}
          <div className="space-y-1.5 pt-0.5">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                Abono / Anticipo Inicial (S/)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formMontoPagado}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormMontoPagado(e.target.value)}
                className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs font-mono font-medium focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
              />
            </div>

            {/* Atajos Rápidos Minimalistas */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFormMontoPagado((total * 0.5).toFixed(2))}
                className="text-[11px] font-mono py-1 px-2.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
              >
                50% (S/ {(total * 0.5).toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setFormMontoPagado(total.toFixed(2))}
                className="text-[11px] font-mono py-1 px-2.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
              >
                100% (S/ {total.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setFormMontoPagado('0')}
                className="text-[11px] font-mono py-1 px-2.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
              >
                S/ 0 Contraentrega
              </button>
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Resumen Contable Limpio */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/40">
            Resumen de Liquidación
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal Productos</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Envío</span>
              <span className="font-mono tabular-nums text-foreground">
                {montoEnvio > 0 ? formatCurrency(montoEnvio) : 'S/ 0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-t border-border/40 font-medium text-foreground">
              <span>Total Pedido</span>
              <span className="font-mono text-sm tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Anticipo</span>
              <span className="font-mono tabular-nums text-foreground">
                {montoAnticipo > 0 ? `− ${formatCurrency(montoAnticipo)}` : 'S/ 0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="font-medium text-xs text-foreground">
                Saldo Pendiente
              </span>
              <span className="font-mono font-medium text-xs text-foreground tabular-nums">
                {formatCurrency(saldoPendiente)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
