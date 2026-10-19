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
      onClick={() => onSelectPedido(pedido)}
      className="p-3.5 sm:p-4 bg-card rounded-2xl border border-border/80 shadow-2xs hover:border-primary/50 transition-all cursor-pointer space-y-3"
    >
      {/* 1. Header: Código, Canal, Fecha y Estado interactivo */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-black text-foreground tracking-tight">
              {codigoLabel}
            </span>
            <span className="text-[10px] font-semibold bg-secondary border border-border/70 text-foreground px-2 py-0.5 rounded-md">
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
        <span className="text-sm font-bold text-foreground leading-snug truncate max-w-[220px]">
          {pedido.cliente}
        </span>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {pedido.handleSocial && (
            <a
              href={getInstagramUrl(pedido.handleSocial)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-lg border border-border/60 transition-colors"
              title={`Abrir perfil @${pedido.handleSocial.replace(/^@/, '')}`}
            >
              <InstagramIcon className="h-3 w-3 text-primary shrink-0" />
              <span>@{pedido.handleSocial.replace(/^@/, '')}</span>
            </a>
          )}

          {pedido.telefono && (
            <a
              href={getWhatsAppUrl(pedido.telefono, pedido.cliente, codigoLabel)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition-colors"
              title="Abrir chat de WhatsApp"
            >
              <MessageCircle className="h-3 w-3 fill-emerald-600 text-emerald-600 shrink-0" />
              <span>{pedido.telefono}</span>
            </a>
          )}
        </div>
      </div>

      {/* 3. Productos del Pedido y Filamentos */}
      <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
          <span className="flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-primary" />
            <span>Productos ({totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'})</span>
          </span>
          <span className="text-[10px] font-mono">{consolidatedItems.length} {consolidatedItems.length === 1 ? 'modelo' : 'modelos'}</span>
        </div>

        <div className="space-y-1">
          {consolidatedItems.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[11px] font-bold text-foreground shrink-0">
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
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-md font-medium text-[11px]">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>{formatDiaPromesaDisplay(pedido.diaEntregaPrometida)}</span>
          </span>
        )}

        {pedido.destinoEnvio && (
          <span className="inline-flex items-center gap-1 bg-secondary text-foreground border border-border/70 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[200px]">
            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="truncate">{pedido.destinoEnvio}</span>
          </span>
        )}

        {/* Caja de Empaque */}
        <div onClick={(e) => e.stopPropagation()} className="ml-auto">
          {cajasCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-accent text-accent-foreground border border-border/70 px-2 py-0.5 rounded-md">
              <Package className="w-3 h-3" />
              <span>{cajasCount} {cajasCount === 1 ? 'caja' : 'cajas'}</span>
            </span>
          ) : (
            onQuickAssignBox && (
              <button
                type="button"
                onClick={(e) => onQuickAssignBox(pedido.id, e)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
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
      <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-black text-foreground">
            {formatCurrency(pedido.total)}
          </span>

          {pedido.saldoPendiente > 0 ? (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 text-[10px] font-bold">
              Resta {formatCurrency(pedido.saldoPendiente)}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold">
              100% Pagado
            </Badge>
          )}
        </div>

        {/* Toggle Postventa */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <button
            type="button"
            onClick={(e) => onTogglePostventa(pedido.id, !pedido.seguimientoPostventa, e)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              hasPendingPostventa
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 shadow-2xs hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15'
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
