'use server'

import prisma from '@/lib/prisma'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/ventas')
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/ingresos')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request store
  }
}

export async function getPromedioPackaging(): Promise<number> {
  const packagingExpenses = await prisma.inversion.findMany({
    where: {
      OR: [
        { subcategoria: { contains: 'Embalaje', mode: 'insensitive' } },
        { subcategoria: { contains: 'Cajas', mode: 'insensitive' } },
        { itemConcepto: { contains: 'Caja', mode: 'insensitive' } },
        { itemConcepto: { contains: 'Bolsa', mode: 'insensitive' } },
        { itemConcepto: { contains: 'Sticker', mode: 'insensitive' } },
      ]
    }
  })

  const totalGasto = packagingExpenses.reduce((sum, e) => sum + Number(e.costoTotal), 0)
  const totalUnidades = packagingExpenses.reduce((sum, e) => sum + (e.cantidad || 1), 0)

  if (totalUnidades > 0) {
    const prom = totalGasto / totalUnidades
    return Number(prom.toFixed(2))
  }

  return 10.00
}

export async function getVentas() {
  const ventas = await prisma.venta.findMany({
    include: {
      producto: true
    },
    orderBy: { fecha: 'desc' }
  })

  return ventas.map(v => ({
    ...v,
    precioUnitario: Number(v.precioUnitario),
    total: Number(v.total),
    montoPagado: Number(v.montoPagado),
    saldoPendiente: Number(v.saldoPendiente),
    costoPackaging: v.costoPackaging ? Number(v.costoPackaging) : 0,
    porcentajeAdicional: v.porcentajeAdicional ? Number(v.porcentajeAdicional) : 0,
    costoBaseSnapshot: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
    nombreProductoSnapshot: v.nombreProductoSnapshot || v.producto?.nombreModelo || '',
    fecha: v.fecha.toISOString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    producto: {
      ...v.producto,
      costoBase: Number(v.producto.costoBase),
      precioAmigos: Number(v.producto.precioAmigos),
      precioMercado: Number(v.producto.precioMercado),
      precioComunidad: Number(v.producto.precioComunidad),
      createdAt: v.producto.createdAt.toISOString(),
      updatedAt: v.producto.updatedAt.toISOString(),
    }
  }))
}

export async function createVenta(data: {
  cliente: string
  productoId: string
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  montoPagado: number
  costoPackaging?: number
  porcentajeAdicional?: number
  estado: EstadoVenta
  diaEntregaPrometida?: string
  destinoEnvio?: string
  canalVenta?: string
}) {
  const total = data.cantidad * data.precioUnitario
  const saldoPendiente = total - data.montoPagado

  // Obtain product to freeze immutable snapshot of base cost and model name
  const producto = await prisma.producto.findUnique({
    where: { id: data.productoId }
  })

  const venta = await prisma.venta.create({
    data: {
      cliente: data.cliente,
      productoId: data.productoId,
      nombreProductoSnapshot: producto?.nombreModelo || '',
      costoBaseSnapshot: producto?.costoBase || 0,
      cantidad: data.cantidad,
      tipoPrecio: data.tipoPrecio,
      precioUnitario: data.precioUnitario,
      total,
      montoPagado: data.montoPagado,
      saldoPendiente,
      costoPackaging: data.costoPackaging || 0,
      porcentajeAdicional: data.porcentajeAdicional || 0,
      estado: data.estado,
      diaEntregaPrometida: data.diaEntregaPrometida,
      destinoEnvio: data.destinoEnvio,
      canalVenta: data.canalVenta,
    }
  })

  safeRevalidate()

  return {
    ...venta,
    precioUnitario: Number(venta.precioUnitario),
    total: Number(venta.total),
    montoPagado: Number(venta.montoPagado),
    saldoPendiente: Number(venta.saldoPendiente),
    costoPackaging: venta.costoPackaging ? Number(venta.costoPackaging) : 0,
    porcentajeAdicional: venta.porcentajeAdicional ? Number(venta.porcentajeAdicional) : 0,
    fecha: venta.fecha.toISOString(),
    createdAt: venta.createdAt.toISOString(),
    updatedAt: venta.updatedAt.toISOString(),
  }
}

export async function updateEstadoVenta(id: string, estado: EstadoVenta) {
  const venta = await prisma.venta.update({
    where: { id },
    data: { estado }
  })
  safeRevalidate()
  return {
    ...venta,
    precioUnitario: Number(venta.precioUnitario),
    total: Number(venta.total),
    montoPagado: Number(venta.montoPagado),
    saldoPendiente: Number(venta.saldoPendiente),
    costoPackaging: venta.costoPackaging ? Number(venta.costoPackaging) : 0,
    porcentajeAdicional: venta.porcentajeAdicional ? Number(venta.porcentajeAdicional) : 0,
    fecha: venta.fecha.toISOString(),
    createdAt: venta.createdAt.toISOString(),
    updatedAt: venta.updatedAt.toISOString(),
  }
}

export async function registrarAbono(id: string, montoAbono: number) {
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) throw new Error("Venta no encontrada")

  const nuevoMontoPagado = Number(venta.montoPagado) + montoAbono
  const nuevoSaldo = Math.max(0, Number(venta.total) - nuevoMontoPagado)

  const updatedVenta = await prisma.venta.update({
    where: { id },
    data: {
      montoPagado: nuevoMontoPagado,
      saldoPendiente: nuevoSaldo,
    }
  })

  safeRevalidate()

  return {
    ...updatedVenta,
    precioUnitario: Number(updatedVenta.precioUnitario),
    total: Number(updatedVenta.total),
    montoPagado: Number(updatedVenta.montoPagado),
    saldoPendiente: Number(updatedVenta.saldoPendiente),
    costoPackaging: updatedVenta.costoPackaging ? Number(updatedVenta.costoPackaging) : 0,
    porcentajeAdicional: updatedVenta.porcentajeAdicional ? Number(updatedVenta.porcentajeAdicional) : 0,
    fecha: updatedVenta.fecha.toISOString(),
    createdAt: updatedVenta.createdAt.toISOString(),
    updatedAt: updatedVenta.updatedAt.toISOString(),
  }
}

export async function liquidarSaldoTotal(id: string) {
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) throw new Error("Venta no encontrada")

  const updatedVenta = await prisma.venta.update({
    where: { id },
    data: {
      montoPagado: venta.total,
      saldoPendiente: 0,
    }
  })

  safeRevalidate()

  return {
    ...updatedVenta,
    precioUnitario: Number(updatedVenta.precioUnitario),
    total: Number(updatedVenta.total),
    montoPagado: Number(updatedVenta.montoPagado),
    saldoPendiente: Number(updatedVenta.saldoPendiente),
    costoPackaging: updatedVenta.costoPackaging ? Number(updatedVenta.costoPackaging) : 0,
    porcentajeAdicional: updatedVenta.porcentajeAdicional ? Number(updatedVenta.porcentajeAdicional) : 0,
    fecha: updatedVenta.fecha.toISOString(),
    createdAt: updatedVenta.createdAt.toISOString(),
    updatedAt: updatedVenta.updatedAt.toISOString(),
  }
}

export async function deleteVenta(id: string) {
  await prisma.venta.delete({ where: { id } })
  safeRevalidate()
}
