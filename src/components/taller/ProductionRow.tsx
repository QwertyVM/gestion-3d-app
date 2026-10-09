'use client'

import React from 'react'
import Link from 'next/link'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import { Play, Check, RotateCcw, Loader2, Sparkles, Calendar, Clock, Flame } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { FilamentDotsGroup } from './FilamentDotsGroup'
import { formatDate } from '@/lib/utils'

export interface ProductionRowProps {
  pieza: PiezaTaller
  isLoading: boolean
  onCambiarEstado: (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => void
  onRequestIniciar?: (pieza: PiezaTaller) => void
  onRequestReabrir?: (pieza: PiezaTaller) => void
  onSelectPieza?: (pieza: PiezaTaller) => void
}

// Helper para calcular días transcurridos o antigüedad relativa
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

// Helper para abreviar textos descriptivos de fechas (ej: "Entre el domingo 11 y lunes 12" -> "Dom 11 - Lun 12")
function formatEntregaCompacta(diaPromesa: string): string {
  return diaPromesa
    .replace(/^Entre el\s+/i, '')
    .replace(/^Entre\s+/i, '')
    .replace(/\s+y\s+/gi, ' - ')
    .replace(/domingo/gi, 'Dom')
    .replace(/lunes/gi, 'Lun')
    .replace(/martes/gi, 'Mar')
    .replace(/mi[ée]rcoles/gi, 'Mié')
    .replace(/jueves/gi, 'Jue')
    .replace(/viernes/gi, 'Vie')
    .replace(/s[áa]bado/gi, 'Sáb')
    .replace(/enero/gi, 'Ene')
    .replace(/febrero/gi, 'Feb')
    .replace(/marzo/gi, 'Mar')
    .replace(/abril/gi, 'Abr')
    .replace(/mayo/gi, 'May')
    .replace(/junio/gi, 'Jun')
    .replace(/julio/gi, 'Jul')
    .replace(/agosto/gi, 'Ago')
    .replace(/se[pt]iembre/gi, 'Sep')
    .replace(/octubre/gi, 'Oct')
    .replace(/noviembre/gi, 'Nov')
    .replace(/diciembre/gi, 'Dic')
    .replace(/\s+de\s+/gi, ' ')
}

// Helper para renderizar fecha prometida con semántica NOVA y Tooltip en hover
function renderEntregaInfo(diaPromesa: string | null) {
  if (!diaPromesa) {
    return (
      <div className="flex items-center min-w-0">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1.5 shrink-0 opacity-50" />
        <span className="text-xs text-muted-foreground/60 font-medium">Sin fecha</span>
      </div>
    )
  }

  try {
    const match = diaPromesa.match(/^(\d{4})-(\d{2})-(\d{2})/)
    let d: Date | null = null
    if (match) {
      d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10))
    } else {
      const parsed = new Date(diaPromesa)
      if (!isNaN(parsed.getTime())) d = parsed
    }

    if (!d || isNaN(d.getTime())) {
      // Texto descriptivo personalizado (e.g. "Entre el domingo 11 y lunes 12" -> "Dom 11 - Lun 12")
      const textoCompacto = formatEntregaCompacta(diaPromesa)
      return (
        <TooltipProvider delay={100}>
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="flex items-start min-w-0 max-w-full cursor-default">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-foreground leading-snug break-words">
                    {textoCompacto}
                  </span>
                </div>
              }
            />
            <TooltipContent sideOffset={4} className="text-xs max-w-xs font-medium">
              <span>Fecha prometida: {diaPromesa}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const promesaMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const diffDias = Math.round((promesaMidnight - hoyMidnight) / (1000 * 60 * 60 * 24))

    let textoRender: React.ReactNode
    let textoCompleto = formatDate(diaPromesa)

    if (diffDias < 0) {
      textoRender = (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
          <Flame className="w-3.5 h-3.5 text-destructive shrink-0 inline mr-1" />
          <span>Vencido ({Math.abs(diffDias)}d)</span>
        </span>
      )
    } else if (diffDias === 0) {
      textoRender = (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500">
          <Clock className="w-3.5 h-3.5 shrink-0 inline mr-1" />
          <span>Entrega Hoy</span>
        </span>
      )
    } else if (diffDias === 1) {
      textoRender = (
        <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-500">
          <Calendar className="w-3.5 h-3.5 text-amber-600 inline mr-1.5 shrink-0" />
          <span>Mañana</span>
        </span>
      )
    } else if (diffDias <= 3) {
      textoRender = (
        <span className="inline-flex items-center text-xs font-medium text-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1.5 shrink-0" />
          <span>En {diffDias} días</span>
        </span>
      )
    } else {
      textoRender = (
        <span className="inline-flex items-start text-xs font-medium text-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0 mt-0.5" />
          <span className="leading-snug break-words">{textoCompleto}</span>
        </span>
      )
    }

    return (
      <TooltipProvider delay={100}>
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-start min-w-0 max-w-full cursor-default">
                {textoRender}
              </div>
            }
          />
          <TooltipContent sideOffset={4} className="text-xs max-w-xs font-medium">
            <span>Fecha prometida: {textoCompleto}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  } catch {
    return (
      <div className="flex items-center min-w-0">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1.5 shrink-0" />
        <span className="text-xs text-foreground font-medium break-words">{diaPromesa}</span>
      </div>
    )
  }
}

