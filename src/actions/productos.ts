'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ajustarStockBobina } from '@/actions/inventario'

function safeRevalidate() {
  try {
    revalidatePath('/catalogo')
    revalidatePath('/catalogo/inventario')
    revalidatePath('/inventario')
    revalidatePath('/ventas')
    revalidatePath('/')
  } catch (e) {}
}

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
    pesoGramos: p.pesoGramos != null ? Number(p.pesoGramos) : 0,
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
  pesoGramos?: number
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
      pesoGramos: data.pesoGramos != null ? data.pesoGramos : 0,
      activo: data.activo ?? true
    }
  })

  safeRevalidate()
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioAmigos: Number(producto.precioAmigos),
    precioMercado: Number(producto.precioMercado),
    precioComunidad: Number(producto.precioComunidad),
    pesoGramos: producto.pesoGramos != null ? Number(producto.pesoGramos) : 0,
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
  pesoGramos?: number
  activo?: boolean
}) {
  const current = await prisma.producto.findUnique({ where: { id } })
  const prevPesoGramos = current?.pesoGramos != null ? Number(current.pesoGramos) : 0
  const nuevoPesoGramos = data.pesoGramos !== undefined && data.pesoGramos !== null ? Number(data.pesoGramos) : prevPesoGramos

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad,
      ...(data.pesoGramos !== undefined ? { pesoGramos: data.pesoGramos } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {})
    }
  })

  // Si se actualizó el peso en gramos, sincronizar todas las ventas activas de este producto y ajustar sus bobinas
  if (data.pesoGramos !== undefined && nuevoPesoGramos !== prevPesoGramos) {
    const ventasAsociadas = await prisma.venta.findMany({
      where: {
        productoId: id,
        estado: { not: 'CANCELADO' }
      }
    })

    for (const v of ventasAsociadas) {
      const cant = Number(v.cantidad || 1)
      const prevVentaGramos = v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
        ? Number(v.gramosConsumidos)
        : (prevPesoGramos * cant)
      const newVentaGramos = nuevoPesoGramos * cant
      const delta = newVentaGramos - prevVentaGramos

      await prisma.venta.update({
        where: { id: v.id },
        data: { gramosConsumidos: newVentaGramos }
      })

      if (v.colorFilamentoId && delta !== 0) {
        await ajustarStockBobina(v.colorFilamentoId, delta)
      }
    }
  }

  safeRevalidate()
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioAmigos: Number(producto.precioAmigos),
    precioMercado: Number(producto.precioMercado),
    precioComunidad: Number(producto.precioComunidad),
    pesoGramos: producto.pesoGramos != null ? Number(producto.pesoGramos) : 0,
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
    precioAmigos: Number(updated.precioAmigos),
    precioMercado: Number(updated.precioMercado),
    precioComunidad: Number(updated.precioComunidad),
    pesoGramos: updated.pesoGramos != null ? Number(updated.pesoGramos) : 0,
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
    safeRevalidate()
    return { discontinued: true, message: 'El producto tiene ventas históricas asociadas, por lo que fue marcado como Descontinuado.' }
  }

  await prisma.producto.delete({ where: { id } })
  safeRevalidate()
  return { deleted: true, message: 'Producto eliminado correctamente.' }
}

