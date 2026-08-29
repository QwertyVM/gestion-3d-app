'use server'

import prisma from '@/lib/prisma'
import { CategoriaInversion } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getInversiones() {
  const inversiones = await prisma.inversion.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return inversiones.map(inv => ({
    ...inv,
    subcategoria: inv.subcategoria || null,
    costoUnitario: Number(inv.costoUnitario),
    costoEnvio: inv.costoEnvio ? Number(inv.costoEnvio) : null,
    costoTotal: Number(inv.costoTotal),
    costoPorGramo: inv.costoPorGramo ? Number(inv.costoPorGramo) : null,
    montoCuota: inv.montoCuota ? Number(inv.montoCuota) : null,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }))
}

export async function createInversion(data: {
  persona?: string
  categoria: CategoriaInversion
  subcategoria?: string
  itemConcepto: string
  especificacionColor?: string
  presentacion?: string
  cantidad: number
  costoUnitario: number
  costoEnvio?: number
  numeroCuotas?: number
}) {
  const costoTotal = (data.cantidad * data.costoUnitario) + (data.costoEnvio || 0)
  
  let montoCuota = null
  if (data.numeroCuotas && data.numeroCuotas > 0) {
    montoCuota = costoTotal / data.numeroCuotas
  }

  // Extraer gramos si dice "1kg" o "1000g"
  let costoPorGramo = null
  if (data.presentacion && data.categoria === 'INSUMO') {
    const match = data.presentacion.match(/(\d+)\s*(kg|g)/i)
    if (match) {
      const amount = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      const totalGrams = (unit === 'kg' ? amount * 1000 : amount) * data.cantidad
      if (totalGrams > 0) {
        costoPorGramo = costoTotal / totalGrams
      }
    }
  }

  const inversion = await prisma.inversion.create({
    data: {
      persona: data.persona || 'Víctor',
      categoria: data.categoria,
      subcategoria: data.subcategoria || undefined,
      itemConcepto: data.itemConcepto,
      especificacionColor: data.especificacionColor,
      presentacion: data.presentacion,
      cantidad: data.cantidad,
      costoUnitario: data.costoUnitario,
      costoEnvio: data.costoEnvio || 0,
      costoTotal,
      costoPorGramo,
      numeroCuotas: data.numeroCuotas,
      montoCuota
    }
  })

  revalidatePath('/finanzas')
  revalidatePath('/finanzas/egresos')
  revalidatePath('/finanzas/flujo-caja')
  revalidatePath('/inversiones')
  revalidatePath('/')
  return {
    ...inversion,
    costoUnitario: Number(inversion.costoUnitario),
    costoEnvio: inversion.costoEnvio ? Number(inversion.costoEnvio) : null,
    costoTotal: Number(inversion.costoTotal),
    costoPorGramo: inversion.costoPorGramo ? Number(inversion.costoPorGramo) : null,
    montoCuota: inversion.montoCuota ? Number(inversion.montoCuota) : null,
    createdAt: inversion.createdAt.toISOString(),
    updatedAt: inversion.updatedAt.toISOString(),
  }
}

export async function updateInversion(id: string, data: {
  persona?: string
  categoria?: CategoriaInversion
  subcategoria?: string
  itemConcepto?: string
  especificacionColor?: string
  presentacion?: string
  cantidad?: number
  costoUnitario?: number
  costoEnvio?: number
  numeroCuotas?: number
}) {
  const current = await prisma.inversion.findUnique({ where: { id } })
  if (!current) throw new Error("Registro de egreso no encontrado")

  const cantidad = data.cantidad !== undefined ? data.cantidad : current.cantidad
  const costoUnitario = data.costoUnitario !== undefined ? data.costoUnitario : Number(current.costoUnitario)
  const costoEnvio = data.costoEnvio !== undefined ? data.costoEnvio : (current.costoEnvio ? Number(current.costoEnvio) : 0)
  const categoria = data.categoria || current.categoria
  const subcategoria = data.subcategoria !== undefined ? data.subcategoria : current.subcategoria
  const presentacion = data.presentacion !== undefined ? data.presentacion : current.presentacion
  const numeroCuotas = data.numeroCuotas !== undefined ? data.numeroCuotas : current.numeroCuotas

  const costoTotal = (cantidad * costoUnitario) + costoEnvio

  let montoCuota = null
  if (numeroCuotas && numeroCuotas > 0) {
    montoCuota = costoTotal / numeroCuotas
  }

  let costoPorGramo = null
  if (presentacion && categoria === 'INSUMO') {
    const match = presentacion.match(/(\d+)\s*(kg|g)/i)
    if (match) {
      const amount = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      const totalGrams = (unit === 'kg' ? amount * 1000 : amount) * cantidad
      if (totalGrams > 0) {
        costoPorGramo = costoTotal / totalGrams
      }
    }
  }

  const updated = await prisma.inversion.update({
    where: { id },
    data: {
      persona: data.persona !== undefined ? data.persona : current.persona,
      categoria,
      subcategoria,
      itemConcepto: data.itemConcepto !== undefined ? data.itemConcepto : current.itemConcepto,
      especificacionColor: data.especificacionColor !== undefined ? data.especificacionColor : current.especificacionColor,
      presentacion,
      cantidad,
      costoUnitario,
      costoEnvio,
      costoTotal,
      costoPorGramo,
      numeroCuotas,
      montoCuota
    }
  })

  revalidatePath('/finanzas')
  revalidatePath('/finanzas/egresos')
  revalidatePath('/finanzas/flujo-caja')
  revalidatePath('/inversiones')
  revalidatePath('/')

  return {
    ...updated,
    costoUnitario: Number(updated.costoUnitario),
    costoEnvio: updated.costoEnvio ? Number(updated.costoEnvio) : null,
    costoTotal: Number(updated.costoTotal),
    costoPorGramo: updated.costoPorGramo ? Number(updated.costoPorGramo) : null,
    montoCuota: updated.montoCuota ? Number(updated.montoCuota) : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteInversion(id: string) {
  await prisma.inversion.delete({ where: { id } })
  revalidatePath('/finanzas')
  revalidatePath('/finanzas/egresos')
  revalidatePath('/finanzas/flujo-caja')
  revalidatePath('/inversiones')
  revalidatePath('/')
}
