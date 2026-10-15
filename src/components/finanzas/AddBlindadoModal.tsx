'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
import { Lock, Calendar, Info } from 'lucide-react'
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
  gastoLibreActual?: number
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
  gastoLibreActual,
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
      const match = editingPartida.subconcepto?.match(/\d+/)
      setDiaPago(match ? match[0] : '')
    } else {
      setConcepto('')
      setMonto('')
      setCategoria('OPERATIVO')
      setDiaPago('')
    }
  }, [editingPartida, open])

  // Cálculo previo del impacto en liquidez libre
  const montoIngresado = parseFloat(monto) || 0
  const montoOriginal = editingPartida
    ? Number(editingPartida.monto || editingPartida.presupuesto || 0)
    : 0

  const { tieneCalculo, gastoAntes, gastoDespues } = useMemo(() => {
    if (gastoLibreActual === undefined) {
      return { tieneCalculo: false, gastoAntes: 0, gastoDespues: 0 }
    }
    const antes = gastoLibreActual
    const impacto = montoIngresado - montoOriginal
    const despues = Math.max(0, antes - impacto)
    return {
      tieneCalculo: montoIngresado > 0,
      gastoAntes: Math.round(antes),
      gastoDespues: Math.round(despues),
    }
  }, [gastoLibreActual, montoIngresado, montoOriginal])

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
        {/* Cabecera */}
        <DialogHeader className="pb-1 border-b border-border/70 space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {editingPartida ? 'Editar Compromiso Blindado' : 'Blindar Nuevo Compromiso Financiero'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Gastos fijos o amortizaciones descontados automáticamente de tu liquidez libre.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Concepto / Nombre del Gasto */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Concepto / Nombre del Gasto <span className="text-destructive">*</span>
            </Label>
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Internet del Taller, Alquiler, Reserva Bambu A2L"
              className="h-10 rounded-xl border border-input bg-card text-xs text-foreground px-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
              autoFocus
            />
          </div>

          {/* 2. Monto Mensual a Blindar (S/) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Monto Mensual a Blindar (S/) <span className="text-destructive">*</span>
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
                className="h-10 rounded-xl border border-input bg-card text-sm font-bold text-foreground text-right pr-3.5 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          {/* 3. Fila de 2 columnas: Categoría y Día de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Categoría
              </Label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card text-xs text-foreground px-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              >
                {CATEGORIAS_BLINDADO.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

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
                  className="h-10 rounded-xl border border-input bg-card text-xs text-foreground pl-9 pr-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 4. Previsualización del Impacto en Liquidez (Micro-Feedback) */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="space-y-0.5 min-w-0">
              {tieneCalculo && (
                <p className="font-semibold text-foreground text-xs">
                  Tu Gasto Libre pasará de <span className="font-mono font-bold">S/ {gastoAntes.toLocaleString('es-PE')}</span> a{' '}
                  <span className="font-mono font-extrabold text-primary">S/ {gastoDespues.toLocaleString('es-PE')}</span>.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground leading-snug">
                Este monto se descontará automáticamente cada mes de tu caja disponible para proteger tus pagos fijos.
              </p>
            </div>
          </div>

          {/* 5. Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground h-10 px-4 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
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
