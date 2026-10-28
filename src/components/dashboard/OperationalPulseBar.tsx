'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Clock,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn, formatCurrency, formatClienteNombre } from '@/lib/utils'

interface OperationalPulseBarProps {
  pedidos: any[]
  filamentos: any[]
  is3D?: boolean
  onOpenClienteDrawer?: (cliente: string) => void
  className?: string
}

export function OperationalPulseBar({
  pedidos = [],
  filamentos = [],
  is3D = true,
  onOpenClienteDrawer,
  className
}: OperationalPulseBarProps) {
  const [showDrawer, setShowDrawer] = useState<'urgencias' | 'postventa' | null>(null)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 1. Conteo de piezas por estado en taller 3D
  const { piezasPendientes, piezasEnProduccion, piezasListas } = useMemo(() => {
    let pendientes = 0
    let enProduccion = 0
    let listas = 0

    pedidos.forEach(p => {
      if (p.estado === 'ENTREGADO' || p.estado === 'CANCELADO') return

      if (Array.isArray(p.items) && p.items.length > 0) {
        p.items.forEach((item: any) => {
          const qty = Math.max(1, Number(item.cantidad || 1))
          const st = item.estado || p.estado
          if (st === 'EN_PRODUCCION' || st === 'EN_TALLER') {
            enProduccion += qty
          } else if (st === 'LISTO_ENTREGA' || st === 'EMPAQUETANDO') {
            listas += qty
          } else {
            pendientes += qty
          }
        })
      } else {
        const qty = Math.max(1, Number(p.cantidad || 1))
        if (p.estado === 'EN_PRODUCCION' || p.estado === 'EN_TALLER') {
          enProduccion += qty
        } else if (p.estado === 'LISTO_ENTREGA' || p.estado === 'EMPAQUETANDO') {
          listas += qty
        } else {
          pendientes += qty
        }
      }
    })

    return {
      piezasPendientes: pendientes,
      piezasEnProduccion: enProduccion,
      piezasListas: listas
    }
  }, [pedidos])

  // 2. Alertas de filamentos
  const { criticosCount } = useMemo(() => {
    if (!is3D || !filamentos.length) return { criticosCount: 0 }
    let crit = 0
    filamentos.forEach((f: any) => {
      const gramos = Number(f.stockGramos || 0)
      if (f.alertaCritica || (gramos > 0 && gramos < 150)) {
        crit++
      }
    })
    return { criticosCount: crit }
  }, [is3D, filamentos])

  // 3. Tareas que requieren atención
  const pedidosCobroPreDespacho = useMemo(() => {
    return pedidos.filter(p => {
      if (p.estado === 'ENTREGADO' || p.estado === 'CANCELADO') return false
      const saldo = Number(p.saldoPendiente || 0)
      return (p.estado === 'LISTO_ENTREGA' || p.estado === 'EMPAQUETANDO') && saldo > 0
    })
  }, [pedidos])

  const getWhatsAppCobroUrl = (p: any) => {
    const cleanPhone = (p.telefono || '').replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`
    const saldo = Number(p.saldoPendiente || 0).toFixed(2)
    const text = encodeURIComponent(
      `¡Hola ${formatClienteNombre(p.cliente)}! Te escribimos de NOVA Studio. Tu pedido #${p.codigo} ya está listo para despacho 📦.\n\nEl saldo pendiente a cancelar es de S/ ${saldo}. Por favor compártenos la constancia de pago para coordinar la entrega. ¡Muchas gracias!`
    )
    return `https://wa.me/${fullPhone}?text=${text}`
  }

  return (
    <div className={cn('bg-card/70 border border-border/40 rounded-xl overflow-hidden shadow-2xs backdrop-blur-xs transition-all', className)}>
      {/* Cinta Principal en 1 sola línea minimalista */}
      <div className="px-3.5 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Lado Izquierdo: Pulso Taller 3D */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-foreground tracking-tight">Taller 3D:</span>
          
          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px] flex-wrap">
            <span className="text-foreground font-semibold">{piezasEnProduccion} imprimiendo</span>
            <span>·</span>
            <span>{piezasPendientes} en cola</span>
            <span>·</span>
            <span>{piezasListas} p/ entrega</span>
            <span>·</span>
            <span className={criticosCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground'}>
              {criticosCount > 0 ? `${criticosCount} stock bajo` : 'Bobinas OK'}
            </span>
          </div>
        </div>

        {/* Lado Derecho: Acciones Urgentes & Acceso Rápido */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {pedidosCobroPreDespacho.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDrawer(showDrawer === 'urgencias' ? null : 'urgencias')}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{pedidosCobroPreDespacho.length} cobro pendiente</span>
              {showDrawer === 'urgencias' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {is3D && (
            <Link
              href="/taller"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span>Ver taller</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* Drawer de cobro pendiente minimalista */}
      {showDrawer === 'urgencias' && pedidosCobroPreDespacho.length > 0 && (
        <div className="p-3 border-t border-border/30 bg-muted/15 space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Pedidos listos para despacho con saldo por liquidar:</span>
            <button 
              type="button" 
              onClick={() => setShowDrawer(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="space-y-1.5">
            {pedidosCobroPreDespacho.map((p) => (
              <div 
                key={p.id}
                className="p-2 rounded-lg bg-card border border-border/40 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-foreground mr-1.5">{p.codigo}</span>
                  <span className="text-muted-foreground">{p.cliente}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                    Debe {formatCurrency(Number(p.saldoPendiente))}
                  </span>
                  {p.telefono && (
                    <a
                      href={getWhatsAppCobroUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                      title="Enviar WhatsApp de cobro"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
