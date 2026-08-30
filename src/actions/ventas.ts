'use server'

import prisma from '@/lib/prisma'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/ventas')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/balance')
    revalidatePath('/inventario')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request store
  }
}

function serializeVenta(v: any) {
  return {
    id: v.id,
    fecha: v.fecha instanceof Date ? v.fecha.toISOString() : String(v.fecha),
    cliente: v.cliente,
    productoId: v.productoId,
    costoBaseSnapshot: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
    nombreProductoSnapshot: v.nombreProductoSnapshot || v.producto?.nombreModelo || '',
    colorFilamentoId: v.colorFilamentoId || null,
    personalizacion: v.personalizacion || null,
    gramosConsumidos: v.gramosConsumidos != null ? Number(v.gramosConsumidos) : 0,
    cantidad: Number(v.cantidad),
    tipoPrecio: v.tipoPrecio,
    precioUnitario: Number(v.precioUnitario),
    total: Number(v.total),
    montoPagado: Number(v.montoPagado),
    saldoPendiente: Number(v.saldoPendiente),
    costoPackaging: v.costoPackaging != null ? Number(v.costoPackaging) : 0,
    porcentajeAdicional: v.porcentajeAdicional != null ? Number(v.porcentajeAdicional) : 0,
    estado: v.estado,
    diaEntregaPrometida: v.diaEntregaPrometida || null,
    destinoEnvio: v.destinoEnvio || null,
    canalVenta: v.canalVenta || null,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
    updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : String(v.updatedAt),
    colorFilamento: v.colorFilamento ? {
      id: v.colorFilamento.id,
      nombreColor: v.colorFilamento.nombreColor,
      numeroBobina: v.colorFilamento.numeroBobina || 1,
      codigoHex: v.colorFilamento.codigoHex || '#1E1E1E',
      tipoMaterial: v.colorFilamento.tipoMaterial,
      marca: v.colorFilamento.marca || 'Genérica',
      stockGramos: v.colorFilamento.stockGramos ? Number(v.colorFilamento.stockGramos) : 0,
      stockBobinas: Number(v.colorFilamento.stockBobinas),
      alertaCritica: Boolean(v.colorFilamento.alertaCritica || (v.colorFilamento.stockGramos && Number(v.colorFilamento.stockGramos) < 300))
    } : null,
    producto: v.producto ? {
      id: v.producto.id,
      lineaCategoria: v.producto.lineaCategoria,
      nombreModelo: v.producto.nombreModelo,
      costoBase: Number(v.producto.costoBase),
      precioAmigos: Number(v.producto.precioAmigos),
      precioMercado: Number(v.producto.precioMercado),
      precioComunidad: Number(v.producto.precioComunidad),
      activo: v.producto.activo,
      createdAt: v.producto.createdAt instanceof Date ? v.producto.createdAt.toISOString() : String(v.producto.createdAt),
      updatedAt: v.producto.updatedAt instanceof Date ? v.producto.updatedAt.toISOString() : String(v.producto.updatedAt),
    } : {
      id: v.productoId,
      lineaCategoria: 'General',
      nombreModelo: v.nombreProductoSnapshot || 'Producto',
      costoBase: 0,
      precioAmigos: 0,
      precioMercado: 0,
      precioComunidad: 0,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function getVentas() {
  const ventas = await prisma.venta.findMany({
    include: {
      producto: true,
      colorFilamento: true
    },
    orderBy: { fecha: 'desc' }
  })

  return ventas.map(serializeVenta)
}

function parseDateInput(fecha?: string | Date) {
  if (!fecha) return new Date()
  if (fecha instanceof Date) return fecha
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) return new Date(fecha)
    const [year, month, day] = fecha.split('-').map(Number)
    if (year && month && day) {
      const target = new Date()
      target.setFullYear(year, month - 1, day)
      return target
    }
    return new Date(fecha)
  }
  return new Date(fecha)
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
  colorFilamentoId?: string | null
  personalizacion?: string | null
  gramosConsumidos?: number | null
  estado: EstadoVenta
  diaEntregaPrometida?: string
  destinoEnvio?: string
  canalVenta?: string
  fecha?: string | Date
}) {
  const total = data.cantidad * data.precioUnitario
  const saldoPendiente = total - data.montoPagado

  const producto = await prisma.producto.findUnique({
    where: { id: data.productoId }
  })

  const venta = await prisma.venta.create({
    data: {
      cliente: data.cliente,
      productoId: data.productoId,
      nombreProductoSnapshot: producto?.nombreModelo || '',
      costoBaseSnapshot: producto?.costoBase || 0,
      colorFilamentoId: data.colorFilamentoId || null,
      personalizacion: data.personalizacion || null,
      gramosConsumidos: data.gramosConsumidos || 0,
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
      fecha: parseDateInput(data.fecha) || new Date(),
    },
    include: {
      producto: true,
      colorFilamento: true
    }
  })

  if (data.colorFilamentoId && data.gramosConsumidos && data.gramosConsumidos > 0) {
    try {
      const spool = await prisma.inventarioFilamento.findUnique({
        where: { id: data.colorFilamentoId }
      })
      if (spool) {
        const currentGramos = spool.stockGramos ? Number(spool.stockGramos) : 0
        const newGramos = Math.max(0, currentGramos - data.gramosConsumidos)
        const pesoInicial = spool.pesoInicialGramos ? Number(spool.pesoInicialGramos) : 1000
        const newPct = Math.min(100, Math.max(0, Number(((newGramos / pesoInicial) * 100).toFixed(0))))

        let estado = 'DISPONIBLE'
        let alertaCritica = false
        let notaProduccion = spool.notaProduccion

        if (newGramos <= 0) {
          estado = 'AGOTADO'
          alertaCritica = true
          notaProduccion = `Bobina #${spool.numeroBobina || 1} agotada en producción`
        } else if (newGramos < 100) {
          estado = 'BAJO_STOCK'
          alertaCritica = true
          notaProduccion = `Alerta: Menos de 100g restantes en Bobina #${spool.numeroBobina || 1} (${newGramos}g restantes)`
        } else if (newGramos < 250) {
          estado = 'BAJO_STOCK'
        }

        await prisma.inventarioFilamento.update({
          where: { id: data.colorFilamentoId },
          data: {
            stockGramos: newGramos,
            stockBobinas: Number((newGramos / 1000).toFixed(2)),
            porcentajeRestante: newPct,
            estado,
            alertaCritica,
            notaProduccion,
          }
        })
      }
    } catch (err) {
      console.error('Error discounting spool grams:', err)
    }
  }

  safeRevalidate()
  return serializeVenta(venta)
}

