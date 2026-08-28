'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProductos() {
  const productos = await prisma.producto.findMany({
    orderBy: { lineaCategoria: 'asc' }
  })

  return productos.map(p => ({
    ...p,
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
}) {
  const producto = await prisma.producto.create({
    data: {
      lineaCategoria: data.lineaCategoria,
      nombreModelo: data.nombreModelo,
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad
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
}) {
  const producto = await prisma.producto.update({
    where: { id },
    data: {
      lineaCategoria: data.lineaCategoria,
      nombreModelo: data.nombreModelo,
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad
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

export async function deleteProducto(id: string) {
  await prisma.producto.delete({ where: { id } })
  revalidatePath('/catalogo')
}
