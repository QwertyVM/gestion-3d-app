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
import { groupCatalogProducts, findVariantInGroups } from './productHierarchy'
import { ProductPickerModal } from './ProductPickerModal'

interface OrderItemCardProps {
  item: FormItemState
  index: number
  totalItems: number
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  productosComboboxItems?: ComboboxItem[]
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
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isFilamentOpen, setIsFilamentOpen] = useState(false)
  const [filamentSearch, setFilamentSearch] = useState('')
  const filamentDropdownRef = useRef<HTMLDivElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  // Información visual del modelo seleccionado
  const selectedProductInfo = useMemo(() => {
    if (!item.productoId && !item.varianteId) return null
    const catalogGroups = groupCatalogProducts(productos)
    const match = findVariantInGroups(catalogGroups, item.varianteId || item.productoId)
    const rawProduct = productos.find(p => p.id === item.productoId)

    const name =
      item.nombreDisplay ||
      (match?.group.hasVariants
        ? `${match.group.baseName} - ${match.variant.nombreVariante}`
        : match?.group.baseName) ||
      rawProduct?.nombreModelo ||
      'Modelo 3D'

    const imageUrl =
      item.imageUrl ||
      match?.variant.imagenUrl ||
      match?.group.imagenUrl ||
      rawProduct?.imagenUrl ||
      (rawProduct as any)?.imageUrl ||
      null

    const tierName =
      item.tipoPrecio === 'MAYOR'
        ? 'PVP Mayor'
        : item.tipoPrecio === 'MENOR'
        ? 'PVP Menor'
        : 'Personalizado'

    const priceNum = Number(item.precioUnitario)
    const priceFormatted = !isNaN(priceNum) && priceNum > 0 ? formatCurrency(priceNum) : ''
    const tierSubtext = priceFormatted ? `${tierName} • ${priceFormatted}` : tierName

    return {
      name,
      imageUrl,
      tierSubtext
    }
  }, [
    item.productoId,
    item.varianteId,
    item.nombreDisplay,
    item.imageUrl,
    item.tipoPrecio,
    item.precioUnitario,
    productos,
    formatCurrency
  ])

  const isSelected = Boolean(item.productoId || item.varianteId)

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
    <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5 shadow-sm transition-all duration-200 hover:border-primary/30 animate-in fade-in-50 slide-in-from-top-1 relative">
      {/* Cabecera de la Tarjeta con Layout Flex Compacto */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
        <span className="bg-accent/80 text-accent-foreground font-semibold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1.5">
          <Package className="h-3 w-3 text-accent-foreground" />
          <span>PRODUCTO #{index + 1}</span>
        </span>

        {totalItems > 1 && (
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="text-destructive hover:bg-destructive/10 rounded-md p-1 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
            title="Quitar este producto del pedido"
          >
            <Trash2 className="h-3 w-3" />
            <span>Quitar</span>
          </button>
        )}
      </div>

      {/* Fila 1: Modelo 3D (flexible) y Filamento(s) (multi-select compacto) */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-start">
        {/* Selección de Modelo 3D (visual picker trigger) */}
        <div className="flex-1 w-full sm:min-w-0 space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Boxes className="h-3 w-3 text-primary" />
            Modelo 3D *
          </Label>
          {!isSelected ? (
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="w-full h-12 rounded-xl border border-dashed border-primary/50 bg-secondary/30 hover:bg-secondary/60 hover:border-primary text-foreground text-xs font-semibold flex items-center justify-between px-4 transition-all group cursor-pointer"
            >
              <div className="flex items-center min-w-0">
                <Sparkles className="text-primary w-4 h-4 mr-2 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">Seleccionar modelo 3D (Explorar galería)...</span>
              </div>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                Catálogo Visual
              </span>
            </button>
          ) : (
            <div className="w-full bg-card border border-border rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedProductInfo?.imageUrl ? (
                  <img
                    src={selectedProductInfo.imageUrl}
                    alt={selectedProductInfo.name}
                    className="w-11 h-11 rounded-lg object-cover border border-border/70 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-secondary/70 border border-border/70 flex items-center justify-center shrink-0 text-primary/60">
                    <Boxes className="w-5 h-5 stroke-[1.5]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className="text-xs font-bold text-foreground truncate"
                    title={selectedProductInfo?.name}
                  >
                    {selectedProductInfo?.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate font-mono">
                    {selectedProductInfo?.tierSubtext}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
                className="text-primary hover:bg-primary/10 text-xs font-semibold h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cambiar</span>
              </Button>
            </div>
          )}

          {/* Modal de Selección Visual de Productos */}
          <ProductPickerModal
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            productos={productos}
            formatCurrency={formatCurrency}
            onSelect={(payload) => {
              onUpdateItem(item.id, {
                productoId: payload.productoId,
                varianteId: payload.varianteId,
                nombreDisplay: payload.nombreDisplay,
                imageUrl: payload.imageUrl,
                costoBase: payload.costoBase,
                precioUnitario: payload.precioUnitario,
                tipoPrecio: payload.tierPrecio
              })
              setIsPickerOpen(false)
              setTimeout(() => {
                quantityInputRef.current?.focus()
              }, 80)
            }}
          />
        </div>

        {/* Multi-selector de Filamentos (compacto) */}
        <div ref={filamentDropdownRef} className="w-full sm:w-[42%] shrink-0 space-y-1 relative">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3 w-3 text-primary" />
              <span>Filamento(s)</span>
              {selectedFilaments.length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-accent text-accent-foreground border border-border">
                  {selectedFilaments.length}
                </span>
              )}
            </Label>
            {selectedFilaments.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilaments}
                className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer font-normal underline-offset-2 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Trigger de Selección */}
          <div
            onClick={() => setIsFilamentOpen(prev => !prev)}
            className="min-h-[36px] p-1 px-2 rounded-xl border border-input bg-card/80 text-foreground text-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 flex flex-wrap items-center gap-1 cursor-pointer shadow-2xs transition-all"
          >
            {selectedFilaments.length === 0 ? (
              <div className="flex items-center justify-between w-full px-1 text-xs text-muted-foreground">
                <span className="italic text-[11px]">Sin asignar / Varios colores</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
                  {selectedFilaments.map((f) => (
                    <span
                      key={f.id}
                      className="bg-secondary text-secondary-foreground text-[11px] px-2 py-0.5 rounded-md border border-border/80 flex items-center gap-1 shadow-2xs group"
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block mr-0.5 border border-black/20 shrink-0"
                        style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                      />
                      <span className="truncate max-w-[80px] font-medium">{f.nombreColor}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFilament(f.id, e)}
                        className="text-muted-foreground hover:text-destructive rounded-full p-0.5 cursor-pointer transition-colors"
                        title="Quitar filamento"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground pr-0.5 shrink-0" />
              </>
            )}
          </div>

          {/* Dropdown de Filamentos */}
          {isFilamentOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border shadow-lg rounded-xl overflow-hidden py-1 z-50 animate-in fade-in-50 duration-150">
              <div className="p-1.5 border-b border-border flex items-center gap-1.5">
                <Search className="h-3 w-3 text-muted-foreground" />
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
                        className={`hover:bg-muted/70 transition-colors cursor-pointer px-2 py-1 text-xs flex justify-between items-center rounded-lg ${
                          isSelected ? 'bg-secondary font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
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
                          {isSelected && <Check className="h-3 w-3 text-primary" />}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-2.5 text-center text-xs text-muted-foreground">
                    No se encontró ningún filamento
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fila 2: 5 Columnas Horizontales Compactas */}
      <div className="flex flex-wrap sm:flex-nowrap items-end gap-2.5">
        {/* Tier (Por Menor) */}
        <div className="flex-1 min-w-[110px] space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Tier
          </Label>
          <select
            value={item.tipoPrecio}
            onChange={(e) => {
              const newTier = e.target.value as TipoPrecio
              const targetId = item.varianteId || item.productoId
              const catalogGroups = groupCatalogProducts(productos)
              const match = findVariantInGroups(catalogGroups, targetId)
              let newPrice = item.precioUnitario
              if (match) {
                if (newTier === 'MAYOR' || (newTier as string) === 'AMIGOS') {
                  newPrice = match.variant.precioMayor
                } else if (newTier === 'MENOR' || (newTier as string) === 'MERCADO') {
                  newPrice = match.variant.precioMenor
                }
              }
              onUpdateItem(item.id, {
                tipoPrecio: newTier,
                precioUnitario: newPrice
              })
            }}
            className="w-full h-9 rounded-xl border border-input bg-card/80 text-foreground text-xs font-semibold px-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="MENOR">Por Menor</option>
            <option value="MAYOR">Por Mayor</option>
            <option value="PERSONALIZADO">Personalizado</option>
          </select>
        </div>

        {/* Cantidad (w-20) */}
        <div className="w-20 shrink-0 space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Cantidad
          </Label>
          <Input
            ref={quantityInputRef}
            type="number"
            min="1"
            placeholder="1"
            value={item.cantidad}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { cantidad: e.target.value })}
            className="h-9 rounded-xl border-input bg-card/80 text-foreground text-xs font-mono font-semibold px-2 text-center focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Unitario S/ (w-24) */}
        <div className="w-24 shrink-0 space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
            Unitario S/
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={item.precioUnitario}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { precioUnitario: e.target.value, tipoPrecio: 'PERSONALIZADO' })}
            className="h-9 rounded-xl border-input bg-card/80 text-foreground text-xs font-mono font-bold px-2 text-right focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Packaging S/ (w-24) */}
        <div className="w-24 shrink-0 space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
            Packaging S/
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={item.costoPackaging}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateItem(item.id, { costoPackaging: e.target.value })}
            className="h-9 rounded-xl border-input bg-card/80 text-foreground text-xs font-mono px-2 text-right focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Subtotal Ítem (badge destacado a la derecha) */}
        <div className="shrink-0 space-y-1 text-right flex flex-col items-end">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Subtotal Ítem
          </Label>
          <div className="h-9 px-3 rounded-xl bg-secondary border border-border/80 flex items-center justify-center font-bold text-xs font-mono text-foreground shadow-2xs">
            {formatCurrency(itemSubtotal)}
          </div>
        </div>
      </div>

      {/* Fila 3: Notas / Personalización / Grabado (input delgado con placeholder discreto) */}
      <div>
        <Input
          placeholder="Notas / Personalización / Grabado del modelo (opcional)..."
          value={item.personalizacion}
          onChange={(e) => onUpdateItem(item.id, { personalizacion: e.target.value })}
          className="h-8 rounded-lg border-input/70 bg-card/60 text-foreground text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all w-full"
        />
      </div>
    </div>
  )
}

export const OrderProductItemForm = OrderItemCard
