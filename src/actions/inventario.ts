'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/inventario')
    revalidatePath('/ventas')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request store
  }
}

export interface ColorFilamentoItem {
  id: string
  nombreColor: string
  codigoHex: string
  estado: 'DISPONIBLE' | 'RESTOCK'
  nota?: string | null
  totalVentas?: number
  createdAt: string
  updatedAt: string
}

// Exact list requested by the user
const INITIAL_DISPONIBLES = [
  { nombreColor: 'Blanco hueso', codigoHex: '#F5F5F0', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Lila púrpura', codigoHex: '#C084FC', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Rojo escarlata', codigoHex: '#DC2626', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Gris ceniza', codigoHex: '#94A3B8', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Azul oscuro', codigoHex: '#1E3A8A', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Negro carbón', codigoHex: '#18181B', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Naranja mandarina', codigoHex: '#F97316', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Marrón latte', codigoHex: '#854D0E', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Verde grass', codigoHex: '#22C55E', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Arena', codigoHex: '#D4B996', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Rosa Sakura', codigoHex: '#F472B6', estado: 'DISPONIBLE' as const, nota: null },
  { nombreColor: 'Blanco marfil', codigoHex: '#FFFBEB', estado: 'DISPONIBLE' as const, nota: null },
]

const INITIAL_RESTOCK = [
  { nombreColor: 'Chocolate oscuro', codigoHex: '#451A03', estado: 'RESTOCK' as const, nota: null },
  { nombreColor: 'Ciruela', codigoHex: '#581C87', estado: 'RESTOCK' as const, nota: null },
  { nombreColor: 'Marrón oscuro', codigoHex: '#3E2723', estado: 'RESTOCK' as const, nota: null },
  { nombreColor: 'Rojo oscuro', codigoHex: '#7F1D1D', estado: 'RESTOCK' as const, nota: null },
  { nombreColor: 'Terracota', codigoHex: '#A36F4C', estado: 'RESTOCK' as const, nota: null },
  { nombreColor: 'Verde manzana', codigoHex: '#65A30D', estado: 'RESTOCK' as const, nota: null },
  { nombreColor: 'Verde oscuro', codigoHex: '#14532D', estado: 'RESTOCK' as const, nota: 'Por terminar' },
  { nombreColor: 'Azul oscuro (Restock)', codigoHex: '#1E3A8A', estado: 'RESTOCK' as const, nota: 'Por terminar' },
]

export async function getColoresInventario(forceReset = false): Promise<{
  disponibles: ColorFilamentoItem[]
  restock: ColorFilamentoItem[]
}> {
  const count = await prisma.inventarioFilamento.count()

  if (count === 0 || forceReset) {
    await prisma.inventarioFilamento.deleteMany({})

    for (const c of INITIAL_DISPONIBLES) {
      await prisma.inventarioFilamento.create({
        data: {
          nombreColor: c.nombreColor,
          codigoHex: c.codigoHex,
          estadoStock: 'ABIERTO', // Map 'ABIERTO' to DISPONIBLE
          estado: 'DISPONIBLE',
          notaProduccion: c.nota,
          stockBobinas: 1.0,
          stockGramos: 1000,
          activo: true,
        }
      })
    }

    for (const c of INITIAL_RESTOCK) {
      await prisma.inventarioFilamento.create({
        data: {
          nombreColor: c.nombreColor,
          codigoHex: c.codigoHex,
          estadoStock: 'FALTANTE', // Map 'FALTANTE' to RESTOCK
          estado: 'AGOTADO',
          notaProduccion: c.nota,
          stockBobinas: 0,
          stockGramos: 0,
          activo: true,
        }
      })
    }
  }

  const filamentos = await prisma.inventarioFilamento.findMany({
    where: { activo: true },
    include: {
      ventas: {
        select: { id: true }
      }
    },
    orderBy: { nombreColor: 'asc' }
  })

  const mapped: ColorFilamentoItem[] = filamentos.map(f => {
    const isDisponible = f.estadoStock === 'ABIERTO' || f.estadoStock === 'SELLADO' || f.estado === 'DISPONIBLE'

    return {
      id: f.id,
      nombreColor: f.nombreColor,
      codigoHex: f.codigoHex || '#18181B',
      estado: isDisponible ? 'DISPONIBLE' : 'RESTOCK',
      nota: f.notaProduccion || null,
      totalVentas: f.ventas.length,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }
  })

  const disponibles = mapped.filter(c => c.estado === 'DISPONIBLE')
  const restock = mapped.filter(c => c.estado === 'RESTOCK')

  return { disponibles, restock }
}

export async function moverEstadoColor(id: string, nuevoEstado: 'DISPONIBLE' | 'RESTOCK', nota?: string | null) {
  const updated = await prisma.inventarioFilamento.update({
    where: { id },
    data: {
      estadoStock: nuevoEstado === 'DISPONIBLE' ? 'ABIERTO' : 'FALTANTE',
      estado: nuevoEstado === 'DISPONIBLE' ? 'DISPONIBLE' : 'AGOTADO',
      stockBobinas: nuevoEstado === 'DISPONIBLE' ? 1.0 : 0,
      stockGramos: nuevoEstado === 'DISPONIBLE' ? 1000 : 0,
      notaProduccion: nota !== undefined ? nota : (nuevoEstado === 'RESTOCK' ? null : null),
      alertaCritica: Boolean(nota),
    }
  })

  safeRevalidate()

  return {
    id: updated.id,
    nombreColor: updated.nombreColor,
    codigoHex: updated.codigoHex || '#18181B',
    estado: nuevoEstado,
    nota: updated.notaProduccion,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function agregarNuevoColor(data: {
  nombreColor: string
  codigoHex?: string
  estado: 'DISPONIBLE' | 'RESTOCK'
  nota?: string | null
}) {
  const created = await prisma.inventarioFilamento.create({
    data: {
      nombreColor: data.nombreColor.trim(),
      codigoHex: data.codigoHex || '#18181B',
      estadoStock: data.estado === 'DISPONIBLE' ? 'ABIERTO' : 'FALTANTE',
      estado: data.estado === 'DISPONIBLE' ? 'DISPONIBLE' : 'AGOTADO',
      stockBobinas: data.estado === 'DISPONIBLE' ? 1.0 : 0,
      stockGramos: data.estado === 'DISPONIBLE' ? 1000 : 0,
      notaProduccion: data.nota?.trim() || null,
      alertaCritica: Boolean(data.nota),
      activo: true,
    }
  })

  safeRevalidate()

  return {
    id: created.id,
    nombreColor: created.nombreColor,
    codigoHex: created.codigoHex || '#18181B',
    estado: data.estado,
    nota: created.notaProduccion,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  }
}

export async function eliminarColor(id: string) {
  const ventaCount = await prisma.venta.count({
    where: { colorFilamentoId: id }
  })

  if (ventaCount > 0) {
    await prisma.inventarioFilamento.update({
      where: { id },
      data: { activo: false }
    })
    safeRevalidate()
    return { success: true, softDeleted: true }
  }

  await prisma.inventarioFilamento.delete({
    where: { id }
  })

  safeRevalidate()
  return { success: true, softDeleted: false }
}

export async function resetColoresTaller() {
  return getColoresInventario(true)
}

// Para selector de ventas
export async function getFilamentosActivos() {
  const { disponibles } = await getColoresInventario()
  return disponibles.map(d => ({
    id: d.id,
    nombreColor: d.nombreColor,
    numeroBobina: 1,
    codigoHex: d.codigoHex,
    tipoMaterial: 'PLA',
    marca: 'Taller',
    stockGramos: 1000,
    stockBobinas: 1,
    porcentajeRestante: 100,
    alertaCritica: false,
    estado: 'DISPONIBLE'
  }))
}
