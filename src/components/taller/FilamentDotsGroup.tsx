'use client'

import React from 'react'

export interface ColorFilamentoInfo {
  id?: string
  nombreColor: string
  codigoHex?: string
  tipoMaterial?: string
  marca?: string
}

interface FilamentDotsGroupProps {
  colores?: ColorFilamentoInfo[]
  nombreColorFallback?: string
  codigoHexFallback?: string
  tipoMaterial?: string
  pesoGramosTotal?: number
  className?: string
}

export function FilamentDotsGroup({
  colores = [],
  nombreColorFallback,
  codigoHexFallback,
  tipoMaterial = 'PLA',
  pesoGramosTotal,
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
      <div className="inline-flex items-center flex-wrap">
        {resolvedColores.map((col, idx) => {
          const tooltipText = `${col.nombreColor}${col.codigoHex ? ` (${col.codigoHex})` : ''}${
            col.marca ? ` • ${col.marca}` : ''
          }`

          return (
            <span
              key={col.id || `${col.nombreColor}-${idx}`}
              className="relative inline-flex items-center group/dot"
              title={tooltipText}
            >
              <span
                tabIndex={0}
                aria-label={tooltipText}
                className="w-2.5 h-2.5 rounded-full inline-block mr-1 shadow-2xs border border-black/10 hover:scale-125 transition-transform duration-150 cursor-pointer shrink-0"
                style={{ backgroundColor: col.codigoHex || '#1E1E1E' }}
              />

              {/* Hover popup Tooltip */}
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/dot:flex flex-col items-center z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                <span className="bg-foreground text-background text-[10px] font-medium px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                  <span>{col.nombreColor}</span>
                  {col.codigoHex && (
                    <span className="font-mono text-[9px] opacity-80">{col.codigoHex}</span>
                  )}
                  {col.marca && (
                    <span className="opacity-80 text-[9px]">• {col.marca}</span>
                  )}
                </span>
                <span className="w-1.5 h-1.5 bg-foreground rotate-45 -mt-0.5" />
              </span>
            </span>
          )
        })}
      </div>

      {/* Badge de material */}
      {tipoMaterial && (
        <span className="bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded border border-border ml-1.5 shrink-0">
          {tipoMaterial}
        </span>
      )}

      {/* Separador y peso */}
      {pesoGramosTotal != null && pesoGramosTotal > 0 && (
        <span className="text-xs text-muted-foreground ml-1.5 font-mono shrink-0">
          • {pesoGramosTotal}g
        </span>
      )}
    </div>
  )
}
