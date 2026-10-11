import { extractBaseAndVariant } from '@/components/catalogo/ProductsTableView'
import { ProductoOption } from './types'

export interface ProductVariantItem {
  id: string
  productoId: string
  nombreVariante: string
  nombreCompleto: string
  categoria: string
  costoBase: number
  precioMenor: number
  precioMayor: number
  activo: boolean
  imagenUrl?: string | null
  pedidosCount?: number
  pedidosIds?: string[]
}

export interface ProductGroupItem {
  id: string
  productoId: string
  baseName: string
  categoria: string
  hasVariants: boolean
  variants: ProductVariantItem[]
  singleVariant?: ProductVariantItem
  imagenUrl?: string | null
  pedidosCount?: number
  pedidosIds?: string[]
}

/**
 * Procesa la lista de catálogo agrupando por producto base:
 * - Caso 1: Productos con Variantes (ej. SETI Organizador, Mansiones de la Locura)
 * - Caso 2: Productos Simples (ej. Bandejas de LEGO)
 */
export function groupCatalogProducts(productos: ProductoOption[]): ProductGroupItem[] {
  if (!productos || productos.length === 0) return []

  // Conteo de hermanos en catálogo para determinar grupos reales
  const familyCounts = new Map<string, number>()
  productos.forEach(p => {
    if (Array.isArray(p.variantes) && p.variantes.length > 0) {
      const key = `${p.nombreModelo.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`
      familyCounts.set(key, (familyCounts.get(key) || 0) + p.variantes.length)
      return
    }

    const { baseName } = extractBaseAndVariant(p.nombreModelo)
    const key = `${baseName.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`
    familyCounts.set(key, (familyCounts.get(key) || 0) + 1)
  })

  const groupsMap = new Map<
    string,
    {
      baseName: string
      categoria: string
      productoId: string
      imagenUrl?: string | null
      items: ProductVariantItem[]
    }
  >()

  productos.forEach(p => {
    const rawImg = p.imagenUrl || p.imageUrl || null

    // Si el producto ya cuenta con la estructura anidada de variantes
    if (Array.isArray(p.variantes) && p.variantes.length > 0) {
      const groupKey = `${p.nombreModelo.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          baseName: p.nombreModelo,
          categoria: p.lineaCategoria || 'General',
          productoId: p.id,
          imagenUrl: rawImg,
          items: []
        })
      } else if (!groupsMap.get(groupKey)!.imagenUrl && rawImg) {
        groupsMap.get(groupKey)!.imagenUrl = rawImg
      }

      p.variantes.forEach(v => {
        const vImg = v.imagenUrl || v.imageUrl || rawImg
        groupsMap.get(groupKey)!.items.push({
          id: v.id,
          productoId: p.id,
          nombreVariante: v.nombreVariante,
          nombreCompleto: `${p.nombreModelo} - ${v.nombreVariante}`,
          categoria: p.lineaCategoria || 'General',
          costoBase: Number(v.costoBase || 0),
          precioMenor: Number(v.precioMenor || 0),
          precioMayor: Number(v.precioMayor || 0),
          activo: v.activo ?? true,
          imagenUrl: vImg,
          pedidosCount: v.pedidosCount ?? p.pedidosCount ?? 0,
          pedidosIds: v.pedidosIds ?? p.pedidosIds ?? []
        })
      })
      return
    }

    // Estructura plana estándar de catálogo
    const { baseName, variantName } = extractBaseAndVariant(p.nombreModelo)
    const groupKey = `${baseName.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        baseName,
        categoria: p.lineaCategoria || 'General',
        productoId: p.id,
        imagenUrl: rawImg,
        items: []
      })
    } else if (!groupsMap.get(groupKey)!.imagenUrl && rawImg) {
      groupsMap.get(groupKey)!.imagenUrl = rawImg
    }

    groupsMap.get(groupKey)!.items.push({
      id: p.id,
      productoId: groupsMap.get(groupKey)!.productoId,
      nombreVariante: variantName,
      nombreCompleto: p.nombreModelo,
      categoria: p.lineaCategoria || 'General',
      costoBase: Number(p.costoBase || 0),
      precioMenor: Number(p.precioMenor || 0),
      precioMayor: Number(p.precioMayor || 0),
      activo: p.activo ?? true,
      imagenUrl: rawImg,
      pedidosCount: p.pedidosCount ?? 0,
      pedidosIds: p.pedidosIds ?? []
    })
  })

  const result: ProductGroupItem[] = []

  groupsMap.forEach((group, key) => {
    const totalCount = familyCounts.get(key) || group.items.length
    const groupImg = group.items.find(i => i.imagenUrl)?.imagenUrl || group.imagenUrl || null

    if (totalCount <= 1 || group.items.length === 1) {
      // Caso 2: Producto Simple
      const single = group.items[0]
      result.push({
        id: single.id,
        productoId: single.productoId,
        baseName: single.nombreCompleto,
        categoria: group.categoria,
        hasVariants: false,
        variants: [single],
        singleVariant: single,
        imagenUrl: single.imagenUrl || groupImg,
        pedidosCount: single.pedidosCount ?? 0,
        pedidosIds: single.pedidosIds ?? []
      })
    } else {
      // Caso 1: Producto Padre con Variantes
      // Ordenar las variantes de forma ascendente por costoBase (de menor a mayor)
      group.items.sort((a, b) => a.costoBase - b.costoBase)

      const groupPedidoIds = new Set<string>()
      let sumFallback = 0
      let hasAnyIds = false
      group.items.forEach(i => {
        if (i.pedidosIds && i.pedidosIds.length > 0) {
          hasAnyIds = true
          i.pedidosIds.forEach(id => groupPedidoIds.add(id))
        }
        sumFallback += i.pedidosCount || 0
      })
      const groupPedidosCount = hasAnyIds ? groupPedidoIds.size : sumFallback

      result.push({
        id: `group_${key}`,
        productoId: group.productoId,
        baseName: group.baseName,
        categoria: group.categoria,
        hasVariants: true,
        variants: group.items,
        imagenUrl: groupImg,
        pedidosCount: groupPedidosCount,
        pedidosIds: Array.from(groupPedidoIds)
      })
    }
  })

  // Ordenar catálogo por categoría y nombre base
  return result.sort((a, b) => {
    if (a.categoria !== b.categoria) {
      return a.categoria.localeCompare(b.categoria)
    }
    return a.baseName.localeCompare(b.baseName)
  })
}

/**
 * Busca una variante específica o producto simple por ID (varianteId o productoId)
 */
export function findVariantInGroups(
  groups: ProductGroupItem[],
  variantIdOrProductoId: string
): { group: ProductGroupItem; variant: ProductVariantItem } | null {
  if (!variantIdOrProductoId) return null

  for (const group of groups) {
    for (const variant of group.variants) {
      if (variant.id === variantIdOrProductoId) {
        return { group, variant }
      }
    }
  }

  // Fallback por productoId si no se encontró por varianteId
  for (const group of groups) {
    if (group.productoId === variantIdOrProductoId) {
      return { group, variant: group.variants[0] }
    }
  }

  return null
}
