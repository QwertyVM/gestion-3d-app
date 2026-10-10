'use server'

import prisma from '@/lib/prisma'
import { EstadoPedido, EstadoVenta } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/taller')
    revalidatePath('/pedidos')
    revalidatePath('/ventas')
    revalidatePath('/catalogo')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request context
  }
}

export interface PiezaTaller {
  id: string
  registroId: string
  tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL'
  codigoRef: string
  fechaSolicitud: string
  diaEntregaPrometida: string | null
  cliente: string
  telefono: string | null
  canalVenta: string | null
  productoId: string
  nombreModelo: string
  lineaCategoria: string
  cantidad: number
  colorFilamentoId: string | null
  coloresIds?: string[]
  colores?: {
    id: string
    nombreColor: string
    codigoHex: string
    tipoMaterial: string
  }[]
  nombreColor: string
  codigoHex: string
  tipoMaterial: string
  personalizacion: string | null
  pesoGramosUnitario: number
  pesoGramosTotal: number
  costoBaseUnitario: number
  estado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO' | 'CANCELADO'
  notas?: string | null
  enlaceMakerworld?: string | null
  imagenUrl?: string | null
}

export interface GrupoModeloTaller {
  productoId: string
  nombreModelo: string
  lineaCategoria: string
  pesoGramosUnitario: number
  totalUnidades: number
  totalGramos: number
  pendientes: number
  enProduccion: number
  listos: number
  enlaceMakerworld?: string | null
  imagenUrl?: string | null
  colores: {
    colorId: string | null
    nombreColor: string
    codigoHex: string
    tipoMaterial: string
    cantidad: number
    gramos: number
    piezasIds: string[]
  }[]
  pedidos: {
    piezaId: string
    codigoRef: string
    cliente: string
    fechaSolicitud: string
    diaEntregaPrometida: string | null
    cantidad: number
    nombreColor: string
    codigoHex: string
    personalizacion: string | null
    estado: string
  }[]
}

export interface GrupoColorTaller {
  colorId: string | null
  nombreColor: string
  codigoHex: string
  tipoMaterial: string
  colores?: {
    id?: string
    nombreColor: string
    codigoHex: string
    tipoMaterial: string
  }[]
  stockGramosActual: number
  stockBobinasActual: number
  alertaCritica: boolean
  totalUnidades: number
  totalGramosRequeridos: number
  deficitGramos: number
  modelos: {
    productoId: string
    nombreModelo: string
    cantidad: number
    gramos: number
    cliente: string
    codigoRef: string
    estado: string
    personalizacion: string | null
    canalVenta?: string | null
  }[]
}

export interface TallerDataResponse {
  piezas: PiezaTaller[]
  historicoPiezas?: PiezaTaller[]
  gruposPorModelo: GrupoModeloTaller[]
  gruposPorColor: GrupoColorTaller[]
  metricas: {
    totalPiezasPendientes: number
    totalPiezasEnProduccion: number
    totalPiezasListas: number
    totalPiezasActivas: number
    totalModelosUnicos: number
    totalGramosRequeridos: number
    totalColoresRequeridos: number
    entregasUrgentes: number
  }
}

