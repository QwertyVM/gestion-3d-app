'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProductos() {
  return await prisma.producto.findMany({
    orderBy: { lineaCategoria: 'asc' }
  })
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
  return producto
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
  return producto
}

export async function deleteProducto(id: string) {
  await prisma.producto.delete({ where: { id } })
  revalidatePath('/catalogo')
}