export async function updateVenta(id: string, data: {
  cliente?: string
  productoId?: string
  cantidad?: number
  tipoPrecio?: TipoPrecio
  precioUnitario?: number
  montoPagado?: number
  costoPackaging?: number
  porcentajeAdicional?: number
  colorFilamentoId?: string | null
  personalizacion?: string | null
  gramosConsumidos?: number | null
  estado?: EstadoVenta
  diaEntregaPrometida?: string | null
  destinoEnvio?: string | null
  canalVenta?: string | null
  fecha?: string | Date
}) {
  const current = await prisma.venta.findUnique({
    where: { id },
    include: { producto: true }
  })
  if (!current) throw new Error("Venta no encontrada")

  const cantidad = data.cantidad !== undefined ? data.cantidad : current.cantidad
  const precioUnitario = data.precioUnitario !== undefined ? data.precioUnitario : Number(current.precioUnitario)
  const total = cantidad * precioUnitario

  const montoPagado = data.montoPagado !== undefined ? data.montoPagado : Number(current.montoPagado)
  const saldoPendiente = Math.max(0, total - montoPagado)

  let newProductoId = current.productoId
  let costoSnapshot = current.costoBaseSnapshot
  let nombreSnapshot = current.nombreProductoSnapshot

  if (data.productoId && data.productoId !== current.productoId) {
    const prod = await prisma.producto.findUnique({ where: { id: data.productoId } })
    if (prod) {
      newProductoId = prod.id
      costoSnapshot = prod.costoBase
      nombreSnapshot = prod.nombreModelo
    }
  }

  let newFecha = current.fecha
  if (data.fecha !== undefined) {
    newFecha = parseDateInput(data.fecha) || current.fecha
  }

  const updated = await prisma.venta.update({
    where: { id },
    data: {
      cliente: data.cliente !== undefined ? data.cliente : current.cliente,
      productoId: newProductoId,
      costoBaseSnapshot: costoSnapshot,
      nombreProductoSnapshot: nombreSnapshot,
      colorFilamentoId: data.colorFilamentoId !== undefined ? data.colorFilamentoId : current.colorFilamentoId,
      personalizacion: data.personalizacion !== undefined ? data.personalizacion : current.personalizacion,
      gramosConsumidos: data.gramosConsumidos !== undefined ? data.gramosConsumidos : current.gramosConsumidos,
      cantidad,
      tipoPrecio: data.tipoPrecio !== undefined ? data.tipoPrecio : current.tipoPrecio,
      precioUnitario,
      total,
      montoPagado,
      saldoPendiente,
      costoPackaging: data.costoPackaging !== undefined ? data.costoPackaging : current.costoPackaging,
      porcentajeAdicional: data.porcentajeAdicional !== undefined ? data.porcentajeAdicional : current.porcentajeAdicional,
      estado: data.estado !== undefined ? data.estado : current.estado,
      diaEntregaPrometida: data.diaEntregaPrometida !== undefined ? data.diaEntregaPrometida : current.diaEntregaPrometida,
      destinoEnvio: data.destinoEnvio !== undefined ? data.destinoEnvio : current.destinoEnvio,
      canalVenta: data.canalVenta !== undefined ? data.canalVenta : current.canalVenta,
      fecha: newFecha,
    },
    include: {
      producto: true,
      colorFilamento: true
    }
  })

  safeRevalidate()
  return serializeVenta(updated)
}

