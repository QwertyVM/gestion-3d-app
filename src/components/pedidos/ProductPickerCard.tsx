'use client'

import React from 'react'
import { Box, Layers, ShoppingBag } from 'lucide-react'
import { TipoPrecio } from '@prisma/client'
import { ProductGroupItem, ProductVariantItem } from './productHierarchy'

export interface ProductSelectPayload {
  productoId: string
  varianteId?: string
  nombreDisplay: string
  imageUrl?: string | null
  precioUnitario: number
  tierPrecio: TipoPrecio
  costoBase: number
}

interface ProductPickerCardProps {
  group: ProductGroupItem
  formatCurrency: (val: number) => string
  onSelect: (payload: ProductSelectPayload) => void
}

export function ProductPickerCard({
  group,
  formatCurrency,
  onSelect
}: ProductPickerCardProps) {
  const imageUrl = group.imagenUrl || (group.singleVariant && group.singleVariant.imagenUrl) || null
  const hasVariants = group.hasVariants && group.variants.length > 1

  // Costo base format
  const baseCostText = React.useMemo(() => {
    if (!hasVariants) {
      const single = group.singleVariant || group.variants[0]
      return `Base: ${formatCurrency(single?.costoBase || 0)}`
    }
    const costs = group.variants.map(v => v.costoBase)
    const minCost = Math.min(...costs)
    const maxCost = Math.max(...costs)
    if (minCost === maxCost) {
      return `Base: ${formatCurrency(minCost)}`
    }
    return `Base: ${formatCurrency(minCost)} – ${formatCurrency(maxCost)}`
  }, [hasVariants, group.singleVariant, group.variants, formatCurrency])

  const handleSelectSimple = (tier: 'MENOR' | 'MAYOR') => {
    const single = group.singleVariant || group.variants[0]
    if (!single) return

    const price = tier === 'MAYOR' ? single.precioMayor : single.precioMenor
    onSelect({
      productoId: group.productoId,
      varianteId: single.id,
      nombreDisplay: group.baseName,
      imageUrl,
      precioUnitario: price,
      tierPrecio: tier as TipoPrecio,
      costoBase: single.costoBase
    })
  }

  const handleSelectVariant = (variant: ProductVariantItem, tier: 'MENOR' | 'MAYOR') => {
    const price = tier === 'MAYOR' ? variant.precioMayor : variant.precioMenor
    onSelect({
      productoId: group.productoId,
      varianteId: variant.id,
      nombreDisplay: `${group.baseName} - ${variant.nombreVariante}`,
      imageUrl: variant.imagenUrl || imageUrl,
      precioUnitario: price,
      tierPrecio: tier as TipoPrecio,
      costoBase: variant.costoBase
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between group">
      {/* ========================================================================= */}
      {/* ZONA DE IMAGEN (aspect-[4/3])                                             */}
      {/* ========================================================================= */}
      <div className="aspect-[4/3] relative w-full bg-secondary/40 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={group.baseName}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
            <Box className="w-8 h-8 text-primary/40 stroke-[1.5]" />
            <span className="text-[10px] font-medium text-muted-foreground mt-1">
              Sin fotografía
            </span>
          </div>
        )}

        {/* Badge flotante en esquina: Categoría */}
        <span className="text-[9px] font-bold bg-card/90 backdrop-blur-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border/70 absolute top-2 left-2 shadow-2xs max-w-[70%] truncate">
          {group.categoria}
        </span>

        {/* Badge flotante de versiones (si aplica) */}
        {hasVariants && (
          <span className="text-[9px] font-bold bg-accent/90 backdrop-blur-xs text-accent-foreground px-2 py-0.5 rounded-md border border-border/70 absolute top-2 right-2 shadow-2xs flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" />
            <span>{group.variants.length} vers.</span>
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ZONA DE TÍTULO E INFORMACIÓN                                              */}
      {/* ========================================================================= */}
      <div className="p-3 pb-2 space-y-1">
        <h4
          className="text-xs font-bold text-foreground line-clamp-1"
          title={group.baseName}
        >
          {group.baseName}
        </h4>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>{baseCostText}</span>
          <span
            className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground"
            title={`Asociado a ${group.pedidosCount ?? 0} ${group.pedidosCount === 1 ? 'pedido' : 'pedidos'}`}
          >
            <ShoppingBag className="w-2.5 h-2.5 text-primary" />
            <span>{(group.pedidosCount ?? 0)} {(group.pedidosCount ?? 0) === 1 ? 'pedido' : 'pedidos'}</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTOR DE PRECIO INTEGRADO (SELECCIÓN CON 1 CLIC)                       */}
      {/* ========================================================================= */}
      <div className="p-2.5 pt-0 mt-auto">
        {!hasVariants ? (
          // Producto Simple: 2 Columnas (PVP Menor y PVP Mayor)
          <div className="grid grid-cols-2 gap-1.5">
            {/* Botón PVP Menor */}
            <button
              type="button"
              onClick={() => handleSelectSimple('MENOR')}
              className="h-auto py-1.5 px-2 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-all flex flex-col items-center justify-center group/btn cursor-pointer"
              title="Seleccionar a precio por menor"
            >
              <span className="text-[8px] font-semibold uppercase opacity-75 group-hover/btn:text-primary-foreground">
                MENOR
              </span>
              <span className="text-xs font-extrabold group-hover/btn:text-primary-foreground">
                {formatCurrency((group.singleVariant || group.variants[0])?.precioMenor || 0)}
              </span>
            </button>

            {/* Botón PVP Mayor */}
            <button
              type="button"
              onClick={() => handleSelectSimple('MAYOR')}
              className="h-auto py-1.5 px-2 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-all flex flex-col items-center justify-center group/btn cursor-pointer"
              title="Seleccionar a precio por mayor"
            >
              <span className="text-[8px] font-semibold uppercase opacity-75 group-hover/btn:text-primary-foreground">
                MAYOR
              </span>
              <span className="text-xs font-extrabold group-hover/btn:text-primary-foreground">
                {formatCurrency((group.singleVariant || group.variants[0])?.precioMayor || 0)}
              </span>
            </button>
          </div>
        ) : (
          // Producto con Variantes: Lista vertical compacta de botones por cada versión
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 no-scrollbar">
            {group.variants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-1">
                {/* Botón Principal: Variante con PVP Menor */}
                <button
                  type="button"
                  onClick={() => handleSelectVariant(variant, 'MENOR')}
                  className="flex-1 h-auto py-1.5 px-2 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-all flex items-center justify-between text-xs group/btn cursor-pointer min-w-0"
                  title={`Seleccionar ${variant.nombreVariante} (PVP Menor: ${formatCurrency(variant.precioMenor)})`}
                >
                  <span className="text-[10px] font-semibold truncate group-hover/btn:text-primary-foreground mr-1">
                    {variant.nombreVariante}
                  </span>
                  <span className="text-xs font-extrabold shrink-0 group-hover/btn:text-primary-foreground">
                    {formatCurrency(variant.precioMenor)}
                  </span>
                </button>

                {/* Botón Auxiliar: PVP Mayor */}
                {variant.precioMayor > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectVariant(variant, 'MAYOR')}
                    className="h-auto py-1 px-1.5 rounded-lg bg-secondary/60 hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-all flex flex-col items-center justify-center shrink-0 group/btn cursor-pointer"
                    title={`Seleccionar ${variant.nombreVariante} (PVP Mayor: ${formatCurrency(variant.precioMayor)})`}
                  >
                    <span className="text-[7px] font-bold uppercase opacity-75 group-hover/btn:text-primary-foreground">
                      MAYOR
                    </span>
                    <span className="text-[10px] font-extrabold group-hover/btn:text-primary-foreground">
                      {formatCurrency(variant.precioMayor)}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
