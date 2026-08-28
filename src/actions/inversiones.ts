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
    costoUnitario: Number(inv.costoUnitario),
    costoEnvio: inv.costoEnvio ? Number(inv.costoEnvio) : null,
    costoTotal: Number(inv.costoTotal),
    costoPorGramo: inv.costoPorGramo ? Number(inv.costoPorGramo) : null,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }))
}

export async function createInversion(data: {
  persona?: string
  categoria: CategoriaInversion
  itemConcepto: string
  especificacionColor?: string
  presentacion?: string
  cantidad: number
  costoUnitario: number
  costoEnvio?: number
  loteRegistro?: string
}) {
  const costoTotal = (data.cantidad * data.costoUnitario) + (data.costoEnvio || 0)
  
  // Asumiendo que presentación contiene "g" o "kg" para calcular costo por gramo si aplica
  let costoPorGramo = null
  if (data.presentacion && data.categoria === 'INSUMO') {
    // Lógica básica para extraer gramos si dice "1kg" o "1000g"
    const match = data.presentacion.match(/(\d+)\s*(kg|g)/i)
    if (match) {
      const amount = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      const totalGrams = unit === 'kg' ? amount * 1000 : amount
      if (totalGrams > 0) {
        costoPorGramo = costoTotal / totalGrams
      }
    }
  }

  const inversion = await prisma.inversion.create({
    data: {
      persona: data.persona || 'Víctor',
      categoria: data.categoria,
      itemConcepto: data.itemConcepto,
      especificacionColor: data.especificacionColor,
      presentacion: data.presentacion,
      cantidad: data.cantidad,
      costoUnitario: data.costoUnitario,
      costoEnvio: data.costoEnvio || 0,
      costoTotal,
      costoPorGramo,
      loteRegistro: data.loteRegistro
    }
  })

  revalidatePath('/inversiones')
  revalidatePath('/')
  return inversion
}

export async function deleteInversion(id: string) {
  await prisma.inversion.delete({ where: { id } })
  revalidatePath('/inversiones')
  revalidatePath('/')
}
