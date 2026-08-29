'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProductos() {
  const productos = await prisma.producto.findMany({
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
    precioAmigos: Number(p.precioAmigos),
    precioMercado: Number(p.precioMercado),
    precioComunidad: Number(p.precioComunidad),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export async function createProducto(data: {
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad: number
  activo?: boolean
}) {
  const producto = await prisma.producto.create({
    data: {
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad,
      activo: data.activo ?? true
    }
  })

  revalidatePath('/catalogo')
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioAmigos: Number(producto.precioAmigos),
    precioMercado: Number(producto.precioMercado),
    precioComunidad: Number(producto.precioComunidad),
    createdAt: producto.createdAt.toISOString(),
    updatedAt: producto.updatedAt.toISOString(),
  }
}

export async function updateProducto(id: string, data: {
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad: number
  activo?: boolean
}) {
  const producto = await prisma.producto.update({
    where: { id },
    data: {
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad,
      ...(data.activo !== undefined ? { activo: data.activo } : {})
    }
  })

  revalidatePath('/catalogo')
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioAmigos: Number(producto.precioAmigos),
    precioMercado: Number(producto.precioMercado),
    precioComunidad: Number(producto.precioComunidad),
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

  revalidatePath('/catalogo')
  return {
    ...updated,
    costoBase: Number(updated.costoBase),
    precioAmigos: Number(updated.precioAmigos),
    precioMercado: Number(updated.precioMercado),
    precioComunidad: Number(updated.precioComunidad),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteProducto(id: string) {
  const ventasCount = await prisma.venta.count({ where: { productoId: id } })
  if (ventasCount > 0) {
    await prisma.producto.update({
      where: { id },
      data: { activo: false }
    })
    revalidatePath('/catalogo')
    return { discontinued: true, message: 'El producto tiene ventas históricas asociadas, por lo que fue marcado como Descontinuado.' }
  }

  await prisma.producto.delete({ where: { id } })
  revalidatePath('/catalogo')
  return { deleted: true, message: 'Producto eliminado correctamente.' }
}

