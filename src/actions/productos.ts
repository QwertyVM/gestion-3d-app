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
  descripcionWeb?: string | null
  destacadoWeb?: boolean
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()

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
      descripcionWeb: data.descripcionWeb ?? null,
      destacadoWeb: data.destacadoWeb ?? false,
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
  descripcionWeb?: string | null
  destacadoWeb?: boolean
}) {
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
      ...(data.descripcionWeb !== undefined ? { descripcionWeb: data.descripcionWeb } : {}),
      ...(data.destacadoWeb !== undefined ? { destacadoWeb: data.destacadoWeb } : {}),
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
