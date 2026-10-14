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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, Calendar, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

export interface CompromisoParaPagar {
  tipoCompromiso: 'PRESTAMO' | 'PARTIDA'
  partidaId?: string
  numeroCuota?: number
  concepto: string
  cuotaLabel?: string
  montoSugerido: number
  mesPeriodo?: string
  categoria?: string
  subcategoria?: string
  esVariable?: boolean
}

export interface ModalPagarCompromisoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compromiso: CompromisoParaPagar | null
  onConfirmarPago: (data: {
    tipoCompromiso: 'PRESTAMO' | 'PARTIDA'
    partidaId?: string
    numeroCuota?: number
    concepto: string
    monto: number
    fechaPago: string
    metodoPago: string
    categoria?: string
    subcategoria?: string
    notas?: string
  }) => Promise<void>
}

const METODOS_PAGO = [
  { value: 'BCP', label: 'BCP (Cuenta / Transferencia)' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'EFECTIVO', label: 'Efectivo en Caja' },
  { value: 'BBVA', label: 'BBVA' },
  { value: 'INTERBANK', label: 'Interbank' },
]

export function ModalPagarCompromiso({
  open,
  onOpenChange,
  compromiso,
  onConfirmarPago,
}: ModalPagarCompromisoProps) {
  const [monto, setMonto] = useState('')
  const [fechaPago, setFechaPago] = useState('2026-10-31') // Finales de octubre por defecto
  const [metodoPago, setMetodoPago] = useState('BCP')
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (compromiso && open) {
      setMonto(compromiso.montoSugerido.toFixed(2))
      // Fecha por defecto: Finales de Octubre (31 Oct 2026)
      setFechaPago('2026-10-31')
      setMetodoPago(compromiso.tipoCompromiso === 'PRESTAMO' ? 'BCP' : 'BCP')
      setNotas('')
    }
  }, [compromiso, open])

  if (!compromiso) return null

  const montoNumero = parseFloat(monto) || 0
  const diferencia = montoNumero - compromiso.montoSugerido
  const esDiferente = Math.abs(diferencia) >= 0.01

  const handleSeleccionarFecha = (fechaStr: string) => {
    setFechaPago(fechaStr)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isNaN(montoNumero) || montoNumero <= 0) {
      toast.error('Ingresa un monto pagado válido mayor a 0')
      return
    }

    if (!fechaPago) {
      toast.error('Selecciona una fecha de pago contable')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirmarPago({
        tipoCompromiso: compromiso.tipoCompromiso,
        partidaId: compromiso.partidaId,
        numeroCuota: compromiso.numeroCuota,
        concepto: compromiso.concepto,
        monto: montoNumero,
        fechaPago,
        metodoPago,
        categoria: compromiso.categoria,
        subcategoria: compromiso.subcategoria,
        notas: notas.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el pago contable')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-5 gap-4 bg-card border-border shadow-xl rounded-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/70 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Asentar Pago Contable
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {compromiso.cuotaLabel || compromiso.concepto} • {compromiso.mesPeriodo || 'Octubre 2026'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Guía Contable Senior */}
        <div className="bg-secondary/40 border border-border/70 rounded-xl p-3 text-xs space-y-1 text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Control de Gastos & Conciliación Real</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {compromiso.tipoCompromiso === 'PRESTAMO'
              ? 'Registra la amortización de la cuota del préstamo BCP. Se generará el egreso financiero en caja y se liberará el blindaje de Octubre.'
              : 'Gastos como la luz e internet pueden variar según el recibo emitido. Ingresa el monto real facturado para asentar el egreso contable exacto.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Monto Real Pagado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="monto" className="text-xs font-bold text-foreground">
                Monto Específico Pagado (S/)
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Presupuestado: S/ {compromiso.montoSugerido.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                S/
              </span>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="pl-9 font-mono font-bold text-base h-10 rounded-xl bg-background border-input focus:border-primary"
              />
            </div>
            {esDiferente && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                {diferencia > 0
                  ? `▲ Variación: +S/ ${diferencia.toFixed(2)} sobre lo estimado`
                  : `▼ Variación: -S/ ${Math.abs(diferencia).toFixed(2)} bajo lo estimado`}
              </p>
            )}
          </div>

          {/* Fecha de Pago & Atajos Contables */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="fecha" className="text-xs font-bold text-foreground">
                Fecha del Pago Contable
              </Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSeleccionarFecha('2026-10-31')}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                    fechaPago === '2026-10-31'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Fin de Mes (31 Oct)
                </button>
                <button
                  type="button"
                  onClick={() => handleSeleccionarFecha('2026-10-13')}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                    fechaPago === '2026-10-13'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hoy (13 Oct)
                </button>
              </div>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="fecha"
                type="date"
                required
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="pl-9 text-xs h-9 rounded-xl bg-background border-input focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-1.5">
            <Label htmlFor="metodo" className="text-xs font-bold text-foreground">
              Cuenta / Medio de Pago
            </Label>
            <Select value={metodoPago} onValueChange={(val) => setMetodoPago(val || 'BCP')}>
              <SelectTrigger id="metodo" className="h-9 text-xs rounded-xl bg-background border-input">
                <SelectValue placeholder="Selecciona medio de pago" />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Referencia / Notas Opcionales */}
          <div className="space-y-1.5">
            <Label htmlFor="notas" className="text-xs font-medium text-foreground">
              N° Recibo / Observación (Opcional)
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Recibo Enel Octubre #84930, N° Operación..."
                className="pl-9 text-xs h-9 rounded-xl bg-background border-input focus:border-primary"
              />
            </div>
          </div>

          {/* Botones de Acción */}
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
              type="submit"
              disabled={isSubmitting || montoNumero <= 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registrando...' : `Confirmar Pago (S/ ${montoNumero.toFixed(2)})`}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