function mapDataToPiezas(
  pedidosList: any[],
  ventasList: any[],
  filamentoMap: Map<string, any>,
  enlaceMap?: Map<string, string>
): PiezaTaller[] {
  const result: PiezaTaller[] = []

  // 1. Procesar items de Pedidos
  pedidosList.forEach((ped) => {
    const rawFecha = ped.fecha instanceof Date ? ped.fecha.toISOString() : String(ped.fecha)
    ped.items.forEach((item: any) => {
      // Taller 3D es exclusivamente para fabricación 3D, no juegos de mesa (BG)
      if (item.producto && item.producto.negocio !== '3D') return
      const cant = Number(item.cantidad || 1)
      const pesoUnit = (item.gramosConsumidos != null && Number(item.gramosConsumidos) > 0 
        ? Number(item.gramosConsumidos) / cant
        : 0)
      const pesoTotal = item.gramosConsumidos != null && Number(item.gramosConsumidos) > 0
        ? Number(item.gramosConsumidos)
        : pesoUnit * cant

      const rawColores: string[] = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
        ? item.coloresIds
        : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

      const resolvedColores = rawColores.map(id => {
        const f = filamentoMap.get(id)
        if (f) {
          return {
            id: f.id,
            nombreColor: f.nombreColor,
            codigoHex: f.codigoHex || '#1E1E1E',
            tipoMaterial: f.tipoMaterial || 'PLA'
          }
        }
        if (item.colorFilamento && item.colorFilamento.id === id) {
          return {
            id: item.colorFilamento.id,
            nombreColor: item.colorFilamento.nombreColor,
            codigoHex: item.colorFilamento.codigoHex || '#1E1E1E',
            tipoMaterial: item.colorFilamento.tipoMaterial || 'PLA'
          }
        }
        return null
      }).filter(Boolean) as { id: string; nombreColor: string; codigoHex: string; tipoMaterial: string }[]

      const sortedColores = resolvedColores.length > 0
        ? [...resolvedColores].sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
        : []

      const primaryCol = sortedColores[0] || item.colorFilamento || (item.colorFilamentoId ? filamentoMap.get(item.colorFilamentoId) : null)
      const displayNombreColor = sortedColores.length > 1
        ? sortedColores.map(c => c.nombreColor).join(' + ')
        : (primaryCol ? primaryCol.nombreColor : 'Sin especificar')

      const enlaceDirecto = item.producto?.enlaceMakerworld || null
      const enlaceFallback = enlaceMap
        ? (enlaceMap.get(item.productoId) || enlaceMap.get((item.producto?.nombreModelo || '').toLowerCase().trim()) || null)
        : null

      result.push({
        id: item.id,
        registroId: ped.id,
        tipoRegistro: 'PEDIDO_ITEM',
        codigoRef: ped.codigo,
        fechaSolicitud: rawFecha,
        diaEntregaPrometida: ped.diaEntregaPrometida || null,
        cliente: ped.cliente,
        telefono: ped.telefono || null,
        canalVenta: ped.canalVenta || null,
        productoId: item.productoId,
        nombreModelo: item.nombreProductoSnapshot || item.producto?.nombreModelo || 'Pieza 3D',
        lineaCategoria: item.producto?.lineaCategoria || 'General',
        cantidad: cant,
        colorFilamentoId: primaryCol?.id || item.colorFilamentoId || null,
        coloresIds: rawColores,
        colores: sortedColores,
        nombreColor: displayNombreColor,
        codigoHex: primaryCol?.codigoHex || '#94A3B8',
        tipoMaterial: primaryCol?.tipoMaterial || 'PLA',
        personalizacion: item.personalizacion || null,
        pesoGramosUnitario: Number(pesoUnit.toFixed(1)),
        pesoGramosTotal: Number(pesoTotal.toFixed(1)),
        costoBaseUnitario: item.costoBaseSnapshot != null ? Number(item.costoBaseSnapshot) : (item.producto ? Number(item.producto.costoBase) : 0),
        estado: (item.estado || ped.estado) as any,
        notas: ped.notas || null,
        enlaceMakerworld: enlaceDirecto || enlaceFallback || null,
        imagenUrl: item.producto?.imagenUrl || null
      })
    })
  })

  // 2. Procesar Ventas individuales
  ventasList.forEach((v) => {
    if (v.producto && v.producto.negocio !== '3D') return
    const rawFecha = v.fecha instanceof Date ? v.fecha.toISOString() : String(v.fecha)
    const cant = Number(v.cantidad || 1)
    const pesoUnit = (v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
      ? Number(v.gramosConsumidos) / cant
      : 0)
    const pesoTotal = v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
      ? Number(v.gramosConsumidos)
      : pesoUnit * cant

    const rawColores: string[] = Array.isArray(v.coloresIds) && v.coloresIds.length > 0
      ? v.coloresIds
      : (v.colorFilamentoId ? [v.colorFilamentoId] : [])

    const resolvedColores = rawColores.map(id => {
      const f = filamentoMap.get(id)
      if (f) {
        return {
          id: f.id,
          nombreColor: f.nombreColor,
          codigoHex: f.codigoHex || '#1E1E1E',
          tipoMaterial: f.tipoMaterial || 'PLA'
        }
      }
      if (v.colorFilamento && v.colorFilamento.id === id) {
        return {
          id: v.colorFilamento.id,
          nombreColor: v.colorFilamento.nombreColor,
          codigoHex: v.colorFilamento.codigoHex || '#1E1E1E',
          tipoMaterial: v.colorFilamento.tipoMaterial || 'PLA'
        }
      }
      return null
    }).filter(Boolean) as { id: string; nombreColor: string; codigoHex: string; tipoMaterial: string }[]

    const sortedColores = resolvedColores.length > 0
      ? [...resolvedColores].sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
      : []

    const primaryCol = sortedColores[0] || v.colorFilamento || (v.colorFilamentoId ? filamentoMap.get(v.colorFilamentoId) : null)
    const displayNombreColor = sortedColores.length > 1
      ? sortedColores.map(c => c.nombreColor).join(' + ')
      : (primaryCol ? primaryCol.nombreColor : 'Sin especificar')

    const enlaceDirecto = v.producto?.enlaceMakerworld || null
    const enlaceFallback = enlaceMap
      ? (enlaceMap.get(v.productoId) || enlaceMap.get((v.producto?.nombreModelo || '').toLowerCase().trim()) || null)
      : null

    result.push({
      id: v.id,
      registroId: v.id,
      tipoRegistro: 'VENTA_INDIVIDUAL',
      codigoRef: 'VTA-INDIVIDUAL',
      fechaSolicitud: rawFecha,
      diaEntregaPrometida: v.diaEntregaPrometida || null,
      cliente: v.cliente,
      telefono: null,
      canalVenta: v.canalVenta || null,
      productoId: v.productoId,
      nombreModelo: v.nombreProductoSnapshot || v.producto?.nombreModelo || 'Pieza 3D',
      lineaCategoria: v.producto?.lineaCategoria || 'General',
      cantidad: cant,
      colorFilamentoId: primaryCol?.id || v.colorFilamentoId || null,
      coloresIds: rawColores,
      colores: sortedColores,
      nombreColor: displayNombreColor,
      codigoHex: primaryCol?.codigoHex || '#94A3B8',
      tipoMaterial: primaryCol?.tipoMaterial || 'PLA',
      personalizacion: v.personalizacion || null,
      pesoGramosUnitario: Number(pesoUnit.toFixed(1)),
      pesoGramosTotal: Number(pesoTotal.toFixed(1)),
      costoBaseUnitario: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
      estado: v.estado as any,
      notas: null,
      enlaceMakerworld: enlaceDirecto || enlaceFallback || null,
      imagenUrl: v.producto?.imagenUrl || null
    })
  })

  return result
}

