'use client'

import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow
} from '@/components/ui/table'
import { Box } from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { ProductionRow } from './ProductionRow'
import { ProductionCardMobile } from './ProductionCardMobile'

export interface PrintJobsQueueTableProps {
  piezas: PiezaTaller[]
  etapa: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA'
  titulo: string
  subtitulo: string
  badgeCount: number
  loadingPieceId?: string | null
  onCambiarEstado: (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
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
    EN_PRODUCCION: 'border-l-4 border-l-primary rounded-xl overflow-hidden border border-border bg-card shadow-xs',
    LISTO_ENTREGA: 'border-l-4 border-l-emerald-600 rounded-xl overflow-hidden border border-border bg-card shadow-xs'
  }[etapa]

  // Indicador dot coloreado
  const stageDot = {
    PENDIENTE: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 shrink-0" />,
    EN_PRODUCCION: <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse mr-2 shrink-0" />,
    LISTO_ENTREGA: <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-2 shrink-0" />
  }[etapa]

  // Texto del badge en esquina superior derecha
  const badgeLabel = {
    PENDIENTE: `${totalUds} ${totalUds === 1 ? 'pieza en cola' : 'piezas en cola'}`,
    EN_PRODUCCION: `${totalUds} ${totalUds === 1 ? 'pieza en impresión' : 'piezas en impresión'}`,
    LISTO_ENTREGA: `${totalUds} ${totalUds === 1 ? 'pieza lista' : 'piezas listas'}`
  }[etapa]

  return (
    <div className={`${stageContainerClasses} transition-all duration-200`}>
      {/* Encabezado de Sección con Jerarquía */}
      <div className="p-4 sm:p-4.5 border-b border-border/70 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Lado Izquierdo: Dot, Título, Badge de Conteo y Subtítulo Operacional */}
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center">
              {stageDot}
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {titulo}
              </h3>
            </div>
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-semibold border border-border/60">
              {badgeCount}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitulo}
          </p>
        </div>

        {/* Lado Derecho: Badge Limpio y Conciso Centrado en Piezas (CERO mención a gramos) */}
        <div className="bg-secondary/70 border border-border px-3 py-1 rounded-lg text-xs font-semibold text-foreground flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
          <Box className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>{badgeLabel}</span>
        </div>
      </div>

      {/* Visualización Desktop: Tabla Fixed w-full con 4 Columnas Unificadas (CERO scroll horizontal) */}
      <div className="hidden md:block w-full overflow-hidden">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-secondary/30 border-y border-border/70">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[28%] pl-6 pr-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Pieza & Especificación
              </TableHead>
              <TableHead className="w-[25%] px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Cliente & Pedido
              </TableHead>
              <TableHead className="w-[24%] px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                Entrega & Antigüedad
              </TableHead>
              <TableHead className="w-[23%] pl-4 pr-6 py-2.5 text-right text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
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
export { PrintJobsQueueTable as ProductionQueueTable, PrintJobsQueueTable as PendingPiecesTable }
