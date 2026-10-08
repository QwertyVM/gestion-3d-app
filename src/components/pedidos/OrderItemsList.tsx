'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Boxes,
  Palette,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  ChevronDown,
  ShoppingBag
} from 'lucide-react'
import { TipoPrecio } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'
import { FilamentoOption, FormItemState, ProductoOption } from './types'

interface OrderItemsListProps {
  items: FormItemState[]
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  productosComboboxItems: ComboboxItem[]
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onUpdateItem: (id: string, updates: Partial<FormItemState>) => void
  formatCurrency: (val: number) => string
  costoEnvio: string
  setCostoEnvio: (val: string) => void
  montoPagado: number
  totalPagosCount: number
}

// Subcomponente de fila individual para manejo eficiente de estado y dropdowns
function OrderItemRow({
  item,
  index,
  totalItems,
  filamentos,
  productosComboboxItems,
  onUpdateItem,
  onRemoveItem,
  formatCurrency
}: {
  item: FormItemState
  index: number
  totalItems: number
  filamentos: FilamentoOption[]
  productosComboboxItems: ComboboxItem[]
  onUpdateItem: (id: string, updates: Partial<FormItemState>) => void
  onRemoveItem: (id: string) => void
  formatCurrency: (val: number) => string
}) {
  const [isFilamentOpen, setIsFilamentOpen] = useState(false)
  const [filamentSearch, setFilamentSearch] = useState('')
  const [showSubDetails, setShowSubDetails] = useState(
    Boolean(item.personalizacion || Number(item.costoPackaging) > 0)
  )
  const filamentRef = useRef<HTMLDivElement>(null)

  // Subtotal por ítem
  const itemSubtotal = useMemo(() => {
    const unit = Number(item.precioUnitario) || 0
    const pack = Number(item.costoPackaging) || 0
    const cant = Math.max(1, Number(item.cantidad) || 1)
    return (unit + pack) * cant
  }, [item.precioUnitario, item.costoPackaging, item.cantidad])

  // Filamentos seleccionados
  const selectedFilaments = useMemo(() => {
    const ids = item.coloresIds && item.coloresIds.length > 0
      ? item.coloresIds
      : (item.colorFilamentoId ? [item.colorFilamentoId] : [])
    return ids
      .map(id => filamentos.find(f => f.id === id))
      .filter((f): f is FilamentoOption => Boolean(f))
  }, [item.coloresIds, item.colorFilamentoId, filamentos])

  // Filtrado de filamentos
  const filteredFilaments = useMemo(() => {
    if (!filamentSearch.trim()) return filamentos
    const q = filamentSearch.toLowerCase()
    return filamentos.filter(f =>
      f.nombreColor.toLowerCase().includes(q) ||
      (f.tipoMaterial && f.tipoMaterial.toLowerCase().includes(q)) ||
      (f.marca && f.marca.toLowerCase().includes(q))
    )
  }, [filamentos, filamentSearch])

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filamentRef.current && !filamentRef.current.contains(e.target as Node)) {
        setIsFilamentOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleColor = (filId: string) => {
    const current = item.coloresIds && item.coloresIds.length > 0
      ? item.coloresIds
      : (item.colorFilamentoId ? [item.colorFilamentoId] : [])
    let next: string[]
    if (current.includes(filId)) {
      next = current.filter(id => id !== filId)
    } else {
      next = [...current, filId]
    }
    onUpdateItem(item.id, {
      coloresIds: next,
      colorFilamentoId: next[0] || ''
    })
  }

  return (
    <div
      style={{ zIndex: totalItems - index }}
      className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 space-y-2 transition-colors hover:bg-muted/20 shadow-2xs"
    >
      {/* FILA PRINCIPAL: Grid calibrado en desktop para alineación exacta sin solapamientos */}
      <div className="flex flex-col md:grid md:grid-cols-[minmax(0,32%)_minmax(0,22%)_minmax(0,20%)_minmax(0,8%)_minmax(0,12%)_minmax(0,6%)] md:gap-2.5 md:items-center">
        {/* 1. MODELO 3D (w-[32%]) */}
        <div className="min-w-0">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block md:hidden mb-1">
            Modelo 3D #{index + 1}
          </label>
          <SearchableCombobox
            items={productosComboboxItems}
            value={item.productoId}
            onChange={(newId) => onUpdateItem(item.id, { productoId: newId })}
            placeholder="Buscar modelo 3D..."
            searchPlaceholder="Filtrar modelo..."
            emptyMessage="No se encontró modelo"
            icon={Boxes}
            size="sm"
            inputClassName="bg-background border-input text-xs font-semibold text-foreground h-8.5 rounded-lg"
            clearable={false}
          />
        </div>

        {/* 2. FILAMENTOS (w-[22%] en desktop - dots de color minimalistas de 10px con Tooltip) */}
        <div ref={filamentRef} className="relative min-w-0 mt-2 md:mt-0">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block md:hidden mb-1">
            Filamentos
          </label>
          <button
            type="button"
            onClick={() => setIsFilamentOpen(prev => !prev)}
            className="w-full h-8.5 px-2 bg-background border border-input hover:border-primary/50 rounded-lg text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer text-left shadow-2xs"
          >
            {selectedFilaments.length === 0 ? (
              <span className="text-muted-foreground italic truncate text-[11px] flex items-center gap-1.5">
                <Palette className="h-3 w-3 opacity-60 shrink-0" />
                <span>Asignar</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                {/* Dots minimalistas de 10px con Tooltip al hover */}
                {selectedFilaments.map(f => (
                  <span
                    key={f.id}
                    title={`${f.nombreColor} (${f.tipoMaterial || ''} • ${f.marca || 'Genérica'}) • ${f.codigoHex || '#1E1E1E'}`}
                    className="w-2.5 h-2.5 rounded-full border border-black/25 shadow-2xs shrink-0 cursor-help hover:scale-125 transition-transform"
                    style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                  />
                ))}
                {selectedFilaments.length === 1 && (
                  <span className="text-[11px] font-medium text-foreground truncate max-w-[85px] ml-0.5">
                    {selectedFilaments[0].nombreColor}
                  </span>
                )}
                {selectedFilaments.length > 1 && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({selectedFilaments.length})
                  </span>
                )}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 opacity-60" />
          </button>

          {/* Menú Desplegable Compacto de Filamentos */}
          {isFilamentOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in-50 duration-150">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Buscar color o tipo..."
                  value={filamentSearch}
                  onChange={(e) => setFilamentSearch(e.target.value)}
                  className="h-7 pl-7 text-[11px] bg-background border-input rounded-md"
                />
              </div>

              <div className="max-h-44 overflow-y-auto divide-y divide-border/40 pr-1 space-y-0.5">
                {filteredFilaments.length > 0 ? (
                  filteredFilaments.map(f => {
                    const isSelected = selectedFilaments.some(s => s.id === f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleToggleColor(f.id)}
                        className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs ${
                          isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                            style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                          />
                          <span className="truncate text-[11px]">{f.nombreColor}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {f.tipoMaterial}
                          </span>
                          {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    Sin coincidencias
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. TIER & PRECIO (w-[20%]) */}
        <div className="min-w-0 mt-2 md:mt-0">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block md:hidden mb-1">
            Tier & Precio
          </label>
          <div className="flex items-center gap-1">
            <select
              value={item.tipoPrecio}
              onChange={(e) => onUpdateItem(item.id, { tipoPrecio: e.target.value as TipoPrecio })}
              className="w-15 h-8.5 rounded-lg border border-input bg-background px-1 text-[11px] font-semibold text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shrink-0"
              title="Tier de precio"
            >
              <option value="MENOR">Menor</option>
              <option value="MAYOR">Mayor</option>
              <option value="PERSONALIZADO">Pers.</option>
            </select>
            <div className="relative flex-1 min-w-0">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={item.precioUnitario}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUpdateItem(item.id, {
                  precioUnitario: e.target.value,
                  tipoPrecio: 'PERSONALIZADO'
                })}
                className="h-8.5 px-1.5 text-xs font-mono font-bold bg-background border-input rounded-lg text-right w-full"
                title="Precio Unitario (S/)"
              />
            </div>
          </div>
        </div>

        {/* 4. CANTIDAD (w-[8%]) */}
        <div className="min-w-0 mt-2 md:mt-0">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block md:hidden mb-1">
            Cant.
          </label>
          <Input
            type="number"
            min="1"
            placeholder="1"
            value={item.cantidad}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { cantidad: e.target.value })}
            className="h-8.5 text-center text-xs font-bold font-mono bg-background border-input rounded-lg w-full"
            title="Cantidad"
          />
        </div>

        {/* 5. SUBTOTAL (w-[12%], text-right) */}
        <div className="min-w-0 mt-2 md:mt-0 flex items-center justify-between md:justify-end gap-1">
          <span className="text-xs text-muted-foreground md:hidden">Subtotal:</span>
          <span className="text-xs sm:text-sm font-bold text-foreground font-mono text-right truncate">
            {formatCurrency(itemSubtotal)}
          </span>
        </div>

        {/* 6. ACCIONES (w-[6%], text-center - Eliminado slider confuso, botón destructivo directo) */}
        <div className="min-w-0 mt-2 md:mt-0 flex items-center justify-end md:justify-center gap-1">
          {totalItems > 1 ? (
            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Quitar producto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>
      </div>

      {/* DETALLES DE PERSONALIZACIÓN Y PACKAGING (Opcional, sutil, sin inflar el alto principal) */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
        <button
          type="button"
          onClick={() => setShowSubDetails(prev => !prev)}
          className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-colors"
        >
          {showSubDetails ? 'Ocultar detalles ▲' : (item.personalizacion || Number(item.costoPackaging) > 0 ? 'Ver grabado / packaging' : '+ Agregar grabado o packaging')}
        </button>

        {showSubDetails && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Pack: S/ {Number(item.costoPackaging || 0).toFixed(2)}
          </span>
        )}
      </div>

      {showSubDetails && (
        <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in-50 duration-150">
          <div className="sm:col-span-2">
            <Input
              placeholder="Texto grabado / Notas de personalización..."
              value={item.personalizacion}
              onChange={(e) => onUpdateItem(item.id, { personalizacion: e.target.value })}
              className="h-7 text-xs bg-background border-input rounded-lg placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-medium shrink-0">Pack S/:</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={item.costoPackaging}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUpdateItem(item.id, { costoPackaging: e.target.value })}
                className="h-7 text-xs font-mono bg-background border-input rounded-lg text-right"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function OrderItemsList({
  items,
  productos,
  filamentos,
  productosComboboxItems,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  formatCurrency,
  costoEnvio,
  setCostoEnvio,
  montoPagado,
  totalPagosCount
}: OrderItemsListProps) {
  // Cálculos dinámicos
  const subtotalItems = useMemo(() => {
    return items.reduce((sum, it) => {
      const u = Number(it.precioUnitario) || 0
      const pack = Number(it.costoPackaging) || 0
      const q = Math.max(1, Number(it.cantidad) || 1)
      return sum + ((u + pack) * q)
    }, 0)
  }, [items])

  const flete = Number(costoEnvio) || 0
  const nuevoTotal = Number((subtotalItems + flete).toFixed(2))
  const saldoPendiente = Math.max(0, Number((nuevoTotal - montoPagado).toFixed(2)))

  return (
    <div className="space-y-3">
      {/* Encabezado de la Sección con UN SOLO botón de Agregar Producto */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Productos Asignados
          </span>
          <Badge className="bg-secondary text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border">
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
          </Badge>
        </div>

        {/* ÚNICO BOTÓN MINIMALISTA DE AGREGAR PRODUCTO (Eliminada la caja dashed redundante inferior) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddItem}
          className="h-7 px-2.5 text-xs text-primary font-medium hover:bg-primary/10 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Agregar Producto</span>
        </Button>
      </div>

      {/* Cabecera de Columnas Estrictamente Calibrada en Desktop (CERO fusión de textos) */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,32%)_minmax(0,22%)_minmax(0,20%)_minmax(0,8%)_minmax(0,12%)_minmax(0,6%)] md:gap-2.5 px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Modelo 3D</span>
        <span>Filamentos</span>
        <span>Tier & Precio</span>
        <span className="text-center">Cant.</span>
        <span className="text-right">Subtotal</span>
        <span className="text-center">Acciones</span>
      </div>

      {/* Lista de Filas Compactas */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <OrderItemRow
            key={item.id}
            item={item}
            index={index}
            totalItems={items.length}
            filamentos={filamentos}
            productosComboboxItems={productosComboboxItems}
            onUpdateItem={onUpdateItem}
            onRemoveItem={onRemoveItem}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      {/* LIQUIDACIÓN FINANCIERA Y TOTALES */}
      <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-foreground shrink-0">
              Costo de Envío / Flete (S/):
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={costoEnvio}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setCostoEnvio(e.target.value)}
              className="h-8 w-28 text-xs font-mono font-bold bg-background border-input rounded-lg text-right"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Abonos registrados ({totalPagosCount}):</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              +{formatCurrency(montoPagado)}
            </span>
          </div>
        </div>

        {/* Resumen Totalizador Simétrico */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center font-mono">
          <div className="p-2 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block uppercase font-medium">
              Subtotal Ítems
            </span>
            <strong className="text-xs sm:text-sm font-bold text-foreground">
              {formatCurrency(subtotalItems)}
            </strong>
          </div>

          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <span className="text-[10px] text-primary block uppercase font-bold">
              Nuevo Total
            </span>
            <strong className="text-sm sm:text-base font-black text-primary">
              {formatCurrency(nuevoTotal)}
            </strong>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2 bg-accent/60 rounded-xl border border-border">
            <span className="text-[10px] text-accent-foreground block uppercase font-bold">
              Saldo Pendiente
            </span>
            <strong className="text-sm sm:text-base font-black text-accent-foreground">
              {formatCurrency(saldoPendiente)}
            </strong>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Los abonos previos ({formatCurrency(montoPagado)}) se conservan intactos. Si el total cambia, el saldo se recalcula automáticamente.
        </p>
      </div>
    </div>
  )
}
