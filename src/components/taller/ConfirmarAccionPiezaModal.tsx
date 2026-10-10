'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Play, RotateCcw, Loader2, Sparkles, Printer, AlertCircle, ExternalLink, Boxes } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { FilamentDotsGroup } from './FilamentDotsGroup'

interface ConfirmarAccionPiezaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pieza: PiezaTaller | null
  modo: 'INICIAR' | 'REABRIR'
  isLoading: boolean
  onConfirm: (pieza: PiezaTaller, impresoraCama?: string) => Promise<void> | void
}

const OPCIONES_IMPRESORA = [
  { id: 'cama-1', label: 'Cama 1 • Bambu Lab X1C (Alta velocidad)' },
  { id: 'cama-2', label: 'Cama 2 • Bambu Lab P1S (Producción)' },
  { id: 'cama-3', label: 'Cama 3 • Creality K1 Max (Gran volumen)' },
  { id: 'cama-4', label: 'Cama 4 • Ender 3 S1 (Detalle fino)' },
  { id: 'cama-std', label: 'Cama general disponible en taller' }
]

export function ConfirmarAccionPiezaModal({
  open,
  onOpenChange,
  pieza,
  modo,
  isLoading,
  onConfirm
}: ConfirmarAccionPiezaModalProps) {
  const [impresoraSeleccionada, setImpresoraSeleccionada] = useState('cama-1')

  if (!pieza) return null

  const esIniciar = modo === 'INICIAR'

  const handleExecute = async () => {
    await onConfirm(pieza, esIniciar ? impresoraSeleccionada : undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-border rounded-2xl p-6 sm:max-w-md w-full shadow-lg gap-5">
        <DialogHeader className="gap-1.5 text-left">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                esIniciar
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}
            >
              {esIniciar ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {esIniciar ? 'Iniciar Impresión 3D' : '¿Reabrir Pieza a Pendientes?'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {esIniciar
              ? 'Asigna la cama de impresión en taller y mueve la pieza a producción activa.'
              : 'La pieza regresará a la cola de pendientes para ser reprogramada.'}
          </DialogDescription>
        </DialogHeader>

        {/* Resumen de la pieza seleccionada */}
        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Pieza a procesar
              </span>
              <p className="text-sm font-bold text-foreground truncate mt-0.5" title={pieza.nombreModelo}>
                {pieza.nombreModelo}{' '}
                <span className="font-mono text-xs text-muted-foreground font-normal">
                  ×{pieza.cantidad}
                </span>
              </p>
            </div>
            <span className="bg-accent/60 text-accent-foreground font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-border/60 shrink-0">
              #{pieza.codigoRef.replace(/^#/, '')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilamentDotsGroup
              colores={pieza.colores}
              nombreColorFallback={pieza.nombreColor}
              codigoHexFallback={pieza.codigoHex}
              tipoMaterial={pieza.tipoMaterial}
            />
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">Cliente: <strong className="text-foreground font-medium">{pieza.cliente}</strong></span>
            {pieza.personalizacion && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500 font-medium italic truncate max-w-[150px]">
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                {pieza.personalizacion}
              </span>
            )}
          </div>

          {/* Enlace al modelo 3D para acceso instantáneo antes de imprimir */}
          {pieza.enlaceMakerworld && (
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
                Modelo 3D:
              </span>
              <a
                href={pieza.enlaceMakerworld}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20 transition-all hover:scale-105"
                title="Abrir enlace del modelo 3D en nueva pestaña"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Abrir en MakerWorld / 3D</span>
              </a>
            </div>
          )}
        </div>

        {/* Sección específica según modo */}
        {esIniciar ? (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              Asignar Cama / Impresora
            </Label>
            <Select
              value={impresoraSeleccionada}
              onValueChange={(val) => setImpresoraSeleccionada(val || 'cama-1')}
            >
              <SelectTrigger className="w-full h-10 text-xs bg-card border-border rounded-xl">
                <SelectValue placeholder="Seleccionar impresora o cama" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                {OPCIONES_IMPRESORA.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Se notificará al operador del taller y el pedido reflejará producción activa.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              Esta pieza dejará de figurar como terminada y requerirá volver a pasar por la cola de impresión.
            </p>
          </div>
        )}

        {/* Pie con botones de acción pegados al fondo */}
        <DialogFooter className="mt-2 pt-3 border-t border-border/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xs h-9 px-4 cursor-pointer"
          >
            Cancelar
          </Button>
          {esIniciar ? (
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleExecute}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Impresión</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={handleExecute}
              className="border-border text-foreground hover:bg-secondary text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reabriendo...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirmar y Reabrir</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
