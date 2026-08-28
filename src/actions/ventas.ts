'use server'

import prisma from '@/lib/prisma'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
import { revalidatePath } from 'next/cache'

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
  estado: EstadoVenta
  diaEntregaPrometida?: string
  destinoEnvio?: string
  canalVenta?: string
}) {
  const total = data.cantidad * data.precioUnitario
  const saldoPendiente = total - data.montoPagado

  const venta = await prisma.venta.create({
    data: {
      cliente: data.cliente,
      productoId: data.productoId,
      cantidad: data.cantidad,
      tipoPrecio: data.tipoPrecio,
      precioUnitario: data.precioUnitario,
      total,
      montoPagado: data.montoPagado,
      saldoPendiente,
      estado: data.estado,
      diaEntregaPrometida: data.diaEntregaPrometida,
      destinoEnvio: data.destinoEnvio,
      canalVenta: data.canalVenta,
    }
  })

  revalidatePath('/ventas')
  revalidatePath('/')
  return {
    ...venta,
    precioUnitario: Number(venta.precioUnitario),
    total: Number(venta.total),
    montoPagado: Number(venta.montoPagado),
    saldoPendiente: Number(venta.saldoPendiente),
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
  revalidatePath('/ventas')
  return {
    ...venta,
    precioUnitario: Number(venta.precioUnitario),
    total: Number(venta.total),
    montoPagado: Number(venta.montoPagado),
    saldoPendiente: Number(venta.saldoPendiente),
    fecha: venta.fecha.toISOString(),
    createdAt: venta.createdAt.toISOString(),
    updatedAt: venta.updatedAt.toISOString(),
  }
}

export async function registrarAbono(id: string, montoAbono: number) {
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) throw new Error("Venta no encontrada")

  const nuevoMontoPagado = Number(venta.montoPagado) + montoAbono
  const nuevoSaldo = Number(venta.total) - nuevoMontoPagado

  const updatedVenta = await prisma.venta.update({
    where: { id },
    data: {
      montoPagado: nuevoMontoPagado,
      saldoPendiente: nuevoSaldo,
      estado: nuevoSaldo <= 0 && venta.estado === 'PENDIENTE' ? 'ENTREGADO' : venta.estado
    }
  })

  revalidatePath('/ventas')
  revalidatePath('/')
  return {
    ...updatedVenta,
    precioUnitario: Number(updatedVenta.precioUnitario),
    total: Number(updatedVenta.total),
    montoPagado: Number(updatedVenta.montoPagado),
    saldoPendiente: Number(updatedVenta.saldoPendiente),
    fecha: updatedVenta.fecha.toISOString(),
    createdAt: updatedVenta.createdAt.toISOString(),
    updatedAt: updatedVenta.updatedAt.toISOString(),
  }
}

export async function deleteVenta(id: string) {
  await prisma.venta.delete({ where: { id } })
  revalidatePath('/ventas')
  revalidatePath('/')
}
