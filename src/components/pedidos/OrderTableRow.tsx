'use client'

import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Calendar, Clock, MapPin, MessageCircle } from 'lucide-react'
import { EstadoPedido } from '@prisma/client'
import { PedidoView, FilamentoOption } from './types'
import { consolidateOrderItems, formatCurrency } from './orderUtils'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderProductDots } from './OrderProductDots'
import { formatDate } from '@/lib/utils'

function InstagramIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function getInstagramUrl(handle: string) {
  const clean = handle.replace(/^@/, '').trim()
  return `https://instagram.com/${clean}`
}

function getWhatsAppUrl(phone: string, clientName: string, codigo: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone
  const msg = encodeURIComponent(
    `¡Hola ${clientName}! 👋 Te escribimos de NOVA para saber cómo te fue con tu pedido ${codigo}.`
  )
  return `https://wa.me/${fullPhone}?text=${msg}`
}

export interface OrderTableRowProps {
  pedido: PedidoView
  filamentos: FilamentoOption[]
  onSelectPedido: (p: PedidoView) => void
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void
  onTogglePostventa: (id: string, nuevoEstado: boolean, e?: React.MouseEvent) => void
}

export function OrderTableRow({
  pedido,
  filamentos,
  onSelectPedido,
  onCambiarEstado,
  onTogglePostventa
}: OrderTableRowProps) {
  const consolidatedItems = React.useMemo(() => {
    return consolidateOrderItems(pedido.items, filamentos)
  }, [pedido.items, filamentos])

  const hasPendingPostventa = !pedido.seguimientoPostventa && pedido.estado !== 'CANCELADO'
  const codigoLabel = pedido.codigo?.startsWith('#') ? pedido.codigo : `#${pedido.codigo}`

  return (
    <TableRow
      onClick={() => onSelectPedido(pedido)}
      className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150 cursor-pointer group min-h-[58px]"
    >
      {/* 1. Pedido & Cliente (w-[22%]) */}
      <TableCell className="w-[22%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate block"
              title={pedido.cliente}
            >
              {pedido.cliente}
            </span>
            <span className="font-mono text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/70 shrink-0">
              {codigoLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mt-0.5">
            <span>{formatDate(pedido.fecha)}</span>
            {pedido.canalVenta && (
              <>
                <span className="text-border">•</span>
                <span className="text-[10px] text-muted-foreground">{pedido.canalVenta}</span>
              </>
            )}
            {pedido.handleSocial && (
              <>
                <span className="text-border">•</span>
                <a
                  href={getInstagramUrl(pedido.handleSocial)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Abrir perfil de Instagram"
                >
                  <InstagramIcon className="h-2.5 w-2.5" />
                  <span>@{pedido.handleSocial.replace(/^@/, '')}</span>
                </a>
              </>
            )}
            {pedido.telefono && (
              <>
                <span className="text-border">•</span>
                <a
                  href={getWhatsAppUrl(pedido.telefono, pedido.cliente, pedido.codigo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Escribir por WhatsApp"
                >
                  <MessageCircle className="h-2.5 w-2.5" />
                  <span>{pedido.telefono}</span>
                </a>
              </>
            )}
          </div>
        </div>
      </TableCell>

      {/* 2. Productos & Filamentos (w-[32%]) */}
      <TableCell className="w-[32%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          {consolidatedItems.length > 1 && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {pedido.totalItemsCount} {pedido.totalItemsCount === 1 ? 'pieza' : 'piezas'}
              </span>
              <span>•</span>
              <span>
                {consolidatedItems.length} {consolidatedItems.length === 1 ? 'modelo' : 'modelos'}
              </span>
            </div>
          )}

          <div className="space-y-1 min-w-0">
            {consolidatedItems.slice(0, 2).map((item) => (
              <div key={item.key} className="text-xs min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="text-xs font-medium text-foreground truncate block"
                    title={item.nombre}
                  >
                    {item.nombre}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0 ml-1">
                    ×{item.cantidadTotal}
                  </span>
                </div>

                <OrderProductDots colores={item.colores} />
              </div>
            ))}

            {consolidatedItems.length > 2 && (
              <span className="text-[10px] font-medium text-muted-foreground block">
                +{consolidatedItems.length - 2} más
              </span>
            )}
          </div>
        </div>
      </TableCell>

      {/* 3. Entrega & Destino (w-[18%]) */}
      <TableCell className="w-[18%] px-4 py-3 align-middle overflow-hidden min-w-0">
        <div className="space-y-1 text-xs min-w-0">
          {pedido.diaEntregaPrometida ? (
            <div
              className="flex items-center gap-1.5 font-medium text-foreground truncate"
              title={pedido.diaEntregaPrometida}
            >
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{pedido.diaEntregaPrometida}</span>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/50">Sin fecha</div>
          )}

          {pedido.destinoEnvio && (
            <div
              className="flex items-center gap-1 text-xs font-medium text-foreground mt-0.5 truncate max-w-[170px]"
              title={pedido.destinoEnvio}
            >
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{pedido.destinoEnvio}</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* 4. Estado & Postventa (w-[14%]) */}
      <TableCell
        className="w-[14%] px-4 py-3 align-middle text-center overflow-hidden min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[130px] mx-auto min-w-0">
          <OrderStatusBadge
            value={pedido.estado}
            onChange={(nuevoEstado) => onCambiarEstado(pedido.id, nuevoEstado)}
          />

          {/* Indicador de Postventa sutil: exclusivo 'Postventa pend.' */}
          {hasPendingPostventa && (
            <button
              type="button"
              onClick={(e) => onTogglePostventa(pedido.id, true, e)}
              className="text-amber-700 dark:text-amber-400 text-[10px] font-medium flex items-center justify-center gap-1 mt-1 hover:underline cursor-pointer truncate max-w-full"
              title="Postventa pendiente. Clic para marcar como realizada."
            >
              <Clock className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Postventa pend.</span>
            </button>
          )}
        </div>
      </TableCell>

      {/* 5. Total & Balance (w-[14%]) */}
      <TableCell className="w-[14%] px-4 py-3 text-right align-middle overflow-hidden min-w-0">
        <div className="flex flex-col items-end gap-0.5 min-w-0">
          <span className="font-mono font-semibold text-sm text-foreground text-right">
            {formatCurrency(pedido.total)}
          </span>

          {pedido.saldoPendiente > 0 && (
            <span className="text-destructive font-medium text-[11px] font-mono block text-right">
              Pendiente: S/ {pedido.saldoPendiente.toFixed(2)}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
