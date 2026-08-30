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
  stockGramos: number
  rollos: number // Cantidad de rollos (cada rollo equivale a 1,000g)
  pesoInicialGramos: number // rollos * 1000g (capacidad total del color)
  alertaCritica: boolean
  totalVentas?: number
  createdAt: string
  updatedAt: string
}

// Exact list requested by the user with initial gram weights
const INITIAL_DISPONIBLES = [
  { nombreColor: 'Blanco hueso', codigoHex: '#F5F5F0', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 850, nota: null },
  { nombreColor: 'Lila púrpura', codigoHex: '#C084FC', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 650, nota: null },
  { nombreColor: 'Rojo escarlata', codigoHex: '#DC2626', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 250, nota: '⚠️ Menos de 300g restantes' },
  { nombreColor: 'Gris ceniza', codigoHex: '#94A3B8', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 400, nota: null },
  { nombreColor: 'Azul oscuro', codigoHex: '#1E3A8A', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 700, nota: null },
  { nombreColor: 'Negro carbón', codigoHex: '#18181B', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 950, nota: null },
  { nombreColor: 'Naranja mandarina', codigoHex: '#F97316', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 500, nota: null },
  { nombreColor: 'Marrón latte', codigoHex: '#854D0E', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 750, nota: null },
  { nombreColor: 'Verde grass', codigoHex: '#22C55E', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 600, nota: null },
  { nombreColor: 'Arena', codigoHex: '#D4B996', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 800, nota: null },
  { nombreColor: 'Rosa Sakura', codigoHex: '#F472B6', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 550, nota: null },
  { nombreColor: 'Blanco marfil', codigoHex: '#FFFBEB', estado: 'DISPONIBLE' as const, rollos: 1, stockGramos: 900, nota: null },
]

const INITIAL_RESTOCK = [
  { nombreColor: 'Chocolate oscuro', codigoHex: '#451A03', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: null },
  { nombreColor: 'Ciruela', codigoHex: '#581C87', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: null },
  { nombreColor: 'Marrón oscuro', codigoHex: '#3E2723', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: null },
  { nombreColor: 'Rojo oscuro', codigoHex: '#7F1D1D', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: null },
  { nombreColor: 'Terracota', codigoHex: '#A36F4C', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: null },
  { nombreColor: 'Verde manzana', codigoHex: '#65A30D', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: null },
  { nombreColor: 'Verde oscuro', codigoHex: '#14532D', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: 'Por terminar' },
  { nombreColor: 'Azul oscuro (Restock)', codigoHex: '#1E3A8A', estado: 'RESTOCK' as const, rollos: 1, stockGramos: 0, nota: 'Por terminar' },
]

