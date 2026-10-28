'use client'

import React, { useState } from 'react'
import { 
  Cpu, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Layers, 
  Sparkles,
  Info,
  ChevronRight,
  Flame
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { PiezaTaller } from '@/actions/taller'

export interface PrinterDevice {
  id: string
  name: string
  model: string // 'Bambu Lab P1S' | 'Bambu Lab A1' | 'Ender 3 V3'
  status: 'PRINTING' | 'IDLE' | 'CALIBRATING' | 'MAINTENANCE'
  currentPieceName?: string
  currentPieceCode?: string
  currentClient?: string
  filamentColor?: string
  filamentHex?: string
  progressPct?: number
  timeRemaining?: string
  powerWatts: number // Consumo eléctrico promedio
}

interface PrinterFleetWidgetProps {
  piezasPendientes: PiezaTaller[]
  onAssignToPrinter?: (printerId: string, pieza: PiezaTaller) => void
  className?: string
}

const INITIAL_PRINTERS: PrinterDevice[] = [
  {
    id: 'printer-1',
    name: 'Impresora 01 (Principal)',
    model: 'Bambu Lab P1S (CoreXY)',
    status: 'PRINTING',
    currentPieceName: 'Planta posavasos',
    currentPieceCode: 'PED-040',
    currentClient: 'Claudia García',
    filamentColor: 'Verde Pino',
    filamentHex: '#15803d',
    progressPct: 68,
    timeRemaining: '1h 15m',
    powerWatts: 160
  },
  {
    id: 'printer-2',
    name: 'Impresora 02 (Alta Velocidad)',
    model: 'Bambu Lab A1',
    status: 'IDLE',
    filamentColor: 'Negro Carbón',
    filamentHex: '#18181b',
    progressPct: 0,
    timeRemaining: 'Libre',
    powerWatts: 140
  },
  {
    id: 'printer-3',
    name: 'Impresora 03 (Formatos Grandes)',
    model: 'Creality K1 Max',
    status: 'IDLE',
    filamentColor: 'Terracota',
    filamentHex: '#a36f4c',
    progressPct: 0,
    timeRemaining: 'Libre',
    powerWatts: 200
  }
]

export function PrinterFleetWidget({
  piezasPendientes,
  onAssignToPrinter,
  className
}: PrinterFleetWidgetProps) {
  const [printers, setPrinters] = useState<PrinterDevice[]>(INITIAL_PRINTERS)
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null)
  const [assignPieceModalOpen, setAssignPieceModalOpen] = useState(false)
  const [targetPrinter, setTargetPrinter] = useState<PrinterDevice | null>(null)

  // Métricas de flota
  const printingCount = printers.filter(p => p.status === 'PRINTING').length
  const idleCount = printers.filter(p => p.status === 'IDLE').length
  const totalWatts = printers.reduce((acc, p) => p.status === 'PRINTING' ? acc + p.powerWatts : acc + 10, 0)
  // Tarifa promedio de luz en Perú: ~S/ 0.85 por kWh
  const costoLuzHora = ((totalWatts / 1000) * 0.85).toFixed(2)

  const handleOpenAssign = (printer: PrinterDevice) => {
    setTargetPrinter(printer)
    setAssignPieceModalOpen(true)
  }

  const handleConfirmAssign = (pieza: PiezaTaller) => {
    if (!targetPrinter) return
    setPrinters(prev => prev.map(p => {
      if (p.id === targetPrinter.id) {
        return {
          ...p,
          status: 'PRINTING',
          currentPieceName: pieza.nombreModelo,
          currentPieceCode: pieza.codigoRef,
          currentClient: pieza.cliente,
          filamentColor: pieza.nombreColor,
          filamentHex: pieza.codigoHex || '#18181b',
          progressPct: 5,
          timeRemaining: '2h 30m'
        }
      }
      return p
    }))
    if (onAssignToPrinter) {
      onAssignToPrinter(targetPrinter.id, pieza)
    }
    setAssignPieceModalOpen(false)
    setTargetPrinter(null)
  }

  const handleCompleteJob = (printerId: string) => {
    setPrinters(prev => prev.map(p => {
      if (p.id === printerId) {
        return {
          ...p,
          status: 'IDLE',
          currentPieceName: undefined,
          currentPieceCode: undefined,
          currentClient: undefined,
          progressPct: 0,
          timeRemaining: 'Libre'
        }
      }
      return p
    }))
  }

  return (
    <div className={cn('bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4', className)}>
      {/* Cabecera de la Flota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Control de Flota de Impresoras 3D
            </h3>
            <Badge variant="outline" className="text-[10px] bg-secondary/60 text-secondary-foreground border-border/50">
              {printers.length} Máquinas
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Monitorea el estado en tiempo real, asigna lotes de impresión y calcula el consumo eléctrico operativo.
          </p>
        </div>

        {/* Resumen Eléctrico & Estado */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground tabular-nums">{printingCount}</span>
            <span className="text-muted-foreground text-[11px]">imprimiendo</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/50">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono text-foreground tabular-nums font-semibold">~S/ {costoLuzHora}/h</span>
            <span className="text-muted-foreground text-[10px]">energía</span>
          </div>
        </div>
      </div>

      {/* Grid de Impresoras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {printers.map((printer) => {
          const isPrinting = printer.status === 'PRINTING'
          const isIdle = printer.status === 'IDLE'

          return (
            <div
              key={printer.id}
              className={cn(
                'rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-3 relative overflow-hidden',
                isPrinting
                  ? 'bg-card border-primary/30 shadow-2xs'
                  : 'bg-muted/15 border-border/50 hover:border-border/80'
              )}
            >
              {/* Barra de progreso sutil superior si está imprimiendo */}
              {isPrinting && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${printer.progressPct || 0}%` }}
                  />
                </div>
              )}

              {/* Header de la Impresora */}
              <div className="flex items-start justify-between gap-2 pt-0.5">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block truncate">
                    {printer.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate block">
                    {printer.model}
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-medium shrink-0',
                    isPrinting
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border-border/50'
                  )}
                >
                  {isPrinting ? '● Imprimiendo' : '○ En espera'}
                </Badge>
              </div>

              {/* Contenido Central: Pieza en curso o Libre */}
              <div className="space-y-1.5 min-h-[58px] flex flex-col justify-center">
                {isPrinting ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[170px]" title={printer.currentPieceName}>
                        {printer.currentPieceName}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {printer.progressPct}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">{printer.currentPieceCode}</span>
                      <span>•</span>
                      <span className="truncate">{printer.currentClient}</span>
                    </div>

                    {/* Color y tiempo restante */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: printer.filamentHex || '#18181b' }}
                        />
                        <span className="truncate">{printer.filamentColor}</span>
                      </div>
                      <span className="font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {printer.timeRemaining}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground/80 space-y-0.5">
                    <p className="font-medium text-foreground/80">Cama despejada y lista</p>
                    <p className="text-[10px] text-muted-foreground">Bobina cargada: {printer.filamentColor}</p>
                  </div>
                )}
              </div>

              {/* Botón de Acción */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                {isPrinting ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteJob(printer.id)}
                    className="w-full h-7 text-[11px] rounded-lg border-border/60 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Finalizar Impresión
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssign(printer)}
                    className="w-full h-7 text-[11px] font-medium rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3 mr-1 fill-primary" />
                    Asignar Pieza de Cola
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal para asignar pieza pendiente de la cola */}
      {assignPieceModalOpen && targetPrinter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/70 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Asignar a {targetPrinter.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Selecciona una pieza pendiente de la cola de producción.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignPieceModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {piezasPendientes.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PRODUCCION').length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No hay piezas pendientes en la cola para asignar.
                </div>
              ) : (
                piezasPendientes
                  .filter(p => p.estado === 'PENDIENTE')
                  .slice(0, 10)
                  .map((pieza) => (
                    <div
                      key={pieza.id}
                      onClick={() => handleConfirmAssign(pieza)}
                      className="p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {pieza.nombreModelo}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {pieza.codigoRef}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{pieza.cliente}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full border border-black/20"
                              style={{ backgroundColor: pieza.codigoHex || '#18181b' }}
                            />
                            {pieza.nombreColor}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        Cargar
                      </Button>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignPieceModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
