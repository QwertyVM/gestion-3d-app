'use server'

import prisma from '@/lib/prisma'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getVentas() {
  return await prisma.venta.findMany({
    include: {
      producto: true
    },
    orderBy: { fecha: 'desc' }
  })
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
  return venta
}

export async function updateEstadoVenta(id: string, estado: EstadoVenta) {
  const venta = await prisma.venta.update({
    where: { id },
    data: { estado }
  })
  revalidatePath('/ventas')
  return venta
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
  return updatedVenta
}

export async function deleteVenta(id: string) {
  await prisma.venta.delete({ where: { id } })
  revalidatePath('/ventas')
  revalidatePath('/')
}