export async function getColoresInventario(forceReset = false): Promise<{
  disponibles: ColorFilamentoItem[]
  restock: ColorFilamentoItem[]
}> {
  const count = await prisma.inventarioFilamento.count()

  if (count === 0 || forceReset) {
    await prisma.inventarioFilamento.deleteMany({})

    for (const c of INITIAL_DISPONIBLES) {
      const rollos = c.rollos || 1
      const totalGramos = rollos * 1000
      await prisma.inventarioFilamento.create({
        data: {
          nombreColor: c.nombreColor,
          codigoHex: c.codigoHex,
          estadoStock: 'ABIERTO',
          estado: 'DISPONIBLE',
          notaProduccion: c.nota,
          stockBobinas: rollos,
          stockGramos: c.stockGramos,
          pesoInicialGramos: totalGramos,
          alertaCritica: c.stockGramos < 300,
          activo: true,
        }
      })
    }

    for (const c of INITIAL_RESTOCK) {
      const rollos = c.rollos || 1
      const totalGramos = rollos * 1000
      await prisma.inventarioFilamento.create({
        data: {
          nombreColor: c.nombreColor,
          codigoHex: c.codigoHex,
          estadoStock: 'FALTANTE',
          estado: 'AGOTADO',
          notaProduccion: c.nota,
          stockBobinas: rollos,
          stockGramos: 0,
          pesoInicialGramos: totalGramos,
          alertaCritica: true,
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
    const storedBobinas = f.stockBobinas != null && Number(f.stockBobinas) >= 1 ? Math.round(Number(f.stockBobinas)) : 1
    const storedPeso = f.pesoInicialGramos != null ? Number(f.pesoInicialGramos) : (storedBobinas * 1000)
    const rollos = Math.max(1, Math.round(storedPeso / 1000))
    const pesoInicialGramos = rollos * 1000

    const stockGramos = f.stockGramos != null ? Number(f.stockGramos) : (isDisponible ? pesoInicialGramos : 0)
    const alertaCritica = isDisponible && stockGramos < 300

    return {
      id: f.id,
      nombreColor: f.nombreColor,
      codigoHex: f.codigoHex || '#18181B',
      estado: isDisponible ? 'DISPONIBLE' : 'RESTOCK',
      nota: f.notaProduccion || (alertaCritica ? '⚠️ Menos de 300g' : null),
      stockGramos,
      rollos,
      pesoInicialGramos,
      alertaCritica,
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
  const current = await prisma.inventarioFilamento.findUnique({ where: { id } })
  const storedBobinas = current?.stockBobinas != null && Number(current.stockBobinas) >= 1 ? Math.round(Number(current.stockBobinas)) : 1
  const storedPeso = current?.pesoInicialGramos != null ? Number(current.pesoInicialGramos) : (storedBobinas * 1000)
  const rollos = Math.max(1, Math.round(storedPeso / 1000))
  const pesoInicialGramos = rollos * 1000

  const gramos = nuevoEstado === 'DISPONIBLE' 
    ? (current?.stockGramos && Number(current.stockGramos) > 0 ? Number(current.stockGramos) : pesoInicialGramos)
    : 0

  const updated = await prisma.inventarioFilamento.update({
    where: { id },
    data: {
      estadoStock: nuevoEstado === 'DISPONIBLE' ? 'ABIERTO' : 'FALTANTE',
      estado: nuevoEstado === 'DISPONIBLE' ? 'DISPONIBLE' : 'AGOTADO',
      stockBobinas: rollos,
      stockGramos: gramos,
      pesoInicialGramos,
      notaProduccion: nota !== undefined ? nota : (nuevoEstado === 'RESTOCK' ? 'Por terminar / Solicitado' : null),
      alertaCritica: nuevoEstado === 'RESTOCK' || gramos < 300,
    }
  })

  safeRevalidate()

  return {
    id: updated.id,
    nombreColor: updated.nombreColor,
    codigoHex: updated.codigoHex || '#18181B',
    estado: nuevoEstado,
    nota: updated.notaProduccion,
    stockGramos: gramos,
    rollos,
    pesoInicialGramos,
    alertaCritica: Boolean(updated.alertaCritica || (nuevoEstado === 'DISPONIBLE' && gramos < 300)),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function actualizarRollosColor(id: string, nuevosRollos: number) {
  const rollosNum = Math.max(1, Math.min(20, Math.round(Number(nuevosRollos))))
  const nuevoPesoTotal = rollosNum * 1000

  const current = await prisma.inventarioFilamento.findUnique({ where: { id } })
  const prevPeso = current?.pesoInicialGramos != null ? Number(current.pesoInicialGramos) : 1000
  const prevRollos = Math.max(1, Math.round(prevPeso / 1000))
  const prevGramos = current?.stockGramos != null ? Number(current.stockGramos) : 1000

  let nuevosGramos = prevGramos
  if (rollosNum > prevRollos) {
    // Al aumentar rollos, suma exactamente de 1000 g en 1000 g por cada rollo añadido
    nuevosGramos = prevGramos + ((rollosNum - prevRollos) * 1000)
  } else if (rollosNum < prevRollos) {
    // Al disminuir rollos, resta 1000 g por cada rollo retirado (mínimo 0 y tope el nuevo total)
    nuevosGramos = Math.max(0, Math.min(nuevoPesoTotal, prevGramos - ((prevRollos - rollosNum) * 1000)))
  }

  const alertaCritica = nuevosGramos < 300
  const estado = nuevosGramos === 0 ? 'AGOTADO' : (alertaCritica ? 'BAJO_STOCK' : 'DISPONIBLE')
  const estadoStock = nuevosGramos === 0 ? 'FALTANTE' : 'ABIERTO'

  const updated = await prisma.inventarioFilamento.update({
    where: { id },
    data: {
      stockBobinas: rollosNum,
      pesoInicialGramos: nuevoPesoTotal,
      stockGramos: nuevosGramos,
      alertaCritica,
      estado,
      estadoStock,
      notaProduccion: alertaCritica ? `⚠️ Stock Crítico: ${nuevosGramos}g restantes` : null
    }
  })

  safeRevalidate()

  return {
    id: updated.id,
    nombreColor: updated.nombreColor,
    codigoHex: updated.codigoHex || '#18181B',
    estado: (nuevosGramos > 0 ? 'DISPONIBLE' : 'RESTOCK') as 'DISPONIBLE' | 'RESTOCK',
    nota: updated.notaProduccion,
    stockGramos: nuevosGramos,
    rollos: rollosNum,
    pesoInicialGramos: nuevoPesoTotal,
    alertaCritica,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function actualizarGramosColor(id: string, stockGramos: number) {
  const current = await prisma.inventarioFilamento.findUnique({ where: { id } })
  const storedBobinas = current?.stockBobinas != null && Number(current.stockBobinas) >= 1 ? Math.round(Number(current.stockBobinas)) : 1
  const storedPeso = current?.pesoInicialGramos != null ? Number(current.pesoInicialGramos) : (storedBobinas * 1000)
  const rollos = Math.max(1, Math.round(storedPeso / 1000))
  const pesoInicialGramos = rollos * 1000

  const gramosNum = Math.max(0, Math.min(pesoInicialGramos, Number(stockGramos)))
  const alertaCritica = gramosNum < 300
  const estado = gramosNum === 0 ? 'AGOTADO' : (alertaCritica ? 'BAJO_STOCK' : 'DISPONIBLE')
  const estadoStock = gramosNum === 0 ? 'FALTANTE' : 'ABIERTO'

  const updated = await prisma.inventarioFilamento.update({
    where: { id },
    data: {
      stockGramos: gramosNum,
      stockBobinas: rollos,
      pesoInicialGramos,
      alertaCritica,
      estado,
      estadoStock,
      notaProduccion: alertaCritica ? `⚠️ Stock Crítico: ${gramosNum}g restantes` : null
    }
  })

  safeRevalidate()

  return {
    id: updated.id,
    nombreColor: updated.nombreColor,
    codigoHex: updated.codigoHex || '#18181B',
    estado: (gramosNum > 0 ? 'DISPONIBLE' : 'RESTOCK') as 'DISPONIBLE' | 'RESTOCK',
    nota: updated.notaProduccion,
    stockGramos: gramosNum,
    rollos,
    pesoInicialGramos,
    alertaCritica,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function agregarNuevoColor(data: {
  nombreColor: string
  codigoHex?: string
  estado: 'DISPONIBLE' | 'RESTOCK'
  rollos?: number
  stockGramos?: number
  nota?: string | null
}) {
  const rollos = Math.max(1, Math.round(data.rollos || 1))
  const totalGramos = rollos * 1000
  const gramos = data.stockGramos !== undefined 
    ? Math.min(totalGramos, Math.max(0, Number(data.stockGramos))) 
    : (data.estado === 'DISPONIBLE' ? totalGramos : 0)
  const alertaCritica = data.estado === 'DISPONIBLE' && gramos < 300

  const created = await prisma.inventarioFilamento.create({
    data: {
      nombreColor: data.nombreColor.trim(),
      codigoHex: data.codigoHex || '#18181B',
      estadoStock: data.estado === 'DISPONIBLE' ? 'ABIERTO' : 'FALTANTE',
      estado: data.estado === 'DISPONIBLE' ? (alertaCritica ? 'BAJO_STOCK' : 'DISPONIBLE') : 'AGOTADO',
      stockBobinas: rollos,
      stockGramos: gramos,
      pesoInicialGramos: totalGramos,
      notaProduccion: data.nota?.trim() || (alertaCritica ? '⚠️ Menos de 300g' : null),
      alertaCritica,
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
    stockGramos: gramos,
    rollos,
    pesoInicialGramos: totalGramos,
    alertaCritica,
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

// Para selector de ventas con información de gramos y stock crítico
export async function getFilamentosActivos() {
  const { disponibles } = await getColoresInventario()
  return disponibles.map(d => ({
    id: d.id,
    nombreColor: d.nombreColor,
    numeroBobina: 1,
    codigoHex: d.codigoHex,
    tipoMaterial: 'PLA',
    marca: 'Taller',
    stockGramos: d.stockGramos,
    stockBobinas: Number((d.stockGramos / 1000).toFixed(2)),
    porcentajeRestante: Math.min(100, Math.round((d.stockGramos / d.pesoInicialGramos) * 100)),
    alertaCritica: d.alertaCritica,
    estado: d.estado
  }))
}
