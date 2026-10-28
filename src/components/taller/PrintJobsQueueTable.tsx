'use client'

import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow
} from '@/components/ui/table'
import { Clock, Printer, Wrench, Package, CheckCircle2 } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { ProductionRow } from './ProductionRow'
import { ProductionCardMobile } from './ProductionCardMobile'

export interface PrintJobsQueueTableProps {
  piezas: PiezaTaller[]
  etapa: 'PENDIENTE' | 'EN_PRODUCCION' | 'EN_TALLER' | 'EMPAQUETANDO' | 'LISTO_ENTREGA'
  titulo: string
  subtitulo: string
  badgeCount: number
  loadingPieceId?: string | null
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

export function PrintJobsQueueTable({
  piezas,
  etapa,
  titulo,
  subtitulo,
  badgeCount,
  loadingPieceId,
  onCambiarEstado,
  onRequestIniciar,
  onRequestReabrir,
  onSelectPieza,
  onVincularUrl
}: PrintJobsQueueTableProps) {
  if (piezas.length === 0) return null

  const totalUds = piezas.reduce((acc, p) => acc + p.cantidad, 0)

  // Contenedor minimalista con hairline borders
  const stageContainerClasses = 'rounded-2xl overflow-hidden border border-border/40 bg-card shadow-2xs'
  const stageHeaderClasses = 'bg-muted/15 border-b border-border/30'

  // Indicador dot coloreado discreto
  const stageDot = {
    PENDIENTE: <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 shrink-0 inline-block" />,
    EN_PRODUCCION: <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse mr-2 shrink-0 inline-block" />,
    EN_TALLER: <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 inline-block shrink-0" />,
    EMPAQUETANDO: <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse mr-2 shrink-0 inline-block" />,
    LISTO_ENTREGA: <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0 inline-block" />
  }[etapa]

  // Estilos de badge discretos
  const stageHeaderBadgeStyle = 'border-border/30 bg-muted/40 text-muted-foreground font-mono text-[10px]'

  const stageHeaderIcon = {
    PENDIENTE: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
    EN_PRODUCCION: <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />,
    EN_TALLER: <Wrench className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
    EMPAQUETANDO: <Package className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />,
    LISTO_ENTREGA: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
  }[etapa]

  // Texto del badge en esquina superior derecha
  const badgeLabel = {
    PENDIENTE: `${totalUds} ${totalUds === 1 ? 'pieza en cola' : 'piezas en cola'}`,
    EN_PRODUCCION: `${totalUds} ${totalUds === 1 ? 'pieza en impresión' : 'piezas en impresión'}`,
    EN_TALLER: `${totalUds} ${totalUds === 1 ? 'lista para empaque' : 'listas para empaque'}`,
    EMPAQUETANDO: `${totalUds} ${totalUds === 1 ? 'pieza en empaque' : 'piezas en empaque'}`,
    LISTO_ENTREGA: `${totalUds} ${totalUds === 1 ? 'pieza lista' : 'piezas listas'}`
  }[etapa]

  return (
    <div className={`${stageContainerClasses} transition-all duration-200`}>
      {/* Encabezado de Sección con Jerarquía y Tinte Semántico */}
      <div className={`p-3.5 sm:p-4 ${stageHeaderClasses} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
        {/* Lado Izquierdo: Dot, Título, Badge de Conteo y Subtítulo Operacional */}
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center">
              {stageDot}
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {titulo}
              </h3>
            </div>
            <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-semibold border ${stageHeaderBadgeStyle}`}>
              {badgeCount}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {subtitulo}
          </p>
        </div>

        {/* Lado Derecho: Badge temático superior derecho */}
        <div className={`border px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto shadow-2xs ${stageHeaderBadgeStyle}`}>
          {stageHeaderIcon}
          <span>{badgeLabel}</span>
        </div>
      </div>

      {/* Visualización Desktop: Tabla Fixed w-full con 4 Columnas Unificadas (CERO scroll horizontal) */}
      <div className="hidden md:block w-full overflow-hidden">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-secondary/40 border-y border-border/70">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[28%] pl-6 pr-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Pieza & Especificación
              </TableHead>
              <TableHead className="w-[22%] px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Cliente & Pedido
              </TableHead>
              <TableHead className="w-[20%] px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Entrega & Antigüedad
              </TableHead>
              <TableHead className="w-[30%] pl-4 pr-6 py-2.5 text-right text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Estado & Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {piezas.map((pieza) => (
              <ProductionRow
                key={pieza.id}
                pieza={pieza}
                isLoading={loadingPieceId === pieza.id}
                onCambiarEstado={onCambiarEstado}
                onRequestIniciar={onRequestIniciar}
                onRequestReabrir={onRequestReabrir}
                onSelectPieza={onSelectPieza}
                onVincularUrl={onVincularUrl}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Visualización Móvil: Tarjetas Individuales Responsivas (CERO scroll horizontal) */}
      <div className="block md:hidden p-3 space-y-3">
        {piezas.map((pieza) => (
          <ProductionCardMobile
            key={pieza.id}
            pieza={pieza}
            isLoading={loadingPieceId === pieza.id}
            onCambiarEstado={onCambiarEstado}
            onRequestIniciar={onRequestIniciar}
            onRequestReabrir={onRequestReabrir}
            onSelectPieza={onSelectPieza}
            onVincularUrl={onVincularUrl}
          />
        ))}
      </div>
    </div>
  )
}

// Aliases para máxima compatibilidad con nombres alternativos de especificación
export {
  PrintJobsQueueTable as ProductionQueueTable,
  PrintJobsQueueTable as PendingPiecesTable,
  PrintJobsQueueTable as WorkshopPiecesSection
}
