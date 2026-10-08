'use client'

import React from 'react'
import Link from 'next/link'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Play, Check, RotateCcw, Loader2, Sparkles, Clock, Flame } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { FilamentDotsGroup } from './FilamentDotsGroup'
import { formatDate } from '@/lib/utils'

interface ProductionRowProps {
  pieza: PiezaTaller
  isLoading: boolean
  onCambiarEstado: (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => void
  onSelectPieza?: (pieza: PiezaTaller) => void
}

// Helper para calcular días transcurridos o restantes
function getTiempoTranscurrido(rawFecha: string) {
  try {
    const match = rawFecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
    let d: Date
    if (match) {
      d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10))
    } else {
      d = new Date(rawFecha)
    }
    if (isNaN(d.getTime())) return ''

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const fechaMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

    const diffDays = Math.round((hoyMidnight - fechaMidnight) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays === -1) return 'Mañana'
    if (diffDays > 1) return `Hace ${diffDays} días`
    if (diffDays < -1) return `En ${Math.abs(diffDays)} días`
    return ''
  } catch {
    return ''
  }
}

// Helper para renderizar fecha prometida con semántica NOVA
function renderEntregaInfo(diaPromesa: string | null) {
  if (!diaPromesa) {
    return <span className="text-[11px] text-muted-foreground/60">Sin fecha</span>
  }

  try {
    const match = diaPromesa.match(/^(\d{4})-(\d{2})-(\d{2})/)
    let d: Date
    if (match) {
      d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10))
    } else {
      d = new Date(diaPromesa)
    }
    if (isNaN(d.getTime())) {
      return <span className="text-[11px] text-muted-foreground">{diaPromesa}</span>
    }

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const promesaMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const diffDias = Math.round((promesaMidnight - hoyMidnight) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
          <Flame className="w-3.5 h-3.5 text-destructive shrink-0" /> Vencido ({Math.abs(diffDias)}d)
        </span>
      )
    }
    if (diffDias === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500">
          <Clock className="w-3.5 h-3.5 shrink-0" /> Entrega Hoy
        </span>
      )
    }
    if (diffDias === 1) {
      return (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">
          Mañana
        </span>
      )
    }
    if (diffDias <= 3) {
      return (
        <span className="text-xs font-medium text-foreground">
          En {diffDias} días
        </span>
      )
    }
    return (
      <span className="text-xs font-medium text-foreground">
        {formatDate(diaPromesa)}
      </span>
    )
  } catch {
    return <span className="text-[11px] text-muted-foreground">{diaPromesa}</span>
  }
}

export function ProductionRow({
  pieza,
  isLoading,
  onCambiarEstado,
  onSelectPieza
}: ProductionRowProps) {
  const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)

  return (
    <TableRow
      onClick={() => onSelectPieza?.(pieza)}
      className="border-b border-border/60 hover:bg-muted/30 transition-colors duration-150 cursor-pointer group min-h-[60px]"
    >
      {/* 1. Pieza & Especificación Técnica (w-[36%]) */}
      <TableCell className="w-[36%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          {/* Nombre del modelo + multiplicador */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="font-semibold text-sm text-foreground truncate block group-hover:text-primary transition-colors"
              title={pieza.nombreModelo}
            >
              {pieza.nombreModelo}
            </span>
            <span className="font-mono text-xs text-muted-foreground font-normal shrink-0">
              ×{pieza.cantidad}
            </span>
          </div>

          {/* Dots de color reales, material y gramos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilamentDotsGroup
              colores={pieza.colores}
              nombreColorFallback={pieza.nombreColor}
              codigoHexFallback={pieza.codigoHex}
              tipoMaterial={pieza.tipoMaterial}
              pesoGramosTotal={pieza.pesoGramosTotal}
            />

            {/* Personalización si existe */}
            {pieza.personalizacion && (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500 font-medium italic truncate max-w-[200px]"
                title={`Personalización: ${pieza.personalizacion}`}
              >
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                "{pieza.personalizacion}"
              </span>
            )}
          </div>
        </div>
      </TableCell>

      {/* 2. Cliente & Referencia de Pedido (w-[20%]) */}
      <TableCell className="w-[20%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          <span
            className="font-semibold text-xs text-foreground truncate block"
            title={pieza.cliente}
          >
            {pieza.cliente}
          </span>

          <div>
            <Link
              href={`/pedidos?search=${encodeURIComponent(pieza.codigoRef)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center text-[10px] font-mono font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded border border-border/80 hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
              title="Filtrar pedido en Gestión de Pedidos"
            >
              #{pieza.codigoRef.replace(/^#/, '')}
            </Link>
          </div>
        </div>
      </TableCell>

      {/* 3. Entrega & Antigüedad (w-[16%]) */}
      <TableCell className="w-[16%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-0.5 text-xs min-w-0">
          <div className="truncate">{renderEntregaInfo(pieza.diaEntregaPrometida)}</div>
          {tiempoTxt && (
            <div className="text-[11px] text-muted-foreground truncate">
              {tiempoTxt}
            </div>
          )}
        </div>
      </TableCell>

      {/* 4. Estado de Fabricación (w-[14%]) */}
      <TableCell className="w-[14%] px-4 py-3 align-middle text-center overflow-hidden min-w-0">
        <div className="flex justify-center">
          {pieza.estado === 'LISTO_ENTREGA' && (
            <span className="bg-accent/60 text-accent-foreground border border-accent rounded-lg px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
              Listo
            </span>
          )}

          {pieza.estado === 'EN_PRODUCCION' && (
            <span className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              En Impresión
            </span>
          )}

          {pieza.estado === 'PENDIENTE' && (
            <span className="bg-muted text-muted-foreground border border-border rounded-lg px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
              Pendiente
            </span>
          )}

          {pieza.estado === 'ENTREGADO' && (
            <span className="bg-muted text-muted-foreground border border-border rounded-lg px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
              Entregado
            </span>
          )}
        </div>
      </TableCell>

      {/* 5. Acción Operativa (w-[14%], alineada a la derecha) */}
      <TableCell
        className="w-[14%] px-4 py-3 align-middle text-right overflow-hidden min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          {pieza.estado === 'LISTO_ENTREGA' && (
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => onCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')}
              className="h-8 px-3 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all"
              title="Volver a poner pendiente"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reabriendo...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reabrir</span>
                </>
              )}
            </Button>
          )}

          {pieza.estado === 'EN_PRODUCCION' && (
            <Button
              size="sm"
              disabled={isLoading}
              onClick={() => onCambiarEstado(pieza.tipoRegistro, pieza.id, 'LISTO_ENTREGA')}
              className="h-8 px-3 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 border border-accent/80 text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Listo</span>
                </>
              )}
            </Button>
          )}

          {pieza.estado === 'PENDIENTE' && (
            <Button
              size="sm"
              disabled={isLoading}
              onClick={() => onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')}
              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar</span>
                </>
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
