'use client'

import React, { useState } from 'react'
import {
  Pencil,
  Share2,
  Check,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { formatCurrency, getItemColors, generateWhatsAppOrderTicket } from './orderUtils'
import { ColorDot } from './ColorDot'
import { OrderLogisticsSummary } from './OrderLogisticsSummary'
import { OrderPostsaleCard } from './OrderPostsaleCard'
import { OrderPaymentsList } from './OrderPaymentsList'
import { PedidoView, FilamentoOption, PagoPedidoView } from './types'

export interface OrderDetailModalProps {
  pedido: PedidoView | null
  filamentos: FilamentoOption[]
  isOpen: boolean
  onClose: () => void
  onEditOrder: (pedido: PedidoView) => void
  onTogglePostventa: (pedidoId: string, nuevoEstado: boolean, e?: React.MouseEvent) => Promise<void>
  onSaveNotasPostventa: (pedidoId: string, notas: string) => Promise<void>
  onOpenEditPago: (pago: PagoPedidoView) => void
  onDeletePago: (pagoId: string, pedidoId: string) => Promise<void>
  onRegistrarAbono: (data: {
    monto: number
    metodoPago: string
    tipo: string
    notas?: string
    fecha?: string
  }) => Promise<boolean>
}

export function OrderDetailModal({
  pedido,
  filamentos,
  isOpen,
  onClose,
  onEditOrder,
  onTogglePostventa,
  onSaveNotasPostventa,
  onOpenEditPago,
  onDeletePago,
  onRegistrarAbono
}: OrderDetailModalProps) {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)

  if (!isOpen || !pedido) return null

  const handleCopyWhatsApp = () => {
    const ticket = generateWhatsAppOrderTicket(pedido, filamentos)
    navigator.clipboard.writeText(ticket)
    setCopiedWhatsApp(true)
    setTimeout(() => setCopiedWhatsApp(false), 2000)
  }

  const rawCodigo = pedido.codigo ? pedido.codigo.trim() : ''
  const displayCodigo = rawCodigo.startsWith('#') ? rawCodigo : `#${rawCodigo}`

  return (
    <div
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-background border border-border rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* HEADER Y ACCIONES PRINCIPALES (TOKENS NOVA)                               */}
        {/* ========================================================================= */}
        <div className="bg-card border-b border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-1 rounded-md border border-border shadow-2xs">
                {displayCodigo}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground tracking-tight truncate">
                Pedido de {pedido.cliente}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fecha: {formatDate(pedido.fecha)} • Canal: {pedido.canalVenta || 'WhatsApp'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Botón [ ✏️ Editar Pedido ] */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditOrder(pedido)}
              className="variant-outline border-border text-foreground hover:bg-muted text-xs h-9 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors font-medium"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Editar Pedido</span>
            </Button>

            {/* Botón [ 🔗 Copiar p/ WhatsApp ] con microinteracción temporal */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyWhatsApp}
              className="variant-outline border-border text-foreground hover:bg-muted text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Copiar p/ WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </>
              )}
            </Button>

            {/* Botón [ ✕ ] Ghost */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Cerrar detalle"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTENIDO CON SCROLL NATURAL (SIN FOOTER FLOTANTE QUE CORTE PANTALLA)    */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* BLOQUE 1: RESUMEN LOGÍSTICO Y DE DESPACHO (SIN DUPLICIDAD) */}
          <OrderLogisticsSummary
            metodoPago={pedido.metodoPago || (pedido.pagos?.[0]?.metodoPago) || 'Yape'}
            destinoEnvio={pedido.destinoEnvio}
            diaEntregaPrometida={pedido.diaEntregaPrometida}
            telefono={pedido.telefono}
          />

          {/* NOTAS GENERALES DEL PEDIDO (si existen) */}
          {pedido.notas && pedido.notas.trim() !== '' && (
            <div className="p-3 bg-card rounded-xl border border-border text-xs flex items-start gap-2 shadow-2xs">
              <span className="font-semibold text-foreground shrink-0">Notas / Instrucciones:</span>
              <span className="text-muted-foreground">{pedido.notas}</span>
            </div>
          )}

          {/* BLOQUE 2: SEGUIMIENTO POSTVENTA COMPACTO (CERO CAJAS PUNTEADAS VACÍAS) */}
          <OrderPostsaleCard
            pedidoId={pedido.id}
            codigo={pedido.codigo}
            cliente={pedido.cliente}
            telefono={pedido.telefono}
            handleSocial={pedido.handleSocial}
            seguimientoPostventa={pedido.seguimientoPostventa}
            fechaPostventa={pedido.fechaPostventa}
            initialNotasPostventa={pedido.notasPostventa}
            onTogglePostventa={onTogglePostventa}
            onSaveNotasPostventa={onSaveNotasPostventa}
          />

          {/* BLOQUE 3: PRODUCTOS ASIGNADOS (CERO SCROLL HORIZONTAL, DOTS MINIMALISTAS) */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
              Productos Asignados ({pedido.items.length})
            </span>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
              <Table className="w-full">
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase py-2.5 pl-4">
                      MODELO / PRODUCTO
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase py-2.5 text-center w-14 shrink-0">
                      CANT.
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase py-2.5 text-right w-20 sm:w-24 shrink-0">
                      P. UNIT
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase py-2.5 text-right w-20 sm:w-24 shrink-0 pr-4">
                      SUBTOTAL
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border">
                  {pedido.items.map((it) => {
                    const itemColores = getItemColors(it, filamentos)
                    return (
                      <TableRow key={it.id} className="border-border hover:bg-muted/20">
                        <TableCell className="align-top py-3 pl-4 whitespace-normal break-words">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground text-xs sm:text-sm">
                              {it.nombreProductoSnapshot}
                            </div>

                            {/* Fila de dots circulares de color con Tooltip al hover */}
                            {itemColores.length > 0 && (
                              <div className="flex items-center flex-wrap pt-0.5">
                                {itemColores.map((col, cIdx) => (
                                  <ColorDot key={col.id || cIdx} filamento={col} />
                                ))}
                              </div>
                            )}

                            {it.personalizacion && (
                              <p className="text-[11px] text-muted-foreground italic">
                                Nota: {it.personalizacion}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-foreground align-top py-3 shrink-0">
                          {it.cantidad}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground align-top py-3 shrink-0">
                          {formatCurrency(it.precioUnitario)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground align-top py-3 pr-4 shrink-0">
                          {formatCurrency(it.subtotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {/* Fila opcional de flete/envío */}
                  {pedido.costoEnvio > 0 && (
                    <TableRow className="border-border bg-muted/20 text-xs">
                      <TableCell colSpan={3} className="text-right text-muted-foreground py-2 pl-4">
                        Costo de Envío / Flete:
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-foreground py-2 pr-4 shrink-0">
                        {formatCurrency(pedido.costoEnvio)}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Fila final de Total Pedido */}
                  <TableRow className="border-t-2 border-border bg-card">
                    <TableCell colSpan={4} className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Total Pedido:
                        </span>
                        <span className="text-base font-bold text-foreground font-mono">
                          {formatCurrency(pedido.total)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* BLOQUE 4: HISTORIAL DE ABONOS Y SALDO (INTEGRADA AL PIE) */}
          <OrderPaymentsList
            pedidoId={pedido.id}
            pagos={pedido.pagos || []}
            saldoPendiente={pedido.saldoPendiente}
            onOpenEditPago={onOpenEditPago}
            onDeletePago={onDeletePago}
            onRegistrarAbono={onRegistrarAbono}
          />
        </div>
      </div>
    </div>
  )
}
