'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Plus,
  RotateCcw,
  Calendar,
  Clock,
  X,
  CreditCard,
} from 'lucide-react'
import type { ItemHistorialPago } from '@/actions/presupuesto'
import type { ReversionTarget } from './ModalRevertirCompromiso'
import { getIconoCompromiso } from './CompromisosBlindadosCard'

export interface HistorialModalItem {
  id: string
  concepto: string
  subconcepto?: string
  categoria?: string
  tipo: 'PRESTAMO' | 'PARTIDA'
  cuotasPagadas: number
  totalCuotas?: number
  totalAbonado: number
  montoMensualPresupuesto: number
  capitalRestante?: number
  historialPagos: ItemHistorialPago[]
}

export interface PaymentHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: HistorialModalItem | null
  onPagarNuevo?: (item: HistorialModalItem, mesPeriodo?: string) => void
  onRevertirPago?: (target: ReversionTarget) => void
}

export function PaymentHistoryModal({
  open,
  onOpenChange,
  item,
  onPagarNuevo,
  onRevertirPago,
}: PaymentHistoryModalProps) {
  if (!item) return null

  const esPrestamo = item.tipo === 'PRESTAMO'
  const listaPagos = item.historialPagos || []
  const pagosRealizados = listaPagos
  const totalAbonado = item.totalAbonado
  const presupuestoMensual = item.montoMensualPresupuesto
  const tienePagos = listaPagos.length > 0

  const handlePagarCuota = (periodo?: string) => {
    onOpenChange(false)
    if (onPagarNuevo) {
      onPagarNuevo(item, periodo)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg sm:max-w-lg bg-background border border-border rounded-2xl shadow-2xl p-6 space-y-5 overflow-y-auto flex flex-col max-h-[85vh]"
      >
        {/* 1. Encabezado del Servicio */}
        <div className="flex items-start justify-between pb-4 border-b border-border/70">
          <div className="min-w-0">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 border border-border/70 mr-3">
                {getIconoCompromiso(item.categoria, item.concepto)}
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  Historial de Pagos
                </h3>
                <span
                  className="bg-secondary border border-border text-foreground text-xs font-semibold px-2.5 py-0.5 rounded-md ml-2 truncate max-w-[200px]"
                  title={item.concepto}
                >
                  {item.concepto}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-13">
              {esPrestamo
                ? 'Registro cronológico de amortización de cuotas del préstamo de capital'
                : 'Registro de egresos contables asentados en caja para este servicio'}
            </p>
          </div>

          {/* Botón X de Cierre */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 2. Resumen de Métricas Financieras (3 Tarjetas Aisladas con Gap) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Resumen Financiero del Servicio
            </span>
            <Button
              type="button"
              onClick={() => handlePagarCuota()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pagar Cuota Actual</span>
            </Button>
          </div>

          {/* Grid de 3 Cajas Independientes con Gap Estricto */}
          <div className="grid grid-cols-3 gap-3">
            {/* Caja 1: Pagos Realizados */}
            <div className="bg-card border border-border rounded-xl p-3 text-center flex flex-col justify-between shadow-2xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                {esPrestamo ? 'Cuotas Pagadas' : 'Pagos Realizados'}
              </span>
              <span className="text-base font-extrabold text-foreground mt-1">
                {esPrestamo
                  ? `${item.cuotasPagadas} / ${item.totalCuotas || 24}`
                  : `${pagosRealizados.length} ${pagosRealizados.length === 1 ? 'pago' : 'pagos'}`}
              </span>
            </div>

            {/* Caja 2: Total Abonado */}
            <div className="bg-card border border-border rounded-xl p-3 text-center flex flex-col justify-between shadow-2xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Total Abonado
              </span>
              <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 mt-1">
                S/ {totalAbonado.toFixed(2)}
              </span>
            </div>

            {/* Caja 3: Presupuesto Mensual */}
            <div className="bg-card border border-border rounded-xl p-3 text-center flex flex-col justify-between shadow-2xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                {esPrestamo ? 'Cap. Restante' : 'Presupuesto Mes'}
              </span>
              <span className="text-base font-extrabold text-foreground mt-1">
                S/ {(esPrestamo ? item.capitalRestante ?? 0 : presupuestoMensual).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Registro de Movimientos Contables */}
        <div className="space-y-2.5 flex-1 min-h-0 flex flex-col">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Registro de Movimientos Contables ({listaPagos.length})</span>
          </div>

          <div className="overflow-y-auto max-h-[300px] space-y-2 pr-1">
            {tienePagos ? (
              listaPagos.map((pago, idx) => {
                const mesLabel =
                  pago.mesPeriodo ||
                  (pago.numeroCuota ? `Cuota ${pago.numeroCuota}` : `Pago #${idx + 1}`)
                return (
                  <div
                    key={pago.id || idx}
                    className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-border/90 transition-colors gap-3"
                  >
                    {/* Izquierda: Mes y año + Badge ✓ Pagado + Fecha completa */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          {mesLabel}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                          ✓ Pagado
                        </span>
                        {pago.metodoPago && (
                          <span className="text-[10px] bg-secondary text-muted-foreground font-mono px-1.5 py-0.5 rounded border border-border/60 whitespace-nowrap">
                            {pago.metodoPago}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span>{pago.fechaPago || '28 set. 2026'}</span>
                        </span>
                        {pago.concepto && pago.concepto !== mesLabel && (
                          <span className="text-xs text-muted-foreground truncate">
                            • {pago.concepto}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Derecha: Monto abonado en negrita + Botón Revertir Pago */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-sm font-bold text-foreground font-mono">
                        S/ {pago.monto.toFixed(2)}
                      </span>

                      {onRevertirPago && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onOpenChange(false)
                            onRevertirPago({
                              tipo: item.tipo,
                              partidaId: item.tipo === 'PARTIDA' ? item.id : undefined,
                              numeroCuota: pago.numeroCuota,
                              concepto: item.concepto,
                              mes: mesLabel,
                              monto: pago.monto,
                              inversionId: pago.inversionId,
                            })
                          }}
                          className="text-destructive hover:bg-destructive/10 text-xs font-semibold h-7 px-2.5 rounded-lg flex items-center gap-1 ml-2 cursor-pointer active:scale-[0.98] whitespace-nowrap"
                          title="Extornar y revertir este movimiento contable"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revertir Pago</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-secondary/30 border border-dashed border-border/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-xs font-bold text-foreground">
                    Aún no se registran pagos para este {esPrestamo ? 'préstamo' : 'compromiso'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Puedes asentar el egreso del mes en curso para descontarlo de tu caja disponible.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => handlePagarCuota()}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold h-8 px-4 rounded-xl shadow-2xs flex items-center gap-1.5 mt-1 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Registrar Pago (S/ {presupuestoMensual.toFixed(2)})</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Footer Estandarizado */}
        <div className="pt-4 border-t border-border/70 flex items-center justify-end mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground hover:bg-secondary rounded-xl text-xs font-semibold h-9 px-4 shadow-2xs cursor-pointer"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
