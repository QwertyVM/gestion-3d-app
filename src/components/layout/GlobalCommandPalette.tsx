'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Calculator,
  ShoppingBag,
  Users,
  Hammer,
  CircleDot,
  Package,
  Wallet,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GlobalCommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalCommandPalette({ isOpen, onClose }: GlobalCommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [copiedQuote, setCopiedQuote] = useState(false)

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setCopiedQuote(false)
    }
  }, [isOpen])

  // Cotizador 3D Pattern Parser (e.g. "120g 4h", "cotizar 140g 5h", "80g 2.5h")
  const quoteCalculation = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    const regex = /(?:cotizar\s+)?(?:(\d+(?:\.\d+)?)\s*g(?:ramos)?)\s+(?:(\d+(?:\.\d+)?)\s*h(?:oras)?)/i
    const match = trimmed.match(regex)

    if (!match) return null

    const gramos = parseFloat(match[1]) || 0
    const horas = parseFloat(match[2]) || 0

    if (gramos <= 0 || horas <= 0) return null

    // Parámetros estándar de taller NOVA Studio
    const costoFilamentoPorGramo = 0.08 // S/ 80 por kg de PLA premium
    const costoMaquinaPorHora = 1.50 // Depreciación + electricidad (0.3 kWh * S/ 0.85 + desgaste boquilla)
    const costoFijoPackaging = 2.50 // Caja + bolsa + sticker

    const costoMaterial = gramos * costoFilamentoPorGramo
    const costoMaquina = horas * costoMaquinaPorHora
    const costoDirecto = costoMaterial + costoMaquina + costoFijoPackaging

    // Margen objetivo: 65% sobre precio final -> Precio = Costo / (1 - 0.65)
    const margen = 0.65
    const precioSugerido = Math.ceil(costoDirecto / (1 - margen))
    const gananciaNeta = precioSugerido - costoDirecto

    return {
      gramos,
      horas,
      costoMaterial,
      costoMaquina,
      costoFijoPackaging,
      costoDirecto,
      precioSugerido,
      gananciaNeta,
      margenEfectivo: Math.round((gananciaNeta / precioSugerido) * 100)
    }
  }, [query])

  // Copiar mensaje para WhatsApp
  const handleCopyQuote = () => {
    if (!quoteCalculation) return
    const text = `👋 ¡Hola! Te comparto la cotización de tu modelo 3D personalizado:\n\n📦 *Detalle de Fabricación:*\n• Consumo estimado: ${quoteCalculation.gramos}g\n• Tiempo en taller: ${quoteCalculation.horas}h de impresión de alta precisión\n• Acabado y empaque protector incluido\n\n💰 *Inversión total: S/ ${quoteCalculation.precioSugerido}.00*\n\n¿Deseas confirmar el pedido para reservar la bobina en taller? 🚀`

    navigator.clipboard.writeText(text)
    setCopiedQuote(true)
    toast.success('¡Cotización copiada para WhatsApp!')
    setTimeout(() => setCopiedQuote(false), 2000)
  }

  // Crear pedido directo con la cotización
  const handleCreateOrderFromQuote = () => {
    if (!quoteCalculation) return
    onClose()
    router.push(`/pedidos?new=true&gramos=${quoteCalculation.gramos}&precio=${quoteCalculation.precioSugerido}&horas=${quoteCalculation.horas}`)
  }

  // Quick navigation items
  const navigationItems = [
    { label: 'Dashboard', sublabel: 'Métricas y cola operativa', href: '/', icon: LayoutDashboard },
    { label: 'Pedidos', sublabel: 'Listado, despachos y saldos', href: '/pedidos', icon: ShoppingBag },
    { label: 'Nuevo Pedido', sublabel: 'Registrar orden multiproducto', href: '/pedidos?new=true', icon: PlusCircle },
    { label: 'Clientes CRM', sublabel: 'Directorio, compras y LTV', href: '/clientes', icon: Users },
    { label: 'Taller de Producción', sublabel: 'Cola de impresión y piezas activas', href: '/taller', icon: Hammer },
    { label: 'Inventario de Filamentos', sublabel: 'Bobinas, swatches y gramos', href: '/catalogo/inventario', icon: CircleDot },
    { label: 'Packaging & Cajas', sublabel: 'Stock de cajas y lotes', href: '/packaging', icon: Package },
    { label: 'Flujo de Caja', sublabel: 'Movimientos, rentabilidad y liquidez', href: '/finanzas', icon: Wallet },
  ]

  const filteredNav = useMemo(() => {
    if (!query.trim() || quoteCalculation) return navigationItems
    const q = query.toLowerCase()
    return navigationItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.sublabel.toLowerCase().includes(q)
    )
  }, [query, quoteCalculation])

  const handleSelectNav = (href: string) => {
    onClose()
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (quoteCalculation) {
        handleCreateOrderFromQuote()
        return
      }
      if (filteredNav.length > 0) {
        handleSelectNav(filteredNav[0].href)
        return
      }
      if (query.trim()) {
        onClose()
        router.push(`/pedidos?search=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl bg-card rounded-2xl">
        <DialogTitle className="sr-only">Búsqueda Global y Comandos</DialogTitle>
        <DialogDescription className="sr-only">Navega rápidamente o cotiza piezas 3D en vivo</DialogDescription>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border/60 bg-card">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar o tipea '120g 4h' para cotizar..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none font-medium"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border/60 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-3 max-h-[70vh] overflow-y-auto space-y-3">
          
          {/* Quick Cotizador 3D Card (si se detectó el patrón de cotización) */}
          {quoteCalculation && (
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Cotizador Ultrarrápido 3D
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Cálculo automático de costos de taller y margen de ganancia
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                  {quoteCalculation.margenEfectivo}% Margen
                </span>
              </div>

              {/* Grid de Costos */}
              <div className="grid grid-cols-3 gap-2 text-xs py-1">
                <div className="p-2.5 rounded-lg bg-card border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Filamento ({quoteCalculation.gramos}g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">S/ {quoteCalculation.costoMaterial.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Taller ({quoteCalculation.horas}h)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">S/ {quoteCalculation.costoMaquina.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Costo Directo</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">S/ {quoteCalculation.costoDirecto.toFixed(2)}</span>
                </div>
              </div>

              {/* Resultado Precio Sugerido */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider block">
                    Precio Sugerido Venta
                  </span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                    S/ {quoteCalculation.precioSugerido}.00
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Ganancia Bruta</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +S/ {quoteCalculation.gananciaNeta.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-xs font-medium border border-border/60 transition-colors cursor-pointer"
                >
                  {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span>{copiedQuote ? '¡Copiado!' : 'Copiar para WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateOrderFromQuote}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-none transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Crear Pedido</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Tip de Cotización si no está activa */}
          {!quoteCalculation && !query.trim() && (
            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Tip pro:</strong> Escribe <code className="bg-background px-1.5 py-0.5 rounded text-foreground font-mono text-[11px] border border-border/50">140g 5h</code> para calcular el precio recomendado con 65% de margen.
              </span>
            </div>
          )}

          {/* Lista de Navegación Rápida */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider px-2">
              Navegación Rápida
            </span>
            <div className="space-y-0.5">
              {filteredNav.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleSelectNav(item.href)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground block truncate group-hover:text-primary transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {item.sublabel}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>↵ Enter para seleccionar</span>
            <span>•</span>
            <span>ESC para cerrar</span>
          </div>
          <span className="font-mono text-[10px]">NOVA Command</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
