'use client'

import React from 'react'

interface OrderLogisticsSummaryProps {
  metodoPago?: string | null
  destinoEnvio?: string | null
  diaEntregaPrometida?: string | null
  telefono?: string | null
}

export function OrderLogisticsSummary({
  metodoPago,
  destinoEnvio,
  diaEntregaPrometida,
  telefono
}: OrderLogisticsSummaryProps) {
  const displayMetodo = metodoPago || 'Yape'
  const displayDestino = destinoEnvio ? (destinoEnvio.startsWith('📍') ? destinoEnvio : `📍 ${destinoEnvio}`) : '📍 Taller'

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs shadow-2xs">
      {/* 1. Medio de Pago */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted-foreground">Medio de Pago:</span>
        <span className="font-semibold text-foreground bg-secondary/80 border border-border px-2 py-0.5 rounded-md inline-block">
          {displayMetodo}
        </span>
      </div>

      {/* 2. Destino / Agencia */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted-foreground">Destino:</span>
        <span className="font-medium text-foreground truncate" title={displayDestino}>
          {displayDestino}
        </span>
      </div>

      {/* 3. Fecha pactada */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted-foreground">Fecha pactada:</span>
        <span className="font-medium text-foreground">
          {diaEntregaPrometida && diaEntregaPrometida.trim() !== '' ? (
            diaEntregaPrometida
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </span>
      </div>

      {/* 4. Teléfono */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted-foreground">Teléfono:</span>
        <span className="font-mono font-medium text-foreground">
          {telefono && telefono.trim() !== '' ? (
            telefono
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </span>
      </div>
    </div>
  )
}
