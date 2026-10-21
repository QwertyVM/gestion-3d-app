'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { 
  Users, 
  Phone, 
  MessageCircle, 
  ShoppingBag, 
  Package, 
  Plus, 
  ExternalLink, 
  X,
  Pencil,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Crown,
  Sparkles,
  Clock,
  Send
} from 'lucide-react'
import { getClienteDetalle, ClienteDetalleView } from '@/actions/clientes'
import { formatCurrency, getInitials, formatClienteNombre } from '@/lib/utils'

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

function getWhatsAppUrl(phone: string, nombre: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`
  const text = encodeURIComponent(`¡Hola ${formatClienteNombre(nombre)}! Te escribimos desde el taller de impresión 3D NOVA.`)
  return `https://wa.me/${fullPhone}?text=${text}`
}

interface ClienteDetalleDrawerProps {
  isOpen: boolean
  onClose: () => void
  clienteNombre: string | null
  onEdit?: (detalle: ClienteDetalleView) => void
}

export function ClienteDetalleDrawer({
  isOpen,
  onClose,
  clienteNombre,
  onEdit
}: ClienteDetalleDrawerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState<ClienteDetalleView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !clienteNombre) {
      setDetalle(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    getClienteDetalle(clienteNombre)
      .then((res) => {
        if (isMounted) {
          if (res) {
            setDetalle(res)
          } else {
            setError(`No se encontraron registros para "${clienteNombre}"`)
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error al cargar información del cliente')
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, clienteNombre])

  // Análisis RFM y Disparador de Reactivación
  const rfm = useMemo(() => {
    if (!detalle) return null

    const ordersCount = detalle.pedidos ? detalle.pedidos.length : (detalle.pedidosCount || 0)
    const lastOrderDate = (detalle.pedidos && detalle.pedidos.length > 0)
      ? detalle.pedidos[0].fecha
      : detalle.ultimoPedidoFecha

    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const ltv = detalle.totalComprado || 0

    let segmento: 'VIP' | 'CHURN_RISK' | 'NUEVO' | 'REGULAR' | 'INACTIVO' = 'REGULAR'
    let label = 'Cliente Regular'
    let badgeClass = 'bg-secondary text-foreground border-border'
    let Icon = ShoppingBag
    let mensajeReactivacion = ''

    if (ordersCount >= 3 && daysSinceLastOrder !== null && daysSinceLastOrder < 30) {
      segmento = 'VIP'
      label = '⭐ Cliente VIP Frecuente'
      badgeClass = 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30 font-bold'
      Icon = Crown
      mensajeReactivacion = `¡Hola ${formatClienteNombre(detalle.nombre)}! Te escribimos de NOVA Studio. Por ser cliente VIP frecuente ⭐, te avisamos que tenemos nuevos colores y prioridad en taller. ¿Tienes algún modelo en mente para estos días?`
    } else if (ordersCount >= 2 && daysSinceLastOrder !== null && daysSinceLastOrder > 60) {
      segmento = 'CHURN_RISK'
      label = '⚠️ En Riesgo de Churn'
      badgeClass = 'bg-rose-500/15 text-rose-900 dark:text-rose-200 border-rose-500/30 font-bold'
      Icon = AlertTriangle
      mensajeReactivacion = `¡Hola ${formatClienteNombre(detalle.nombre)}! Te escribimos de NOVA Studio. Ya pasó un tiempo desde tus pedidos anteriores. Acabamos de incorporar nuevos filamentos y modelos en catálogo. ¿Te gustaría ver las novedades?`
    } else if (ordersCount === 1 && daysSinceLastOrder !== null && daysSinceLastOrder <= 30) {
      segmento = 'NUEVO'
      label = 'Nuevo / Prometedor'
      badgeClass = 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30'
      Icon = Sparkles
      mensajeReactivacion = `¡Hola ${formatClienteNombre(detalle.nombre)}! Gracias por confiar en NOVA Studio para tu pedido. ¿Cómo quedó tu pieza 3D? Recuerda que podemos cotizar cualquier nuevo proyecto cuando gustes.`
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 90) {
      segmento = 'INACTIVO'
      label = 'Inactivo (>90 días)'
      badgeClass = 'bg-muted text-muted-foreground border-border'
      Icon = Clock
      mensajeReactivacion = `¡Hola ${formatClienteNombre(detalle.nombre)}! Te saludamos de NOVA Studio. Esperamos que todo vaya excelente. Estamos agendando impresiones para este mes, ¿tienes algún proyecto que te gustaría cotizar?`
    }

    const smartBadge = (segmento === 'VIP' || segmento === 'CHURN_RISK') ? {
      type: segmento,
      label,
      badgeClass,
      mensaje: mensajeReactivacion
    } : null

    return {
      daysSinceLastOrder,
      ordersCount,
      ltv,
      segmento,
      label,
      badgeClass,
      Icon,
      mensajeReactivacion,
      smartBadge
    }
  }, [detalle])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg bg-background p-0 border-l border-border/60 flex flex-col z-50 overflow-hidden"
      >
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between gap-3 bg-card/95 backdrop-blur-xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-muted text-foreground border border-border/60 font-medium text-xs flex items-center justify-center shrink-0">
              {getInitials(clienteNombre || 'Cliente')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base font-semibold text-foreground tracking-tight truncate">
                  {clienteNombre ? formatClienteNombre(clienteNombre) : 'Detalle del Cliente'}
                </SheetTitle>

                {rfm?.smartBadge && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${rfm.smartBadge.badgeClass}`}>
                    {rfm.smartBadge.label}
                  </span>
                )}

                {rfm?.smartBadge && detalle?.telefono && (
                  <a
                    href={`https://wa.me/${detalle.telefono.replace(/\D/g, '').startsWith('51') ? detalle.telefono.replace(/\D/g, '') : `51${detalle.telefono.replace(/\D/g, '')}`}?text=${encodeURIComponent(rfm.smartBadge.mensaje)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer shrink-0"
                    title="Reactivar cliente por WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Reactivar</span>
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Estado de cuenta e historial comercial
                {rfm?.daysSinceLastOrder !== null && rfm?.daysSinceLastOrder !== undefined && (
                  <span className="font-mono ml-1.5 text-[11px] tabular-nums">
                    • Último pedido hace {rfm.daysSinceLastOrder} {rfm.daysSinceLastOrder === 1 ? 'día' : 'días'} ({rfm.ordersCount} {rfm.ordersCount === 1 ? 'pedido' : 'pedidos'})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && detalle && (
              <button
                type="button"
                onClick={() => onEdit(detalle)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 flex items-center justify-center transition-colors cursor-pointer"
                title="Editar datos del cliente"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4.5">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground italic space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Cargando información y pedidos del cliente...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center">
              {error}
            </div>
          ) : detalle ? (
            <>
              {/* Canales y Contactos */}
              <div className="flex flex-wrap items-center gap-2">
                {detalle.handleSocial && (
                  <a
                    href={`https://instagram.com/${detalle.handleSocial.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary border border-border text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <InstagramIcon className="h-3 w-3 text-primary" />
                    <span>@{detalle.handleSocial.replace(/^@/, '')}</span>
                  </a>
                )}

                {detalle.telefono && (
                  <a
                    href={getWhatsAppUrl(detalle.telefono, detalle.nombre)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                    <span>{detalle.telefono}</span>
                  </a>
                )}

                {detalle.canalPreferido && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-muted-foreground border border-border">
                    <span>Canal: {detalle.canalPreferido}</span>
                  </span>
                )}
              </div>

              {/* Tarjeta de Segmentación RFM & Reactivación WhatsApp */}
              {rfm && (
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${rfm.badgeClass}`}>
                      <rfm.Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{rfm.label}</span>
                    </span>

                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {rfm.daysSinceLastOrder !== null
                        ? `Último pedido: hace ${rfm.daysSinceLastOrder} ${rfm.daysSinceLastOrder === 1 ? 'día' : 'días'}`
                        : 'Sin pedidos previos'}
                    </span>
                  </div>

                  {detalle.telefono && rfm.mensajeReactivacion && (
                    <div className="pt-1">
                      <a
                        href={`https://wa.me/${detalle.telefono.replace(/\D/g, '').startsWith('51') ? detalle.telefono.replace(/\D/g, '') : `51${detalle.telefono.replace(/\D/g, '')}`}?text=${encodeURIComponent(rfm.mensajeReactivacion)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        <span>Reactivar Cliente por WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Métricas Financieras (Grid de 3 Bloques) */}
              <div className="grid grid-cols-3 gap-2.5 bg-muted/20 border border-border/50 rounded-xl p-3.5 shadow-none">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                    LTV Total
                  </span>
                  <span className="text-sm font-semibold font-mono text-foreground mt-0.5 block tabular-nums tracking-tight">
                    {formatCurrency(detalle.totalComprado)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Cobrado
                  </span>
                  <span className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block tabular-nums tracking-tight">
                    {formatCurrency(detalle.totalPagado)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Saldo
                  </span>
                  <span className={`text-sm font-semibold font-mono mt-0.5 block tabular-nums tracking-tight ${
                    detalle.saldoPendiente > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {detalle.saldoPendiente > 0 ? formatCurrency(detalle.saldoPendiente) : 'S/ 0.00'}
                  </span>
                </div>
              </div>

              {/* Alerta de Deuda si existe saldo pendiente */}
              {detalle.saldoPendiente > 0 ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-medium text-rose-600 dark:text-rose-400 block">Cuenta con saldo pendiente</span>
                    <p className="text-rose-600/90 dark:text-rose-400/90 mt-0.5">
                      Este cliente debe {formatCurrency(detalle.saldoPendiente)}. Verifica sus comprobantes antes de iniciar nueva producción.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-medium">Cliente 100% al día en sus pagos</span>
                </div>
              )}

              {/* Botón "+ Crear Pedido" */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push(`/pedidos?cliente=${encodeURIComponent(detalle.nombre)}`)
                }}
                className="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Crear Pedido para {formatClienteNombre(detalle.nombre)}</span>
              </button>

              {/* Notas del cliente si existen */}
              {detalle.notas && (
                <div className="p-3 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-1">
                  <span className="font-medium text-foreground block uppercase text-[10px] tracking-wider">
                    Notas / Preferencias:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{detalle.notas}</p>
                </div>
              )}

              {/* Historial de Pedidos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Historial de Pedidos ({detalle.pedidos.length})</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {detalle.piezasCount} piezas en total
                  </span>
                </div>

                {detalle.pedidos.length === 0 ? (
                  <div className="p-6 text-center bg-card border border-border/60 rounded-xl text-xs text-muted-foreground italic">
                    Sin pedidos registrados para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalle.pedidos.map((p) => {
                      const fechaStr = p.fecha ? p.fecha.split('T')[0] : ''
                      return (
                        <div
                          key={p.id}
                          className="p-3.5 bg-card border border-border/60 rounded-xl space-y-2 hover:border-border transition-colors shadow-none"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-foreground">{p.codigo}</span>
                              <span className="text-[11px] text-muted-foreground">{fechaStr}</span>
                            </div>
                            <span className="font-mono font-semibold text-foreground tabular-nums tracking-tight">
                              {formatCurrency(p.total)}
                            </span>
                          </div>

                          {/* Items del pedido */}
                          {p.items && p.items.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-border/50 text-[11px]">
                              {p.items.map((it, itIdx) => (
                                <div key={itIdx} className="flex items-center justify-between text-muted-foreground">
                                  <span className="truncate pr-2">
                                    {it.cantidad}x {it.nombre}
                                  </span>
                                  <span className="font-mono shrink-0">
                                    {formatCurrency(it.subtotal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Estado de pago del pedido */}
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-muted-foreground">
                              {p.canalVenta ? `Vía ${p.canalVenta}` : 'Venta directa'}
                            </span>
                            {p.saldoPendiente > 0 ? (
                              <span className="font-bold text-destructive">
                                Debe {formatCurrency(p.saldoPendiente)}
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                Pagado 100%
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
