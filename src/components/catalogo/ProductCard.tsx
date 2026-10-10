'use client'

import React, { useMemo } from 'react'
import {
  Box,
  Eye,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
  Share2,
  Archive,
  RotateCcw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import type { ProductGroupRow } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'

export interface ProductCardProps {
  row: ProductGroupRow
  onViewDetail: (group?: ProductGroupRow, single?: ProductoItem) => void
  onEdit: (product: ProductoItem) => void
  onEditGroup?: (group: ProductGroupRow) => void
  onDuplicar: (product: ProductoItem) => void
  onDuplicarGroup?: (group: ProductGroupRow) => void
  onDeleteProduct?: (product: ProductoItem) => void
  onDeleteGroup?: (group: ProductGroupRow) => void
  onToggleEstado?: (product: ProductoItem) => void
  onCopiarCotizacion?: (product: ProductoItem) => void
  onCopyGroupQuotation?: (group: ProductGroupRow) => void
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
}

export function ProductCard({
  row,
  onViewDetail,
  onEdit,
  onEditGroup,
  onDuplicar,
  onDuplicarGroup,
  onDeleteProduct,
  onDeleteGroup,
  onToggleEstado,
  onCopiarCotizacion,
  onCopyGroupQuotation,
  formatCurrency,
  calcMargen
}: ProductCardProps) {
  const isGroup = row.isGroup
  const isMultiVariant = isGroup && row.totalVariants > 1
  const primaryProduct = isGroup
    ? row.variants[0]?.producto
    : (row.singleProduct || row.variants[0]?.producto)

  // Imagen del modelo o variante
  const imageUrl = isGroup
    ? (row.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || null)
    : (primaryProduct?.imagenUrl || null)

  // Link a MakerWorld
  const enlaceMakerworld = isGroup
    ? (row.variants.find((v) => v.producto.enlaceMakerworld)?.producto.enlaceMakerworld || null)
    : (primaryProduct?.enlaceMakerworld || null)

  // Estado consolidado
  const isActive = row.hasActive

  // Formatos de precio y costo
  const baseCostFormatted = isMultiVariant && row.minCosto !== row.maxCosto
    ? `${formatCurrency(row.minCosto)} – ${formatCurrency(row.maxCosto)}`
    : formatCurrency(row.minCosto)

  const menorPriceFormatted = isMultiVariant && row.minPrecioMenor !== row.maxPrecioMenor
    ? `${formatCurrency(row.minPrecioMenor)} – ${formatCurrency(row.maxPrecioMenor)}`
    : formatCurrency(row.minPrecioMenor)

  const mayorPriceFormatted = isMultiVariant && row.minPrecioMayor !== row.maxPrecioMayor
    ? `${formatCurrency(row.minPrecioMayor)} – ${formatCurrency(row.maxPrecioMayor)}`
    : formatCurrency(row.minPrecioMayor)

  // Margen Por Menor
  const menorMargen = useMemo(() => {
    if (!isGroup || row.variants.length <= 1) {
      const costo = primaryProduct?.costoBase || 0
      const precio = primaryProduct?.precioMenor || 0
      return calcMargen(precio, costo)
    }
    const margenes = row.variants.map((v) => {
      const c = v.producto.costoBase || 0
      const p = v.producto.precioMenor || 0
      return c > 0 ? ((p - c) / c) * 100 : (p > 0 ? 100 : 0)
    })
    const minM = Math.min(...margenes)
    const maxM = Math.max(...margenes)
    if (Math.round(minM) === Math.round(maxM)) {
      return minM >= 0 ? `+${Math.round(minM)}%` : `${Math.round(minM)}%`
    }
    const minStr = minM >= 0 ? `+${Math.round(minM)}%` : `${Math.round(minM)}%`
    const maxStr = maxM >= 0 ? `+${Math.round(maxM)}%` : `${Math.round(maxM)}%`
    return `${minStr} ~ ${maxStr}`
  }, [isGroup, row.variants, primaryProduct, calcMargen])

  // Margen Por Mayor
  const mayorMargen = useMemo(() => {
    if (!isGroup || row.variants.length <= 1) {
      const costo = primaryProduct?.costoBase || 0
      const precio = primaryProduct?.precioMayor || 0
      return calcMargen(precio, costo)
    }
    const margenes = row.variants.map((v) => {
      const c = v.producto.costoBase || 0
      const p = v.producto.precioMayor || 0
      return c > 0 ? ((p - c) / c) * 100 : (p > 0 ? 100 : 0)
    })
    const minM = Math.min(...margenes)
    const maxM = Math.max(...margenes)
    if (Math.round(minM) === Math.round(maxM)) {
      return minM >= 0 ? `+${Math.round(minM)}%` : `${Math.round(minM)}%`
    }
    const minStr = minM >= 0 ? `+${Math.round(minM)}%` : `${Math.round(minM)}%`
    const maxStr = maxM >= 0 ? `+${Math.round(maxM)}%` : `${Math.round(maxM)}%`
    return `${minStr} ~ ${maxStr}`
  }, [isGroup, row.variants, primaryProduct, calcMargen])

  const handleCardClick = () => {
    if (row.isGroup) {
      onViewDetail(row, undefined)
    } else {
      onViewDetail(undefined, primaryProduct)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* ========================================================================= */}
      {/* ZONA SUPERIOR: Fotografía / Render 3D (aspect-[4/3])                      */}
      {/* ========================================================================= */}
      <div className="relative w-full aspect-[4/3] bg-secondary/50 border-b border-border/60 flex items-center justify-center overflow-hidden">
        {/* Render de Imagen o Placeholder 3D */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={row.baseName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Box className="w-12 h-12 text-primary/40 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-muted-foreground mt-1">
              Sin fotografía
            </span>
          </div>
        )}

        {/* Overlays Flotantes en Esquinas */}
        {/* Top-Left: Badge de Estado */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isActive ? (
            <span className="bg-card/90 backdrop-blur-xs text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/80 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
              <span>Activo</span>
            </span>
          ) : (
            <span className="bg-card/90 backdrop-blur-xs text-muted-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/80 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
              <span>Archivado</span>
            </span>
          )}
        </div>

        {/* Top-Right: Variantes y Chip MakerWorld */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {isMultiVariant && (
            <span className="bg-accent/90 backdrop-blur-xs text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/80 shadow-2xs">
              {row.totalVariants} {row.totalVariants === 1 ? 'versión' : 'versiones'}
            </span>
          )}
          {enlaceMakerworld && (
            <a
              href={enlaceMakerworld}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-card/90 backdrop-blur-xs text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border/80 flex items-center gap-1 hover:text-primary transition-colors shadow-2xs cursor-pointer"
              title="Abrir en MakerWorld"
            >
              <ExternalLink className="w-2.5 h-2.5 text-primary" />
              <span>MakerWorld</span>
            </a>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONA CENTRAL: Información y Tiers Financieros                             */}
      {/* ========================================================================= */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Identidad */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {row.lineaCategoria || 'ACCESORIOS'}
          </div>
          <h3
            className="text-sm font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors"
            title={row.baseName}
          >
            {row.baseName}
          </h3>
          <div className="text-xs text-muted-foreground flex items-center justify-between pt-0.5">
            <span>Costo Base:</span>
            <span className="font-semibold text-foreground font-mono">
              {baseCostFormatted}
            </span>
          </div>
        </div>

        {/* Cajas de Precio y Margen (Tiers Menor & Mayor) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Caja Por Menor */}
          <div className="bg-secondary/40 border border-border/70 rounded-xl p-2 text-center shadow-2xs">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
              MENOR
            </span>
            <span
              className="text-xs font-extrabold text-foreground mt-0.5 block font-mono truncate"
              title={menorPriceFormatted}
            >
              {menorPriceFormatted}
            </span>
            <span
              className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block font-mono truncate"
              title={menorMargen}
            >
              {menorMargen}
            </span>
          </div>

          {/* Caja Por Mayor */}
          <div className="bg-secondary/40 border border-border/70 rounded-xl p-2 text-center shadow-2xs">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
              MAYOR
            </span>
            <span
              className="text-xs font-extrabold text-foreground mt-0.5 block font-mono truncate"
              title={mayorPriceFormatted}
            >
              {mayorPriceFormatted}
            </span>
            <span
              className="text-[10px] font-bold text-primary block font-mono truncate"
              title={mayorMargen}
            >
              {mayorMargen}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONA INFERIOR: Acciones de la Tarjeta                                     */}
      {/* ========================================================================= */}
      <div className="px-4 pb-3.5 pt-2 border-t border-border/50 flex items-center justify-between mt-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleCardClick()
          }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span>Ver Detalle</span>
        </button>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center border border-transparent hover:border-border/60 cursor-pointer outline-none"
              title="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">Acciones</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 bg-card border border-border rounded-xl shadow-lg p-1"
            >
              <DropdownMenuItem
                onClick={() => handleCardClick()}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>Ver Detalle del Modelo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (row.isGroup && onEditGroup) {
                    onEditGroup(row)
                  } else if (primaryProduct) {
                    onEdit(primaryProduct)
                  }
                }}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <span>Editar {row.isGroup ? 'Producto y Versiones' : 'Producto'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (row.isGroup && onDuplicarGroup) {
                    onDuplicarGroup(row)
                  } else if (primaryProduct) {
                    onDuplicar(primaryProduct)
                  }
                }}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Copy className="h-3.5 w-3.5 text-primary" />
                <span>Duplicar Modelo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (row.isGroup && onCopyGroupQuotation) {
                    onCopyGroupQuotation(row)
                  } else if (primaryProduct && onCopiarCotizacion) {
                    onCopiarCotizacion(primaryProduct)
                  }
                }}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" />
                <span>Copiar Cotización</span>
              </DropdownMenuItem>
              {primaryProduct && !row.isGroup && onToggleEstado && (
                <DropdownMenuItem
                  onClick={() => onToggleEstado(primaryProduct)}
                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                >
                  {primaryProduct.activo ? (
                    <>
                      <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Archivar Producto</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Reactivar Producto</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1 bg-border/60" />
              <DropdownMenuItem
                onClick={() => {
                  if (row.isGroup && onDeleteGroup) {
                    onDeleteGroup(row)
                  } else if (primaryProduct && onDeleteProduct) {
                    onDeleteProduct(primaryProduct)
                  }
                }}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                <span>Eliminar Producto</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
