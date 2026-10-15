'use client'

import { useState, useEffect } from 'react'
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
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { getClienteDetalle, ClienteDetalleView } from '@/actions/clientes'

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

function getInitials(name: string) {
  if (!name) return 'CL'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatClienteNombre(name: string) {
  if (!name) return 'Cliente'
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
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
}

export function ClienteDetalleDrawer({
  isOpen,
  onClose,
  clienteNombre
}: ClienteDetalleDrawerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState<ClienteDetalleView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg bg-background p-0 border-l border-border flex flex-col z-50 overflow-hidden"
      >
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-border/70 flex items-center justify-between gap-3 bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(clienteNombre || 'Cliente')}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base font-extrabold text-foreground truncate">
                {clienteNombre ? formatClienteNombre(clienteNombre) : 'Detalle del Cliente'}
              </SheetTitle>
              <p className="text-xs text-muted-foreground truncate">
                Estado de cuenta e historial comercial
              </p>
            </div>
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

              {/* Métricas Financieras (Grid de 3 Bloques) */}
              <div className="grid grid-cols-3 gap-2.5 bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    LTV Total
                  </span>
                  <span className="text-sm font-black font-mono text-foreground mt-0.5 block tabular-nums">
                    {formatCurrency(detalle.totalComprado)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Cobrado
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-800 dark:text-emerald-300 mt-0.5 block tabular-nums">
                    {formatCurrency(detalle.totalPagado)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Saldo
                  </span>
                  <span className={`text-sm font-black font-mono mt-0.5 block tabular-nums ${
                    detalle.saldoPendiente > 0 ? 'text-destructive' : 'text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {detalle.saldoPendiente > 0 ? formatCurrency(detalle.saldoPendiente) : 'S/ 0.00'}
                  </span>
                </div>
              </div>

              {/* Alerta de Deuda si existe saldo pendiente */}
              {detalle.saldoPendiente > 0 ? (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-destructive block">Cuenta con saldo pendiente</span>
                    <p className="text-destructive/90 mt-0.5">
                      Este cliente debe {formatCurrency(detalle.saldoPendiente)}. Verifica sus comprobantes antes de iniciar nueva producción.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span className="font-semibold">Cliente 100% al día en sus pagos</span>
                </div>
              )}

              {/* Botón "+ Crear Pedido" */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push(`/pedidos?cliente=${encodeURIComponent(detalle.nombre)}`)
                }}
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Crear Pedido para {formatClienteNombre(detalle.nombre)}</span>
              </button>

              {/* Notas del cliente si existen */}
              {detalle.notas && (
                <div className="p-3 bg-secondary border border-border/70 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider">
                    Notas / Preferencias:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{detalle.notas}</p>
                </div>
              )}

              {/* Historial de Pedidos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    <span>Historial de Pedidos ({detalle.pedidos.length})</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {detalle.piezasCount} piezas en total
                  </span>
                </div>

                {detalle.pedidos.length === 0 ? (
                  <div className="p-6 text-center bg-card border border-border/70 rounded-xl text-xs text-muted-foreground italic">
                    Sin pedidos registrados para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalle.pedidos.map((p) => {
                      const fechaStr = p.fecha ? p.fecha.split('T')[0] : ''
                      return (
                        <div
                          key={p.id}
                          className="p-3.5 bg-card border border-border/70 rounded-xl space-y-2 hover:border-primary/40 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">{p.codigo}</span>
                              <span className="text-[11px] text-muted-foreground">{fechaStr}</span>
                            </div>
                            <span className="font-mono font-extrabold text-foreground">
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
