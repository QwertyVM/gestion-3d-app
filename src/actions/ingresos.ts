'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/ingresos')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request context
  }
}

export async function getIngresos() {
  const ingresos = await prisma.ingreso.findMany({
    orderBy: { fecha: 'desc' }
  })

  return ingresos.map(i => ({
    id: i.id,
    fecha: i.fecha.toISOString(),
    cliente: i.cliente,
    concepto: i.concepto,
    categoria: i.categoria,
    monto: Number(i.monto),
    metodoPago: i.metodoPago || 'YAPE',
    notas: i.notas || '',
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }))
}

export async function createIngreso(data: {
  cliente: string
  concepto: string
  categoria?: string
  monto: number
  metodoPago?: string
  notas?: string
  fecha?: string
}) {
  const ingreso = await prisma.ingreso.create({
    data: {
      cliente: data.cliente,
      concepto: data.concepto,
      categoria: data.categoria || 'SERVICIO',
      monto: data.monto,
      metodoPago: data.metodoPago || 'YAPE',
      notas: data.notas || null,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
    }
  })

  safeRevalidate()

  return {
    id: ingreso.id,
    fecha: ingreso.fecha.toISOString(),
    cliente: ingreso.cliente,
    concepto: ingreso.concepto,
    categoria: ingreso.categoria,
    monto: Number(ingreso.monto),
    metodoPago: ingreso.metodoPago || 'YAPE',
    notas: ingreso.notas || '',
    createdAt: ingreso.createdAt.toISOString(),
    updatedAt: ingreso.updatedAt.toISOString(),
  }
}

export async function deleteIngreso(id: string) {
  await prisma.ingreso.delete({ where: { id } })
  safeRevalidate()
}
