'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, ShoppingBag, Store, Globe, Sparkles, Layers } from 'lucide-react'

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

function getChannelIcon(canalName: string) {
  const norm = canalName.toLowerCase()
  if (norm.includes('instagram') || norm.includes('ig')) {
    return <InstagramIcon className="h-3.5 w-3.5 text-primary shrink-0" />
  }
  if (norm.includes('whatsapp') || norm.includes('wsp') || norm.includes('chat')) {
    return <MessageCircle className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
  }
  if (norm.includes('tienda') || norm.includes('web') || norm.includes('online')) {
    return <Globe className="h-3.5 w-3.5 text-sky-600 shrink-0" />
  }
  if (norm.includes('feria') || norm.includes('directo') || norm.includes('taller')) {
    return <Store className="h-3.5 w-3.5 text-amber-600 shrink-0" />
  }
  return <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
}

const BAR_COLORS = [
  'bg-primary',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-indigo-600',
  'bg-rose-600',
]

interface SalesMixCardProps {
  ventas: any[]
  ticketPromedio: number
  totalPedidos: number
  className?: string
}

export function SalesMixCard({
  ventas,
  ticketPromedio,
  totalPedidos,
  className = ''
}: SalesMixCardProps) {
  const [viewMode, setViewMode] = useState<'CANALES' | 'CATEGORIAS'>('CANALES')

  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // 1. Desglose comercial por Canal de Venta
  const { canalesData, totalVentasCanales } = useMemo(() => {
    const map: Record<string, { canal: string; total: number; count: number }> = {}
    let total = 0

    ventas.forEach((v) => {
      const rawCanal = (v.canalVenta || 'Directo / Taller').trim()
      let canalKey = rawCanal
      const lower = rawCanal.toLowerCase()
      if (lower.includes('instagram')) canalKey = 'Instagram'
      else if (lower.includes('whatsapp')) canalKey = 'WhatsApp'
      else if (lower.includes('feria')) canalKey = 'Feria'
      else if (lower.includes('tienda') || lower.includes('web')) canalKey = 'Tienda Web'
      else if (lower.includes('directo')) canalKey = 'Directo / Taller'

      const monto = Number(v.total || 0)
      if (!map[canalKey]) {
        map[canalKey] = { canal: canalKey, total: 0, count: 0 }
      }
      map[canalKey].total += monto
      map[canalKey].count += 1
      total += monto
    })

    const sorted = Object.values(map)
      .map((item) => ({
        ...item,
        porcentaje: total > 0 ? (item.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)

    return { canalesData: sorted, totalVentasCanales: total }
  }, [ventas])

  // 2. Desglose comercial por Categoría / Familia de Producto
  const { categoriasData, totalVentasCategorias, totalPiezas } = useMemo(() => {
    const map: Record<string, { categoria: string; total: number; unidades: number }> = {}
    let total = 0
    let piezas = 0

    ventas.forEach((v) => {
      // Si el pedido tiene items desagregados
      if (Array.isArray(v.items) && v.items.length > 0) {
        v.items.forEach((it: any) => {
          const cat = (it.lineaCategoria || it.producto?.lineaCategoria || 'General').trim()
          const sub = Number(it.subtotal != null ? it.subtotal : (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)))
          const cant = Number(it.cantidad || 1)

          if (!map[cat]) {
            map[cat] = { categoria: cat, total: 0, unidades: 0 }
          }
          map[cat].total += sub
          map[cat].unidades += cant
          total += sub
          piezas += cant
        })
      } else {
        // Fallback a nivel de venta individual
        const cat = (v.producto?.lineaCategoria || 'General').trim()
        const sub = Number(v.total || 0)
        const cant = Number(v.cantidad || 1)

        if (!map[cat]) {
          map[cat] = { categoria: cat, total: 0, unidades: 0 }
        }
        map[cat].total += sub
        map[cat].unidades += cant
        total += sub
        piezas += cant
      }
    })

    const sorted = Object.values(map)
      .map((item) => ({
        ...item,
        porcentaje: total > 0 ? (item.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)

    return { categoriasData: sorted, totalVentasCategorias: total, totalPiezas: piezas }
  }, [ventas])

  return (
    <Card className={`bg-card border-border/70 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between ${className}`}>
      {/* Cabecera */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground">
              Canales de Venta & Familias
            </CardTitle>
          </div>

          {/* Selector Compacto [ Por Canal | Por Categoría ] */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-secondary border border-border/70 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('CANALES')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'CANALES'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Por Canal
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CATEGORIAS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'CATEGORIAS'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Por Categoría
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Cuerpo: Barras de Composición Comercial */}
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {viewMode === 'CANALES' ? (
          canalesData.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground italic space-y-1">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p>Sin canales registrados en este período.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {canalesData.map((item, idx) => {
                const colorClass = BAR_COLORS[idx % BAR_COLORS.length]
                return (
                  <div key={item.canal} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getChannelIcon(item.canal)}
                        <span className="font-bold text-foreground truncate">{item.canal}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          ({item.count} {item.count === 1 ? 'pedido' : 'pedidos'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-extrabold text-foreground">{formatCurrency(item.total)}</span>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md min-w-[38px] text-right">
                          {item.porcentaje.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(4, Math.min(100, item.porcentaje))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          categoriasData.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground italic space-y-1">
              <Layers className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p>Sin categorías registradas en este período.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoriasData.map((item, idx) => {
                const colorClass = BAR_COLORS[idx % BAR_COLORS.length]
                return (
                  <div key={item.categoria} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-bold text-foreground truncate" title={item.categoria}>
                          {item.categoria}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          ({item.unidades} {item.unidades === 1 ? 'unidad' : 'unidades'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-extrabold text-foreground">{formatCurrency(item.total)}</span>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md min-w-[38px] text-right">
                          {item.porcentaje.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(4, Math.min(100, item.porcentaje))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Fila Inferior con Ticket Promedio y Volumen */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>Ticket Promedio:</span>
            <span className="font-mono font-bold text-foreground">
              {formatCurrency(ticketPromedio)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>Volumen Período:</span>
            <span className="font-bold text-foreground">
              {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </span>
            {totalPiezas > 0 && (
              <span className="text-[11px] text-muted-foreground font-mono">
                • {totalPiezas} piezas
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
