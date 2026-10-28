'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  Calculator, 
  Zap, 
  Sparkles, 
  Package, 
  Layers, 
  ShieldAlert, 
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Info
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, cn } from '@/lib/utils'
import { PiezaTaller } from '@/actions/taller'

interface SlicingCostBreakdownModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pieza?: PiezaTaller | null
}

export function SlicingCostBreakdownModal({
  open,
  onOpenChange,
  pieza
}: SlicingCostBreakdownModalProps) {
  // Parámetros de simulación
  const pesoGramos = pieza?.pesoGramosUnitario || 45
  const precioVenta = pieza?.costoBaseUnitario ? Math.max(30, pieza.costoBaseUnitario * 1.8) : 50

  const [gramos, setGramos] = useState<number>(pesoGramos)
  const [horasImpresion, setHorasImpresion] = useState<number>(2.5)
  const [costoKiloFilamento, setCostoKiloFilamento] = useState<number>(60) // S/ 60 el kg promedio
  const [tasaFalloPct, setTasaFalloPct] = useState<number>(7) // 7% merma/fallas
  const [incluirCaja, setIncluirCaja] = useState<boolean>(true)
  const [precioVentaSim, setPrecioVentaSim] = useState<number>(precioVenta)

  // Cálculos de costo real
  const costoGramo = costoKiloFilamento / 1000 // S/ 0.06
  const costoFilamentoPuro = gramos * costoGramo
  const costoMermaFallas = (costoFilamentoPuro * tasaFalloPct) / 100

  // Luz: ~160 Watts = 0.16 kWh * horas * S/ 0.85/kWh
  const consumoKwh = 0.16 * horasImpresion
  const costoLuz = consumoKwh * 0.85

  // Depreciación de impresora (boquilla endurecida, cama PEI, desgaste de correas): ~S/ 0.35 por hora de uso
  const costoDesgasteMaquina = horasImpresion * 0.35

  // Packaging promedio (caja personalizada + papel film)
  const costoPackaging = incluirCaja ? 2.90 : 0.50

  // Total costo de fabricación directo
  const costoTotalReal = costoFilamentoPuro + costoMermaFallas + costoLuz + costoDesgasteMaquina + costoPackaging
  const gananciaNeta = precioVentaSim - costoTotalReal
  const margenPorcentaje = precioVentaSim > 0 ? (gananciaNeta / precioVentaSim) * 100 : 0
  const markup = costoTotalReal > 0 ? (gananciaNeta / costoTotalReal) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl bg-card border-border/80">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Calculadora de Coste Real 3D & Merma
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Desglose analítico: Filamento + Electricidad kWh + Desgaste + Contingencia + Packaging.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {pieza && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-foreground block truncate">{pieza.nombreModelo}</span>
              <span className="text-[11px] text-muted-foreground font-mono">{pieza.codigoRef} · {pieza.cliente}</span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background">
              {pieza.nombreColor}
            </Badge>
          </div>
        )}

        {/* Inputs Interactivos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Peso (gramos)</Label>
            <Input
              type="number"
              min="1"
              value={gramos}
              onChange={(e) => setGramos(Math.max(1, parseFloat(e.target.value) || 0))}
              className="h-8 text-xs font-mono font-semibold mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Tiempo (horas)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.5"
              value={horasImpresion}
              onChange={(e) => setHorasImpresion(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className="h-8 text-xs font-mono font-semibold mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Costo Bobina 1kg (S/)</Label>
            <Input
              type="number"
              min="20"
              value={costoKiloFilamento}
              onChange={(e) => setCostoKiloFilamento(Math.max(1, parseFloat(e.target.value) || 0))}
              className="h-8 text-xs font-mono font-semibold mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Margen Fallas (%)</Label>
            <Input
              type="number"
              min="0"
              max="30"
              value={tasaFalloPct}
              onChange={(e) => setTasaFalloPct(Math.max(0, parseFloat(e.target.value) || 0))}
              className="h-8 text-xs font-mono font-semibold mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Precio Venta (S/)</Label>
            <Input
              type="number"
              min="1"
              value={precioVentaSim}
              onChange={(e) => setPrecioVentaSim(Math.max(1, parseFloat(e.target.value) || 0))}
              className="h-8 text-xs font-mono font-semibold mt-1"
            />
          </div>

          <div className="flex flex-col justify-end">
            <Button
              type="button"
              variant={incluirCaja ? 'secondary' : 'outline'}
              onClick={() => setIncluirCaja(!incluirCaja)}
              className="h-8 text-[11px] font-medium"
            >
              {incluirCaja ? '✓ Con Caja (S/ 2.90)' : 'Sin Caja (S/ 0.50)'}
            </Button>
          </div>
        </div>

        {/* Desglose de Costo en Cascada */}
        <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Filamento ({gramos}g × S/ {costoGramo.toFixed(3)}/g):
            </span>
            <span className="font-mono font-semibold text-foreground">S/ {costoFilamentoPuro.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Contingencia de merma y fallas ({tasaFalloPct}%):
            </span>
            <span className="font-mono font-medium text-amber-600 dark:text-amber-400">S/ {costoMermaFallas.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Energía Eléctrica ({horasImpresion}h a 160W):
            </span>
            <span className="font-mono font-medium text-foreground">S/ {costoLuz.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Amortización de Boquilla & Cama PEI:
            </span>
            <span className="font-mono font-medium text-foreground">S/ {costoDesgasteMaquina.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              Packaging & Embalaje ({incluirCaja ? 'Caja + Film' : 'Solo Film'}):
            </span>
            <span className="font-mono font-medium text-foreground">S/ {costoPackaging.toFixed(2)}</span>
          </div>

          {/* TOTAL COSTO */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 font-semibold text-sm">
            <span className="text-foreground">Costo Total Real de Fabricación:</span>
            <span className="font-mono text-foreground font-bold">S/ {costoTotalReal.toFixed(2)}</span>
          </div>
        </div>

        {/* Tarjeta de Rentabilidad Neta del Modelo */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Utilidad Neta por Unidad:
            </span>
            <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(gananciaNeta)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-emerald-500/20">
            <span>Margen sobre Venta: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{margenPorcentaje.toFixed(1)}%</strong></span>
            <span>Markup sobre Costo: <strong className="font-mono text-foreground font-bold">{markup.toFixed(0)}%</strong></span>
          </div>
        </div>

        {/* Explicación Teórica */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground space-y-1">
          <div className="flex items-center gap-1 text-foreground font-semibold">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>¿Por qué se calculan estos 5 factores?</span>
          </div>
          <p>
            En impresión 3D comercial, ignorar la luz, el desgaste de boquillas y un 7% de fallas ocultas provoca pérdidas invisibles. Al incorporar packaging y amortización, sabes con exactitud matemática cuánto dinero limpio deja cada pieza despachada.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cerrar Calculadora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
