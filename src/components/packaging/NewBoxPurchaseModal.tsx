'use client'

import React, { useState } from 'react'
import {
  Package,
  X,
  DollarSign,
  Calendar,
  User,
  Layers,
  Truck,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrarCompraCajas } from '@/actions/cajas'

interface NewBoxPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchaseSuccess: () => void
}

export function NewBoxPurchaseModal({
  isOpen,
  onClose,
  onPurchaseSuccess
}: NewBoxPurchaseModalProps) {
  const [concepto, setConcepto] = useState('Cajas de Envío')
  const [cantidad, setCantidad] = useState('50')
  const [costoUnitario, setCostoUnitario] = useState('2.40')
  const [costoEnvio, setCostoEnvio] = useState('0')
  const [persona, setPersona] = useState('Víctor')
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const cantNum = Math.max(1, parseInt(cantidad, 10) || 0)
  const unitNum = Math.max(0, parseFloat(costoUnitario) || 0)
  const envioNum = Math.max(0, parseFloat(costoEnvio) || 0)
  const totalCalculado = (cantNum * unitNum) + envioNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!concepto.trim()) {
      toast.error('Ingresa una descripción o nombre para las cajas')
      return
    }
    if (cantNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (unitNum <= 0) {
      toast.error('El costo unitario debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await registrarCompraCajas({
        itemConcepto: concepto.trim(),
        cantidad: cantNum,
        costoUnitario: unitNum,
        costoEnvio: envioNum,
        persona,
        fecha
      })

      if (res.success) {
        toast.success(`Lote de ${cantNum} cajas registrado exitosamente`)
        onPurchaseSuccess()
        onClose()
      } else {
        toast.error(res.error || 'Error al registrar compra de cajas')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al registrar compra')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-card text-foreground border border-border/80 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-card/95 backdrop-blur-xs border-b border-border/60 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-muted/60 border border-border/60 text-primary shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-foreground truncate">
                Registrar Compra de Cajas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ingresa un nuevo lote a inventario y regístralo en Egresos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Concepto / Nombre de la caja */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/90 block">
                Tipo / Concepto de Caja *
              </Label>
              <Input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Cajas de Envío 50 uds, Caja Grande 25x20x15..."
                required
                className="bg-background border-border/80 text-foreground text-sm rounded-lg h-9"
              />
            </div>

            {/* Cantidad y Costo Unitario */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 block">
                  Cantidad Comprada *
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  className="bg-background border-border/80 text-foreground font-mono tabular-nums font-semibold text-sm rounded-lg h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 block">
                  Costo Unitario (S/) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    S/
                  </span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    required
                    className="pl-8 bg-background border-border/80 text-foreground font-mono tabular-nums font-semibold text-sm rounded-lg h-9"
                  />
                </div>
              </div>
            </div>

            {/* Costo de Envío y Persona */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 block">
                  Costo de Envío / Flete (S/)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    S/
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costoEnvio}
                    onChange={(e) => setCostoEnvio(e.target.value)}
                    className="pl-8 bg-background border-border/80 text-foreground font-mono tabular-nums text-sm rounded-lg h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 block">
                  Comprado por *
                </Label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Víctor">Víctor</option>
                  <option value="Jamile">Jamile</option>
                </select>
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/90 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Fecha de Compra *
              </Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="bg-background border-border/80 text-foreground text-sm rounded-lg h-9 cursor-pointer"
              />
            </div>

            {/* Resumen Total Estimado */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Total a Registrar en Egresos:
                </span>
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {cantNum} cajas × S/ {unitNum.toFixed(2)}{envioNum > 0 ? ` + S/ ${envioNum.toFixed(2)} envío` : ''}
                </span>
              </div>
              <span className="text-xl font-mono tabular-nums font-semibold text-foreground">
                S/ {totalCalculado.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs rounded-lg cursor-pointer text-muted-foreground hover:text-foreground h-8 px-3"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 rounded-lg cursor-pointer h-8"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Compra'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
