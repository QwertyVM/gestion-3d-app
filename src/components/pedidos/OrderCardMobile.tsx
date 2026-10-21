'use client'

import React from 'react'
import {
  Calendar,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  ShoppingBag
} from 'lucide-react'
import { EstadoPedido } from '@prisma/client'
import { PedidoView, FilamentoOption } from './types'
import { consolidateOrderItems, formatCurrency } from './orderUtils'
import { OrderStatusBadge } from './OrderStatusBadge'
import { ColorDot } from './ColorDot'
import { formatDate } from '@/lib/utils'
import { formatDiaPromesaDisplay } from '@/lib/date-utils'
import { Badge } from '@/components/ui/badge'

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

export interface OrderCardMobileProps {
  pedido: PedidoView
  filamentos: FilamentoOption[]
  onSelectPedido: (p: PedidoView) => void
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void | Promise<void>
  onTogglePostventa: (id: string, nuevoEstado: boolean, e?: React.MouseEvent) => void
  onQuickAssignBox?: (pedidoId: string, e: React.MouseEvent) => void
}

export function OrderCardMobile({
  pedido,
  filamentos,
  onSelectPedido,
  onCambiarEstado,
  onTogglePostventa,
  onQuickAssignBox
}: OrderCardMobileProps) {
  const consolidatedItems = React.useMemo(() => {
    return consolidateOrderItems(pedido.items, filamentos)
  }, [pedido.items, filamentos])

  const hasPendingPostventa = !pedido.seguimientoPostventa && pedido.estado !== 'CANCELADO'
  const codigoLabel = pedido.codigo?.startsWith('#') ? pedido.codigo : `#${pedido.codigo}`
  const totalPiezas = pedido.items.reduce((acc, it) => acc + (it.cantidad || 1), 0)

  // Cajas asociadas
  const cajasCount = Array.isArray(pedido.cajas)
    ? pedido.cajas.reduce((sum, c) => sum + (c.cantidad || 0), 0)
    : 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectPedido(pedido)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectPedido(pedido)
        }
      }}
      className="p-3.5 bg-card rounded-xl border border-border/60 shadow-none hover:border-border transition-colors cursor-pointer space-y-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {/* 1. Header: Código, Canal, Fecha y Estado interactivo */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
              {codigoLabel}
            </span>
            <span className="text-[10px] font-medium bg-muted/60 border border-border/50 text-muted-foreground px-1.5 py-0.5 rounded-md">
              {pedido.canalVenta || 'Directo'}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(pedido.fecha)}
          </span>
        </div>

        {/* Estado interactivo con select/dropdown */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <OrderStatusBadge
            value={pedido.estado}
            onChange={(nuevoEstado) => onCambiarEstado(pedido.id, nuevoEstado)}
          />
        </div>
      </div>

      {/* 2. Cliente y Canales de Contacto Directo */}
      <div className="pt-0.5 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground leading-snug truncate max-w-[220px]">
          {pedido.cliente}
        </span>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {pedido.handleSocial && (
            <a
              href={getInstagramUrl(pedido.handleSocial)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted/40 hover:bg-muted/70 px-2 py-0.5 rounded-md border border-border/50 transition-colors"
              title={`Abrir perfil @${pedido.handleSocial.replace(/^@/, '')}`}
            >
              <InstagramIcon className="h-3 w-3 shrink-0" />
              <span>@{pedido.handleSocial.replace(/^@/, '')}</span>
            </a>
          )}

          {pedido.telefono && (
            <a
              href={getWhatsAppUrl(pedido.telefono, pedido.cliente, codigoLabel)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-border/50 transition-colors flex items-center gap-1"
              title="Abrir chat de WhatsApp"
            >
              <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{pedido.telefono}</span>
            </a>
          )}
        </div>
      </div>

      {/* 3. Productos del Pedido y Filamentos */}
      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-muted-foreground" />
            <span>Productos ({totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'})</span>
          </span>
          <span className="text-[10px] font-mono tabular-nums">{consolidatedItems.length} {consolidatedItems.length === 1 ? 'modelo' : 'modelos'}</span>
        </div>

        <div className="space-y-1">
          {consolidatedItems.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[11px] font-medium text-muted-foreground shrink-0 tabular-nums">
                  {item.cantidadTotal}×
                </span>
                <span className="text-foreground truncate" title={item.nombre}>
                  {item.nombre}
                </span>
              </div>

              {item.colores.length > 0 && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {item.colores.map((col, cIdx) => (
                    <ColorDot key={col.id || cIdx} filamento={col} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {consolidatedItems.length > 3 && (
            <div className="text-[10px] text-muted-foreground font-medium pt-0.5">
              +{consolidatedItems.length - 3} productos más...
            </div>
          )}
        </div>
      </div>

      {/* 4. Entrega, Destino y Packaging */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {pedido.diaEntregaPrometida && (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{formatDiaPromesaDisplay(pedido.diaEntregaPrometida)}</span>
          </span>
        )}

        {pedido.destinoEnvio && (
          <span className="inline-flex items-center gap-1 bg-muted/50 text-foreground border border-border/50 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[200px]">
            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="truncate">{pedido.destinoEnvio}</span>
          </span>
        )}

        {/* Caja de Empaque */}
        <div onClick={(e) => e.stopPropagation()} className="ml-auto">
          {cajasCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/50 px-2 py-0.5 rounded-md font-mono tabular-nums">
              <Package className="w-3 h-3" />
              <span>{cajasCount} {cajasCount === 1 ? 'caja' : 'cajas'}</span>
            </span>
          ) : (
            onQuickAssignBox && (
              <button
                type="button"
                onClick={(e) => onQuickAssignBox(pedido.id, e)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border/50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                title="Asignar caja rápida a este pedido"
              >
                <Plus className="w-3 h-3" />
                <span>+ Caja</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 5. Footer: Totales, Pagos y Postventa */}
      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-foreground tabular-nums tracking-tight">
            {formatCurrency(pedido.total)}
          </span>

          {pedido.saldoPendiente > 0 ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
              Resta {formatCurrency(pedido.saldoPendiente)}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              100% Pagado
            </span>
          )}
        </div>

        {/* Toggle Postventa */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <button
            type="button"
            onClick={(e) => onTogglePostventa(pedido.id, !pedido.seguimientoPostventa, e)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              hasPendingPostventa
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
            }`}
            title={hasPendingPostventa ? 'Marcar seguimiento postventa completado' : 'Seguimiento postventa completado'}
          >
            <Check className={`w-3 h-3 ${hasPendingPostventa ? 'opacity-40' : 'text-emerald-600 stroke-[2.5]'}`} />
            <span>{hasPendingPostventa ? 'Postventa pend.' : 'Postventa OK'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
