'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  DollarSign, 
  ArrowRight,
  PackageCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatCurrency, formatClienteNombre } from '@/lib/utils'

interface ImmediateActionQueueProps {
  pedidos: any[]
  onOpenClienteDrawer?: (cliente: string) => void
}

export function ImmediateActionQueue({ pedidos = [], onOpenClienteDrawer }: ImmediateActionQueueProps) {
  const [showPostventa, setShowPostventa] = useState(false)
  const todayStr = new Date().toISOString().split('T')[0]

  // a) "Cobros Pre-Despacho": Pedidos en estado LISTO_ENTREGA (o EMPAQUETANDO) con saldoPendiente > 0
  const pedidosCobroPreDespacho = pedidos.filter(p => {
    const isReady = p.estado === 'LISTO_ENTREGA' || p.estado === 'EMPAQUETANDO'
    const hasDebt = Number(p.saldoPendiente || 0) > 0.05
    return isReady && hasDebt
  })

  // b) "Riesgo de SLA Hoy": Pedidos cuya fecha de entrega prometida es hoy o ya venció y siguen en PENDIENTE o EN_TALLER
  const pedidosRiesgoSlaHoy = pedidos.filter(p => {
    const inProgress = p.estado === 'PENDIENTE' || p.estado === 'EN_TALLER' || p.estado === 'EN_PRODUCCION'
    if (!inProgress) return false
    if (!p.diaEntregaPrometida) return false
    const entregaDate = String(p.diaEntregaPrometida).split('T')[0]
    return entregaDate <= todayStr
  })

  // c) "Postventa del Día": Pedidos entregados con seguimiento pendiente para hoy o vencido
  const pedidosPostventaDia = pedidos.filter(p => {
    if (p.estado !== 'ENTREGADO') return false
    if (!p.seguimientoPostventa) return false
    if (!p.fechaPostventa) return true
    const postventaDate = String(p.fechaPostventa).split('T')[0]
    return postventaDate <= todayStr
  })

  const hasUrgentActions = pedidosCobroPreDespacho.length > 0 || pedidosRiesgoSlaHoy.length > 0

  const getWhatsAppCobroUrl = (p: any) => {
    const cleanPhone = (p.telefono || '').replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`
    const saldo = Number(p.saldoPendiente || 0).toFixed(2)
    const text = encodeURIComponent(
      `¡Hola ${formatClienteNombre(p.cliente)}! Te escribimos de NOVA Studio. Tu pedido #${p.codigo} ya está listo para despacho 📦.\n\nEl saldo pendiente a cancelar es de S/ ${saldo}. Por favor compártenos la constancia de pago para coordinar la entrega. ¡Muchas gracias!`
    )
    return `https://wa.me/${fullPhone}?text=${text}`
  }

  const getWhatsAppPostventaUrl = (p: any) => {
    const cleanPhone = (p.telefono || '').replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`
    const text = encodeURIComponent(
      `¡Hola ${formatClienteNombre(p.cliente)}! Te escribimos de NOVA Studio para consultar si recibiste tu pedido #${p.codigo} en óptimas condiciones. ¿Qué te pareció el acabado de las piezas? 🚀 Agradeceríamos mucho tu reseña.`
    )
    return `https://wa.me/${fullPhone}?text=${text}`
  }

  // ESTADO 1: Operaciones 100% al día (Sin urgencias de cobro ni SLA)
  if (!hasUrgentActions) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-3 text-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-foreground">Operaciones al día:</span>
            <span className="text-muted-foreground">Sin cobros retenidos ni entregas vencidas.</span>
          </div>

          <div className="flex items-center gap-3">
            {pedidosPostventaDia.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPostventa(!showPostventa)}
                className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>{pedidosPostventaDia.length} postventas pendientes</span>
                {showPostventa ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            <Link
              href="/pedidos"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Pedidos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Panel Colapsable de Postventa si el usuario lo activa */}
        {showPostventa && pedidosPostventaDia.length > 0 && (
          <div className="pt-2 border-t border-border/60 space-y-1.5 animate-in fade-in duration-200">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
              Clientes para solicitar reseña / validar satisfacción:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {pedidosPostventaDia.map(p => (
                <div 
                  key={p.id}
                  className="p-2 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpenClienteDrawer?.(p.cliente)}
                      className="font-mono font-semibold text-foreground text-left block truncate hover:text-primary transition-colors cursor-pointer text-xs"
                    >
                      #{p.codigo} • {formatClienteNombre(p.cliente)}
                    </button>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {p.notasPostventa || 'Entregado'}
                    </span>
                  </div>

                  {p.telefono && (
                    <a
                      href={getWhatsAppPostventaUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-medium inline-flex items-center gap-1 shrink-0"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                      <span>Reseña</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ESTADO 2: Hay acciones urgentes (Cobros pre-despacho o SLA en riesgo)
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-950/10 p-3.5 text-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <h3 className="font-semibold text-foreground">Acción Requerida Hoy</h3>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {pedidosCobroPreDespacho.length + pedidosRiesgoSlaHoy.length} prioridades
          </span>
        </div>

        <Link
          href="/pedidos"
          className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <span>Ver bandeja completa</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* A. Cobros Pre-Despacho (Solo si > 0) */}
        {pedidosCobroPreDespacho.length > 0 && (
          <div className="rounded-lg border border-destructive/25 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1 text-destructive">
                <DollarSign className="w-3.5 h-3.5" />
                Cobro Pre-Despacho ({pedidosCobroPreDespacho.length})
              </span>
              <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                Retener Despacho
              </span>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {pedidosCobroPreDespacho.map((p) => (
                <div 
                  key={p.id}
                  className="p-2 rounded-md bg-muted/30 border border-border/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpenClienteDrawer?.(p.cliente)}
                      className="font-mono font-semibold text-foreground text-left block truncate hover:text-primary transition-colors cursor-pointer text-xs"
                    >
                      #{p.codigo} • {formatClienteNombre(p.cliente)}
                    </button>
                    <span className="text-[11px] text-destructive font-mono font-semibold block mt-0.5 tabular-nums">
                      Debe {formatCurrency(Number(p.saldoPendiente || 0))}
                    </span>
                  </div>

                  {p.telefono && (
                    <a
                      href={getWhatsAppCobroUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                      <span>Cobrar</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* B. Riesgo de SLA Hoy (Solo si > 0) */}
        {pedidosRiesgoSlaHoy.length > 0 && (
          <div className="rounded-lg border border-amber-500/25 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                Entrega para Hoy / Vencidos ({pedidosRiesgoSlaHoy.length})
              </span>
              <span className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Prioridad Taller
              </span>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {pedidosRiesgoSlaHoy.map((p) => {
                const isDelayed = String(p.diaEntregaPrometida).split('T')[0] < todayStr
                return (
                  <div 
                    key={p.id}
                    className="p-2 rounded-md bg-muted/30 border border-border/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onOpenClienteDrawer?.(p.cliente)}
                        className="font-mono font-semibold text-foreground text-left block truncate hover:text-primary transition-colors cursor-pointer text-xs"
                      >
                        #{p.codigo} • {formatClienteNombre(p.cliente)}
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className={isDelayed ? 'text-destructive font-semibold' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                          {isDelayed ? '⚠️ Vencido' : '📅 Hoy'}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[9px] font-medium px-1 rounded bg-secondary">
                          {p.estado}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/pedidos?search=${encodeURIComponent(p.codigo)}`}
                      className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-medium shrink-0"
                    >
                      Abrir
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
