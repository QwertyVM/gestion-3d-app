'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Package,
  Trash2,
  Boxes,
  Palette,
  X,
  Check,
  ChevronDown,
  Search,
  Sparkles,
  Layers
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'
import { TipoPrecio } from '@prisma/client'
import { FormItemState, ProductoOption, FilamentoOption } from './types'

interface OrderItemCardProps {
  item: FormItemState
  index: number
  totalItems: number
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  productosComboboxItems: ComboboxItem[]
  onUpdateItem: (id: string, updates: Partial<FormItemState>) => void
  onRemoveItem: (id: string) => void
  formatCurrency: (val: number) => string
}

export function OrderItemCard({
  item,
  index,
  totalItems,
  productos,
  filamentos,
  productosComboboxItems,
  onUpdateItem,
  onRemoveItem,
  formatCurrency
}: OrderItemCardProps) {
  const [isFilamentOpen, setIsFilamentOpen] = useState(false)
  const [filamentSearch, setFilamentSearch] = useState('')
  const filamentDropdownRef = useRef<HTMLDivElement>(null)

  // Subtotal calculado para este ítem
  const itemSubtotal = useMemo(() => {
    const unit = Number(item.precioUnitario) || 0
    const pack = Number(item.costoPackaging) || 0
    const cant = Math.max(1, Number(item.cantidad) || 1)
    return (unit + pack) * cant
  }, [item.precioUnitario, item.costoPackaging, item.cantidad])

  // Filamentos seleccionados actualmente
  const selectedFilaments = useMemo(() => {
    const ids = item.coloresIds || (item.colorFilamentoId ? [item.colorFilamentoId] : [])
    return ids
      .map(id => filamentos.find(f => f.id === id))
      .filter((f): f is FilamentoOption => Boolean(f))
  }, [item.coloresIds, item.colorFilamentoId, filamentos])

  // Filtrado de filamentos en el dropdown
  const filteredFilaments = useMemo(() => {
    if (!filamentSearch.trim()) return filamentos
    const q = filamentSearch.toLowerCase()
    return filamentos.filter(f =>
      f.nombreColor.toLowerCase().includes(q) ||
      (f.tipoMaterial && f.tipoMaterial.toLowerCase().includes(q)) ||
      (f.marca && f.marca.toLowerCase().includes(q))
    )
  }, [filamentos, filamentSearch])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filamentDropdownRef.current && !filamentDropdownRef.current.contains(e.target as Node)) {
        setIsFilamentOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleFilament = (filId: string) => {
    const current = item.coloresIds || (item.colorFilamentoId ? [item.colorFilamentoId] : [])
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

  const handleRemoveFilament = (filId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const current = item.coloresIds || (item.colorFilamentoId ? [item.colorFilamentoId] : [])
    const next = current.filter(id => id !== filId)
    onUpdateItem(item.id, {
      coloresIds: next,
      colorFilamentoId: next[0] || ''
    })
  }

  const handleClearAllFilaments = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdateItem(item.id, {
      coloresIds: [],
      colorFilamentoId: ''
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-4.5 space-y-3.5 shadow-sm transition-all duration-200 hover:border-primary/30 animate-in fade-in-50 slide-in-from-top-2 duration-200 relative">
      {/* Cabecera de la Tarjeta con Layout Flex */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <span className="bg-accent text-accent-foreground font-semibold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-accent-foreground" />
          <span>PRODUCTO #{index + 1}</span>
        </span>

        {totalItems > 1 && (
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
            title="Quitar este producto del pedido"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Quitar</span>
          </button>
        )}
      </div>

      {/* Grid de Datos Técnicos - Fila 1: Modelo 3D (60%) y Filamentos (40%) */}
      <div className="flex flex-col md:flex-row gap-3.5 items-start">
        {/* Selección de Modelo 3D (60% ancho) */}
        <div className="w-full md:w-[60%] space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Boxes className="h-3.5 w-3.5 text-primary" />
            Modelo 3D *
          </Label>
          <SearchableCombobox
            items={productosComboboxItems}
            value={item.productoId}
            onChange={(newId) => onUpdateItem(item.id, { productoId: newId })}
            placeholder="Buscar modelo 3D..."
            searchPlaceholder="Escribe para filtrar modelo..."
            emptyMessage="No se encontró ningún modelo"
            icon={Boxes}
            size="sm"
            inputClassName="bg-card/80 border-input text-foreground text-sm font-semibold h-10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20"
            clearable={false}
          />
        </div>

        {/* Multi-selector de Filamentos (40% ancho) */}
        <div ref={filamentDropdownRef} className="w-full md:w-[40%] space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span>Filamento(s)</span>
              {selectedFilaments.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-accent text-accent-foreground border border-border">
                  {selectedFilaments.length}
                </span>
              )}
            </Label>
            {selectedFilaments.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilaments}
                className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer font-normal underline-offset-2 hover:underline"
              >
                Quitar todos
              </button>
            )}
          </div>

          {/* Selector Trigger con Chips de Filamento */}
          <div
            onClick={() => setIsFilamentOpen(prev => !prev)}
            className="min-h-[40px] p-1.5 rounded-xl border border-input bg-card/80 text-foreground text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 flex flex-wrap items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
          >
            {selectedFilaments.length === 0 ? (
              <div className="flex items-center justify-between w-full px-2 text-xs text-muted-foreground">
                <span className="italic">Sin asignar / Varios colores</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  {selectedFilaments.map((f) => (
                    <span
                      key={f.id}
                      className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-lg border border-border/80 flex items-center gap-1 shadow-2xs group"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block mr-1.5 border border-black/20 shrink-0"
                        style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                      />
                      <span className="truncate max-w-[95px] font-medium">{f.nombreColor}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFilament(f.id, e)}
                        className="text-muted-foreground hover:text-destructive rounded-full p-0.5 cursor-pointer transition-colors"
                        title="Quitar filamento"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground pr-1 shrink-0" />
              </>
            )}
          </div>

          {/* Dropdown de Selección de Filamentos con Preview Visual */}
          {isFilamentOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border shadow-lg rounded-xl overflow-hidden py-1 z-50 animate-in fade-in-50 duration-150">
              <div className="p-2 border-b border-border flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filtrar filamento..."
                  value={filamentSearch}
                  onChange={(e) => setFilamentSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-border/40 p-1">
                {filteredFilaments.length > 0 ? (
                  filteredFilaments.map((f) => {
                    const isSelected = (item.coloresIds || []).includes(f.id) || item.colorFilamentoId === f.id
                    return (
                      <div
                        key={f.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFilament(f.id)
                        }}
                        className={`hover:bg-muted/70 transition-colors cursor-pointer px-2.5 py-1.5 text-xs flex justify-between items-center rounded-lg ${
                          isSelected ? 'bg-secondary font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                          />
                          <span className="truncate text-foreground text-xs">{f.nombreColor}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {f.tipoMaterial || ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {f.stockGramos != null && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {f.stockGramos}g
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No se encontró ningún filamento
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Datos Técnicos - Fila 2: 4 Columnas Simétricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Tier de Precio */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Tier de Precio
          </Label>
          <select
            value={item.tipoPrecio}
            onChange={(e) => onUpdateItem(item.id, { tipoPrecio: e.target.value as TipoPrecio })}
            className="w-full h-10 rounded-xl border border-input bg-card/80 text-foreground text-sm font-semibold px-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="MENOR">Por Menor</option>
            <option value="MAYOR">Por Mayor</option>
            <option value="PERSONALIZADO">Personalizado</option>
          </select>
        </div>

        {/* Cantidad */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Cantidad
          </Label>
          <Input
            type="number"
            min="1"
            placeholder="1"
            value={item.cantidad}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { cantidad: e.target.value })}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Precio Unitario */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Unitario (S/)
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={item.precioUnitario}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { precioUnitario: e.target.value, tipoPrecio: 'PERSONALIZADO' })}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono font-bold text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Packaging */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Packaging (S/)
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={item.costoPackaging}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { costoPackaging: e.target.value })}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Footer de la Tarjeta: Personalización y Subtotal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
        <div className="flex-1 w-full">
          <Input
            placeholder="Personalización / Texto grabado / Notas del modelo..."
            value={item.personalizacion}
            onChange={(e) => onUpdateItem(item.id, { personalizacion: e.target.value })}
            className="h-10 rounded-xl border-input bg-card/80 text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60 w-full"
          />
        </div>

        {/* Badge de Subtotal del Ítem */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto font-mono">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Subtotal Ítem:
          </span>
          <span className="text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg font-mono">
            {formatCurrency(itemSubtotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
