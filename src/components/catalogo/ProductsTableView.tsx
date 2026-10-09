'use client'

import React, { useMemo } from 'react'
import { 
  Package, 
  ChevronDown, 
  Calendar, 
  MoreHorizontal, 
  Plus, 
  Share2, 
  Pencil, 
  Copy, 
  CopyPlus, 
  Archive, 
  RotateCcw, 
  Check,
  ArrowUpDown,
  Eye,
  Trash2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import type { ProductoItem } from './CatalogoClient'

export type OrdenCatalogType = 
  | 'RECIENTES' 
  | 'NOMBRE_ASC' 
  | 'NOMBRE_DESC' 
  | 'MARGEN_DESC' 
  | 'COSTO_ASC' 
  | 'COSTO_DESC'

export interface CategoryCountItem {
  name: string
  count: number
}

// Sufijos conocidos de fabricación según especificaciones (Regla 2)
const KNOWN_SUFFIX_RULES = [
  { regex: /^(.*?)(?:[\s\-_]+)(1\s*color)$/i, label: '1 Color' },
  { regex: /^(.*?)(?:[\s\-_]+)(multicolor)$/i, label: 'Multicolor' },
  { regex: /^(.*?)(?:[\s\-_]+)(con\s*tapa)$/i, label: 'Con Tapa' },
  { regex: /^(.*?)(?:[\s\-_]+)(sin\s*tapa)$/i, label: 'Sin Tapa' },
  { regex: /^(.*?)(?:[\s\-_]+)(v\s*1)$/i, label: 'V1' },
  { regex: /^(.*?)(?:[\s\-_]+)(v\s*2)$/i, label: 'V2' },
  { regex: /^(.*?)(?:[\s\-_]+)(v\s*[3-9])$/i, format: (m: string) => m.toUpperCase().replace(/\s+/g, '') },
]

/**
 * Función pura de extracción de baseName y variantName
 * Aplica:
 * - Regla 1: Separador por guión (" - ")
 * - Regla 2: Sufijos de versión y acabado ("1 Color", "Multicolor", "Con Tapa", "Sin Tapa", "V1", "V2")
 */
export function extractBaseAndVariant(nombre: string): { baseName: string; variantName: string } {
  const raw = (nombre || '').trim()

  // Regla 1 (Separador por guión):
  if (raw.includes(' - ')) {
    const idx = raw.indexOf(' - ')
    const base = raw.substring(0, idx).trim()
    const variant = raw.substring(idx + 3).trim()
    if (base && variant) {
      return { baseName: base, variantName: variant }
    }
  }

  // Regla 2 (Sufijos de versión y acabado):
  for (const rule of KNOWN_SUFFIX_RULES) {
    const match = raw.match(rule.regex)
    if (match && match[1] && match[1].trim()) {
      const base = match[1].trim()
      const variant = rule.label || (rule.format ? rule.format(match[2]) : match[2])
      return { baseName: base, variantName: variant }
    }
  }

  return { baseName: raw, variantName: 'Estándar' }
}

export interface VariantItemData {
  producto: ProductoItem
  variantName: string
}

export interface ProductGroupRow {
  id: string
  isGroup: boolean
  baseName: string
  lineaCategoria: string
  totalVariants: number
  variants: VariantItemData[]
  minCosto: number
  maxCosto: number
  minPrecioMenor: number
  maxPrecioMenor: number
  minPrecioMayor: number
  maxPrecioMayor: number
  hasActive: boolean
  allActive: boolean
  latestCreatedAt?: string
  singleProduct?: ProductoItem
}

/**
 * Función que agrupa una lista de productos en una estructura jerárquica
 * con cálculo dinámico de rangos y detección de productos únicos (Regla 3).
 */
export function groupProducts(
  productos: ProductoItem[],
  allCatalogProductos: ProductoItem[] = productos
): ProductGroupRow[] {
  const catalogFamilyCounts = new Map<string, number>()
  allCatalogProductos.forEach((p) => {
    const { baseName } = extractBaseAndVariant(p.nombreModelo)
    const key = `${baseName.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`
    catalogFamilyCounts.set(key, (catalogFamilyCounts.get(key) || 0) + 1)
  })

  const groupsMap = new Map<string, {
    baseName: string
    lineaCategoria: string
    items: VariantItemData[]
  }>()

  productos.forEach((p) => {
    const { baseName, variantName } = extractBaseAndVariant(p.nombreModelo)
    const groupKey = `${baseName.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        baseName,
        lineaCategoria: p.lineaCategoria || 'General',
        items: [],
      })
    }

    groupsMap.get(groupKey)!.items.push({
      producto: p,
      variantName,
    })
  })

  const rows: ProductGroupRow[] = []

  groupsMap.forEach((group, groupKey) => {
    const totalInCatalog = catalogFamilyCounts.get(groupKey) || group.items.length

    // Regla 3: Si no tiene variantes hermanas en el catálogo, fila independiente estándar
    if (totalInCatalog <= 1 || (group.items.length === 1 && totalInCatalog <= 1)) {
      const single = group.items[0].producto
      rows.push({
        id: single.id,
        isGroup: false,
        baseName: single.nombreModelo,
        lineaCategoria: single.lineaCategoria || 'General',
        totalVariants: 1,
        variants: group.items,
        minCosto: single.costoBase || 0,
        maxCosto: single.costoBase || 0,
        minPrecioMenor: single.precioMenor || 0,
        maxPrecioMenor: single.precioMenor || 0,
        minPrecioMayor: single.precioMayor || 0,
        maxPrecioMayor: single.precioMayor || 0,
        hasActive: single.activo,
        allActive: single.activo,
        latestCreatedAt: single.createdAt,
        singleProduct: single,
      })
    } else {
      // Ordenar las variantes de forma ascendente por costoBase (de menor a mayor)
      group.items.sort((a, b) => (a.producto.costoBase || 0) - (b.producto.costoBase || 0))

      // Producto Padre con Variantes Consolidadas
      const costos = group.items.map(i => i.producto.costoBase || 0)
      const preciosMenor = group.items.map(i => i.producto.precioMenor || 0)
      const preciosMayor = group.items.map(i => i.producto.precioMayor || 0)
      const dates = group.items
        .map(i => i.producto.createdAt)
        .filter(Boolean) as string[]
      const latestDate = dates.length > 0
        ? dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : undefined

      rows.push({
        id: `group_${groupKey}`,
        isGroup: true,
        baseName: group.baseName,
        lineaCategoria: group.lineaCategoria,
        totalVariants: group.items.length,
        variants: group.items,
        minCosto: Math.min(...costos),
        maxCosto: Math.max(...costos),
        minPrecioMenor: Math.min(...preciosMenor),
        maxPrecioMenor: Math.max(...preciosMenor),
        minPrecioMayor: Math.min(...preciosMayor),
        maxPrecioMayor: Math.max(...preciosMayor),
        hasActive: group.items.some(i => i.producto.activo),
        allActive: group.items.every(i => i.producto.activo),
        latestCreatedAt: latestDate,
      })
    }
  })

  return rows
}

interface ProductsTableViewProps {
  rows?: ProductGroupRow[]
  productos?: ProductoItem[]
  allCatalogProductos?: ProductoItem[]
  expandedParents: Set<string>
  onToggleExpand: (id: string) => void
  onViewDetail?: (group?: ProductGroupRow, single?: ProductoItem) => void
  onEdit: (p: ProductoItem) => void
  onEditGroup?: (group: ProductGroupRow) => void
  onAddVariant?: (baseName: string, categoria: string) => void
  onCopiarCotizacion: (p: ProductoItem) => void
  onCopyGroupQuotation: (group: ProductGroupRow) => void
  onToggleEstado: (p: ProductoItem) => void
  onDuplicar: (p: ProductoItem) => void
  onDuplicarGroup?: (group: ProductGroupRow) => void
  onDeleteProduct?: (p: ProductoItem) => void
  onDeleteGroup?: (group: ProductGroupRow) => void
  copiedId: string | null
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
  formatFechaRegistro: (rawDate: string | Date | null | undefined) => string
  // Barra de Clasificación y Orden
  categoriaFilter?: string
  onCategoriaFilterChange?: (cat: string) => void
  categoriesWithCounts?: CategoryCountItem[]
  totalCatalogModelos?: number
  ordenFilter?: OrdenCatalogType
  onOrdenFilterChange?: (orden: OrdenCatalogType) => void
}

export function ProductsTableView({
  rows,
  productos = [],
  allCatalogProductos = productos,
  expandedParents,
  onToggleExpand,
  onViewDetail,
  onEdit,
  onEditGroup,
  onAddVariant,
  onCopiarCotizacion,
  onCopyGroupQuotation,
  onToggleEstado,
  onDuplicar,
  onDuplicarGroup,
  onDeleteProduct,
  onDeleteGroup,
  copiedId,
  formatCurrency,
  calcMargen,
  formatFechaRegistro,
  categoriaFilter = 'TODAS',
  onCategoriaFilterChange,
  categoriesWithCounts = [],
  totalCatalogModelos = 0,
  ordenFilter = 'RECIENTES',
  onOrdenFilterChange,
}: ProductsTableViewProps) {

  const displayRows = useMemo(() => {
    if (rows && rows.length > 0) return rows
    if (productos.length > 0) return groupProducts(productos, allCatalogProductos)
    return []
  }, [rows, productos, allCatalogProductos])

  // Handlers de clic en encabezados para ordenamiento dinámico
  const handleSortHeader = (type: 'NOMBRE' | 'FECHA' | 'COSTO' | 'PRECIO_MENOR') => {
    if (!onOrdenFilterChange) return

    switch (type) {
      case 'NOMBRE':
        onOrdenFilterChange(ordenFilter === 'NOMBRE_ASC' ? 'NOMBRE_DESC' : 'NOMBRE_ASC')
        break
      case 'FECHA':
        onOrdenFilterChange('RECIENTES')
        break
      case 'COSTO':
        onOrdenFilterChange(ordenFilter === 'COSTO_ASC' ? 'COSTO_DESC' : 'COSTO_ASC')
        break
      case 'PRECIO_MENOR':
        onOrdenFilterChange('MARGEN_DESC')
        break
    }
  }

  return (
    <div className="w-full space-y-4">
      {displayRows.length === 0 ? (
        <div className="w-full bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground italic text-xs shadow-xs">
          No se encontraron productos con ese criterio de búsqueda
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VISTA ESCRITORIO (>= lg): Master-Detail Collapsible Table                */}
          {/* REGLA ESTRICTA: Sin scroll horizontal (table-fixed w-full)                */}
          {/* Anchos exactos rebalanceados: 32% + 10% + 10% + 16% + 16% + 10% + 6% = 100% */}
          {/* ========================================================================= */}
          <div className="hidden lg:block w-full bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="bg-secondary/40 border-y border-border/70 text-muted-foreground text-[11px] font-semibold tracking-wider uppercase select-none">
                  {/* Columna 1: Modelo & Familia con clic para ordenar */}
                  <th 
                    onClick={() => handleSortHeader('NOMBRE')}
                    className="py-3 px-4 text-left cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Modelo & Familia</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0 hover:text-foreground" />
                    </div>
                  </th>

                  {/* Columna 2: Fecha Registro con clic para ordenar */}
                  <th 
                    onClick={() => handleSortHeader('FECHA')}
                    className="py-3 px-3 text-center cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Fecha Registro</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0 hover:text-foreground" />
                    </div>
                  </th>

                  {/* Columna 3: Costo Base con clic para ordenar */}
                  <th 
                    onClick={() => handleSortHeader('COSTO')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Costo Base</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0 hover:text-foreground" />
                    </div>
                  </th>

                  {/* Columna 4: Precio por Menor con clic para ordenar */}
                  <th 
                    onClick={() => handleSortHeader('PRECIO_MENOR')}
                    className="py-3 px-3 text-center cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Precio por Menor</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0 hover:text-foreground" />
                    </div>
                  </th>

                  {/* Columna 5: Precio por Mayor */}
                  <th className="py-3 px-3 text-center">
                    <span>Precio por Mayor</span>
                  </th>

                  {/* Columna 6: Estado */}
                  <th className="py-3 px-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Estado</span>
                  </th>

                  {/* Columna 7: Acciones */}
                  <th className="py-3 pr-6 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {displayRows.map((row) => {
                  const isExpanded = expandedParents.has(row.id)

                  // ---------------------------------------------------------------
                  // CASO 1: PRODUCTO PADRE CON VARIANTES COLAPSABLES
                  // ---------------------------------------------------------------
                  if (row.isGroup) {
                    return (
                      <React.Fragment key={row.id}>
                        {/* Fila Maestra (Producto Padre) */}
                        <tr
                          onClick={() => onToggleExpand(row.id)}
                          className={`h-16 bg-card border-b border-border/80 hover:bg-secondary/25 transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-secondary/15' : ''
                          }`}
                        >
                          {/* Columna 1: Chevron + Cubo 3D + Modelo + Chip Categoría */}
                          <td className="py-3 px-4">
                            <div className="flex items-center min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggleExpand(row.id)
                                }}
                                className={`w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center mr-1.5 text-muted-foreground transition-transform duration-200 cursor-pointer shrink-0 ${
                                  isExpanded ? 'rotate-180 text-primary' : ''
                                }`}
                                title={isExpanded ? 'Colapsar variantes' : 'Ver variantes'}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>

                              {row.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl ? (
                                <img
                                  src={row.variants.find((v) => v.producto.imagenUrl)!.producto.imagenUrl!}
                                  alt={row.baseName}
                                  className="w-10 h-10 rounded-xl object-cover border border-border/80 shadow-2xs shrink-0 mr-2.5"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 border border-border/70 mr-2.5 shadow-2xs">
                                  <Package className="h-5 w-5 stroke-[2.2]" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm font-bold text-foreground line-clamp-2 leading-snug break-words" title={row.baseName}>
                                    {row.baseName}
                                  </span>
                                  <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/70 shrink-0">
                                    {row.totalVariants} versiones
                                  </span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block border border-border/70">
                                    {row.lineaCategoria}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna 2: Fecha de Registro */}
                          <td className="py-3 px-3 text-center">
                            {row.latestCreatedAt ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                                <Calendar className="h-3 w-3 text-primary" />
                                <span>{formatFechaRegistro(row.latestCreatedAt)}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px] font-mono">-</span>
                            )}
                          </td>

                          {/* Columna 3: Rango de Costo Base */}
                          <td className="py-3 px-3 text-right">
                            <div className="font-mono text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
                              {row.minCosto === row.maxCosto
                                ? formatCurrency(row.minCosto)
                                : `${formatCurrency(row.minCosto)} – ${formatCurrency(row.maxCosto)}`}
                            </div>
                          </td>

                          {/* Columna 4: Rango Precio por Menor */}
                          <td className="py-3 px-3">
                            <div className="flex justify-center text-center font-mono tabular-nums">
                              <div className="rounded-xl border border-border bg-card shadow-2xs min-w-[130px] px-2.5 py-1 text-center whitespace-nowrap w-full max-w-[160px]">
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase block font-sans">Rango Por Menor</span>
                                <span className="text-xs font-bold text-foreground block font-mono">
                                  {row.minPrecioMenor === row.maxPrecioMenor
                                    ? formatCurrency(row.minPrecioMenor)
                                    : `${formatCurrency(row.minPrecioMenor)} – ${formatCurrency(row.maxPrecioMenor)}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Columna 5: Rango Precio por Mayor */}
                          <td className="py-3 px-3">
                            <div className="flex justify-center text-center font-mono tabular-nums">
                              <div className="rounded-xl border border-border/80 bg-secondary/70 shadow-2xs min-w-[130px] px-2.5 py-1 text-center whitespace-nowrap w-full max-w-[160px]">
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase block font-sans">Rango Por Mayor</span>
                                <span className="text-xs font-bold text-foreground block font-mono">
                                  {row.minPrecioMayor === row.maxPrecioMayor
                                    ? formatCurrency(row.minPrecioMayor)
                                    : `${formatCurrency(row.minPrecioMayor)} – ${formatCurrency(row.maxPrecioMayor)}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Columna 6: Estado Consolidado */}
                          <td className="py-3 px-3 text-left">
                            {row.hasActive ? (
                              <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                <span>Activo</span>
                              </span>
                            ) : (
                              <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-muted-foreground border border-border whitespace-nowrap shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                                <span>Archivado</span>
                              </span>
                            )}
                          </td>

                          {/* Columna 7: Acciones Centralizadas */}
                          <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-auto flex items-center justify-center border border-transparent hover:border-border/60 cursor-pointer outline-none"
                                title="Más opciones"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Acciones</span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 bg-card border border-border rounded-xl shadow-lg p-1">
                                <DropdownMenuItem
                                  onClick={() => onViewDetail && onViewDetail(row, undefined)}
                                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                                >
                                  <Eye className="h-3.5 w-3.5 text-primary" />
                                  <span>Ver Detalle del Modelo</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEditGroup ? onEditGroup(row) : onEdit(row.variants[0].producto)}
                                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-primary" />
                                  <span>Editar Producto y Versiones</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDuplicarGroup && onDuplicarGroup(row)}
                                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                                >
                                  <Copy className="h-3.5 w-3.5 text-primary" />
                                  <span>Duplicar Modelo</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-border/60" />
                                <DropdownMenuItem
                                  onClick={() => onDeleteGroup && onDeleteGroup(row)}
                                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  <span>Eliminar Producto</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>

                        {/* ======================================================= */}
                        {/* SUBFILAS REALES DE VARIANTES (READ-ONLY INFORMATIVO)    */}
                        {/* ======================================================= */}
                        {isExpanded && (
                          <TooltipProvider>
                            {row.variants.map((v) => {
                              const p = v.producto
                              const costo = p.costoBase || 0
                              const margenMenor = calcMargen(p.precioMenor, costo)
                              const margenMayor = calcMargen(p.precioMayor, costo)

                              return (
                                <tr
                                  key={p.id}
                                  className="h-12 bg-secondary/20 hover:bg-secondary/35 border-b border-border/40 transition-colors animate-in fade-in-50 duration-150"
                                >
                                  {/* Col 1 (Modelo & Versión): Rama de árbol └─ + Nombre de versión */}
                                  <td className="py-2.5 px-4">
                                    <div className="pl-12 flex items-center min-w-0">
                                      <span className="text-primary/70 font-mono text-sm shrink-0 select-none mr-2">└─</span>
                                      <span className="text-xs font-bold text-foreground truncate" title={v.variantName}>
                                        {v.variantName}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Col 2 (Fecha Registro) */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                                      <Calendar className="h-3 w-3 text-primary" />
                                      <span>{formatFechaRegistro(p.createdAt)}</span>
                                    </span>
                                  </td>

                                  {/* Col 3 (Costo Base Individual) */}
                                  <td className="py-2.5 px-3 text-right">
                                    <span className="text-xs font-semibold text-foreground font-mono tabular-nums whitespace-nowrap">
                                      {formatCurrency(costo)}
                                    </span>
                                  </td>

                                  {/* Col 4 (Precio por Menor): Caja Estandarizada NOVA */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex justify-center text-center font-mono tabular-nums">
                                      <div className="bg-card border border-border rounded-lg px-2.5 py-1 text-center shadow-2xs min-w-[130px] w-full max-w-[160px] whitespace-nowrap">
                                        <span className="text-xs font-extrabold text-foreground block font-mono">
                                          {formatCurrency(p.precioMenor)}
                                        </span>
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block font-mono cursor-help">
                                                {margenMenor}
                                              </span>
                                            }
                                          />
                                          <TooltipContent>
                                            Margen calculado sobre el costo base de {formatCurrency(costo)}
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 5 (Precio por Mayor): Caja Estandarizada NOVA */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex justify-center text-center font-mono tabular-nums">
                                      <div className="bg-secondary/80 border border-border/80 rounded-lg px-2.5 py-1 text-center shadow-2xs min-w-[130px] w-full max-w-[160px] whitespace-nowrap">
                                        <span className="text-xs font-extrabold text-foreground block font-mono">
                                          {formatCurrency(p.precioMayor)}
                                        </span>
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <span className="text-[10px] font-bold text-primary block font-mono cursor-help">
                                                {margenMayor}
                                              </span>
                                            }
                                          />
                                          <TooltipContent>
                                            Margen calculado sobre el costo base de {formatCurrency(costo)}
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 6 (Estado) */}
                                  <td className="py-2.5 px-3 text-left">
                                    {p.activo ? (
                                      <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                        <span>Activo</span>
                                      </span>
                                    ) : (
                                      <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-muted-foreground border border-border whitespace-nowrap shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                                        <span>Archivado</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Col 7 (Celda vacía para simetría) */}
                                  <td className="py-2.5 pr-4 text-right"></td>
                                </tr>
                              )
                            })}
                          </TooltipProvider>
                        )}
                      </React.Fragment>
                    )
                  }

                  // ---------------------------------------------------------------
                  // CASO 2: PRODUCTO ÚNICO ESTÁNDAR (REGLA 3)
                  // ---------------------------------------------------------------
                  const product = row.singleProduct!
                  const costo = product.costoBase || 0

                  return (
                    <tr
                      key={product.id}
                      onClick={() => onViewDetail ? onViewDetail(undefined, product) : onEdit(product)}
                      className={`h-16 bg-card border-b border-border/80 hover:bg-secondary/25 transition-colors cursor-pointer select-none ${
                        !product.activo ? 'opacity-85 bg-secondary/20' : ''
                      }`}
                    >
                      {/* Columna 1: Cubo 3D o Miniatura + Nombre + Categoría */}
                      <td className="py-3 px-4">
                        <div className="flex items-center min-w-0">
                          <div className="w-6 mr-1.5 shrink-0" />
                          {product.imagenUrl ? (
                            <img
                              src={product.imagenUrl}
                              alt={product.nombreModelo}
                              className="w-10 h-10 rounded-xl object-cover border border-border/80 shadow-2xs shrink-0 mr-2.5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 border border-border/70 mr-2.5 shadow-2xs">
                              <Package className="h-5 w-5 stroke-[2.2]" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-bold text-foreground block line-clamp-2 leading-snug break-words" title={product.nombreModelo}>
                              {product.nombreModelo}
                            </span>
                            <div className="mt-0.5">
                              <span className="bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block border border-border/70">
                                {product.lineaCategoria || 'General'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Columna 2: Fecha de Registro */}
                      <td className="py-3 px-3 text-center">
                        {product.createdAt ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span>{formatFechaRegistro(product.createdAt)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-mono">-</span>
                        )}
                      </td>

                      {/* Columna 3: Costo Base Individual */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
                          {formatCurrency(costo)}
                        </div>
                      </td>

                      {/* Columna 4: Precio por Menor */}
                      <td className="py-3 px-3">
                        <div className="flex justify-center text-center font-mono tabular-nums">
                          <div className="rounded-xl border border-border bg-card shadow-2xs px-2.5 py-1 text-center min-w-[130px] w-full max-w-[160px] whitespace-nowrap">
                            <span className="text-xs font-extrabold text-foreground block font-mono">
                              {formatCurrency(product.precioMenor)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block font-mono">
                              {calcMargen(product.precioMenor, costo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna 5: Precio por Mayor */}
                      <td className="py-3 px-3">
                        <div className="flex justify-center text-center font-mono tabular-nums">
                          <div className="rounded-xl border border-border/80 bg-secondary/70 shadow-2xs px-2.5 py-1 text-center min-w-[130px] w-full max-w-[160px] whitespace-nowrap">
                            <span className="text-xs font-extrabold text-foreground block font-mono">
                              {formatCurrency(product.precioMayor)}
                            </span>
                            <span className="text-[10px] font-bold text-primary block font-mono">
                              {calcMargen(product.precioMayor, costo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna 6: Estado */}
                      <td className="py-3 px-3 text-left">
                        {product.activo ? (
                          <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-muted-foreground border border-border whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                            <span>Archivado</span>
                          </span>
                        )}
                      </td>

                      {/* Columna 7: Acciones */}
                      <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-auto flex items-center justify-center border border-transparent hover:border-border/60 cursor-pointer outline-none"
                            title="Más opciones"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">Acciones</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-card border border-border rounded-xl shadow-lg p-1">
                            <DropdownMenuItem
                              onClick={() => onViewDetail && onViewDetail(undefined, product)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>Ver Detalle del Modelo</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEdit(product)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5 text-primary" />
                              <span>Editar Producto y Versiones</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDuplicar(product)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5 text-primary" />
                              <span>Duplicar Modelo</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-border/60" />
                            <DropdownMenuItem
                              onClick={() => onDeleteProduct ? onDeleteProduct(product) : onToggleEstado(product)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              <span>Eliminar Producto</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* VISTA MÓVIL Y TABLET (< lg): Tarjetas Fluidas con Soporte de Variantes    */}
          {/* ========================================================================= */}
          <div className="block lg:hidden space-y-3">
            {displayRows.map((row) => {
              const isExpanded = expandedParents.has(row.id)

              if (row.isGroup) {
                return (
                  <div
                    key={row.id}
                    className="bg-card border border-border rounded-2xl p-4 shadow-2xs space-y-3"
                  >
                    <div 
                      className="flex items-start justify-between gap-2 cursor-pointer"
                      onClick={() => onToggleExpand(row.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          className={`w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-180 text-primary' : ''
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-bold text-sm text-foreground truncate">
                              {row.baseName}
                            </span>
                            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-border/70">
                              {row.totalVariants} versiones
                            </span>
                          </div>
                          <div className="mt-0.5">
                            <span className="bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block border border-border/70">
                              {row.lineaCategoria}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {row.hasActive ? (
                          <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-muted-foreground border border-border whitespace-nowrap shadow-2xs shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                            <span>Archivado</span>
                          </span>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center cursor-pointer transition-colors outline-none"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-card border border-border rounded-xl shadow-lg p-1">
                            <DropdownMenuItem
                              onClick={() => onViewDetail && onViewDetail(row, undefined)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>Ver Detalle del Modelo</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditGroup ? onEditGroup(row) : onEdit(row.variants[0].producto)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5 text-primary" />
                              <span>Editar Producto y Versiones</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDuplicarGroup && onDuplicarGroup(row)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5 text-primary" />
                              <span>Duplicar Modelo</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-border/60" />
                            <DropdownMenuItem
                              onClick={() => onDeleteGroup && onDeleteGroup(row)}
                              className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              <span>Eliminar Producto</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-secondary/40 p-2.5 rounded-xl border border-border/70 text-center font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block font-sans font-semibold">Costo Base</span>
                        <span className="text-xs font-bold text-foreground block">
                          {row.minCosto === row.maxCosto
                            ? formatCurrency(row.minCosto)
                            : `${formatCurrency(row.minCosto)} – ${formatCurrency(row.maxCosto)}`}
                        </span>
                      </div>
                      <div className="space-y-0.5 border-x border-border px-1">
                        <span className="text-[10px] text-muted-foreground block font-sans font-bold">Por Menor</span>
                        <span className="text-xs font-extrabold text-foreground block">
                          {row.minPrecioMenor === row.maxPrecioMenor
                            ? formatCurrency(row.minPrecioMenor)
                            : `${formatCurrency(row.minPrecioMenor)} – ${formatCurrency(row.maxPrecioMenor)}`}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block font-sans font-bold">Por Mayor</span>
                        <span className="text-xs font-extrabold text-foreground block">
                          {row.minPrecioMayor === row.maxPrecioMayor
                            ? formatCurrency(row.minPrecioMayor)
                            : `${formatCurrency(row.minPrecioMayor)} – ${formatCurrency(row.maxPrecioMayor)}`}
                        </span>
                      </div>
                    </div>

                    {/* Subfilas de versiones (Read-Only) */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-border/70 space-y-2 animate-in fade-in-50 duration-150">
                        {row.variants.map((v) => {
                          const p = v.producto
                          const costo = p.costoBase || 0
                          const margenMenor = calcMargen(p.precioMenor, costo)
                          const margenMayor = calcMargen(p.precioMayor, costo)

                          return (
                            <div
                              key={p.id}
                              className="p-2.5 bg-secondary/30 border border-border/70 rounded-xl space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-primary/70 font-mono text-xs select-none">└─</span>
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {v.variantName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {formatFechaRegistro(p.createdAt)}
                                  </span>
                                  {p.activo ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                  ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px] bg-card p-1.5 rounded-lg border border-border/60">
                                <div>
                                  <span className="text-[9px] text-muted-foreground block font-sans">Costo</span>
                                  <span className="font-semibold text-foreground">{formatCurrency(costo)}</span>
                                </div>
                                <div className="border-x border-border px-0.5">
                                  <span className="text-[9px] text-muted-foreground block font-sans">Menor</span>
                                  <span className="font-extrabold text-foreground">{formatCurrency(p.precioMenor)}</span>
                                  <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 block">{margenMenor}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-muted-foreground block font-sans">Mayor</span>
                                  <span className="font-extrabold text-foreground">{formatCurrency(p.precioMayor)}</span>
                                  <span className="text-[9px] font-bold text-primary block">{margenMayor}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // Móvil: Producto Único
              const product = row.singleProduct!
              const costo = product.costoBase || 0
              const margenMenor = calcMargen(product.precioMenor, costo)
              const margenMayor = calcMargen(product.precioMayor, costo)

              return (
                <div
                  key={product.id}
                  onClick={() => onViewDetail && onViewDetail(undefined, product)}
                  className={`bg-card border border-border rounded-2xl p-4 shadow-2xs space-y-3 cursor-pointer hover:bg-secondary/20 transition-colors ${
                    !product.activo ? 'opacity-85 bg-secondary/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {product.imagenUrl ? (
                        <img
                          src={product.imagenUrl}
                          alt={product.nombreModelo}
                          className="w-10 h-10 rounded-xl object-cover border border-border/80 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 border border-border/70 shadow-2xs">
                          <Package className="h-5 w-5 stroke-[2.2]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-foreground block line-clamp-2 leading-snug break-words" title={product.nombreModelo}>
                          {product.nombreModelo}
                        </span>
                        <div className="mt-0.5">
                          <span className="bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block border border-border/70">
                            {product.lineaCategoria || 'General'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {product.activo ? (
                        <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-muted-foreground border border-border whitespace-nowrap shadow-2xs shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                          <span>Archivado</span>
                        </span>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center cursor-pointer transition-colors outline-none"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-card border border-border rounded-xl shadow-lg p-1">
                          <DropdownMenuItem
                            onClick={() => onViewDetail && onViewDetail(undefined, product)}
                            className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                          >
                            <Eye className="h-3.5 w-3.5 text-primary" />
                            <span>Ver Detalle del Modelo</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(product)}
                            className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5 text-primary" />
                            <span>Editar Producto y Versiones</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDuplicar(product)}
                            className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5 text-primary" />
                            <span>Duplicar Modelo</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/60" />
                          <DropdownMenuItem
                            onClick={() => onDeleteProduct ? onDeleteProduct(product) : onToggleEstado(product)}
                            className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            <span>Eliminar Producto</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-secondary/40 p-2.5 rounded-xl border border-border/70 text-center font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block font-sans font-semibold">Costo Base</span>
                      <span className="text-xs font-bold text-foreground block">{formatCurrency(costo)}</span>
                    </div>
                    <div className="space-y-0.5 border-x border-border px-1">
                      <span className="text-[10px] text-muted-foreground block font-sans font-bold">Por Menor</span>
                      <span className="text-xs font-extrabold text-foreground block">{formatCurrency(product.precioMenor)}</span>
                      <span className="text-[9px] text-emerald-800 dark:text-emerald-300 font-bold block">{margenMenor}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block font-sans font-bold">Por Mayor</span>
                      <span className="text-xs font-extrabold text-foreground block">{formatCurrency(product.precioMayor)}</span>
                      <span className="text-[9px] text-primary font-bold block">{margenMayor}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
