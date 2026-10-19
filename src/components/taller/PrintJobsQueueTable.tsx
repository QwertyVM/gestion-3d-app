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

  // Identidad cromática semántica por contenedor según fase de producción
  const stageContainerClasses = {
    PENDIENTE: 'border-l-4 border-l-amber-500 rounded-xl overflow-hidden border border-border bg-card shadow-xs',
    EN_PRODUCCION: 'border-l-4 border-l-blue-600 rounded-xl overflow-hidden border border-border bg-card shadow-xs',
    EN_TALLER: 'border-l-4 border-l-indigo-600 rounded-xl overflow-hidden border border-border bg-card shadow-xs',
    EMPAQUETANDO: 'border-l-4 border-l-orange-500 rounded-xl overflow-hidden border border-border bg-card shadow-xs',
    LISTO_ENTREGA: 'border-l-4 border-l-emerald-600 rounded-xl overflow-hidden border border-border bg-card shadow-xs'
  }[etapa]

  const stageHeaderClasses = {
    PENDIENTE: 'bg-amber-500/[0.04]',
    EN_PRODUCCION: 'bg-blue-500/[0.04]',
    EN_TALLER: 'bg-indigo-500/[0.04]',
    EMPAQUETANDO: 'bg-orange-500/[0.04]',
    LISTO_ENTREGA: 'bg-emerald-500/[0.04]'
  }[etapa]

  // Indicador dot coloreado de alto contraste
  const stageDot = {
    PENDIENTE: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 shrink-0 inline-block shadow-2xs" />,
    EN_PRODUCCION: <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse mr-2 shrink-0 inline-block shadow-2xs" />,
    EN_TALLER: <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-2 inline-block shrink-0 shadow-2xs" />,
    EMPAQUETANDO: <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse mr-2 shrink-0 inline-block shadow-2xs" />,
    LISTO_ENTREGA: <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-2 shrink-0 inline-block shadow-2xs" />
  }[etapa]

  // Estilos de badge para el encabezado
  const stageHeaderBadgeStyle = {
    PENDIENTE: 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300',
    EN_PRODUCCION: 'border-blue-500/25 bg-blue-500/10 text-blue-800 dark:text-blue-300',
    EN_TALLER: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300',
    EMPAQUETANDO: 'border-orange-500/25 bg-orange-500/10 text-orange-800 dark:text-orange-300',
    LISTO_ENTREGA: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
  }[etapa]

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
      <div className={`p-4 sm:p-4.5 border-b border-border/70 ${stageHeaderClasses} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        {/* Lado Izquierdo: Dot, Título, Badge de Conteo y Subtítulo Operacional */}
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center">
              {stageDot}
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {titulo}
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${stageHeaderBadgeStyle}`}>
              {badgeCount}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitulo}
          </p>
        </div>

        {/* Lado Derecho: Badge temático superior derecho */}
        <div className={`border px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-2xs ${stageHeaderBadgeStyle}`}>
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
