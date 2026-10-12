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
import { Play, Check, RotateCcw, Loader2, Sparkles, Calendar, Clock, Flame, ExternalLink, Link2, Pencil, Package, PackageCheck } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { FilamentDotsGroup } from './FilamentDotsGroup'
import { formatDate } from '@/lib/utils'
import { parseDiaPromesa, getEntregaInfoStatus } from '@/lib/date-utils'

interface ProductionCardMobileProps {
  pieza: PiezaTaller
  isLoading: boolean
  onCambiarEstado: (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'EN_TALLER' | 'EMPAQUETANDO' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => void
  onRequestIniciar?: (pieza: PiezaTaller) => void
  onRequestReabrir?: (pieza: PiezaTaller) => void
  onSelectPieza?: (pieza: PiezaTaller) => void
  onVincularUrl?: (pieza: PiezaTaller) => void
}

function getDomainBadgeLabel(url: string | null | undefined): string {
  if (!url) return 'Modelo 3D'
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('makerworld')) return 'MakerWorld'
    if (host.includes('printables')) return 'Printables'
    if (host.includes('thingiverse')) return 'Thingiverse'
    if (host.includes('drive.google')) return 'Drive'
    if (host.includes('cults3d')) return 'Cults3D'
    return 'Modelo 3D'
  } catch {
    return 'Modelo 3D'
  }
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
  const info = getEntregaInfoStatus(diaPromesa)

  let iconNode: React.ReactNode = null
  if (info.iconType === 'flame') {
    iconNode = <Flame className="w-3.5 h-3.5 shrink-0 inline mr-1 text-red-600 dark:text-red-400" />
  } else if (info.iconType === 'clock') {
    iconNode = <Clock className="w-3.5 h-3.5 shrink-0 inline mr-1 text-red-600 dark:text-red-400" />
  } else if (info.iconType === 'none') {
    iconNode = <Calendar className="w-3.5 h-3.5 shrink-0 inline mr-1 opacity-50 text-muted-foreground" />
  } else {
    iconNode = <Calendar className="w-3.5 h-3.5 shrink-0 inline mr-1" />
  }

  const content = (
    <span className={`inline-flex items-center text-xs ${info.colorClass}`}>
      {iconNode}
      <span className="truncate">{info.texto}</span>
    </span>
  )

  if (!diaPromesa) {
    return (
      <div className="flex items-center min-w-0">
        {content}
      </div>
    )
  }

  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          render={
            <div className="flex items-center min-w-0 max-w-full truncate cursor-default">
              {content}
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

export function ProductionCardMobile({
  pieza,
  isLoading,
  onCambiarEstado,
  onRequestIniciar,
  onRequestReabrir,
  onSelectPieza,
  onVincularUrl
}: ProductionCardMobileProps) {
  const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)

  const borderEtapaClass =
    pieza.estado === 'PENDIENTE'
      ? 'border-l-4 border-l-amber-500'
      : pieza.estado === 'EN_PRODUCCION'
      ? 'border-l-4 border-l-primary'
      : pieza.estado === 'EN_TALLER'
      ? 'border-l-4 border-l-sky-500'
      : pieza.estado === 'EMPAQUETANDO'
      ? 'border-l-4 border-l-amber-600'
      : 'border-l-4 border-l-emerald-600'

  const handleIniciarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    if (onRequestIniciar) onRequestIniciar(pieza)
    else onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')
  }

  const handleATallerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_TALLER')
  }

  const handleEmpaquetarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EMPAQUETANDO')
  }

  const handleEntregarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    onCambiarEstado(pieza.tipoRegistro, pieza.id, 'ENTREGADO')
  }

  const handleReabrirClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return
    if (pieza.estado === 'EN_TALLER') {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')
    } else if (pieza.estado === 'EMPAQUETANDO') {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_TALLER')
    } else if (pieza.estado === 'LISTO_ENTREGA') {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_TALLER')
    } else if (pieza.estado === 'ENTREGADO') {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'EMPAQUETANDO')
    } else if (onRequestReabrir) {
      onRequestReabrir(pieza)
    } else {
      onCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')
    }
  }

  return (
    <div
      onClick={() => onSelectPieza?.(pieza)}
      className={`bg-card border border-border rounded-xl p-3.5 shadow-xs space-y-2.5 transition-all ${borderEtapaClass} ${
        isLoading ? 'animate-out fade-out-50 duration-150 pointer-events-none' : ''
      }`}
    >
      {/* Cabecera de la tarjeta: Modelo + Multiplicador y Badge de estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              title={pieza.nombreModelo}
            >
              {pieza.nombreModelo}
            </h4>
            {pieza.indicadorUnidad ? (
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                Pieza {pieza.indicadorUnidad}
              </span>
            ) : (
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                x{pieza.cantidad}
              </span>
            )}
          </div>

          {/* Enlace o botón para modelo 3D en móvil */}
          <div className="mt-1 flex items-center gap-1.5">
            {pieza.enlaceMakerworld ? (
              <div className="inline-flex items-center shrink-0">
                <a
                  href={pieza.enlaceMakerworld}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 px-2 py-0.5 rounded-l-md border border-emerald-500/25 transition-all active:scale-95 group/link"
                  title={`Abrir modelo: ${pieza.enlaceMakerworld}`}
                >
                  <ExternalLink className="w-3 h-3 shrink-0 group-hover/link:translate-x-0.5 transition-transform" />
                  <span className="font-sans">{getDomainBadgeLabel(pieza.enlaceMakerworld)}</span>
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onVincularUrl?.(pieza)
                  }}
                  className="inline-flex items-center justify-center text-[11px] text-emerald-700/80 hover:text-emerald-700 dark:text-emerald-400/80 dark:hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 px-1.5 py-0.5 rounded-r-md border-y border-r border-emerald-500/25 transition-colors cursor-pointer"
                  title="Editar enlace del modelo"
                >
                  <Pencil className="w-2.5 h-2.5 shrink-0" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onVincularUrl?.(pieza)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/80 px-2 py-0.5 rounded-md border border-border/70 transition-colors shrink-0 cursor-pointer shadow-2xs"
                title="Vincular URL del modelo 3D"
              >
                <Link2 className="w-3 h-3 shrink-0" />
                <span>+ Vincular URL</span>
              </button>
            )}
          </div>
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
              Imprimiendo
            </span>
          )}
          {pieza.estado === 'EN_TALLER' && (
            <span className="bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
              En taller (Acabada)
            </span>
          )}
          {pieza.estado === 'EMPAQUETANDO' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 whitespace-nowrap shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              Empaquetando
            </span>
          )}
          {pieza.estado === 'LISTO_ENTREGA' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              Listo
            </span>
          )}
          {pieza.estado === 'ENTREGADO' && (
            <span className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
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
              onClick={handleATallerClick}
              className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 hover:shadow-sm cursor-pointer shrink-0 ml-auto"
              title="Mover a En Taller (terminar impresión)"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>A taller</span>
                </>
              )}
            </Button>
          )}

          {pieza.estado === 'EN_TALLER' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <TooltipProvider delay={100}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isLoading}
                        onClick={handleReabrirClick}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        aria-label="Devolver pieza a impresión / descarte"
                      >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      </Button>
                    }
                  />
                  <TooltipContent sideOffset={4} className="text-xs font-medium">
                    Devolver pieza a impresión / descarte
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                size="sm"
                disabled={isLoading}
                onClick={handleEmpaquetarClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0"
                title="Enviar a Empaque"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Enviar a Empaque</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {pieza.estado === 'EMPAQUETANDO' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={handleReabrirClick}
                className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center shrink-0"
                title="Volver a En taller"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              </Button>
              <Button
                size="sm"
                disabled={isLoading}
                onClick={handleEntregarClick}
                className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 hover:shadow-sm cursor-pointer shrink-0"
                title="Marcar como Entregado"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Entregar</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {pieza.estado === 'LISTO_ENTREGA' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={handleReabrirClick}
                className="h-8 px-2.5 rounded-xl text-xs font-semibold border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1 whitespace-nowrap transition-all hover:shadow-sm cursor-pointer shrink-0"
                title="Volver a En taller"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              </Button>
              <Button
                size="sm"
                disabled={isLoading}
                onClick={handleEntregarClick}
                className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 hover:shadow-sm cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Entregar</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
