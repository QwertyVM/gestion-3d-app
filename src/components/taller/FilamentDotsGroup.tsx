'use client'

import React from 'react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'

export interface ColorFilamentoInfo {
  id?: string
  nombreColor: string
  codigoHex?: string
  tipoMaterial?: string
  marca?: string
  carrete?: string
  nombreCarrete?: string
}

interface FilamentDotsGroupProps {
  colores?: ColorFilamentoInfo[]
  nombreColorFallback?: string
  codigoHexFallback?: string
  tipoMaterial?: string
  pesoGramosTotal?: number // Mantener prop por compatibilidad sin renderizar gramos
  className?: string
}

export function FilamentDotsGroup({
  colores = [],
  nombreColorFallback,
  codigoHexFallback,
  tipoMaterial = 'PLA',
  className = ''
}: FilamentDotsGroupProps) {
  // Si no hay lista de colores pero hay fallback, creamos un item
  const resolvedColores: ColorFilamentoInfo[] = React.useMemo(() => {
    if (colores && colores.length > 0) return colores
    if (nombreColorFallback) {
      return [
        {
          nombreColor: nombreColorFallback,
          codigoHex: codigoHexFallback || '#1E1E1E',
          tipoMaterial
        }
      ]
    }
    return []
  }, [colores, nombreColorFallback, codigoHexFallback, tipoMaterial])

  return (
    <div className={`inline-flex items-center flex-wrap gap-y-1 text-xs ${className}`}>
      {/* Fila de dots de filamento con Tooltip al hover */}
      <TooltipProvider delay={100}>
        <div className="inline-flex items-center flex-wrap gap-1">
          {resolvedColores.map((col, idx) => {
            const rolloInfo = col.carrete || col.nombreCarrete ? ` • Carrete: ${col.carrete || col.nombreCarrete}` : ''
            const tooltipText = `${col.nombreColor}${rolloInfo}${col.codigoHex ? ` (${col.codigoHex})` : ''}${
              col.marca ? ` • ${col.marca}` : ''
            }`

            return (
              <Tooltip key={col.id || `${col.nombreColor}-${idx}`}>
                <TooltipTrigger
                  render={
                    <span
                      tabIndex={0}
                      aria-label={tooltipText}
                      className="w-3 h-3 rounded-full border border-border/60 shadow-2xs hover:scale-125 transition-transform duration-150 cursor-pointer shrink-0 inline-block"
                      style={{ backgroundColor: col.codigoHex || '#1E1E1E' }}
                    />
                  }
                />
                <TooltipContent sideOffset={4} className="text-[11px] font-medium py-1 px-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 border border-black/20"
                      style={{ backgroundColor: col.codigoHex || '#1E1E1E' }}
                    />
                    <span>{col.nombreColor}</span>
                    {col.carrete || col.nombreCarrete ? (
                      <span className="opacity-80">({col.carrete || col.nombreCarrete})</span>
                    ) : null}
                    {col.marca && <span className="opacity-70">• {col.marca}</span>}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {/* Chip de material (CERO mención a gramos) */}
      {tipoMaterial && (
        <span className="bg-secondary border border-border/80 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-md ml-1.5 shrink-0">
          {tipoMaterial}
        </span>
      )}
    </div>
  )
}
