'use client'

import React from 'react'
import {
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Package,
  Calendar,
  MapPin,
  Phone
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PedidoView, FilamentoOption } from './types'
import { formatDate } from '@/lib/utils'
import { formatCurrency, getItemColors } from './orderUtils'

interface ThermalTicketModalProps {
  isOpen: boolean
  onClose: () => void
  pedido: PedidoView | null
  filamentos: FilamentoOption[]
}

export function ThermalTicketModal({
  isOpen,
  onClose,
  pedido,
  filamentos
}: ThermalTicketModalProps) {
  if (!pedido) return null

  const handlePrint = () => {
    window.print()
  }

  const rawCodigo = pedido.codigo ? pedido.codigo.trim() : ''
  const displayCodigo = rawCodigo.startsWith('#') ? rawCodigo : `#${rawCodigo}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 gap-0 overflow-hidden border border-border shadow-2xl bg-card rounded-2xl">
        <DialogTitle className="sr-only">Ticket Térmico de Despacho 80mm</DialogTitle>
        <DialogDescription className="sr-only">Formato de impresión para mini-impresora Bluetooth y caja de despacho</DialogDescription>

        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-foreground">
              Ticket Térmico de Despacho (80mm)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-4 max-h-[75vh] overflow-y-auto bg-muted/30 flex justify-center">
          <div 
            id="thermal-receipt-printable"
            className="w-[320px] bg-white text-black p-5 shadow-lg border border-neutral-300 font-mono text-xs leading-relaxed space-y-3.5 print:w-full print:border-none print:shadow-none print:p-0"
            style={{ fontFamily: 'monospace' }}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-neutral-400 pb-3">
              <h2 className="text-base font-black tracking-tight uppercase">
                NOVA STUDIO 3D
              </h2>
              <p className="text-[10px] text-neutral-600 uppercase">
                Taller de Impresión 3D Personalizada
              </p>
              <div className="mt-2 text-sm font-black border border-neutral-900 py-1 px-2 inline-block">
                PEDIDO {displayCodigo}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Fecha: {formatDate(pedido.fecha)}
              </p>
            </div>

            {/* Client and Shipping Details */}
            <div className="border-b border-dashed border-neutral-400 pb-3 space-y-1 text-[11px]">
              <div>
                <span className="font-bold">CLIENTE: </span>
                <span className="uppercase">{pedido.cliente}</span>
              </div>
              {pedido.telefono && (
                <div>
                  <span className="font-bold">TELÉFONO: </span>
                  <span>{pedido.telefono}</span>
                </div>
              )}
              {pedido.destinoEnvio && (
                <div>
                  <span className="font-bold">DESTINO / DIRECCIÓN: </span>
                  <span className="uppercase">{pedido.destinoEnvio}</span>
                </div>
              )}
              {pedido.diaEntregaPrometida && (
                <div>
                  <span className="font-bold">ENTREGA PROMETIDA: </span>
                  <span>{pedido.diaEntregaPrometida}</span>
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="border-b border-dashed border-neutral-400 pb-3">
              <div className="flex justify-between font-bold border-b border-neutral-300 pb-1 text-[10px] uppercase">
                <span>Cant • Producto</span>
                <span>Total</span>
              </div>
              <div className="divide-y divide-neutral-200 pt-1 space-y-1">
                {pedido.items.map((item, i) => {
                  const colors = getItemColors(item, filamentos)
                  const nombreProd = item.nombreProductoSnapshot || item.producto?.nombreModelo || 'Pieza 3D'
                  return (
                    <div key={i} className="pt-1.5 first:pt-0">
                      <div className="flex justify-between items-start">
                        <span className="font-bold">{item.cantidad}x {nombreProd}</span>
                        <span className="font-bold tabular-nums">S/ {item.subtotal.toFixed(2)}</span>
                      </div>
                      {colors.length > 0 && (
                        <div className="text-[10px] text-neutral-600">
                          Color: {colors.map(c => c.nombreColor).join(', ')}
                        </div>
                      )}
                      {item.personalizacion && (
                        <div className="text-[10px] text-neutral-800 italic">
                          Detalle: &quot;{item.personalizacion}&quot;
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="border-b border-dashed border-neutral-400 pb-3 space-y-1 text-right text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal Piezas:</span>
                <span className="tabular-nums">S/ {pedido.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de Envío:</span>
                <span className="tabular-nums">S/ {pedido.costoEnvio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-300">
                <span>TOTAL PEDIDO:</span>
                <span className="tabular-nums">S/ {pedido.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Abonado / Pagado:</span>
                <span className="tabular-nums">S/ {pedido.montoPagado.toFixed(2)}</span>
              </div>
            </div>

            {/* CRITICAL DELIVERY COLD STAMP / REPARTO INSTRUCTION */}
            {pedido.saldoPendiente > 0 ? (
              <div className="border-2 border-black p-3 text-center space-y-1.5 my-2">
                <div className="text-[11px] font-black uppercase tracking-wider bg-black text-white py-0.5 px-1">
                  ⚠️ COBRAR CONTRAENTREGA
                </div>
                <div className="text-xl font-black tabular-nums">
                  S/ {pedido.saldoPendiente.toFixed(2)}
                </div>
                <p className="text-[9px] text-neutral-600 leading-tight">
                  Repartidor: No entregar paquete sin verificar recepción de este monto por Yape o Efectivo.
                </p>
                <div className="pt-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border border-neutral-400 p-1 flex items-center justify-center bg-neutral-50">
                    <QrCode className="w-12 h-12 text-neutral-800" />
                  </div>
                  <span className="text-[9px] font-bold mt-1">YAPE / PLIN DIRECTO</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-black p-2.5 text-center my-2 space-y-0.5">
                <div className="text-base font-black tracking-widest uppercase">
                  ✓ PAGADO AL 100%
                </div>
                <p className="text-[10px] font-bold text-neutral-700">
                  NO COBRAR AL CLIENTE (PEDIDO CANCELADO)
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[9px] text-neutral-500 pt-2 border-t border-dashed border-neutral-300 space-y-0.5">
              <p>¡Gracias por tu preferencia!</p>
              <p>WhatsApp Soporte: +51 936 904 940</p>
              <p className="font-mono text-[8px] text-neutral-400">novastudio3d.pe</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