export async function getTallerData(): Promise<TallerDataResponse> {
  try {
    const [pedidos, ventas, filamentos, todosPedidos, todasVentas, productosConEnlace] = await Promise.all([
      // Cola activa en taller
      prisma.pedido.findMany({
        where: {
          negocio: '3D',
          estado: { in: ['PENDIENTE', 'EN_PRODUCCION', 'LISTO_ENTREGA'] }
        },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          }
        },
        orderBy: { fecha: 'asc' }
      }),
      prisma.venta.findMany({
        where: {
          negocio: '3D',
          estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] }
        },
        include: {
          producto: true,
          colorFilamento: true
        },
        orderBy: { fecha: 'asc' }
      }),
      prisma.inventarioFilamento.findMany({
        where: { activo: true }
      }),
      // Histórico completo de 3D para métricas acumuladas y ranking
      prisma.pedido.findMany({
        where: {
          negocio: '3D',
          estado: { not: 'CANCELADO' }
        },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          }
        },
        orderBy: { fecha: 'desc' }
      }),
      prisma.venta.findMany({
        where: {
          negocio: '3D',
          estado: { not: 'CANCELADO' }
        },
        include: {
          producto: true,
          colorFilamento: true
        },
        orderBy: { fecha: 'desc' }
      }),
      // Productos con enlace registrado para propagar a cualquier ítem del modelo
      prisma.producto.findMany({
        where: {
          negocio: '3D',
          enlaceMakerworld: { not: null }
        },
        select: {
          id: true,
          nombreModelo: true,
          enlaceMakerworld: true,
          imagenUrl: true
        }
      })
    ])

    const filamentoMap = new Map<string, any>()
    filamentos.forEach((f) => {
      filamentoMap.set(f.id, f)
    })

    // Mapa de enlaces por ID y nombre base para que cualquier variante herede el enlace
    const enlaceMap = new Map<string, string>()
    productosConEnlace.forEach((p) => {
      if (p.enlaceMakerworld) {
        enlaceMap.set(p.id, p.enlaceMakerworld)
        const nameLower = p.nombreModelo.toLowerCase().trim()
        enlaceMap.set(nameLower, p.enlaceMakerworld)
        if (nameLower.includes(' - ')) {
          const baseName = nameLower.split(' - ')[0].trim()
          if (!enlaceMap.has(baseName)) {
            enlaceMap.set(baseName, p.enlaceMakerworld)
          }
        }
      }
    })

    const piezas = mapDataToPiezas(pedidos, ventas, filamentoMap, enlaceMap)
    const historicoPiezas = mapDataToPiezas(todosPedidos, todasVentas, filamentoMap, enlaceMap)

    // 3. Agrupación por Modelo / Producto
    const modeloMap = new Map<string, GrupoModeloTaller>()

    piezas.forEach((p) => {
      const key = p.productoId || p.nombreModelo
      if (!modeloMap.has(key)) {
        modeloMap.set(key, {
          productoId: p.productoId,
          nombreModelo: p.nombreModelo,
          lineaCategoria: p.lineaCategoria,
          pesoGramosUnitario: p.pesoGramosUnitario,
          totalUnidades: 0,
          totalGramos: 0,
          pendientes: 0,
          enProduccion: 0,
          listos: 0,
          enlaceMakerworld: p.enlaceMakerworld || null,
          imagenUrl: p.imagenUrl || null,
          colores: [],
          pedidos: []
        })
      }

      const grp = modeloMap.get(key)!
      grp.totalUnidades += p.cantidad
      grp.totalGramos = Number((grp.totalGramos + p.pesoGramosTotal).toFixed(1))

      if (p.estado === 'PENDIENTE') grp.pendientes += p.cantidad
      else if (p.estado === 'EN_PRODUCCION') grp.enProduccion += p.cantidad
      else if (p.estado === 'LISTO_ENTREGA') grp.listos += p.cantidad

      // Desglose por color dentro del modelo
      const colorKey = p.colorFilamentoId || p.nombreColor
      let colEntry = grp.colores.find((c) => (c.colorId || c.nombreColor) === colorKey)
      if (!colEntry) {
        colEntry = {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          cantidad: 0,
          gramos: 0,
          piezasIds: []
        }
        grp.colores.push(colEntry)
      }
      colEntry.cantidad += p.cantidad
      colEntry.gramos = Number((colEntry.gramos + p.pesoGramosTotal).toFixed(1))
      colEntry.piezasIds.push(p.id)

      // Detalle del pedido
      grp.pedidos.push({
        piezaId: p.id,
        codigoRef: p.codigoRef,
        cliente: p.cliente,
        fechaSolicitud: p.fechaSolicitud,
        diaEntregaPrometida: p.diaEntregaPrometida,
        cantidad: p.cantidad,
        nombreColor: p.nombreColor,
        codigoHex: p.codigoHex,
        personalizacion: p.personalizacion,
        estado: p.estado
      })
    })

    const gruposPorModelo = Array.from(modeloMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)

    // 4. Agrupación por Color / Combinación de Filamentos (Clave Normalizada Alfabéticamente)
    const colorGroupMap = new Map<string, GrupoColorTaller>()

    piezas.forEach((p) => {
      const sortedColores = (p.colores && p.colores.length > 0)
        ? [...p.colores].sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
        : (p.nombreColor ? p.nombreColor.split(' + ').map(s => s.trim()).sort().map(name => ({
            id: p.colorFilamentoId || undefined,
            nombreColor: name,
            codigoHex: p.codigoHex || '#94A3B8',
            tipoMaterial: p.tipoMaterial || 'PLA'
          })) : [])

      const normalizedColorKey = sortedColores.length > 0
        ? sortedColores.map(c => c.nombreColor.trim().toLowerCase()).join(' + ')
        : (p.nombreColor || 'sin-especificar').toLowerCase()

      const displayTitle = sortedColores.length > 0
        ? sortedColores.map(c => c.nombreColor).join(' + ')
        : (p.nombreColor || 'Sin especificar')

      if (!colorGroupMap.has(normalizedColorKey)) {
        const inv = p.colorFilamentoId ? filamentoMap.get(p.colorFilamentoId) : null
        const stockGramos = inv?.stockGramos ? Number(inv.stockGramos) : 0
        const stockBobinas = inv?.stockBobinas ? Number(inv.stockBobinas) : (sortedColores.length > 0 ? sortedColores.length : 1)
        const alertaCritica = Boolean(inv?.alertaCritica || (stockGramos < 300 && stockGramos > 0))

        colorGroupMap.set(normalizedColorKey, {
          colorId: p.colorFilamentoId,
          nombreColor: displayTitle,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          colores: sortedColores,
          stockGramosActual: stockGramos,
          stockBobinasActual: stockBobinas,
          alertaCritica,
          totalUnidades: 0,
          totalGramosRequeridos: 0,
          deficitGramos: 0,
          modelos: []
        })
      }

      const cGrp = colorGroupMap.get(normalizedColorKey)!
      cGrp.totalUnidades += p.cantidad
      cGrp.totalGramosRequeridos = Number((cGrp.totalGramosRequeridos + p.pesoGramosTotal).toFixed(1))
      cGrp.deficitGramos = Number(Math.max(0, cGrp.totalGramosRequeridos - cGrp.stockGramosActual).toFixed(1))

      cGrp.modelos.push({
        productoId: p.productoId,
        nombreModelo: p.nombreModelo,
        cantidad: p.cantidad,
        gramos: p.pesoGramosTotal,
        cliente: p.cliente,
        codigoRef: p.codigoRef,
        estado: p.estado,
        personalizacion: p.personalizacion,
        canalVenta: p.canalVenta
      })
    })

    const gruposPorColor = Array.from(colorGroupMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)

    // 5. Métricas Generales
    const totalPiezasPendientes = piezas.filter((p) => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const totalPiezasEnProduccion = piezas.filter((p) => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const totalPiezasListas = piezas.filter((p) => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)
    const totalGramosRequeridos = Number(piezas.reduce((sum, p) => sum + p.pesoGramosTotal, 0).toFixed(1))
    
    // Entregas urgentes: con fecha prometida en los próximos 2 días o vencidas
    const now = new Date()
    const dosDias = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const entregasUrgentes = piezas.filter((p) => {
      if (!p.diaEntregaPrometida) return false
      try {
        const d = new Date(p.diaEntregaPrometida)
        return !isNaN(d.getTime()) && d <= dosDias
      } catch {
        return false
      }
    }).length

    return {
      piezas,
      historicoPiezas,
      gruposPorModelo,
      gruposPorColor,
      metricas: {
        totalPiezasPendientes,
        totalPiezasEnProduccion,
        totalPiezasListas,
        totalPiezasActivas: totalPiezasPendientes + totalPiezasEnProduccion + totalPiezasListas,
        totalModelosUnicos: gruposPorModelo.length,
        totalGramosRequeridos,
        totalColoresRequeridos: gruposPorColor.length,
        entregasUrgentes
      }
    }
  } catch (error) {
    console.error('Error fetching taller data:', error)
    return {
      piezas: [],
      historicoPiezas: [],
      gruposPorModelo: [],
      gruposPorColor: [],
      metricas: {
        totalPiezasPendientes: 0,
        totalPiezasEnProduccion: 0,
        totalPiezasListas: 0,
        totalPiezasActivas: 0,
        totalModelosUnicos: 0,
        totalGramosRequeridos: 0,
        totalColoresRequeridos: 0,
        entregasUrgentes: 0
      }
    }
  }
}