export function ProductionRow({
  pieza,
  isLoading,
  onCambiarEstado,
  onRequestIniciar,
  onRequestReabrir,
  onSelectPieza
}: ProductionRowProps) {
  const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)

  const handleIniciarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    if (onRequestIniciar) {
      onRequestIniciar(pieza)
    } else {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')
    }
  }

  const handleReabrirClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    if (onRequestReabrir) {
      onRequestReabrir(pieza)
    } else {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')
    }
  }

  const handleListoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    onCambiarEstado(pieza.tipoRegistro, pieza.id, 'LISTO_ENTREGA')
  }

  return (
    <TableRow
      onClick={() => onSelectPieza?.(pieza)}
      className="border-b border-border/70 hover:bg-secondary/35 transition-colors duration-150 cursor-default group min-h-[64px]"
    >
      {/* 1. Pieza & Especificación (w-[28%], con pl-6) */}
      <TableCell className="w-[28%] pl-6 pr-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          {/* Título del modelo con hover primario */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              onClick={(e) => {
                e.stopPropagation()
                onSelectPieza?.(pieza)
              }}
              className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate block"
              title={pieza.nombreModelo}
            >
              {pieza.nombreModelo}
            </span>
          </div>

          {/* Fila secundaria: Multiplicador x1, Swatches circulares nítidos y Chip de Material (CERO gramos) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground font-mono shrink-0">
              x{pieza.cantidad}
            </span>

            <FilamentDotsGroup
              colores={pieza.colores}
              nombreColorFallback={pieza.nombreColor}
              codigoHexFallback={pieza.codigoHex}
              tipoMaterial={pieza.tipoMaterial}
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

      {/* 2. Cliente & Pedido (w-[25%]) */}
      <TableCell className="w-[25%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          <span
            className="text-sm font-semibold text-foreground truncate block"
            title={pieza.cliente}
          >
            {pieza.cliente}
          </span>

          {/* Chip de pedido y canal de venta asociado */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/pedidos?search=${encodeURIComponent(pieza.codigoRef)}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-accent/60 text-accent-foreground font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-border/60 flex items-center gap-1.5 w-fit mt-1 hover:bg-accent transition-colors shrink-0"
              title="Filtrar pedido en Gestión de Pedidos"
            >
              <span>#{pieza.codigoRef.replace(/^#/, '')}</span>
              {pieza.canalVenta && (
                <span className="font-sans font-medium text-[10px] text-accent-foreground/80 border-l border-accent-foreground/30 pl-1.5">
                  {pieza.canalVenta}
                </span>
              )}
            </Link>
          </div>
        </div>
      </TableCell>

      {/* 3. Entrega & Antigüedad (w-[24%]) */}
      <TableCell className="w-[24%] px-4 py-3 align-middle min-w-0">
        <div className="space-y-0.5 min-w-0">
          {/* Primera línea: Ícono de calendario y fecha con Tooltip */}
          {renderEntregaInfo(pieza.diaEntregaPrometida)}

          {/* Segunda línea: Antigüedad relativa */}
          {tiempoTxt && (
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {tiempoTxt}
            </div>
          )}
        </div>
      </TableCell>

      {/* 4. Estado & Acción Operativa Unificada (w-[23%], mínimo 210px efectivo, CERO recorte de badge) */}
      <TableCell
        className="w-[23%] pl-2 pr-4 py-3 align-middle text-right min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-2.5 pr-4 h-full">
          {/* Badge de Estado con shrink-0 estricto */}
          {pieza.estado === 'PENDIENTE' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              Pendiente
            </span>
          )}

          {pieza.estado === 'EN_PRODUCCION' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              En Impresión
            </span>
          )}

          {pieza.estado === 'LISTO_ENTREGA' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              Listo
            </span>
          )}

          {pieza.estado === 'ENTREGADO' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap shrink-0">
              Entregado
            </span>
          )}

          {/* Botón de Acción con shrink-0 estricto */}
          {pieza.estado === 'PENDIENTE' && (
            <Button
              size="sm"
              disabled={isLoading}
              onClick={handleIniciarClick}
              className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer hover:shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Iniciar</span>
                </>
              )}
            </Button>
          )}

          {pieza.estado === 'EN_PRODUCCION' && (
            <Button
              size="sm"
              disabled={isLoading}
              onClick={handleListoClick}
              className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer hover:shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Listo</span>
                </>
              )}
            </Button>
          )}

          {pieza.estado === 'LISTO_ENTREGA' && (
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={handleReabrirClick}
              className="h-8 px-3.5 rounded-xl text-xs font-semibold border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 shrink-0 transition-all hover:shadow-sm cursor-pointer"
              title="Volver a poner pendiente en cola"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Reabriendo...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Reabrir</span>
                </>
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