export async function updateEstadoVenta(id: string, estado: EstadoVenta) {
  const venta = await prisma.venta.update({
    where: { id },
    data: { estado },
    include: {
      producto: true,
      colorFilamento: true
    }
  })
  safeRevalidate()
  return serializeVenta(venta)
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
    },
    include: {
      producto: true,
      colorFilamento: true
    }
  })

  safeRevalidate()
  return serializeVenta(updatedVenta)
}

export async function liquidarSaldoTotal(id: string) {
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) throw new Error("Venta no encontrada")

  const updatedVenta = await prisma.venta.update({
    where: { id },
    data: {
      montoPagado: venta.total,
      saldoPendiente: 0,
    },
    include: {
      producto: true,
      colorFilamento: true
    }
  })

  safeRevalidate()
  return serializeVenta(updatedVenta)
}

export async function deleteVenta(id: string) {
  await prisma.venta.delete({
    where: { id }
  })
  safeRevalidate()
  return { success: true }
}

export async function getPromedioPackaging(): Promise<number> {
  const egresosPackaging = await prisma.inversion.findMany({
    where: {
      OR: [
        { categoria: 'INSUMO' },
        { subcategoria: { contains: 'packaging', mode: 'insensitive' } },
        { itemConcepto: { contains: 'bolsa', mode: 'insensitive' } },
        { itemConcepto: { contains: 'caja', mode: 'insensitive' } },
        { itemConcepto: { contains: 'packaging', mode: 'insensitive' } },
        { itemConcepto: { contains: 'embalaje', mode: 'insensitive' } },
      ]
    },
    select: { costoTotal: true }
  })

  if (egresosPackaging.length === 0) return 1.50
  const suma = egresosPackaging.reduce((acc, e) => acc + Number(e.costoTotal), 0)
  return Number((suma / egresosPackaging.length).toFixed(2))
}
