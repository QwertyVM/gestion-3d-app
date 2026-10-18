'use client'

import React, { useState } from 'react'
import {
  Package,
  Plus,
  Trash2,
  Check,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from './orderUtils'
import { PedidoView, AsignacionCajaPedidoView } from './types'
import { LoteCajaItem, StockCajasResumen } from '@/actions/cajas'
import { toast } from 'sonner'

interface BoxAssignmentSectionProps {
  pedido: PedidoView
  stockCajas?: StockCajasResumen | null
  onAssignBoxes: (pedidoId: string, cajas: { inversionId?: string | null, nombreCaja: string, cantidad: number, costoUnitario: number }[]) => Promise<boolean>
  onRemoveBoxes: (pedidoId: string) => Promise<boolean>
}

export function BoxAssignmentSection({
  pedido,
  stockCajas,
  onAssignBoxes,
  onRemoveBoxes
}: BoxAssignmentSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Asignaciones locales mientras se edita
  const initialCajas = pedido.cajas && pedido.cajas.length > 0
    ? pedido.cajas
    : []

  const [selectedLotId, setSelectedLotId] = useState<string>(() => {
    if (initialCajas.length > 0 && initialCajas[0].inversionId) {
      return initialCajas[0].inversionId
    }
    // Por defecto el lote de 50 o el primer lote con stock
    if (stockCajas?.loteReciente50) return stockCajas.loteReciente50.id
    if (stockCajas?.lotes && stockCajas.lotes.length > 0) return stockCajas.lotes[0].id
    return ''
  })

  const [boxQuantity, setBoxQuantity] = useState<number>(() => {
    if (initialCajas.length > 0) return initialCajas[0].cantidad || 1
    return 1
  })

  // Obtener lote seleccionado
  const selectedLot = stockCajas?.lotes.find(l => l.id === selectedLotId) || stockCajas?.loteReciente50 || null
  const unitCost = selectedLot ? selectedLot.costoUnitario : 2.40
  const boxName = selectedLot ? selectedLot.concepto : 'Caja estándar'

  // Cálculos financieros en tiempo real
  const totalCobrado = Number(pedido.montoPagado || 0)
  const totalPedido = Number(pedido.total || 0)
  const totalEnvio = Number(pedido.costoEnvio || 0)

  // Costo base de fabricación de los productos
  const costoFabricacion = Number((pedido.items || []).reduce((sum, it) => {
    const cBase = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
      ? Number(it.costoBaseSnapshot)
      : (it.producto ? Number(it.producto.costoBase) : 0)
    return sum + (cBase * Number(it.cantidad || 1))
  }, 0).toFixed(2))

  // Costo de cajas actual
  const currentCajas = pedido.cajas || []
  const hasAssignedBoxes = currentCajas.length > 0
  const costoCajasActual = Number(currentCajas.reduce((sum, c) => sum + Number(c.costoTotal || 0), 0).toFixed(2))
  const totalCajasActual = currentCajas.reduce((sum, c) => sum + Number(c.cantidad || 1), 0)

  // Costos totales y utilidad neta
  const costosTotales = Number((costoFabricacion + costoCajasActual + totalEnvio).toFixed(2))
  const utilidadNetaReal = Number((totalPedido - costosTotales).toFixed(2))
  const margenNetoPct = totalPedido > 0
    ? Number(((utilidadNetaReal / totalPedido) * 100).toFixed(1))
    : 0

  // Guardar asignación rápida o personalizada
  const handleSave = async (invId?: string, qty?: number) => {
    setIsSaving(true)
    try {
      const targetLotId = invId !== undefined ? invId : selectedLotId
      const targetLot = stockCajas?.lotes.find(l => l.id === targetLotId) || selectedLot
      const targetQty = qty !== undefined ? qty : boxQuantity

      const uCost = targetLot ? targetLot.costoUnitario : 2.40
      const bName = targetLot ? targetLot.concepto : 'Caja estándar'

      const ok = await onAssignBoxes(pedido.id, [{
        inversionId: targetLotId || null,
        nombreCaja: bName,
        cantidad: targetQty,
        costoUnitario: uCost
      }])

      if (ok) {
        toast.success(`Caja asignada a ${pedido.codigo} correctamente`)
        setIsEditing(false)
      } else {
        toast.error('No se pudo asignar la caja')
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al asignar caja')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    try {
      const ok = await onRemoveBoxes(pedido.id)
      if (ok) {
        toast.success(`Caja removida de ${pedido.codigo}`)
        setIsEditing(false)
      } else {
        toast.error('No se pudo remover la caja')
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al remover caja')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 pt-1">
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-primary" />
          Empaque & Cajas Asignadas (Stock Real)
        </span>
        {hasAssignedBoxes && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs h-7 px-2 text-primary hover:text-primary/80 font-medium cursor-pointer"
          >
            Modificar caja
          </Button>
        )}
      </div>

      {/* BLOQUE DE ASIGNACIÓN */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs space-y-3">
        {!hasAssignedBoxes && !isEditing ? (
          /* Estado 1: Sin cajas asignadas */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Sin caja asignada a este pedido
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Asigna la caja empleada para descontarla del stock y calcular el costo neto exacto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {/* Asignación rápida con 1 clic (Lote de 50 cajas @ S/ 2.40) */}
              <Button
                size="sm"
                onClick={() => handleSave(stockCajas?.loteReciente50?.id, 1)}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg font-medium cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>+ 1 Caja (Lote S/ 2.40)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-border text-foreground hover:bg-muted text-xs h-8 px-2.5 rounded-lg cursor-pointer font-medium"
              >
                Elegir otro lote...
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          /* Estado 2: Formulario de Asignación / Cambio de Lote */
          <div className="space-y-3 p-3 bg-muted/20 border border-border rounded-xl">
            <div className="text-xs font-bold text-foreground">
              Seleccionar Lote de Cajas Registrado
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Selector de Lote de Inversión */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  Lote de Egreso / Tipo de Caja
                </label>
                <select
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {(stockCajas?.lotes || []).map((lote) => (
                    <option key={lote.id} value={lote.id}>
                      {lote.concepto} ({lote.fecha.slice(0, 10)}) — S/ {lote.costoUnitario.toFixed(2)} c/u ({lote.stockDisponible} disp.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad de Cajas */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  Cantidad
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground text-sm font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={boxQuantity}
                    onChange={(e) => setBoxQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full h-9 rounded-lg border border-border bg-background text-center text-xs font-mono font-bold text-foreground focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setBoxQuantity(boxQuantity + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Total del Packaging a descontar */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">
                Costo Total Packaging: <strong>{boxQuantity} × S/ {unitCost.toFixed(2)} = S/ {(boxQuantity * unitCost).toFixed(2)}</strong>
              </span>
              {selectedLot && (
                <span className="text-[11px] text-muted-foreground">
                  Stock remanente tras asignar: <strong>{Math.max(0, selectedLot.stockDisponible - boxQuantity)} uds</strong>
                </span>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              {hasAssignedBoxes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isSaving}
                  className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2.5 rounded-lg cursor-pointer mr-auto"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Quitar caja
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="text-xs h-8 px-3 rounded-lg border-border cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                size="sm"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="bg-primary text-primary-foreground text-xs h-8 px-3 rounded-lg font-medium cursor-pointer flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Guardar Asignación</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Estado 3: Cajas ya asignadas (Vista normal de resumen) */
          <div className="space-y-2.5">
            {currentCajas.map((caja) => (
              <div
                key={caja.id}
                className="flex items-center justify-between p-2.5 bg-secondary/40 border border-border/80 rounded-xl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {caja.nombreCaja}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {caja.cantidad} unidad(es) × S/ {Number(caja.costoUnitario).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-foreground">
                    {formatCurrency(caja.costoTotal)}
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                    Stock descontado
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARD DE ESTIMACIÓN DE UTILIDAD NETA REAL DEL PEDIDO                        */}
        {/* ========================================================================= */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="bg-gradient-to-br from-card to-secondary/30 border border-border rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Estimación de Utilidad Neta Real
              </span>
              <Badge className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                margenNetoPct >= 50
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : margenNetoPct >= 25
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : 'bg-destructive/10 text-destructive border-destructive/30'
              }`}>
                {margenNetoPct}% margen
              </Badge>
            </div>

            {/* Desglose de ingresos vs costos reales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-card/80 border border-border/60 rounded-lg p-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Pedido</span>
                <span className="font-mono font-bold text-foreground block mt-0.5">
                  {formatCurrency(totalPedido)}
                </span>
              </div>

              <div className="bg-card/80 border border-border/60 rounded-lg p-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Costo Fabricación</span>
                <span className="font-mono font-semibold text-muted-foreground block mt-0.5">
                  - {formatCurrency(costoFabricacion)}
                </span>
              </div>

              <div className="bg-card/80 border border-border/60 rounded-lg p-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Costo Cajas</span>
                <span className={`font-mono font-semibold block mt-0.5 ${hasAssignedBoxes ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/60 italic'}`}>
                  {hasAssignedBoxes ? `- ${formatCurrency(costoCajasActual)}` : 'S/ 0.00'}
                </span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Ganancia Neta</span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 block mt-0.5 text-sm">
                  {formatCurrency(utilidadNetaReal)}
                </span>
              </div>
            </div>

            {/* Detalle explicativo de la fórmula */}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              * Calculado como: Total Venta ({formatCurrency(totalPedido)}) - Fabricación ({formatCurrency(costoFabricacion)}) - Cajas ({formatCurrency(costoCajasActual)}) {totalEnvio > 0 ? `- Envío (${formatCurrency(totalEnvio)})` : ''} = <strong>{formatCurrency(utilidadNetaReal)}</strong> neto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
