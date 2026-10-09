'use client'

import React from 'react'
import { Palette, Layers } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import { GrupoColorTaller } from '@/actions/taller'

export interface ProductionByColorViewProps {
  grupos: GrupoColorTaller[]
  coloresExpandidos: Record<string, boolean>
  onToggleExpandido: (key: string) => void
}

export function ProductionByColorView({
  grupos,
  coloresExpandidos,
  onToggleExpandido
}: ProductionByColorViewProps) {
  return (
    <div className="space-y-4">
      {/* Encabezado Superior con contador dinámico de combinaciones consolidadas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
        <span className="text-xs font-semibold text-muted-foreground">
          {grupos.length}{' '}
          {grupos.length === 1
            ? 'combinación de colores requerida en producción'
            : 'combinaciones de colores requeridas en producción'}
        </span>
        <span className="text-xs text-muted-foreground">
          Agrupa impresiones por combinación para optimizar cambios de filamento en taller
        </span>
      </div>

      {/* Rejilla Modular de Tarjetas (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {grupos.map((grupo) => {
          const grupoKey = grupo.colorId || grupo.nombreColor
          const expandido = coloresExpandidos[grupoKey] || false

          // Resolver swatches a mostrar: si el grupo tiene array 'colores', se usan; si no, el color base
          const swatches =
            grupo.colores && grupo.colores.length > 0
              ? grupo.colores
              : [
                  {
                    id: grupo.colorId || undefined,
                    nombreColor: grupo.nombreColor,
                    codigoHex: grupo.codigoHex || '#94A3B8',
                    tipoMaterial: grupo.tipoMaterial || 'PLA'
                  }
                ]

          const totalBobinas = grupo.stockBobinasActual > 0 ? grupo.stockBobinasActual : swatches.length

          return (
            <div
              key={grupoKey}
              className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Cabecera de la Tarjeta de Color */}
              <div className="p-4 pb-3 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  {/* Lado Izquierdo: Cluster de Swatches Multicolor + Título de la Combinación */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Cluster de Swatches Multicolor (-space-x-1.5) */}
                    <TooltipProvider delay={100}>
                      <div className="flex items-center -space-x-1.5 p-1 rounded-xl bg-secondary/60 border border-border/80 shrink-0 shadow-2xs">
                        {swatches.map((col, cIdx) => (
                          <Tooltip key={col.id || `${col.nombreColor}-${cIdx}`}>
                            <TooltipTrigger
                              render={
                                <span
                                  className="w-5 h-5 rounded-full border-2 border-card shadow-2xs cursor-pointer hover:scale-110 hover:z-10 transition-transform shrink-0 inline-block"
                                  style={{ backgroundColor: col.codigoHex }}
                                />
                              }
                            />
                            <TooltipContent sideOffset={4} className="text-xs font-medium py-1 px-2.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                                  style={{ backgroundColor: col.codigoHex }}
                                />
                                <span className="font-semibold text-foreground">{col.nombreColor}</span>
                                <span className="text-muted-foreground">
                                  ({col.tipoMaterial || grupo.tipoMaterial || 'PLA'})
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>

                    {/* Título y Metadatos de Material (CERO mención a gramos) */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-sm font-bold text-foreground leading-snug break-words"
                        title={grupo.nombreColor}
                      >
                        {grupo.nombreColor}
                      </h4>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>Material: {grupo.tipoMaterial || 'PLA'}</span>
                        <span>•</span>
                        <span>
                          Stock: {totalBobinas} {totalBobinas === 1 ? 'bobina' : 'bobinas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado Derecho: Contador de Unidades */}
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-foreground font-mono tabular-nums block">
                      {grupo.totalUnidades} uds
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                      {grupo.totalUnidades === 1 ? 'unidad' : 'unidades'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de Piezas Asociadas (PIEZAS QUE USAN ESTE COLOR / COMBINACIÓN) */}
              <div className="p-4 pt-3 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-primary/70 shrink-0" />
                    <span>Piezas que usan este color:</span>
                  </span>

                  <div className="space-y-1.5">
                    {grupo.modelos.slice(0, expandido ? undefined : 3).map((mod, mIdx) => (
                      <div
                        key={mIdx}
                        className="bg-secondary/40 border border-border/70 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:bg-secondary/70 transition-colors"
                      >
                        {/* Nombre del modelo con multiplicador */}
                        <span className="text-xs font-semibold text-foreground truncate pr-2">
                          {mod.cantidad}× {mod.nombreModelo}
                        </span>

                        {/* Badge de pedido con canal (CERO gramos flotando) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="bg-accent/60 text-accent-foreground font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/60 inline-flex items-center gap-1">
                            <span>#{mod.codigoRef.replace(/^#/, '')}</span>
                            {mod.canalVenta && (
                              <span className="font-sans font-medium text-[9px] border-l border-accent-foreground/30 pl-1">
                                {mod.canalVenta}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {grupo.modelos.length > 3 && (
                    <button
                      type="button"
                      onClick={() => onToggleExpandido(grupoKey)}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer pt-1 block"
                    >
                      {expandido ? 'Mostrar menos' : `+ Ver ${grupo.modelos.length - 3} piezas más`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Estado vacío cuando no hay grupos con los filtros actuales */}
      {grupos.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-xs">
          <Palette className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-foreground">No hay combinaciones de color activas</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            No se encontraron piezas con los filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  )
}
