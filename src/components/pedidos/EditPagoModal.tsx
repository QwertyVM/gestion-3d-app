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
      className="fixed inset-0 isolate z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-card border border-border rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-muted/40 border-b border-border p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-accent flex items-center justify-center shadow-xs">
              <DollarSign className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Registro de Abono</h3>
              <p className="text-xs text-muted-foreground">Ajusta la fecha contable, monto o método de este abono.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Fecha */}
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Fecha Real de Cobranza *
            </Label>
            <Input
              type="date"
              value={editingPago.fecha}
              onChange={(e) => setEditingPago(prev => prev ? { ...prev, fecha: e.target.value } : null)}
              required
              className="bg-background border-border text-foreground font-mono text-sm font-semibold rounded-xl focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              Esta fecha se reflejará exactamente en el Flujo de Caja e ingresos de ese día.
            </p>
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
              Monto Cobrado (S/) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">S/</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editingPago.monto}
                onChange={(e) => setEditingPago(prev => prev ? { ...prev, monto: e.target.value } : null)}
                required
                placeholder="0.00"
                className="pl-9 bg-background border-border text-foreground font-mono text-base font-bold rounded-xl focus:border-primary"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
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
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSel 
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs' 
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {metodo}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tipo de Abono */}
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
              Tipo de Abono *
            </Label>
            <select
              value={editingPago.tipo}
              onChange={(e) => setEditingPago(prev => prev ? { ...prev, tipo: e.target.value } : null)}
              className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground cursor-pointer"
            >
              <option value="ANTICIPO">Anticipo / Adelanto</option>
              <option value="SALDO_ENTREGA">Liquidación / Saldo Final</option>
              <option value="ABONO">Abono Parcial</option>
            </select>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
              Notas o N° de Operación (Opcional)
            </Label>
            <Input
              value={editingPago.notas}
              onChange={(e) => setEditingPago(prev => prev ? { ...prev, notas: e.target.value } : null)}
              placeholder="Ej: Operación 481920..."
              className="bg-background border-border text-foreground text-xs rounded-xl"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 h-9 text-xs font-medium border-border bg-card hover:bg-muted text-muted-foreground rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
