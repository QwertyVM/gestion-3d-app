'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  TrendingUp, 
  Package, 
  ShieldCheck, 
  DollarSign, 
  Layers,
  ArrowDownRight,
  Equal
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialWaterfallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingresosVentas: number
  costoDirectoTotal: number
  gananciaNeta: number
  totalFijos: number
  superavit: number
  filteredVentasCount: number
}

export function FinancialWaterfallModal({
  open,
  onOpenChange,
  ingresosVentas,
  costoDirectoTotal,
  gananciaNeta,
  totalFijos,
  superavit,
  filteredVentasCount
}: FinancialWaterfallModalProps) {
  // Porcentajes relativos a la facturación bruta
  const base = Math.max(1, ingresosVentas)
  const pctCosto = ((costoDirectoTotal / base) * 100).toFixed(1)
  const pctMargenContribucion = ((gananciaNeta / base) * 100).toFixed(1)
  const pctFijos = ((totalFijos / base) * 100).toFixed(1)
  const pctNetoLibre = ((superavit / base) * 100).toFixed(1)

  const steps = [
    {
      id: 'ingresos',
      title: '1. Facturación Bruta Total',
      subtitle: `${filteredVentasCount} pedidos facturados en el período`,
      amount: ingresosVentas,
      percentage: '100%',
      type: 'base',
      colorClass: 'text-foreground bg-primary/10 border-primary/20',
      barColor: 'bg-primary',
      barWidth: '100%',
      icon: <DollarSign className="w-4 h-4 text-primary" />
    },
    {
      id: 'costos_directos',
      title: '2. (-) Costo Directo de Producción',
      subtitle: 'Insumos, filamento base, empaque/cajas y fletes',
      amount: -costoDirectoTotal,
      percentage: `-${pctCosto}%`,
      type: 'subtraction',
      colorClass: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      barColor: 'bg-rose-500',
      barWidth: `${Math.min(100, Math.max(5, (costoDirectoTotal / base) * 100))}%`,
      icon: <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
    },
    {
      id: 'margen_bruto',
      title: '3. (=) Margen de Contribución Taller',
      subtitle: 'Utilidad operativa generada para absorber costos fijos',
      amount: gananciaNeta,
      percentage: `${pctMargenContribucion}%`,
      type: 'subtotal',
      colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      barColor: 'bg-emerald-500',
      barWidth: `${Math.min(100, Math.max(5, (gananciaNeta / base) * 100))}%`,
      icon: <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'costos_fijos',
      title: '4. (-) Compromisos Blindados del Mes',
      subtitle: 'Alquiler, servicios, amortización y cuotas fijas reservadas',
      amount: -totalFijos,
      percentage: `-${pctFijos}%`,
      type: 'subtraction',
      colorClass: 'text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
      barColor: 'bg-amber-500',
      barWidth: `${Math.min(100, Math.max(5, (totalFijos / base) * 100))}%`,
      icon: <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'utilidad_libre',
      title: '5. (=) Beneficio Neto Real Disponible',
      subtitle: superavit >= 0 
        ? 'Superávit libre de polvo y paja para reinversión o socios'
        : 'Déficit operativo: faltan fondos para cubrir la totalidad de fijos',
      amount: superavit,
      percentage: `${pctNetoLibre}%`,
      type: 'result',
      colorClass: superavit >= 0 
        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
        : 'text-rose-700 dark:text-rose-400 bg-rose-500/15 border-rose-500/30',
      barColor: superavit >= 0 ? 'bg-emerald-600' : 'bg-rose-600',
      barWidth: `${Math.min(100, Math.max(5, (Math.abs(superavit) / base) * 100))}%`,
      icon: <TrendingUp className={`w-4 h-4 ${superavit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Cascada Financiera (Waterfall)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Visualización de extremo a extremo: cómo fluye cada sol desde la venta hasta la ganancia libre.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Pasos de la Cascada */}
        <div className="space-y-3 py-2">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="p-3 sm:p-3.5 rounded-xl bg-card border border-border/70 hover:border-border transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${step.colorClass}`}>
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground tracking-tight">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs sm:text-sm font-mono font-bold tracking-tight tabular-nums block ${
                    step.amount >= 0 ? 'text-foreground' : 'text-rose-700 dark:text-rose-400'
                  }`}>
                    {step.amount < 0 ? '-' : (step.type === 'subtotal' || step.type === 'result') ? '' : ''}
                    {formatCurrency(Math.abs(step.amount))}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {step.percentage} de ventas
                  </span>
                </div>
              </div>

              {/* Barra de proporción visual */}
              <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${step.barColor}`} 
                  style={{ width: step.barWidth }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Resumen Ejecutivo del Asesor */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Dictamen del Asesor Financiero:
          </p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {superavit >= 0 
              ? `Tus ventas del período cubrieron el 100% de los costos directos y absorbieron la totalidad de costos fijos (${formatCurrency(totalFijos)}). Tienes un superávit neto real de ${formatCurrency(superavit)} (${pctNetoLibre}% de margen final).`
              : `Aún no se alcanza el punto de absorción total de fijos. Faltan ${formatCurrency(Math.abs(superavit))} para cubrir el presupuesto blindado del mes.`
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
