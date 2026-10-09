'use client'

import React from 'react'
import Link from 'next/link'
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

interface ProductionCardMobileProps {
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
      return (
        <TooltipProvider delay={100}>
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="flex items-center min-w-0 max-w-full truncate cursor-default">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1.5 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">{diaPromesa}</span>
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
        <span className="inline-flex items-center text-xs font-medium text-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1.5 shrink-0" />
          <span className="truncate">{textoCompleto}</span>
        </span>
      )
    }

    return (
      <TooltipProvider delay={100}>
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-center min-w-0 max-w-full truncate cursor-default">
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
      <div className="flex items-center min-w-0 truncate">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground inline mr-1.5 shrink-0" />
        <span className="text-xs text-foreground font-medium truncate">{diaPromesa}</span>
      </div>
    )
  }
}

export function ProductionCardMobile({
  pieza,
  isLoading,
  onCambiarEstado,
  onRequestIniciar,
  onRequestReabrir,
  onSelectPieza
}: ProductionCardMobileProps) {
  const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)

  const borderEtapaClass =
    pieza.estado === 'PENDIENTE'
      ? 'border-l-4 border-l-amber-500'
      : pieza.estado === 'EN_PRODUCCION'
      ? 'border-l-4 border-l-primary'
      : 'border-l-4 border-l-emerald-600'

  const handleIniciarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    if (onRequestIniciar) onRequestIniciar(pieza)
    else onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')
  }

  const handleReabrirClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    if (onRequestReabrir) onRequestReabrir(pieza)
    else onCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')
  }

  const handleListoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    onCambiarEstado(pieza.tipoRegistro, pieza.id, 'LISTO_ENTREGA')
  }

  return (
    <div
      onClick={() => onSelectPieza?.(pieza)}
      className={`bg-card border border-border rounded-xl p-3.5 shadow-xs space-y-2.5 transition-all ${borderEtapaClass}`}
    >
      {/* Cabecera de la tarjeta: Modelo + Multiplicador y Badge de estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4
            className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
            title={pieza.nombreModelo}
          >
            {pieza.nombreModelo}
          </h4>
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            x{pieza.cantidad}
          </span>
        </div>

        {/* Badge de estado con contraste semántico */}
        <div className="shrink-0">
          {pieza.estado === 'PENDIENTE' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              Pendiente
            </span>
          )}
          {pieza.estado === 'EN_PRODUCCION' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              En Impresión
            </span>
          )}
          {pieza.estado === 'LISTO_ENTREGA' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              Listo
            </span>
          )}
          {pieza.estado === 'ENTREGADO' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
              Entregado
            </span>
          )}
        </div>
      </div>

      {/* Filamentos (CERO mención a gramos) & Personalización */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <FilamentDotsGroup
          colores={pieza.colores}
          nombreColorFallback={pieza.nombreColor}
          codigoHexFallback={pieza.codigoHex}
          tipoMaterial={pieza.tipoMaterial}
        />
        {pieza.personalizacion && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500 font-medium italic truncate max-w-full">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            "{pieza.personalizacion}"
          </span>
        )}
      </div>

      {/* Cliente y Pedido */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
        <div className="min-w-0 pr-2">
          <span className="text-muted-foreground">Cliente: </span>
          <span className="font-semibold text-foreground truncate">{pieza.cliente}</span>
        </div>

        <Link
          href={`/pedidos?search=${encodeURIComponent(pieza.codigoRef)}`}
          onClick={(e) => e.stopPropagation()}
          className="bg-accent/60 text-accent-foreground font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-border/60 flex items-center gap-1.5 hover:bg-accent shrink-0"
        >
          <span>#{pieza.codigoRef.replace(/^#/, '')}</span>
          {pieza.canalVenta && (
            <span className="font-sans font-medium text-[10px] text-accent-foreground/80 border-l border-accent-foreground/30 pl-1.5">
              {pieza.canalVenta}
            </span>
          )}
        </Link>
      </div>

      {/* Entrega & Acción */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <div className="min-w-0 space-y-0.5">
          {renderEntregaInfo(pieza.diaEntregaPrometida)}
          {tiempoTxt && (
            <div className="text-[11px] text-muted-foreground">
              {tiempoTxt}
            </div>
          )}
        </div>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {pieza.estado === 'PENDIENTE' && (
            <Button
              size="sm"
              disabled={isLoading}
              onClick={handleIniciarClick}
              className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 hover:shadow-sm cursor-pointer shrink-0 ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
              className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 hover:shadow-sm cursor-pointer shrink-0 ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
              className="h-8 px-3.5 rounded-xl text-xs font-semibold border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 whitespace-nowrap transition-all hover:shadow-sm cursor-pointer shrink-0 ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
      </div>
    </div>
  )
}
