'use client'

import React, { useState } from 'react'
import {
  Pencil,
  Share2,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  PackageCheck,
  Printer
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThermalTicketModal } from './ThermalTicketModal'
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
import { BoxAssignmentSection } from './BoxAssignmentSection'
import { PedidoView, FilamentoOption, PagoPedidoView } from './types'
import { StockCajasResumen } from '@/actions/cajas'

export interface OrderDetailDrawerProps {
  pedido: PedidoView | null
  filamentos: FilamentoOption[]
  stockCajas?: StockCajasResumen | null
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
  onAssignBoxes?: (pedidoId: string, cajas: { inversionId?: string | null, nombreCaja: string, cantidad: number, costoUnitario: number }[]) => Promise<boolean>
  onRemoveBoxes?: (pedidoId: string) => Promise<boolean>
}

export function OrderDetailDrawer({
  pedido,
  filamentos,
  stockCajas,
  isOpen,
  onClose,
  onEditOrder,
  onTogglePostventa,
  onSaveNotasPostventa,
  onOpenEditPago,
  onDeletePago,
  onRegistrarAbono,
  onAssignBoxes,
  onRemoveBoxes
}: OrderDetailDrawerProps) {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  if (!pedido) return null

  const handleCopyWhatsApp = () => {
    const ticket = generateWhatsAppOrderTicket(pedido, filamentos)
    navigator.clipboard.writeText(ticket)
    setCopiedWhatsApp(true)
    setTimeout(() => setCopiedWhatsApp(false), 2000)
  }

  const rawCodigo = pedido.codigo ? pedido.codigo.trim() : ''
  const displayCodigo = rawCodigo.startsWith('#') ? rawCodigo : `#${rawCodigo}`

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-xl lg:max-w-2xl h-full border-l border-border/60 bg-background shadow-2xl flex flex-col p-0 z-50 overflow-hidden"
      >
        {/* ========================================================================= */}
        {/* HEADER CONTEXTUAL DEL DRAWER 360°                                        */}
        {/* ========================================================================= */}
        <div className="bg-card border-b border-border/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                {displayCodigo}
              </span>
              <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
                {pedido.cliente}
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Registrado: {formatDate(pedido.fecha)} • Canal: {pedido.canalVenta || 'Directo'}
            </p>
          </div>

          {/* Quick Actions Header Toolbar */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditOrder(pedido)}
              className="text-xs h-8 px-2.5 rounded-lg border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
              <span>Editar</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTicketModalOpen(true)}
              className="text-xs h-8 px-2.5 rounded-lg border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 cursor-pointer"
              title="Ver e imprimir ticket térmico para despacho"
            >
              <Printer className="h-3 w-3 text-muted-foreground" />
              <span>Ticket 80mm</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyWhatsApp}
              className="text-xs h-8 px-2.5 rounded-lg border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3 text-muted-foreground" />
                  <span>WhatsApp</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/60 flex items-center justify-center ml-1"
              title="Cerrar panel lateral"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTENIDO CON SCROLL NATURAL Y VISTA 360°                                */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* BLOQUE 1: RESUMEN LOGÍSTICO Y DE DESPACHO */}
          <OrderLogisticsSummary
            metodoPago={pedido.metodoPago || (pedido.pagos?.[0]?.metodoPago) || 'Yape'}
            destinoEnvio={pedido.destinoEnvio}
            diaEntregaPrometida={pedido.diaEntregaPrometida}
            telefono={pedido.telefono}
          />

          {/* NOTAS GENERALES DEL PEDIDO */}
          {pedido.notas && pedido.notas.trim() !== '' && (
            <div className="p-3 bg-card rounded-lg border border-border text-xs flex items-start gap-2 shadow-2xs">
              <span className="font-semibold text-foreground shrink-0">Notas / Instrucciones:</span>
              <span className="text-muted-foreground">{pedido.notas}</span>
            </div>
          )}

          {/* BLOQUE 2: SEGUIMIENTO POSTVENTA COMPACTO */}
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

          {/* BLOQUE 3: PRODUCTOS ASIGNADOS */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Productos Asignados ({pedido.items.length})
            </span>

            <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-none">
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table className="w-full">
                  <TableHeader className="bg-muted/20 border-b border-border/60">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase py-2 pl-3 select-none">
                        MODELO / PRODUCTO
                      </TableHead>
                      <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase py-2 text-center w-14 shrink-0 select-none">
                        CANT.
                      </TableHead>
                      <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase py-2 text-right w-20 shrink-0 select-none">
                        P. UNIT
                      </TableHead>
                      <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase py-2 text-right w-24 shrink-0 pr-3 select-none">
                        SUBTOTAL
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs divide-y divide-border/40">
                    {pedido.items.map((it) => {
                      const itemColores = getItemColors(it, filamentos)
                      return (
                        <TableRow key={it.id} className="border-border/40 hover:bg-muted/20">
                          <TableCell className="align-top py-2.5 pl-3 whitespace-normal break-words">
                            <div className="space-y-1">
                              <div className="font-medium text-foreground text-xs">
                                {it.nombreProductoSnapshot}
                              </div>

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
                          <TableCell className="text-center font-medium text-foreground align-top py-2.5 shrink-0 tabular-nums">
                            {it.cantidad}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground align-top py-2.5 shrink-0 text-xs tabular-nums">
                            {formatCurrency(it.precioUnitario)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-foreground align-top py-2.5 pr-3 shrink-0 text-xs tabular-nums">
                            {formatCurrency(it.subtotal)}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Fila opcional de envío */}
                    {pedido.costoEnvio > 0 && (
                      <TableRow className="border-border/40 bg-muted/10 text-xs">
                        <TableCell colSpan={3} className="text-right text-muted-foreground py-2 pl-3">
                          Costo de Envío / Flete:
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-foreground py-2 pr-3 shrink-0 tabular-nums">
                          {formatCurrency(pedido.costoEnvio)}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Total Pedido */}
                    <TableRow className="border-t border-border/60 bg-muted/20">
                      <TableCell colSpan={4} className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Total Pedido:
                          </span>
                          <span className="text-sm font-semibold text-foreground font-mono tabular-nums tracking-tight">
                            {formatCurrency(pedido.total)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="block sm:hidden divide-y divide-border">
                {pedido.items.map((it) => {
                  const itemColores = getItemColors(it, filamentos)
                  return (
                    <div key={it.id} className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="font-semibold text-foreground text-xs leading-snug block">
                            {it.nombreProductoSnapshot}
                          </span>
                          {itemColores.length > 0 && (
                            <div className="flex items-center flex-wrap pt-0.5">
                              {itemColores.map((col, cIdx) => (
                                <ColorDot key={col.id || cIdx} filamento={col} />
                              ))}
                            </div>
                          )}
                          {it.personalizacion && (
                            <p className="text-[10px] text-muted-foreground italic">
                              Nota: {it.personalizacion}
                            </p>
                          )}
                        </div>

                        <span className="text-[11px] font-mono font-bold text-foreground shrink-0 bg-secondary px-1.5 py-0.5 rounded border border-border">
                          ×{it.cantidad}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                        <span className="text-muted-foreground text-[10px]">
                          Unit: {formatCurrency(it.precioUnitario)}
                        </span>
                        <span className="font-mono font-bold text-foreground text-xs">
                          Subtotal: {formatCurrency(it.subtotal)}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {pedido.costoEnvio > 0 && (
                  <div className="p-2.5 bg-secondary/30 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium text-[11px]">
                      Envío:
                    </span>
                    <span className="font-mono font-bold text-foreground text-xs">
                      {formatCurrency(pedido.costoEnvio)}
                    </span>
                  </div>
                )}

                <div className="p-2.5 bg-card flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Total Pedido:
                  </span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {formatCurrency(pedido.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 3.5: ASIGNACIÓN DE CAJAS & PACKAGING */}
          {onAssignBoxes && onRemoveBoxes && (
            <BoxAssignmentSection
              pedido={pedido}
              stockCajas={stockCajas}
              onAssignBoxes={onAssignBoxes}
              onRemoveBoxes={onRemoveBoxes}
            />
          )}

          {/* BLOQUE 4: HISTORIAL DE ABONOS Y GESTIÓN DE PAGOS */}
          <OrderPaymentsList
            pedidoId={pedido.id}
            pagos={pedido.pagos || []}
            saldoPendiente={pedido.saldoPendiente}
            onOpenEditPago={onOpenEditPago}
            onDeletePago={onDeletePago}
            onRegistrarAbono={onRegistrarAbono}
          />
        </div>

        <ThermalTicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          pedido={pedido}
          filamentos={filamentos}
        />
      </SheetContent>
    </Sheet>
  )
}
