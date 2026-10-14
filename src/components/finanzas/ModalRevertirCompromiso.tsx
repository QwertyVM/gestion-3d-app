'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export interface ReversionTarget {
  tipo: 'PRESTAMO' | 'PARTIDA'
  numeroCuota?: number
  partidaId?: string
  concepto: string
  mes: string
  monto: number
  inversionId?: string | null
}

export interface ModalRevertirCompromisoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ReversionTarget | null
  onConfirmarReversion: (target: ReversionTarget) => Promise<void>
}

export function ModalRevertirCompromiso({
  open,
  onOpenChange,
  target,
  onConfirmarReversion,
}: ModalRevertirCompromisoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!target) return null

  const handleRevertir = async () => {
    setIsSubmitting(true)
    try {
      await onConfirmarReversion(target)
      toast.success(`Pago de "${target.concepto}" (${target.mes}) revertido con éxito`)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al revertir el compromiso contable')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-5 gap-4 bg-card border-border shadow-xl rounded-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/70 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Revertir Asiento de Pago
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Extorno contable de cuota o gasto ejecutado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>¿Confirmas extornar este pago?</span>
          </div>
          <div className="text-foreground/90 space-y-1 text-xs">
            <p>
              <span className="font-semibold text-muted-foreground">Concepto: </span>
              <span className="font-bold">{target.concepto}</span>
            </p>
            <p>
              <span className="font-semibold text-muted-foreground">Período: </span>
              <span className="font-bold">{target.mes}</span>
            </p>
            <p>
              <span className="font-semibold text-muted-foreground">Importe Pagado: </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                S/ {target.monto.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-secondary/40 border border-border/70 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Efecto Contable:</span> Al revertir, se eliminará el egreso contable en la base de datos, reintegrando el saldo a tu Caja y volviendo a blindar la cuota pendiente.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 px-3.5 rounded-xl cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleRevertir}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Extornando...' : 'Confirmar Reversión'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
