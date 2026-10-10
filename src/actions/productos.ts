'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/catalogo')
    revalidatePath('/catalogo/productos')
    revalidatePath('/catalogo/inventario')
    revalidatePath('/inventario')
    revalidatePath('/ventas')
    revalidatePath('/pedidos')
    revalidatePath('/')
  } catch (e) {}
}

export async function getProductos(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const productos = await prisma.producto.findMany({
    where: { negocio: targetNegocio },
    orderBy: [
      { activo: 'desc' },
      { lineaCategoria: 'asc' },
      { nombreModelo: 'asc' }
    ]
  })

  return productos.map(p => ({
    ...p,
    activo: p.activo ?? true,
    costoBase: Number(p.costoBase),
    precioMayor: Number(p.precioMayor),
    precioMenor: Number(p.precioMenor),
    precioOferta: p.precioOferta != null ? Number(p.precioOferta) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

function parseFechaRegistro(fecha?: string | Date): Date | undefined {
  if (!fecha) return undefined
  if (fecha instanceof Date) return fecha
  if (typeof fecha === 'string') {
    const trimmed = fecha.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T12:00:00.000Z`)
    }
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return undefined
}

export async function createProducto(data: {
  negocio?: TipoNegocio
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioMayor: number
  precioMenor: number
  activo?: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  imagenUrl?: string | null
  enlaceMakerworld?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  fechaRegistro?: string | Date
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()
  const parsedFecha = parseFechaRegistro(data.fechaRegistro)

  const producto = await prisma.producto.create({
    data: {
      negocio: targetNegocio,
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioMayor: data.precioMayor,
      precioMenor: data.precioMenor,
      activo: data.activo ?? true,
      stock: data.stock ?? 0,
      controlarStock: data.controlarStock ?? false,
      enOferta: data.enOferta ?? false,
      precioOferta: data.precioOferta ?? null,
      imagenUrl: data.imagenUrl ?? null,
      enlaceMakerworld: data.enlaceMakerworld ?? null,
      descripcionWeb: data.descripcionWeb ?? null,
      destacadoWeb: data.destacadoWeb ?? false,
      ...(parsedFecha ? { createdAt: parsedFecha } : {}),
    }
  })

  safeRevalidate()
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioMayor: Number(producto.precioMayor),
    precioMenor: Number(producto.precioMenor),
    precioOferta: producto.precioOferta != null ? Number(producto.precioOferta) : null,
    createdAt: producto.createdAt.toISOString(),
    updatedAt: producto.updatedAt.toISOString(),
  }
}

export async function updateProducto(id: string, data: {
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioMayor: number
  precioMenor: number
  activo?: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  imagenUrl?: string | null
  enlaceMakerworld?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  fechaRegistro?: string | Date
}) {
  const parsedFecha = parseFechaRegistro(data.fechaRegistro)

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioMayor: data.precioMayor,
      precioMenor: data.precioMenor,
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.controlarStock !== undefined ? { controlarStock: data.controlarStock } : {}),
      ...(data.enOferta !== undefined ? { enOferta: data.enOferta } : {}),
      ...(data.precioOferta !== undefined ? { precioOferta: data.precioOferta } : {}),
      ...(data.imagenUrl !== undefined ? { imagenUrl: data.imagenUrl } : {}),
      ...(data.enlaceMakerworld !== undefined ? { enlaceMakerworld: data.enlaceMakerworld } : {}),
      ...(data.descripcionWeb !== undefined ? { descripcionWeb: data.descripcionWeb } : {}),
      ...(data.destacadoWeb !== undefined ? { destacadoWeb: data.destacadoWeb } : {}),
      ...(parsedFecha ? { createdAt: parsedFecha } : {}),
    }
  })

  safeRevalidate()
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioMayor: Number(producto.precioMayor),
    precioMenor: Number(producto.precioMenor),
    precioOferta: producto.precioOferta != null ? Number(producto.precioOferta) : null,
    createdAt: producto.createdAt.toISOString(),
    updatedAt: producto.updatedAt.toISOString(),
  }
}

export async function toggleEstadoProducto(id: string) {
  const current = await prisma.producto.findUnique({ where: { id } })
  if (!current) throw new Error('Producto no encontrado')

  const updated = await prisma.producto.update({
    where: { id },
    data: { activo: !current.activo }
  })

  safeRevalidate()
  return {
    ...updated,
    costoBase: Number(updated.costoBase),
    precioMayor: Number(updated.precioMayor),
    precioMenor: Number(updated.precioMenor),
    precioOferta: updated.precioOferta != null ? Number(updated.precioOferta) : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function duplicarProducto(id: string) {
  const current = await prisma.producto.findUnique({ where: { id } })
  if (!current) throw new Error('Producto no encontrado')

  let nuevoNombre = `${current.nombreModelo} (Copia)`
  let count = 1
  while (await prisma.producto.findFirst({ where: { nombreModelo: nuevoNombre, negocio: current.negocio } })) {
    count++
    nuevoNombre = `${current.nombreModelo} (Copia ${count})`
  }

  const duplicado = await prisma.producto.create({
    data: {
      negocio: current.negocio,
      lineaCategoria: current.lineaCategoria,
      nombreModelo: nuevoNombre,
      costoBase: current.costoBase,
      precioMayor: current.precioMayor,
      precioMenor: current.precioMenor,
      activo: true,
      stock: 0,
      controlarStock: current.controlarStock,
      enOferta: current.enOferta,
      precioOferta: current.precioOferta,
      imagenUrl: current.imagenUrl,
      enlaceMakerworld: current.enlaceMakerworld,
      descripcionWeb: current.descripcionWeb,
      destacadoWeb: current.destacadoWeb
    }
  })

  safeRevalidate()
  return {
    ...duplicado,
    costoBase: Number(duplicado.costoBase),
    precioMayor: Number(duplicado.precioMayor),
    precioMenor: Number(duplicado.precioMenor),
    precioOferta: duplicado.precioOferta != null ? Number(duplicado.precioOferta) : null,
    createdAt: duplicado.createdAt.toISOString(),
    updatedAt: duplicado.updatedAt.toISOString(),
  }
}

export async function deleteProducto(id: string) {
  const ventasCount = await prisma.venta.count({ where: { productoId: id } })
  if (ventasCount > 0) {
    await prisma.producto.update({
      where: { id },
      data: { activo: false }
    })
    safeRevalidate()
    return { discontinued: true, message: 'El producto tiene ventas históricas asociadas, por lo que fue marcado como Descontinuado.' }
  }

  await prisma.producto.delete({ where: { id } })
  safeRevalidate()
  return { deleted: true, message: 'Producto eliminado correctamente.' }
}

export interface VariantInputData {
  id?: string
  nombreVersion: string
  costoBase: number
  precioMenor: number
  precioMayor: number
}

export async function saveProductoConVariantes(data: {
  negocio?: TipoNegocio
  baseName: string
  lineaCategoria: string
  fechaRegistro?: string | Date
  activo?: boolean
  imagenUrl?: string | null
  enlaceMakerworld?: string | null
  variantes: VariantInputData[]
  deletedVariantIds?: string[]
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()
  const parsedFecha = parseFechaRegistro(data.fechaRegistro)
  const baseNameTrimmed = data.baseName.trim()
  const lineaCategoriaTrimmed = data.lineaCategoria.trim() || 'General'

  if (!baseNameTrimmed) {
    throw new Error('El nombre base del modelo es obligatorio')
  }

  if (!data.variantes || data.variantes.length === 0) {
    throw new Error('Debe especificar al menos una versión o set')
  }

  // Ejecutamos en una transacción para atomicidad
  const savedVariants = await prisma.$transaction(async (tx) => {
    // 1. Procesar eliminaciones si existen
    if (data.deletedVariantIds && data.deletedVariantIds.length > 0) {
      for (const delId of data.deletedVariantIds) {
        const ventasCount = await tx.venta.count({ where: { productoId: delId } })
        if (ventasCount > 0) {
          await tx.producto.update({
            where: { id: delId },
            data: { activo: false }
          })
        } else {
          await tx.producto.delete({ where: { id: delId } })
        }
      }
    }

    // 2. Guardar o actualizar cada variante
    const results = []
    for (const v of data.variantes) {
      let variantName = v.nombreVersion.trim()
      if (!variantName) variantName = 'Estándar'
      
      // Aseguramos que el nombre en DB sea: "BaseName - VariantName"
      const nombreFinal = variantName.startsWith(`${baseNameTrimmed} - `)
        ? variantName
        : `${baseNameTrimmed} - ${variantName}`

      if (v.id) {
        const updated = await tx.producto.update({
          where: { id: v.id },
          data: {
            nombreModelo: nombreFinal,
            lineaCategoria: lineaCategoriaTrimmed,
            costoBase: v.costoBase,
            precioMenor: v.precioMenor,
            precioMayor: v.precioMayor,
            ...(data.activo !== undefined ? { activo: data.activo } : {}),
            ...(data.imagenUrl !== undefined ? { imagenUrl: data.imagenUrl } : {}),
            ...(data.enlaceMakerworld !== undefined ? { enlaceMakerworld: data.enlaceMakerworld } : {}),
            ...(parsedFecha ? { createdAt: parsedFecha } : {}),
          }
        })
        results.push(updated)
      } else {
        const created = await tx.producto.create({
          data: {
            negocio: targetNegocio,
            nombreModelo: nombreFinal,
            lineaCategoria: lineaCategoriaTrimmed,
            costoBase: v.costoBase,
            precioMenor: v.precioMenor,
            precioMayor: v.precioMayor,
            activo: data.activo ?? true,
            imagenUrl: data.imagenUrl ?? null,
            enlaceMakerworld: data.enlaceMakerworld ?? null,
            ...(parsedFecha ? { createdAt: parsedFecha } : {}),
          }
        })
        results.push(created)
      }
    }

    return results
  })

  safeRevalidate()

  return {
    saved: savedVariants.map(p => ({
      ...p,
      costoBase: Number(p.costoBase),
      precioMayor: Number(p.precioMayor),
      precioMenor: Number(p.precioMenor),
      precioOferta: p.precioOferta != null ? Number(p.precioOferta) : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    deletedIds: data.deletedVariantIds || []
  }
}

export async function duplicarModeloConVariantes(variantIds: string[], baseName: string) {
  if (!variantIds || variantIds.length === 0) {
    throw new Error('No se especificaron productos para duplicar')
  }

  const productos = await prisma.producto.findMany({
    where: { id: { in: variantIds } }
  })

  if (productos.length === 0) {
    throw new Error('Modelos no encontrados')
  }

  const targetNegocio = productos[0].negocio

  // Buscar un nombre único para el nuevo modelo base
  let nuevoBaseName = `${baseName.trim()} (Copia)`
  let count = 1
  while (await prisma.producto.findFirst({
    where: {
      nombreModelo: { startsWith: nuevoBaseName },
      negocio: targetNegocio
    }
  })) {
    count++
    nuevoBaseName = `${baseName.trim()} (Copia ${count})`
  }

  const duplicados = await prisma.$transaction(async (tx) => {
    const results = []
    for (const p of productos) {
      let nuevoNombreModelo: string
      if (p.nombreModelo.includes(' - ')) {
        const vPart = p.nombreModelo.substring(p.nombreModelo.indexOf(' - ') + 3).trim()
        nuevoNombreModelo = `${nuevoBaseName} - ${vPart}`
      } else {
        nuevoNombreModelo = nuevoBaseName
      }

      const dup = await tx.producto.create({
        data: {
          negocio: p.negocio,
          lineaCategoria: p.lineaCategoria,
          nombreModelo: nuevoNombreModelo,
          costoBase: p.costoBase,
          precioMayor: p.precioMayor,
          precioMenor: p.precioMenor,
          activo: true,
          stock: 0,
          controlarStock: p.controlarStock,
          enOferta: p.enOferta,
          precioOferta: p.precioOferta,
          imagenUrl: p.imagenUrl,
          enlaceMakerworld: p.enlaceMakerworld,
          descripcionWeb: p.descripcionWeb,
          destacadoWeb: p.destacadoWeb
        }
      })
      results.push(dup)
    }
    return results
  })

  safeRevalidate()

  return duplicados.map(p => ({
    ...p,
    costoBase: Number(p.costoBase),
    precioMayor: Number(p.precioMayor),
    precioMenor: Number(p.precioMenor),
    precioOferta: p.precioOferta != null ? Number(p.precioOferta) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export async function obtenerMetadataMakerworld(inputUrl: string) {
  const urlTrimmed = inputUrl.trim()
  if (!urlTrimmed) return { success: false, error: 'URL vacía' }

  // 1. Si el usuario ya pegó un link directo de imagen (ej. CDN de MakerWorld o imagen web)
  if (
    urlTrimmed.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) || 
    urlTrimmed.includes('bblmw.com') ||
    urlTrimmed.includes('bblamb.com')
  ) {
    return {
      success: true,
      imagenUrl: urlTrimmed,
      isDirectImage: true
    }
  }

  // 2. Extraer ID del modelo si es URL de makerworld.com
  const matchModel = urlTrimmed.match(/models\/([0-9]+)/i)
  const modelId = matchModel ? matchModel[1] : null

  // Normalizar a URL canónica limpia para evitar parámetros de rastreo y hashes pesados
  const cleanUrl = modelId 
    ? `https://makerworld.com/en/models/${modelId}`
    : urlTrimmed.split('#')[0].split('?')[0]

  // 3. Estrategia A: Microlink con URL normalizada
  try {
    const fetchUrl = `https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`
    const res = await fetch(fetchUrl, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 86400 }
    })
    if (res.ok) {
      const data = await res.json()
      const imgUrl = data?.data?.image?.url
      let title = data?.data?.title
      if (title) {
        title = title.replace(/\s*-\s*Free\s*3D\s*Print\s*Model\s*-\s*MakerWorld/i, '').trim()
        title = title.replace(/\s*-\s*MakerWorld/i, '').trim()
      }
      if (imgUrl && !imgUrl.includes('og-icon.jpeg') && !imgUrl.includes('favicon')) {
        return {
          success: true,
          imagenUrl: imgUrl,
          titulo: title && title !== modelId ? title : undefined
        }
      }
    }
  } catch (e) {
    // Continuar a estrategia fallback
  }

  // 4. Estrategia B: Jina Reader como fallback si Microlink está limitado
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${cleanUrl}`, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(8000)
    })
    if (jinaRes.ok) {
      const text = await jinaRes.text()
      const imgMatch = text.match(/!\[.*?\]\((https:\/\/makerworld\.bblmw\.com\/makerworld\/model\/[^\s\)]+)\)/i) ||
                       text.match(/!\[.*?\]\((https:\/\/makerworld\.bblmw\.com\/[^\s\)]+)\)/i)
      if (imgMatch && imgMatch[1]) {
        const titleMatch = text.match(/Title:\s*(.+)/i)
        const title = titleMatch 
          ? titleMatch[1].replace(/\s*-\s*Free\s*3D\s*Print\s*Model\s*-\s*MakerWorld/i, '').replace(/\s*-\s*MakerWorld/i, '').trim() 
          : undefined
        return {
          success: true,
          imagenUrl: imgMatch[1],
          titulo: title
        }
      }
    }
  } catch (e) {
    // Continuar
  }

  return {
    success: false,
    modelId,
    error: 'No se pudo extraer la portada automáticamente. Puedes hacer clic derecho en la portada en MakerWorld -> "Copiar dirección de la imagen" y pegarla en el campo de Imagen.'
  }
}

export async function deleteModeloConVariantes(variantIds: string[]) {
  if (!variantIds || variantIds.length === 0) {
    throw new Error('No se especificaron productos para eliminar')
  }

  const deletedIds: string[] = []
  const discontinuedIds: string[] = []

  await prisma.$transaction(async (tx) => {
    for (const id of variantIds) {
      const ventasCount = await tx.venta.count({ where: { productoId: id } })
      if (ventasCount > 0) {
        await tx.producto.update({
          where: { id },
          data: { activo: false }
        })
        discontinuedIds.push(id)
      } else {
        await tx.producto.delete({ where: { id } })
        deletedIds.push(id)
      }
    }
  })

  safeRevalidate()

  let message = ''
  if (deletedIds.length > 0 && discontinuedIds.length > 0) {
    message = `Se eliminaron ${deletedIds.length} versión(es) y se marcaron ${discontinuedIds.length} como descontinuadas por tener ventas históricas.`
  } else if (discontinuedIds.length > 0) {
    message = `Las versiones tienen ventas históricas asociadas, por lo que fueron marcadas como Descontinuadas.`
  } else {
    message = `El modelo y sus versiones fueron eliminados correctamente.`
  }

  return { deletedIds, discontinuedIds, message }
}


