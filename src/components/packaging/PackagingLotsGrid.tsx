'use client'

import React, { useState, useMemo } from 'react'
import {
  Package,
  Layers,
  Sparkles,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Sliders,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoteCajaItem, ajustarStockLoteCajas } from '@/actions/cajas'

interface PackagingLotsGridProps {
  lotes: LoteCajaItem[]
  loteReciente50Id?: string
  onSelectLot: (lote: LoteCajaItem) => void
  onStockUpdated?: () => void
}

export function PackagingLotsGrid({
  lotes,
  loteReciente50Id,
  onSelectLot,
  onStockUpdated
}: PackagingLotsGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'CON_STOCK' | 'TODOS' | 'AGOTADOS'>('CON_STOCK')
  const [adjustingLot, setAdjustingLot] = useState<LoteCajaItem | null>(null)
  const [newStockInput, setNewStockInput] = useState<string>('')
  const [isSavingAdjust, setIsSavingAdjust] = useState(false)

  const conStockCount = useMemo(() => lotes.filter((l) => l.stockDisponible > 0).length, [lotes])
  const agotadosCount = useMemo(() => lotes.filter((l) => l.stockDisponible <= 0).length, [lotes])

  const filteredLotes = useMemo(() => {
    return lotes.filter((l) => {
      const q = searchTerm.toLowerCase().trim()
      const lotCode = (l.codigo || `LOT-${l.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`).toLowerCase()
      if (
        q && 
        !l.concepto.toLowerCase().includes(q) && 
        !(l.subcategoria || '').toLowerCase().includes(q) && 
        !l.persona.toLowerCase().includes(q) &&
        !l.id.toLowerCase().includes(q) &&
        !lotCode.includes(q)
      ) {
        return false
      }
      if (stockFilter === 'CON_STOCK' && l.stockDisponible <= 0) return false
      if (stockFilter === 'AGOTADOS' && l.stockDisponible > 0) return false
      return true
    })
  }, [lotes, searchTerm, stockFilter])

  const formatDate = (isoString: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID (ej. LOT-...), tipo de caja o comprador..."
            className="pl-9 h-9 text-xs bg-background border-border/80 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setStockFilter('CON_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
              stockFilter === 'CON_STOCK'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Disponibles ({conStockCount})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('AGOTADOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
              stockFilter === 'AGOTADOS'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Agotados ({agotadosCount})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
              stockFilter === 'TODOS'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Todos ({lotes.length})
          </button>
        </div>
      </div>

      {/* GRID DE LOTES */}
      {filteredLotes.length === 0 ? (
        <div className="py-12 px-4 text-center bg-card border border-border/60 rounded-xl">
          <Package className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No se encontraron lotes de cajas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Prueba cambiando los términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredLotes.map((lote) => {
            const isLote50 = lote.id === loteReciente50Id || lote.cantidadComprada === 50
            const isExhausted = lote.stockDisponible <= 0
            const pctUsado = lote.cantidadComprada > 0
              ? Math.min(100, Math.round((lote.cajasAsignadasCount / lote.cantidadComprada) * 100))
              : 0

            return (
              <Card
                key={lote.id}
                className={`rounded-xl transition-colors border overflow-hidden relative shadow-none ${
                  isLote50
                    ? 'border-primary/40 bg-card ring-1 ring-primary/20'
                    : 'border-border/60 bg-card'
                }`}
              >
                <CardContent className="p-4 sm:p-4.5 flex flex-col justify-between h-full space-y-3.5">
                  {/* Encabezado del Lote */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const code = lote.codigo || `LOT-${lote.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
                              navigator.clipboard.writeText(code)
                              toast.success(`ID ${code} copiado`)
                            }}
                            title="Haz clic para copiar el ID del lote"
                            className="font-mono text-[10px] text-muted-foreground bg-muted/60 hover:bg-muted border border-border/50 px-1.5 py-0.5 rounded tracking-wider shrink-0 transition-colors cursor-pointer flex items-center gap-1 group/btn"
                          >
                            <span>{lote.codigo || `LOT-${lote.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`}</span>
                            <Copy className="w-2.5 h-2.5 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {lote.concepto}
                          </span>
                          {isLote50 && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium px-1.5 py-0">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Lote Activo (50)
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          className={`text-[10px] font-medium shrink-0 tabular-nums px-2 py-0.5 rounded-md border ${
                            isExhausted
                              ? 'bg-muted/60 text-muted-foreground border-border/50'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isExhausted ? 'Agotado' : `${lote.stockDisponible} disp.`}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingLot(lote)
                            setNewStockInput(String(lote.stockDisponible))
                          }}
                          title="Ajustar stock de este lote"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(lote.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {lote.persona}
                      </span>
                    </div>
                  </div>

                  {/* Cifras Financieras y Costos */}
                  <div className="grid grid-cols-2 gap-2 bg-muted/25 p-2.5 rounded-lg border border-border/40 text-xs">
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Costo Unitario
                      </span>
                      <span className="font-semibold text-foreground font-mono tabular-nums text-xs">
                        S/ {lote.costoUnitario.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Inversión Total
                      </span>
                      <span className="font-semibold text-foreground font-mono tabular-nums text-xs">
                        S/ {lote.costoTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progreso y Consumo */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-normal">
                        Consumo: <strong className="text-foreground font-mono tabular-nums">{lote.cajasAsignadasCount}</strong> / {lote.cantidadComprada}
                      </span>
                      <span className="font-mono tabular-nums font-medium text-muted-foreground">
                        {pctUsado}%
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLote50 ? 'bg-primary' : 'bg-foreground/50'
                        }`}
                        style={{ width: `${pctUsado}%` }}
                      />
                    </div>
                  </div>

                  {/* Botón de Asignaciones y Pedidos Vinculados */}
                  <div className="pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectLot(lote)}
                      className="w-full h-8 text-xs font-medium rounded-lg border-border/60 bg-background hover:bg-muted text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        Ver Pedidos Asignados ({lote.asignaciones.length})
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL PARA AJUSTAR STOCK DE LOTE */}
      {adjustingLot && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card text-foreground border border-border/80 rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold tracking-tight text-foreground">
                  Ajustar Stock Disponible
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lote {adjustingLot.codigo} — {adjustingLot.concepto}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingLot(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Compradas originalmente:</span>
                <span className="font-mono tabular-nums font-semibold text-foreground">{adjustingLot.cantidadComprada} uds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Asignadas a pedidos:</span>
                <span className="font-mono tabular-nums font-semibold text-foreground">
                  {adjustingLot.asignaciones.reduce((acc, a) => acc + a.cantidad, 0)} uds
                </span>
              </div>
              <div className="pt-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Nuevo Stock Disponible Real:
                </label>
                <Input
                  type="number"
                  min="0"
                  max={adjustingLot.cantidadComprada}
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(e.target.value)}
                  className="font-mono tabular-nums font-semibold text-sm h-9 bg-background border-border/80 rounded-lg"
                />
                <p className="text-[10px] text-muted-foreground">
                  Ajustará el consumo no asociado a pedidos directos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdjustingLot(null)}
                className="flex-1 h-8 rounded-lg text-xs font-medium"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={isSavingAdjust}
                onClick={async () => {
                  const val = parseInt(newStockInput, 10)
                  if (isNaN(val) || val < 0) {
                    toast.error('Ingresa un número válido mayor o igual a 0')
                    return
                  }
                  setIsSavingAdjust(true)
                  try {
                    const res = await ajustarStockLoteCajas(adjustingLot.id, val)
                    if (res.success) {
                      toast.success(`Stock del lote ${adjustingLot.codigo} actualizado a ${val} uds`)
                      setAdjustingLot(null)
                      if (onStockUpdated) onStockUpdated()
                    } else {
                      toast.error(res.error || 'Error al actualizar')
                    }
                  } catch (e: any) {
                    toast.error(e.message || 'Error al actualizar')
                  } finally {
                    setIsSavingAdjust(false)
                  }
                }}
                className="flex-1 h-8 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
              >
                {isSavingAdjust ? 'Guardando...' : 'Guardar Ajuste'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
