'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Hammer, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  DollarSign,
  CircleDot
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
  const [showDrawer, setShowDrawer] = useState<'postventa' | 'urgencias' | null>(null)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 1. Conteo de piezas por estado en taller 3D
  const { piezasPendientes, piezasEnProduccion, piezasListas, totalPiezasActivas } = useMemo(() => {
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
      piezasListas: listas,
      totalPiezasActivas: pendientes + enProduccion + listas
    }
  }, [pedidos])

  // 2. Alertas de filamentos comprometidos
  const { quiebresCount, criticosCount } = useMemo(() => {
    if (!is3D || !filamentos.length) {
      return { quiebresCount: 0, criticosCount: 0 }
    }

    const demandaPorColor: Record<string, number> = {}

    pedidos.forEach(p => {
      if (p.estado === 'ENTREGADO' || p.estado === 'CANCELADO' || p.estado === 'LISTO_ENTREGA') return

      if (Array.isArray(p.items) && p.items.length > 0) {
        p.items.forEach((item: any) => {
          const st = item.estado || p.estado
          if (st === 'ENTREGADO' || st === 'CANCELADO' || st === 'LISTO_ENTREGA') return

          const gramos = Number(item.pesoGramos || item.gramosPorUnidad || 0) * Math.max(1, Number(item.cantidad || 1))
          const colorKey = (item.color || item.nombreColor || 'Desconocido').toLowerCase().trim()
          if (gramos > 0) {
            demandaPorColor[colorKey] = (demandaPorColor[colorKey] || 0) + gramos
          }
        })
      } else {
        const gramos = Number(p.pesoGramos || 0)
        const colorKey = (p.color || 'Desconocido').toLowerCase().trim()
        if (gramos > 0) {
          demandaPorColor[colorKey] = (demandaPorColor[colorKey] || 0) + gramos
        }
      }
    })

    let quiebres = 0
    let criticos = 0

    filamentos.forEach(f => {
      const colorKey = (f.nombreColor || '').toLowerCase().trim()
      const stockActual = Number(f.stockGramosActual || 0)
      const demanda = demandaPorColor[colorKey] || 0
      const stockNetoProyectado = stockActual - demanda

      if (demanda > 0 && stockNetoProyectado < 0) {
        quiebres++
      } else if (demanda > 0 && stockNetoProyectado < 150) {
        criticos++
      }
    })

    return {
      quiebresCount: quiebres,
      criticosCount: criticos
    }
  }, [pedidos, filamentos, is3D])

  // 3. Triage Logístico y Cobranza Pre-Despacho
  const pedidosCobroPreDespacho = useMemo(() => {
    return pedidos.filter(p => {
      const isReady = p.estado === 'LISTO_ENTREGA' || p.estado === 'EMPAQUETANDO'
      const hasDebt = Number(p.saldoPendiente || 0) > 0.05
      return isReady && hasDebt
    })
  }, [pedidos])

  const pedidosRiesgoSlaHoy = useMemo(() => {
    return pedidos.filter(p => {
      const inProgress = p.estado === 'PENDIENTE' || p.estado === 'EN_TALLER' || p.estado === 'EN_PRODUCCION'
      if (!inProgress) return false
      if (!p.diaEntregaPrometida) return false
      const entregaDate = String(p.diaEntregaPrometida).split('T')[0]
      return entregaDate <= todayStr
    })
  }, [pedidos, todayStr])

  // 4. Seguimiento Postventa: Pedidos entregados con ventana activa de contacto (últimos 7 días)
  const pedidosPostventaDia = useMemo(() => {
    const now = new Date()
    const ventanaReciente = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return pedidos.filter(p => {
      if (p.estado !== 'ENTREGADO') return false
      if (!p.seguimientoPostventa) return false
      const postventaDate = p.fechaPostventa 
        ? String(p.fechaPostventa).split('T')[0] 
        : (p.fecha ? String(p.fecha).split('T')[0] : null)
      if (!postventaDate) return false
      return postventaDate >= ventanaReciente && postventaDate <= todayStr
    })
  }, [pedidos, todayStr])

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

  return (
    <div className={cn('bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs transition-all', className)}>
      {/* ========================================================================= */}
      {/* CINTA PRINCIPAL: 1 SOLA LÍNEA HORIZONTAL ELEGANTE Y COMPACTA (~42px)      */}
      {/* ========================================================================= */}
      <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs select-none">
        
        {/* BLOQUE IZQUIERDO: ESTADO DE FABRICACIÓN 3D */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 text-foreground">
              <Hammer className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-foreground text-xs whitespace-nowrap">
              Taller 3D
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Imprimiendo */}
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>{piezasEnProduccion} imprimiendo</span>
            </span>

            {/* En Cola */}
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>{piezasPendientes} en cola</span>
            </span>

            {/* Listas para entrega */}
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              <span>{piezasListas} p/ despacho</span>
            </span>

            {/* Estado de Filamento */}
            {quiebresCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/25 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3" />
                <span>{quiebresCount} quiebres</span>
              </span>
            ) : criticosCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                <CircleDot className="w-3 h-3" />
                <span>{criticosCount} stock bajo</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium px-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">Filamentos OK</span>
              </span>
            )}
          </div>
        </div>

        {/* SEPARADOR VERTICAL DESKTOP */}
        <div className="hidden lg:block h-4 w-px bg-border/60 mx-1 shrink-0" />

        {/* BLOQUE DERECHO: SALUD OPERATIVA, POSTVENTA Y ACCIONES RÁPIDAS */}
        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap shrink-0">
          
          {/* Indicador de Operaciones / Alertas Urgentes */}
          {hasUrgentActions ? (
            <button
              type="button"
              onClick={() => setShowDrawer(showDrawer === 'urgencias' ? null : 'urgencias')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-md cursor-pointer hover:bg-amber-500/20 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{pedidosCobroPreDespacho.length + pedidosRiesgoSlaHoy.length} prioridades hoy</span>
              {showDrawer === 'urgencias' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-foreground">Operaciones al día</span>
              <span className="text-muted-foreground/50 hidden xl:inline">•</span>
              <span className="text-[11px] text-muted-foreground hidden xl:inline">sin cobros retenidos</span>
            </div>
          )}

          {/* Trigger de Postventa */}
          {pedidosPostventaDia.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDrawer(showDrawer === 'postventa' ? null : 'postventa')}
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer',
                showDrawer === 'postventa'
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold'
                  : 'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10'
              )}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>{pedidosPostventaDia.length} postventas</span>
              {showDrawer === 'postventa' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Botones de Navegación Minimalistas */}
          <div className="flex items-center gap-1 pl-1 border-l border-border/50">
            {is3D && (
              <Link
                href="/taller"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-foreground hover:bg-secondary/80 text-[11px] font-semibold transition-colors"
              >
                <span>Taller</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <Link
              href="/pedidos"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
            >
              <span>Pedidos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL DESPLEGABLE INLINE: POSTVENTA O TRIAGE DE URGENCIAS                 */}
      {/* ========================================================================= */}
      {showDrawer === 'postventa' && pedidosPostventaDia.length > 0 && (
        <div className="border-t border-border/60 p-3 sm:p-4 bg-muted/15 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
              Seguimiento de satisfacción y reseñas recientes ({pedidosPostventaDia.length} clientes)
            </span>
            <button
              type="button"
              onClick={() => setShowDrawer(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-medium"
            >
              Cerrar panel ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {pedidosPostventaDia.map(p => (
              <div 
                key={p.id}
                className="p-2 rounded-lg bg-card border border-border/60 flex items-center justify-between gap-2 shadow-2xs"
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
                    className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-semibold inline-flex items-center gap-1 shrink-0"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showDrawer === 'urgencias' && hasUrgentActions && (
        <div className="border-t border-border/60 p-3 sm:p-4 bg-muted/15 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Acciones Inmediatas Requeridas ({pedidosCobroPreDespacho.length + pedidosRiesgoSlaHoy.length})
            </span>
            <button
              type="button"
              onClick={() => setShowDrawer(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-medium"
            >
              Cerrar panel ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Cobros Pre-Despacho */}
            {pedidosCobroPreDespacho.length > 0 && (
              <div className="rounded-xl border border-destructive/25 bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Cobro Pre-Despacho ({pedidosCobroPreDespacho.length})
                  </span>
                  <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                    Retener
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

            {/* Riesgo de SLA Hoy */}
            {pedidosRiesgoSlaHoy.length > 0 && (
              <div className="rounded-xl border border-amber-500/25 bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
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
      )}
    </div>
  )
}
