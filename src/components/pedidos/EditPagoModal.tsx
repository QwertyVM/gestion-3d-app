'use client'

import React from 'react'
import { DollarSign, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface EditingPagoState {
  id: string
  fecha: string
  monto: string
  metodoPago: string
  tipo: string
  notas: string
  pedidoId: string
}

interface EditPagoModalProps {
  isOpen: boolean
  onClose: () => void
  editingPago: EditingPagoState | null
  setEditingPago: React.Dispatch<React.SetStateAction<EditingPagoState | null>>
  onSubmit: (e: React.FormEvent) => Promise<void>
  isSubmitting: boolean
}

export function EditPagoModal({
  isOpen,
  onClose,
  editingPago,
  setEditingPago,
  onSubmit,
  isSubmitting
}: EditPagoModalProps) {
  if (!isOpen || !editingPago) return null

  return (
    <div
      className="fixed inset-0 isolate z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-card border border-border/80 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Minimalista */}
        <div className="p-4 sm:p-5 border-b border-border/50 bg-card/95 backdrop-blur-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">Editar Registro de Abono</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ajusta fecha contable, monto o método de este abono.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Fecha */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              Fecha Real de Cobranza *
            </Label>
            <Input
              type="date"
              value={editingPago.fecha}
              onChange={(e) => setEditingPago(prev => prev ? { ...prev, fecha: e.target.value } : null)}
              required
              className="h-9 rounded-lg border-border/70 bg-background text-foreground font-mono text-xs focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Monto Cobrado (S/) *
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">S/</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editingPago.monto}
                onChange={(e) => setEditingPago(prev => prev ? { ...prev, monto: e.target.value } : null)}
                required
                placeholder="0.00"
                className="pl-7 h-9 rounded-lg border-border/70 bg-background text-foreground font-mono text-xs focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Método de Pago *
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {['YAPE', 'PLIN', 'BCP', 'EFECTIVO'].map(metodo => {
                const isSel = editingPago.metodoPago === metodo
                return (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => setEditingPago(prev => prev ? { ...prev, metodoPago: metodo } : null)}
                    className={`py-1.5 px-1 text-center rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSel 
                        ? 'bg-foreground text-background border-foreground font-semibold shadow-xs' 
                        : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {metodo}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tipo de Abono */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Tipo de Abono *
            </Label>
            <select
              value={editingPago.tipo}
              onChange={(e) => setEditingPago(prev => prev ? { ...prev, tipo: e.target.value } : null)}
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="ANTICIPO">Anticipo / Adelanto</option>
              <option value="SALDO_ENTREGA">Liquidación / Saldo Final</option>
              <option value="ABONO">Abono Parcial</option>
            </select>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Notas o N° de Operación (Opcional)
            </Label>
            <Input
              value={editingPago.notas}
              onChange={(e) => setEditingPago(prev => prev ? { ...prev, notas: e.target.value } : null)}
              placeholder="Ej: Operación 481920..."
              className="h-9 rounded-lg border-border/70 bg-background text-foreground text-xs focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-4 h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
