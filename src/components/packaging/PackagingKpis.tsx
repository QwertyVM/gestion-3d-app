'use client'

import React from 'react'
import {
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StockCajasResumen } from '@/actions/cajas'

interface PackagingKpisProps {
  stockCajas: StockCajasResumen
}

export function PackagingKpis({ stockCajas }: PackagingKpisProps) {
  const isOutOfStock = stockCajas.totalStockDisponible <= 0
  const isLowStock = stockCajas.totalStockDisponible < 15

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. STOCK DISPONIBLE */}
      <Card className="bg-card border-border/80 rounded-2xl shadow-xs overflow-hidden relative group hover:border-primary/40 transition-all">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Stock Disponible
            </span>
            <div className={`p-2 rounded-xl border ${
              isOutOfStock
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : isLowStock
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {stockCajas.totalStockDisponible}
              </span>
              <span className="text-xs text-muted-foreground font-medium">unidades</span>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-[10px] font-semibold px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Sin stock
                </Badge>
              ) : isLowStock ? (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Reordenar pronto
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Stock saludable
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground font-mono">
                de {stockCajas.totalCajasCompradas} compradas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. VALORIZACIÓN EN ALMACÉN */}
      <Card className="bg-card border-border/80 rounded-2xl shadow-xs overflow-hidden relative group hover:border-primary/40 transition-all">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Valor en Almacén
            </span>
            <div className="p-2 rounded-xl border bg-primary/10 text-primary border-primary/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {formatCurrency(stockCajas.valorTotalStockDisponible)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2.5">
              Capital disponible invertido en cajas sin usar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. COSTO PROMEDIO & LOTE ACTIVO */}
      <Card className="bg-card border-border/80 rounded-2xl shadow-xs overflow-hidden relative group hover:border-primary/40 transition-all">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Costo Unit. Promedio
            </span>
            <div className="p-2 rounded-xl border bg-secondary text-secondary-foreground border-border">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {formatCurrency(stockCajas.costoUnitarioPromedio)}
              </span>
              <span className="text-xs text-muted-foreground">/ caja</span>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {stockCajas.loteReciente50 ? (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-semibold px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Lote activo: S/ {stockCajas.loteReciente50.costoUnitario.toFixed(2)}
                </Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground">Ponderado histórico</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. TOTAL CONSUMIDAS / ASIGNADAS */}
      <Card className="bg-card border-border/80 rounded-2xl shadow-xs overflow-hidden relative group hover:border-primary/40 transition-all">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Cajas Asignadas
            </span>
            <div className="p-2 rounded-xl border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {stockCajas.totalCajasAsignadas}
              </span>
              <span className="text-xs text-muted-foreground font-medium">despachadas</span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      stockCajas.totalCajasCompradas > 0
                        ? (stockCajas.totalCajasAsignadas / stockCajas.totalCajasCompradas) * 100
                        : 0
                    )}%`
                  }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground shrink-0">
                {stockCajas.totalCajasCompradas > 0
                  ? `${Math.round((stockCajas.totalCajasAsignadas / stockCajas.totalCajasCompradas) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