export async function updateEstadoPieza(
  tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
  registroId: string,
  nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
) {
  try {
    if (tipoRegistro === 'PEDIDO_ITEM') {
      // 1. Actualizar el estado de la pieza individual (ItemPedido)
      const itemActualizado = await prisma.itemPedido.update({
        where: { id: registroId },
        data: { estado: nuevoEstado as EstadoPedido },
        include: {
          pedido: {
            include: {
              items: true
            }
          }
        }
      })

      // 2. Recalcular el estado consolidado del Pedido padre
      if (itemActualizado.pedido) {
        const todosItems = itemActualizado.pedido.items
        const todosListos = todosItems.every(it => it.estado === 'LISTO_ENTREGA' || it.estado === 'ENTREGADO')
        const algunEnProduccionOListo = todosItems.some(it => it.estado === 'EN_PRODUCCION' || it.estado === 'LISTO_ENTREGA')
        const todosPendientes = todosItems.every(it => it.estado === 'PENDIENTE')

        let nuevoEstadoPedido: EstadoPedido = 'PENDIENTE'
        if (todosListos) {
          nuevoEstadoPedido = 'LISTO_ENTREGA'
        } else if (algunEnProduccionOListo) {
          nuevoEstadoPedido = 'EN_PRODUCCION'
        } else if (todosPendientes) {
          nuevoEstadoPedido = 'PENDIENTE'
        }

        await prisma.pedido.update({
          where: { id: itemActualizado.pedidoId },
          data: { estado: nuevoEstadoPedido }
        })
      }
    } else {
      // Venta individual
      await prisma.venta.update({
        where: { id: registroId },
        data: { estado: (nuevoEstado === 'LISTO_ENTREGA' ? 'ENTREGADO' : nuevoEstado) as EstadoVenta }
      })
    }

    safeRevalidate()
    return { success: true }
  } catch (error: any) {
    console.error('Error updating taller item status:', error)
    return { success: false, error: error.message || 'Error al actualizar estado' }
  }
}

