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
    <div className="bg-card/70 border border-border rounded-xl p-5 mb-2 space-y-4 shadow-sm">
      {/* Encabezado con Stepper Badge */}
      <div className="flex items-center pb-3 border-b border-border">
        <span className="bg-primary/10 text-primary font-bold text-xs w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 shrink-0">
          3
        </span>
        <span className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-primary" />
          Totales y Liquidación Dinámica
        </span>
      </div>

      {/* Grid de 2 Bloques: Inputs Financieros vs Tarjeta Consolidada */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Bloque Izquierdo: Flujo Compacto y Estrictamente Ordenado (7 columnas) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Fila 1 (2 cols): [ Costo de Envío (S/) ] y [ Método de Pago (select) ] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Costo de Envío */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Truck className="h-3 w-3 text-primary" />
                Costo de Envío (S/)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formCostoEnvio}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormCostoEnvio(e.target.value)}
                className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Método de Pago */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-primary" />
                Método de Pago
              </Label>
              <select
                value={formMetodoPago}
                onChange={(e) => setFormMetodoPago(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-card/80 text-foreground text-sm font-semibold px-3 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="BCP">Transferencia BCP</option>
                <option value="BBVA">Transferencia BBVA</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </div>
          </div>

          {/* Fila 2 (1 col): [ Abono / Anticipo (S/) ] con Atajos en Grid de 3 Columnas Fijas */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-primary" />
                Abono / Anticipo (S/)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formMontoPagado}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormMontoPagado(e.target.value)}
                className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono font-bold text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Atajos de Anticipo: Grid de 3 Columnas Fijas y Altura Uniforme */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Atajos de Anticipo:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  title={`50% (S/ ${(total * 0.5).toFixed(2)})`}
                  onClick={() => setFormMontoPagado((total * 0.5).toFixed(2))}
                  className="text-xs py-1.5 px-2 text-center truncate rounded-lg font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer"
                >
                  50% (S/ {(total * 0.5).toFixed(2)})
                </button>
                <button
                  type="button"
                  title="100% Total"
                  onClick={() => setFormMontoPagado(total.toFixed(2))}
                  className="text-xs py-1.5 px-2 text-center truncate rounded-lg font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer"
                >
                  100% Total
                </button>
                <button
                  type="button"
                  title="Contra entrega (S/ 0)"
                  onClick={() => setFormMontoPagado('0')}
                  className="text-xs py-1.5 px-2 text-center truncate rounded-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors cursor-pointer"
                >
                  Contra entrega (S/ 0)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Desglose Operativo de Balance (5 columnas) */}
        <div className="lg:col-span-5 h-fit bg-secondary/50 border border-border rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Resumen de Balance
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/70">
              Desglose Operativo
            </span>
          </div>

          {/* Cálculo Matemático Operativo */}
          <div className="text-[10.5px] font-mono text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1 text-center border border-border/50">
            Subtotal + Envío − Anticipo = Saldo por Cobrar
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="text-muted-foreground/60 font-mono">(+)</span> Subtotal:
              </span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="text-muted-foreground/60 font-mono">(+)</span> Envío:
              </span>
              <span className="font-mono font-medium text-foreground">
                {montoEnvio > 0 ? formatCurrency(montoEnvio) : 'S/ 0.00'}
              </span>
            </div>

            {/* Total Pedido con tipografía reducida */}
            <div className="flex items-center justify-between py-1 border-t border-border/60 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wide text-[11px]">
                <span className="text-muted-foreground/60 font-mono">(=)</span> Total Pedido:
              </span>
              <span className="font-mono font-bold text-foreground text-xs">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="text-muted-foreground/60 font-mono">(−)</span> Anticipo:
              </span>
              <span className="font-mono font-medium text-primary">
                − {formatCurrency(montoAnticipo)}
              </span>
            </div>

            {/* Saldo por Cobrar con tipografía reducida */}
            <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
              <div>
                <span className="font-semibold text-foreground flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground/60 font-mono">(=)</span> Saldo por Cobrar:
                </span>
                <span className="text-[10px] text-muted-foreground block pl-4">
                  {saldoPendiente === 0 ? 'Liquidado' : 'Pendiente al entregar'}
                </span>
              </div>
              <span className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                {formatCurrency(saldoPendiente)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
