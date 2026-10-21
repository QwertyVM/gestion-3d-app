'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw, Loader2, Sparkles, Printer, AlertCircle, ExternalLink, Boxes } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { FilamentDotsGroup } from './FilamentDotsGroup'

interface ConfirmarAccionPiezaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pieza: PiezaTaller | null
  modo: 'INICIAR' | 'REABRIR'
  isLoading: boolean
  onConfirm: (pieza: PiezaTaller) => Promise<void> | void
}

export function ConfirmarAccionPiezaModal({
  open,
  onOpenChange,
  pieza,
  modo,
  isLoading,
  onConfirm
}: ConfirmarAccionPiezaModalProps) {
  if (!pieza) return null

  const esIniciar = modo === 'INICIAR'

  const handleExecute = async () => {
    await onConfirm(pieza)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border border-border/80 rounded-2xl p-6 sm:max-w-md w-full shadow-xl gap-4">
        <DialogHeader className="gap-1 text-left">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                esIniciar
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {esIniciar ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {esIniciar ? 'Iniciar Impresión 3D' : '¿Reabrir Pieza a Pendientes?'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {esIniciar
              ? 'Asigna la cama de impresión en taller y mueve la pieza a producción activa.'
              : 'La pieza regresará a la cola de pendientes para ser reprogramada.'}
          </DialogDescription>
        </DialogHeader>

        {/* Resumen de la pieza seleccionada */}
        <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                Pieza a procesar
              </span>
              <p className="text-sm font-semibold text-foreground truncate mt-0.5" title={pieza.nombreModelo}>
                {pieza.nombreModelo}{' '}
                <span className="font-mono tabular-nums text-xs text-muted-foreground font-normal">
                  ×{pieza.cantidad}
                </span>
              </p>
            </div>
            <span className="bg-muted/60 text-muted-foreground font-mono tabular-nums text-[11px] font-medium px-2 py-0.5 rounded-md border border-border/50 shrink-0">
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

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">Cliente: <strong className="text-foreground font-medium">{pieza.cliente}</strong></span>
            {pieza.personalizacion && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium italic truncate max-w-[150px]">
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                {pieza.personalizacion}
              </span>
            )}
          </div>

          {/* Enlace al modelo 3D para acceso instantáneo antes de imprimir */}
          {pieza.enlaceMakerworld && (
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
                Modelo 3D:
              </span>
              <a
                href={pieza.enlaceMakerworld}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20 transition-colors"
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
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300">
            <Printer className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <p className="leading-relaxed">
              La pieza pasará inmediatamente a <strong>En Impresión</strong> dentro de la cola de fabricación activa y se actualizará el avance del pedido.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              Esta pieza dejará de figurar como terminada y requerirá volver a pasar por la cola de impresión.
            </p>
          </div>
        )}

        {/* Pie con botones de acción */}
        <DialogFooter className="mt-2 pt-3 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-muted-foreground hover:text-foreground text-xs h-8 px-3 cursor-pointer"
          >
            Cancelar
          </Button>
          {esIniciar ? (
            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={handleExecute}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 px-4 rounded-lg cursor-pointer flex items-center gap-1.5"
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
              size="sm"
              disabled={isLoading}
              onClick={handleExecute}
              className="border-border/60 text-foreground hover:bg-muted/50 text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 font-medium cursor-pointer"
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
