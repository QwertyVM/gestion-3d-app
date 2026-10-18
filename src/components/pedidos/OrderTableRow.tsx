'use client'

import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Calendar, Check, Clock, MapPin, MessageCircle } from 'lucide-react'
import { EstadoPedido } from '@prisma/client'
import { PedidoView, FilamentoOption } from './types'
import { consolidateOrderItems, formatCurrency } from './orderUtils'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderProductDots } from './OrderProductDots'
import { formatDate } from '@/lib/utils'
import { formatDiaPromesaDisplay } from '@/lib/date-utils'

function InstagramIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
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
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void | Promise<void>
  onTogglePostventa: (id: string, nuevoEstado: boolean, e?: React.MouseEvent) => void
  onQuickAssignBox?: (pedidoId: string, e: React.MouseEvent) => void
}

export function OrderTableRow({
  pedido,
  filamentos,
  onSelectPedido,
  onCambiarEstado,
  onTogglePostventa,
  onQuickAssignBox
}: OrderTableRowProps) {
  const consolidatedItems = React.useMemo(() => {
    return consolidateOrderItems(pedido.items, filamentos)
  }, [pedido.items, filamentos])

  const hasPendingPostventa = !pedido.seguimientoPostventa && pedido.estado !== 'CANCELADO'
  const codigoLabel = pedido.codigo?.startsWith('#') ? pedido.codigo : `#${pedido.codigo}`

  return (
    <TableRow
      onClick={() => onSelectPedido(pedido)}
      className="h-18 border-b border-border/60 hover:bg-secondary/35 transition-colors cursor-pointer group"
    >
      {/* 1. PEDIDO (w-[14%] / text-left pl-5) */}
      <TableCell className="w-[14%] pl-5 pr-3 py-3 align-middle overflow-hidden min-w-0 text-left whitespace-normal">
        <div className="flex flex-col items-start min-w-0">
          <span className="font-mono text-xs font-extrabold text-foreground tracking-tight">
            {codigoLabel}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {formatDate(pedido.fecha)}
          </span>
          <span className="text-[10px] font-semibold bg-secondary border border-border/70 text-foreground px-2 py-0.5 rounded-md w-fit mt-1">
            {pedido.canalVenta || 'Directo'}
          </span>
        </div>
      </TableCell>

      {/* 2. CLIENTE (w-[18%] / text-left px-3) */}
      <TableCell className="w-[18%] px-3 py-3 align-middle overflow-hidden min-w-0 text-left whitespace-normal">
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-bold text-foreground leading-snug break-words">
            {pedido.cliente}
          </span>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {pedido.handleSocial && (
              <a
                href={getInstagramUrl(pedido.handleSocial)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mt-0.5 max-w-full"
                title="Abrir perfil de Instagram"
              >
                <InstagramIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="break-all">@{pedido.handleSocial.replace(/^@/, '')}</span>
              </a>
            )}

            {pedido.telefono && (
              <a
                href={getWhatsAppUrl(pedido.telefono, pedido.cliente, pedido.codigo)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-500 hover:underline flex items-center gap-1 mt-0.5 max-w-full"
                title="Escribir por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pedido.telefono}</span>
              </a>
            )}
          </div>
        </div>
      </TableCell>

      {/* 3. PRODUCTOS & FILAMENTOS (w-[22%] / text-left px-3) */}
      <TableCell className="w-[22%] px-3 py-3 align-middle overflow-hidden min-w-0 text-left whitespace-normal">
        <div className="space-y-1.5 min-w-0">
          {consolidatedItems.length > 0 ? (
            <>
              {consolidatedItems.slice(0, 2).map((item) => (
                <div key={item.key} className="text-xs min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="text-xs font-bold text-foreground truncate block"
                      title={item.nombre}
                    >
                      {item.nombre}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground shrink-0 ml-1">
                      ×{item.cantidadTotal}
                    </span>
                  </div>

                  <OrderProductDots colores={item.colores} />
                </div>
              ))}

              {consolidatedItems.length > 2 && (
                <span className="text-[10px] font-semibold text-muted-foreground block">
                  +{consolidatedItems.length - 2} más
                </span>
              )}
            </>
          ) : (
            <span className="text-xs italic text-muted-foreground/60">Sin productos</span>
          )}
        </div>
      </TableCell>

      {/* 4. ENTREGA & DESTINO (w-[18%] / text-left px-3) */}
      <TableCell className="w-[18%] px-3 py-3 align-middle overflow-hidden min-w-0 text-left whitespace-normal">
        <div className="flex flex-col items-start min-w-0">
          {pedido.diaEntregaPrometida ? (
            <div
              className="flex items-center gap-1.5 text-xs font-medium text-foreground truncate max-w-full"
              title={pedido.diaEntregaPrometida}
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{formatDiaPromesaDisplay(pedido.diaEntregaPrometida)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs italic text-muted-foreground/60">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              <span>Sin programar</span>
            </div>
          )}

          {pedido.destinoEnvio && (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate max-w-full"
              title={pedido.destinoEnvio}
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{pedido.destinoEnvio}</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* 5. ESTADO & POSTVENTA (w-[14%] / text-left px-3) */}
      <TableCell
        className="w-[14%] px-3 py-3 align-middle overflow-hidden min-w-0 text-left whitespace-normal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-start min-w-0">
          <OrderStatusBadge
            value={pedido.estado}
            onChange={(nuevoEstado) => onCambiarEstado(pedido.id, nuevoEstado)}
          />

          {/* Indicador de Postventa */}
          {hasPendingPostventa ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePostventa(pedido.id, true, e)
              }}
              className="text-amber-700 dark:text-amber-400 text-[10px] font-medium flex items-center gap-1 mt-1 hover:underline cursor-pointer truncate max-w-full"
              title="Postventa pendiente. Clic para marcar como realizada."
            >
              <Clock className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Postventa pend.</span>
            </button>
          ) : pedido.seguimientoPostventa ? (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              <span>Postventa realizada</span>
            </span>
          ) : null}
        </div>
      </TableCell>

      {/* 6. TOTAL & BALANCE (w-[14%] / text-right pr-5) */}
      <TableCell className="w-[14%] pl-3 pr-5 py-3 align-middle overflow-hidden min-w-0 text-right whitespace-normal">
        <div className="flex flex-col items-end gap-0.5 min-w-0">
          <span className="font-mono text-sm font-extrabold text-foreground text-right">
            {formatCurrency(pedido.total)}
          </span>

          {pedido.saldoPendiente > 0 ? (
            <span className="font-mono text-xs font-bold text-destructive text-right">
              Pendiente: S/ {pedido.saldoPendiente.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 text-right">
              ✓ Saldado
            </span>
          )}

          {/* Badge de Packaging / Cajas Asignadas */}
          {pedido.totalCajas && pedido.totalCajas > 0 ? (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium text-right flex-wrap justify-end">
              <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-mono">
                📦 {pedido.totalCajas} {pedido.totalCajas === 1 ? 'caja' : 'cajas'}
              </span>
              {pedido.utilidadNetaReal !== undefined && (
                <span className="text-[10px] text-muted-foreground font-mono" title="Utilidad neta estimada">
                  Neto: S/ {pedido.utilidadNetaReal.toFixed(1)}
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (onQuickAssignBox) onQuickAssignBox(pedido.id, e)
              }}
              className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              title="Asignar 1 caja del stock para calcular neto"
            >
              <span>+ 📦 Caja</span>
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
