'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { PartidaPresupuesto } from './CashFlowHubView'

export interface BlindadoFormData {
  id?: string
  concepto: string
  subconcepto?: string
  monto: number
  categoria: string
  diaPago?: number
}

export interface AddBlindadoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPartida?: PartidaPresupuesto | null
  onSave: (data: BlindadoFormData) => Promise<void>
}

export const CATEGORIAS_BLINDADO = [
  { value: 'OPERATIVO', label: 'Fijo / Taller' },
  { value: 'SERVICIOS', label: 'Servicios & Op.' },
  { value: 'CAPEX', label: 'Reserva Máquinas' },
  { value: 'BLINDADO', label: 'Deuda / Préstamo' },
] as const

export function AddBlindadoModal({
  open,
  onOpenChange,
  editingPartida,
  onSave,
}: AddBlindadoModalProps) {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState<string>('OPERATIVO')
  const [diaPago, setDiaPago] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingPartida) {
      setConcepto(editingPartida.concepto)
      setMonto(String(editingPartida.monto || editingPartida.presupuesto || ''))
      setCategoria(editingPartida.categoria || 'OPERATIVO')
      // Extraer día si existía en subconcepto tipo "Día 15"
      const match = editingPartida.subconcepto?.match(/\d+/)
      setDiaPago(match ? match[0] : '')
    } else {
      setConcepto('')
      setMonto('')
      setCategoria('OPERATIVO')
      setDiaPago('')
    }
  }, [editingPartida, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanConcepto = concepto.trim()
    if (!cleanConcepto) {
      toast.error('Ingresa un concepto o nombre para el gasto')
      return
    }

    const numMonto = parseFloat(monto)
    if (isNaN(numMonto) || numMonto <= 0) {
      toast.error('Ingresa un monto válido mayor a 0')
      return
    }

    let numDia: number | undefined = undefined
    if (diaPago.trim()) {
      const parsedDia = parseInt(diaPago, 10)
      if (isNaN(parsedDia) || parsedDia < 1 || parsedDia > 31) {
        toast.error('El día de pago debe estar entre 1 y 31')
        return
      }
      numDia = parsedDia
    }

    const subconcepto = numDia
      ? `Débito estimado: día ${numDia} de cada mes`
      : editingPartida?.subconcepto || undefined

    setIsSubmitting(true)
    try {
      await onSave({
        id: editingPartida?.id,
        concepto: cleanConcepto,
        subconcepto,
        monto: numMonto,
        categoria,
        diaPago: numDia,
      })
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error al guardar blindado:', err)
      toast.error(err.message || 'Error al guardar el compromiso blindado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-background border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-foreground">
        <DialogHeader className="pb-1 border-b border-border/60">
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span>
              {editingPartida ? 'Editar Compromiso Blindado' : 'Blindar Nuevo Compromiso Financiero'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Gastos fijos o amortizaciones descontados automáticamente de tu liquidez libre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Concepto / Nombre */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Concepto / Nombre del Gasto <span className="text-destructive">*</span>
            </Label>
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Internet del Taller, Alquiler, Reserva Bambu A2L"
              className="bg-card border-input text-xs rounded-xl h-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card"
              required
              autoFocus
            />
          </div>

          {/* 2. Monto a Blindar */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Monto a Blindar (S/) <span className="text-destructive">*</span>
            </Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-muted-foreground pointer-events-none select-none">
                S/
              </span>
              <Input
                type="number"
                step="any"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="pl-8 bg-card border-input text-xs font-mono font-bold rounded-xl h-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 3. Categoría */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Categoría
              </Label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-card border border-input rounded-xl h-10 px-3 text-xs text-foreground font-medium cursor-pointer focus:border-primary focus:outline-none"
              >
                {CATEGORIAS_BLINDADO.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Día Estimado de Pago */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Día de Pago</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
              </Label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={diaPago}
                  onChange={(e) => setDiaPago(e.target.value)}
                  placeholder="Ej: 15"
                  className="pl-9 bg-card border-input text-xs rounded-xl h-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl h-10 px-4 text-muted-foreground hover:text-foreground cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-5 rounded-xl shadow-md shadow-primary/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                'Guardando...'
              ) : editingPartida ? (
                'Actualizar Compromiso'
              ) : (
                'Guardar y Blindar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
