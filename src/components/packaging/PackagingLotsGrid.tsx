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
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoteCajaItem } from '@/actions/cajas'

interface PackagingLotsGridProps {
  lotes: LoteCajaItem[]
  loteReciente50Id?: string
  onSelectLot: (lote: LoteCajaItem) => void
}

export function PackagingLotsGrid({
  lotes,
  loteReciente50Id,
  onSelectLot
}: PackagingLotsGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'TODOS' | 'CON_STOCK' | 'AGOTADOS'>('TODOS')

  const filteredLotes = useMemo(() => {
    return lotes.filter((l) => {
      const q = searchTerm.toLowerCase().trim()
      if (q && !l.concepto.toLowerCase().includes(q) && !(l.subcategoria || '').toLowerCase().includes(q) && !l.persona.toLowerCase().includes(q)) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo de caja o comprador..."
            className="pl-9 h-9 text-xs bg-background border-border rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {(['TODOS', 'CON_STOCK', 'AGOTADOS'] as const).map((filter) => {
            const isSel = stockFilter === filter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStockFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {filter === 'TODOS' ? 'Todos' : filter === 'CON_STOCK' ? 'Con Stock' : 'Agotados'}
              </button>
            )
          })}
        </div>
      </div>

      {/* GRID DE LOTES */}
      {filteredLotes.length === 0 ? (
        <div className="py-12 px-4 text-center bg-card border border-border/80 rounded-2xl">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No se encontraron lotes de cajas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Prueba cambiando los términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLotes.map((lote) => {
            const isLote50 = lote.id === loteReciente50Id || lote.cantidadComprada === 50
            const isExhausted = lote.stockDisponible <= 0
            const pctUsado = lote.cantidadComprada > 0
              ? Math.min(100, Math.round((lote.cajasAsignadasCount / lote.cantidadComprada) * 100))
              : 0

            return (
              <Card
                key={lote.id}
                className={`rounded-2xl transition-all duration-200 border overflow-hidden relative ${
                  isLote50
                    ? 'border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 shadow-md ring-1 ring-primary/30'
                    : 'border-border/80 bg-card hover:border-border shadow-xs'
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
                  {/* Encabezado del Lote */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {lote.concepto}
                        </span>
                        {isLote50 && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                            <Sparkles className="w-3 h-3 mr-1" /> Lote Activo (50)
                          </Badge>
                        )}
                      </div>

                      <Badge
                        className={`text-[10px] font-bold shrink-0 ${
                          isExhausted
                            ? 'bg-muted text-muted-foreground border-border'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isExhausted ? 'Agotado' : `${lote.stockDisponible} disp.`}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(lote.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {lote.persona}
                      </span>
                    </div>
                  </div>

                  {/* Cifras Financieras y Costos */}
                  <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
                        Costo Unitario
                      </span>
                      <span className="font-bold text-foreground font-mono text-sm">
                        S/ {lote.costoUnitario.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
                        Inversión Total
                      </span>
                      <span className="font-bold text-foreground font-mono text-sm">
                        S/ {lote.costoTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progreso y Consumo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">
                        Consumo: <strong className="text-foreground">{lote.cajasAsignadasCount}</strong> / {lote.cantidadComprada}
                      </span>
                      <span className="font-mono font-bold text-muted-foreground">
                        {pctUsado}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLote50 ? 'bg-primary' : 'bg-foreground/60'
                        }`}
                        style={{ width: `${pctUsado}%` }}
                      />
                    </div>
                  </div>

                  {/* Botón de Asignaciones y Pedidos Vinculados */}
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectLot(lote)}
                      className="w-full h-8 text-xs font-semibold rounded-xl border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-primary" />
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
    </div>
  )
}