export async function iniciarPieza(
  tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
  registroId: string
) {
  return updateEstadoPieza(tipoRegistro, registroId, 'EN_PRODUCCION')
}

export async function reabrirPieza(
  tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
  registroId: string
) {
  return updateEstadoPieza(tipoRegistro, registroId, 'PENDIENTE')
}

export async function updateEnlaceModelo(
  productoId: string,
  enlaceMakerworld: string | null
): Promise<{ success: boolean; enlaceMakerworld?: string | null; error?: string }> {
  try {
    const trimmed = enlaceMakerworld && enlaceMakerworld.trim() ? enlaceMakerworld.trim() : null

    // 1. Obtener producto para identificar su contexto y variantes
    const prod = await prisma.producto.findUnique({
      where: { id: productoId }
    })

    if (!prod) {
      return { success: false, error: 'Producto no encontrado' }
    }

    // 2. Extraer nombre base si tiene variante con guion (ej: "Pikachu - Grande" -> "Pikachu")
    const baseName = prod.nombreModelo.includes(' - ')
      ? prod.nombreModelo.split(' - ')[0].trim()
      : prod.nombreModelo.trim()

    // 3. Actualizar producto y sincronizar con sus variantes con el mismo nombre base
    await prisma.producto.updateMany({
      where: {
        negocio: prod.negocio,
        OR: [
          { id: productoId },
          { nombreModelo: prod.nombreModelo },
          ...(baseName.length >= 3 ? [{ nombreModelo: { startsWith: `${baseName} - ` } }] : [])
        ]
      },
      data: {
        enlaceMakerworld: trimmed
      }
    })

    safeRevalidate()
    return { success: true, enlaceMakerworld: trimmed }
  } catch (error: any) {
    console.error('Error al actualizar enlace del modelo:', error)
    return { success: false, error: error.message || 'Error al actualizar enlace' }
  }
}

