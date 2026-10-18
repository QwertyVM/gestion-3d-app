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
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-muted/40 border-b border-border p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Registrar Compra de Cajas
              </h3>
              <p className="text-xs text-muted-foreground">
                Ingresa un nuevo lote a inventario y regístralo en Egresos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Concepto / Nombre de la caja */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Tipo / Concepto de Caja *
            </Label>
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Cajas de Envío 50 uds, Caja Grande 25x20x15..."
              required
              className="bg-background border-border text-foreground text-xs rounded-xl"
            />
          </div>

          {/* Cantidad y Costo Unitario */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Cantidad Comprada *
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                className="bg-background border-border text-foreground font-mono font-bold text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Costo Unitario (S/) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  required
                  className="pl-8 bg-background border-border text-foreground font-mono font-bold text-sm rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Costo de Envío y Persona */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Costo de Envío / Flete (S/)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                  className="pl-8 bg-background border-border text-foreground font-mono text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Comprado por *
              </Label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
              >
                <option value="Víctor">Víctor</option>
                <option value="Jamile">Jamile</option>
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha de Compra *
            </Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="bg-background border-border text-foreground text-xs font-semibold rounded-xl"
            />
          </div>

          {/* Resumen Total Estimado */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Total a Registrar en Egresos:
              </span>
              <span className="text-xs text-muted-foreground">
                {cantNum} cajas × S/ {unitNum.toFixed(2)}{envioNum > 0 ? ` + S/ ${envioNum.toFixed(2)} envío` : ''}
              </span>
            </div>
            <span className="text-xl font-mono font-extrabold text-primary">
              S/ {totalCalculado.toFixed(2)}
            </span>
          </div>

          {/* BOTONES */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 h-9 text-xs font-medium rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Compra'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
