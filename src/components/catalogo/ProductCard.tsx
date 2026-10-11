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
  RotateCcw,
  ShoppingBag
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
  const pedidosCount = row.pedidosCount ?? 0
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

  // Helper de redondeo limpio sin decimales innecesarios
  const formatNum = (n: number) =>
    n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '')

  // Costo Base (rango simplificado ej: S/ 96 – S/ 106)
  const baseCostFormatted = useMemo(() => {
    if (isMultiVariant && row.minCosto !== row.maxCosto) {
      return `S/ ${formatNum(row.minCosto)} – S/ ${formatNum(row.maxCosto)}`
    }
    return formatCurrency(row.minCosto)
  }, [isMultiVariant, row.minCosto, row.maxCosto, formatCurrency])

  // Precio Menor comercial compacto (ej: S/ 160 – 190)
  const menorPriceFormatted = useMemo(() => {
    if (isMultiVariant && row.minPrecioMenor !== row.maxPrecioMenor) {
      return `S/ ${formatNum(row.minPrecioMenor)} – ${formatNum(row.maxPrecioMenor)}`
    }
    return formatCurrency(row.minPrecioMenor)
  }, [isMultiVariant, row.minPrecioMenor, row.maxPrecioMenor, formatCurrency])

  // Precio Mayor comercial compacto (ej: S/ 130 – 150)
  const mayorPriceFormatted = useMemo(() => {
    if (isMultiVariant && row.minPrecioMayor !== row.maxPrecioMayor) {
      return `S/ ${formatNum(row.minPrecioMayor)} – ${formatNum(row.maxPrecioMayor)}`
    }
    return formatCurrency(row.minPrecioMayor)
  }, [isMultiVariant, row.minPrecioMayor, row.maxPrecioMayor, formatCurrency])

  const menorPriceTooltip = useMemo(() => {
    if (isMultiVariant && row.minPrecioMenor !== row.maxPrecioMenor) {
      return `${formatCurrency(row.minPrecioMenor)} a ${formatCurrency(row.maxPrecioMenor)}`
    }
    return menorPriceFormatted
  }, [isMultiVariant, row.minPrecioMenor, row.maxPrecioMenor, formatCurrency, menorPriceFormatted])

  const mayorPriceTooltip = useMemo(() => {
    if (isMultiVariant && row.minPrecioMayor !== row.maxPrecioMayor) {
      return `${formatCurrency(row.minPrecioMayor)} a ${formatCurrency(row.maxPrecioMayor)}`
    }
    return mayorPriceFormatted
  }, [isMultiVariant, row.minPrecioMayor, row.maxPrecioMayor, formatCurrency, mayorPriceFormatted])

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
    return maxM >= 0 ? `Hasta +${Math.round(maxM)}%` : `Hasta ${Math.round(maxM)}%`
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
    return maxM >= 0 ? `Hasta +${Math.round(maxM)}%` : `Hasta ${Math.round(maxM)}%`
  }, [isGroup, row.variants, primaryProduct, calcMargen])

  const menorMargenTooltip = useMemo(() => {
    if (!isGroup || row.variants.length <= 1) return menorMargen
    const margenes = row.variants.map((v) => {
      const c = v.producto.costoBase || 0
      const p = v.producto.precioMenor || 0
      return c > 0 ? ((p - c) / c) * 100 : (p > 0 ? 100 : 0)
    })
    const minM = Math.round(Math.min(...margenes))
    const maxM = Math.round(Math.max(...margenes))
    return `Margen menor: ${minM}% a ${maxM}%`
  }, [isGroup, row.variants, menorMargen])

  const mayorMargenTooltip = useMemo(() => {
    if (!isGroup || row.variants.length <= 1) return mayorMargen
    const margenes = row.variants.map((v) => {
      const c = v.producto.costoBase || 0
      const p = v.producto.precioMayor || 0
      return c > 0 ? ((p - c) / c) * 100 : (p > 0 ? 100 : 0)
    })
    const minM = Math.round(Math.min(...margenes))
    const maxM = Math.round(Math.max(...margenes))
    return `Margen mayor: ${minM}% a ${maxM}%`
  }, [isGroup, row.variants, mayorMargen])

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

        {/* Overlays Flotantes en Esquinas (Descongestionados) */}
        {/* Top-Left: Badge único de Estado */}
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

        {/* Top-Right: Badge de Versiones o Chip MakerWorld (Sin saturar) */}
        {isMultiVariant ? (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-accent/90 backdrop-blur-xs text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/80 shadow-2xs">
              {row.totalVariants} {row.totalVariants === 1 ? 'versión' : 'versiones'}
            </span>
          </div>
        ) : enlaceMakerworld ? (
          <div className="absolute top-2.5 right-2.5 z-10">
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
          </div>
        ) : null}
      </div>

      {/* ========================================================================= */}
      {/* ZONA CENTRAL: Información y Tiers Financieros                             */}
      {/* ========================================================================= */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Identidad */}
        <div className="space-y-1.5">
          {/* Fila Superior: Categoría & Métricas */}
          <div className="flex items-center justify-between gap-1.5">
            <span
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[70%]"
              title={row.lineaCategoria || 'ACCESORIOS'}
            >
              {row.lineaCategoria || 'ACCESORIOS'}
            </span>
            <span
              className="bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border/60 ml-auto flex items-center gap-1 shrink-0"
              title={`Asociado a ${pedidosCount} ${pedidosCount === 1 ? 'pedido' : 'pedidos'}`}
            >
              <ShoppingBag className="w-3 h-3 text-muted-foreground" />
              <span>
                {pedidosCount} {pedidosCount === 1 ? 'pedido' : 'pedidos'}
              </span>
            </span>
          </div>

          {/* Título del Modelo (Soporte Multilínea) */}
          <h3
            className="text-sm font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors"
            title={row.baseName}
          >
            {row.baseName}
          </h3>

          {/* Costo Base */}
          <div className="text-xs text-muted-foreground flex items-center justify-between pt-0.5">
            <span>Costo Base:</span>
            <span
              className="font-semibold text-foreground font-mono"
              title={
                isMultiVariant && row.minCosto !== row.maxCosto
                  ? `${formatCurrency(row.minCosto)} a ${formatCurrency(row.maxCosto)}`
                  : undefined
              }
            >
              {baseCostFormatted}
            </span>
          </div>
        </div>

        {/* Cajas de Precio (Cero Truncamiento, rounded-xl) */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {/* Caja Por Menor */}
          <div className="bg-secondary/40 border border-border/80 rounded-xl p-2.5 text-center flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
              MENOR
            </span>
            <span
              className="text-xs font-extrabold text-foreground mt-0.5 whitespace-nowrap block font-mono"
              title={menorPriceTooltip}
            >
              {menorPriceFormatted}
            </span>
            <span
              className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mt-0.5 block font-mono"
              title={menorMargenTooltip}
            >
              {menorMargen}
            </span>
          </div>

          {/* Caja Por Mayor */}
          <div className="bg-secondary/40 border border-border/80 rounded-xl p-2.5 text-center flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
              MAYOR
            </span>
            <span
              className="text-xs font-extrabold text-foreground mt-0.5 whitespace-nowrap block font-mono"
              title={mayorPriceTooltip}
            >
              {mayorPriceFormatted}
            </span>
            <span
              className="text-[10px] font-bold text-primary mt-0.5 block font-mono"
              title={mayorMargenTooltip}
            >
              {mayorMargen}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONA INFERIOR: Pie de Tarjeta y Acciones                                  */}
      {/* ========================================================================= */}
      <div className="px-4 pb-3.5 pt-2.5 border-t border-border/50 flex items-center justify-between mt-auto">
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
