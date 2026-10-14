'use server'

import prisma from '@/lib/prisma'
import { getVentas } from '@/actions/ventas'
import { getActiveNegocioServer } from '@/lib/business-server'
import { TipoNegocio } from '@/lib/business'
import { revalidatePath } from 'next/cache'
import { CategoriaInversion } from '@prisma/client'

export interface ColorRestockItem {
  id: string
  nombreColor: string
  codigoHex: string
  nota?: string | null
}

export interface CuotaDetalle {
  numeroCuota: number
  mes: string
  anio: number
  monto: number
  pagada: boolean
  inversionId?: string | null
  fechaPago?: string | null
  vencimiento: string
}

export interface PrestamoCapitalInfo {
  totalPrestamo: number
  cuotaMensual: number
  totalCuotas: number
  cuotasPagadas: number
  cuotaActual: number
  pagadaEnPeriodo: boolean
  fechaCorteRecalculo: string
  saldoCapitalRestante: number
  montoPagadoTotal: number
  cuotaSeptiembre?: CuotaDetalle | null
  cuotaOctubre?: CuotaDetalle | null
}

export interface PartidaBlindadaResumen {
  id: string
  concepto: string
  presupuesto: number
  pagado: boolean
  montoPendiente: number
}

export interface ItemPartidaPlan {
  id: string
  categoria: 'INSUMOS' | 'BLINDADO' | 'OPERATIVO' | 'CAPEX' | 'MARKETING' | 'OTROS'
  concepto: string
  subconcepto?: string
  montoAgostoReal: number
  montoSeptiembreReal: number
  presupuesto: number
  tipo: 'Blindado' | 'Flexible'
  pagado: boolean
  inversionId?: string | null
  montoPagadoReal?: number | null
  fechaPago?: string | null
  vencimiento?: string
}

export interface DatosPresupuestoTranquilidad {
  // 1. Diagnóstico de Partida (Lo que tengo hoy)
  saldoActualCaja: number
  totalIngresosCobrados: number
  totalEgresosAcumulados: number
  cuentasPorCobrar: number
  
  // 2. Inventario y Materiales
  totalGramosStock: number
  totalBobinasTaller: number
  coloresActivos: number
  coloresRestock: number
  costoEstimadoRestock: number
  listaColoresRestock: ColorRestockItem[]
  
  // 3. Métricas de Producción & Ventas Históricas
  ticketPromedio: number
  costoPromedioFabricacion: number
  margenPromedioUnitario: number
  promedioPedidosMensuales: number
  
  // 4. Costos Fijos y Compromisos Base
  gastosFijosTallerEstimado: number
  cuotaPrestamoSugerida: number
  reservaCapexSugerida: number
  packagingPromedioPorPedido: number

  // 5. Estado y Control del Préstamo Capital
  prestamoInfo: PrestamoCapitalInfo

  // 6. Resumen Oficial de Blindaje (Fuente única de la verdad en BD)
  totalBlindadoPendiente: number
  gastoDisponibleLibre: number
  partidasBlindadasResumen: PartidaBlindadaResumen[]
  partidasPlan: ItemPartidaPlan[]
}

function getPartidasDefault(): ItemPartidaPlan[] {
  return [
    {
      id: 'gasto-filamentos',
      categoria: 'INSUMOS',
      concepto: 'Reposición de Filamentos',
      subconcepto: '6 bobinas x S/ 48.00 (PLA Matte Bambu Lab)',
      montoAgostoReal: 1542.77,
      montoSeptiembreReal: 142.00,
      presupuesto: 288.00,
      tipo: 'Flexible',
      pagado: false
    },
    {
      id: 'gasto-packaging',
      categoria: 'INSUMOS',
      concepto: 'Packaging & Cajas de Envío',
      subconcepto: '8 pedidos estimados x S/ 8.50 (Cajas, stickers, film)',
      montoAgostoReal: 168.75,
      montoSeptiembreReal: 0.00,
      presupuesto: 68.00,
      tipo: 'Flexible',
      pagado: false
    },
    {
      id: 'gasto-cuota-prestamo',
      categoria: 'BLINDADO',
      concepto: 'Cuota Mensual de Préstamo',
      subconcepto: 'Amortización de capital financiero (BCP S/ 8,000)',
      montoAgostoReal: 0.00,
      montoSeptiembreReal: 0.00,
      presupuesto: 388.68,
      tipo: 'Blindado',
      pagado: false
    },
    {
      id: 'gasto-reserva-capex',
      categoria: 'CAPEX',
      concepto: 'Reserva para Nueva Impresora',
      subconcepto: 'Ahorro mensual para Bambu A2L (S/ 744 de S/ 2,500 pagados)',
      montoAgostoReal: 4403.00,
      montoSeptiembreReal: 0.00,
      presupuesto: 878.00,
      tipo: 'Flexible',
      pagado: false
    },
    {
      id: 'gasto-fijos-taller',
      categoria: 'OPERATIVO',
      concepto: 'Luz e Internet del Taller',
      subconcepto: 'Electricidad de 2x impresoras 3D y servicios fijos',
      montoAgostoReal: 0.00,
      montoSeptiembreReal: 0.00,
      presupuesto: 111.00,
      tipo: 'Blindado',
      pagado: false
    },
    {
      id: 'gasto-publicidad',
      categoria: 'MARKETING',
      concepto: 'Pauta & Publicidad en Redes',
      subconcepto: 'Presupuesto mensual para anuncios (Meta Ads / TikTok)',
      montoAgostoReal: 308.92,
      montoSeptiembreReal: 0.00,
      presupuesto: 100.00,
      tipo: 'Flexible',
      pagado: false
    },
    {
      id: 'gasto-imprevistos',
      categoria: 'OPERATIVO',
      concepto: 'Fondo de Imprevistos & Repuestos',
      subconcepto: 'Boquillas, mantenimiento menor, herramientas',
      montoAgostoReal: 86.55,
      montoSeptiembreReal: 0.00,
      presupuesto: 150.00,
      tipo: 'Flexible',
      pagado: false
    }
  ]
}

export async function getPartidasPlanDB(negocio: string = '3D'): Promise<ItemPartidaPlan[]> {
  try {
    const list = await prisma.partidaPresupuesto.findMany({
      where: { negocio },
      orderBy: { orden: 'asc' }
    })

    if (list.length > 0) {
      return list.map(p => ({
        id: p.id,
        categoria: p.categoria as any,
        concepto: p.concepto,
        subconcepto: p.subconcepto || undefined,
        montoAgostoReal: Number(p.montoAgostoReal || 0),
        montoSeptiembreReal: Number(p.montoSeptiembreReal || 0),
        presupuesto: Number(p.presupuesto || 0),
        tipo: (p.tipo === 'Blindado' ? 'Blindado' : 'Flexible') as 'Blindado' | 'Flexible',
        pagado: Boolean(p.pagado)
      }))
    }
  } catch (err) {
    console.error('Error obteniendo partidas de BD:', err)
  }

  return getPartidasDefault()
}

async function ejecutarConReintentoDB<T>(fn: () => Promise<T>, intentos = 2): Promise<T> {
  try {
    return await fn()
  } catch (err: any) {
    const esErrorConexion = 
      err?.code === 'P1001' || 
      err?.message?.includes("Can't reach database server") ||
      err?.message?.includes("Connection pool timeout") ||
      err?.message?.includes("connection closed")
    if (intentos > 0 && esErrorConexion) {
      console.warn(`[Neon DB] Reintentando tras cold-start (${intentos} intentos restantes)...`)
      await new Promise(res => setTimeout(res, 1200))
      return ejecutarConReintentoDB(fn, intentos - 1)
    }
    throw err
  }
}

export async function getDatosPresupuestoTranquilidad(negocio?: TipoNegocio): Promise<DatosPresupuestoTranquilidad> {
  const targetNegocio = negocio || await getActiveNegocioServer()
  const [inversiones, ventas, ingresosDirectos, filamentos] = await ejecutarConReintentoDB(() =>
    Promise.all([
      prisma.inversion.findMany({
        where: { negocio: targetNegocio }
      }),
      getVentas(targetNegocio),
      prisma.ingreso.findMany({
        where: { negocio: targetNegocio },
        orderBy: { fecha: 'desc' }
      }),
      prisma.inventarioFilamento.findMany({
        where: { activo: true }
      })
    ])
  )

  // 1. Saldo actual en caja (Ingresos cobrados - Egresos pagados)
  const totalCobradoVentas = ventas.reduce((sum, v) => sum + Number(v.montoPagado || 0), 0)
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto || 0), 0)
  const totalIngresosCobrados = totalCobradoVentas + totalIngresosDirectos

  const totalEgresosAcumulados = inversiones.reduce((sum, e) => sum + Number(e.costoTotal || 0), 0)
  const saldoActualCaja = Math.max(0, totalIngresosCobrados - totalEgresosAcumulados)

  const cuentasPorCobrar = ventas.reduce((sum, v) => sum + Number(v.saldoPendiente || 0), 0)

  // 2. Inventario de Filamentos
  const filamentosDisponibles = filamentos.filter(f => f.estado === 'DISPONIBLE')
  const filamentosRestock = filamentos.filter(f => f.estado !== 'DISPONIBLE' || (Number(f.stockGramos || 0) < 300))

  const totalGramosStock = filamentosDisponibles.reduce((sum, f) => sum + Number(f.stockGramos || 0), 0)
  const totalBobinasTaller = filamentosDisponibles.reduce((sum, f) => sum + Number(f.stockBobinas || 1), 0)

  const PRECIO_PROMEDIO_BOBINA = 48.00 // S/ 48 por kg de PLA de calidad
  const costoEstimadoRestock = filamentosRestock.length * PRECIO_PROMEDIO_BOBINA

  const listaColoresRestock: ColorRestockItem[] = filamentosRestock.map(f => ({
    id: f.id,
    nombreColor: f.nombreColor,
    codigoHex: f.codigoHex || '#18181B',
    nota: f.notaProduccion || f.notas
  }))

  // 3. Métricas de Producción y Ventas
  const totalFacturadoVentas = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0)
  const ticketPromedio = ventas.length > 0 ? Number((totalFacturadoVentas / ventas.length).toFixed(2)) : 135.00

  const totalCostosFabricacion = ventas.reduce((sum, v) => {
    const costoUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0
      ? Number(v.costoBaseSnapshot)
      : (Number(v.producto?.costoBase) || 0)
    return sum + (costoUnit * (v.cantidad || 1))
  }, 0)

  const costoPromedioFabricacion = ventas.length > 0 
    ? Number((totalCostosFabricacion / ventas.length).toFixed(2)) 
    : 38.00

  const margenPromedioUnitario = Math.max(0, ticketPromedio - costoPromedioFabricacion)

  // Pedidos del último mes o promedio estimado
  const promedioPedidosMensuales = Math.max(8, Math.min(40, ventas.length > 0 ? Math.round(ventas.length / Math.max(1, 2)) : 18))

  // 4. Costos Fijos de Servicios y Taller
  const gastosFijosServicios = inversiones
    .filter(e => e.categoria === 'SERVICIO')
    .reduce((sum, e) => sum + Number(e.costoTotal || 0), 0)

  const gastosFijosTallerEstimado = gastosFijosServicios > 0 ? Math.round(gastosFijosServicios / Math.max(1, 3)) : 250.00
  const cuotaPrestamoSugerida = 388.68 // Cuota confirmada del préstamo de capital BCP (24 cuotas)
  const reservaCapexSugerida = 878.00  // Cuota mensual de llegada de nueva impresora
  const packagingPromedioPorPedido = 8.50 // Costo estimado de packaging por envío

  // 5. Análisis del Préstamo de Capital BCP
  // NOTA CRÍTICA: Excluir ITF (0.10) y gastos bancarios generales; considerar únicamente cuotas de amortización real
  const totalPrestamo = 8000.00
  const cuotaMensual = 388.68
  const totalCuotas = 24
  
  const pagosPrestamo = inversiones.filter(e => 
    e.categoria === 'FINANCIERO' && 
    !e.itemConcepto?.toLowerCase().includes('itf') &&
    !e.itemConcepto?.toLowerCase().includes('comisi') &&
    (
      e.itemConcepto?.toLowerCase().includes('préstamo') || 
      e.itemConcepto?.toLowerCase().includes('prestamo') || 
      e.itemConcepto?.toLowerCase().includes('cuota') ||
      (Number(e.costoTotal || 0) >= 100 && e.subcategoria?.toLowerCase().includes('bcp'))
    )
  )

  const cuotasPagadas = pagosPrestamo.length // Cuotas pagadas según egresos reales
  const montoPagadoTotal = pagosPrestamo.reduce((acc, p) => acc + Number(p.costoTotal || 0), 0)
  const cuotaActual = Math.min(totalCuotas, cuotasPagadas + 1) // Cuota siguiente

  // Buscar pagos por mes específico
  // Septiembre 2026: mes 8 en JS
  const pagoSeptiembre = pagosPrestamo.find(p => {
    const d = new Date(p.createdAt)
    return d.getMonth() === 8 && d.getFullYear() === 2026
  }) || (pagosPrestamo.find(p => p.itemConcepto?.toLowerCase().includes('cuota 1')))

  // Octubre 2026: mes 9 en JS
  const pagoOctubre = pagosPrestamo.find(p => {
    const d = new Date(p.createdAt)
    return d.getMonth() === 9 && d.getFullYear() === 2026
  }) || (pagosPrestamo.find(p => p.itemConcepto?.toLowerCase().includes('cuota 2')))

  const cuotaSeptiembre: CuotaDetalle = {
    numeroCuota: 1,
    mes: 'Septiembre',
    anio: 2026,
    monto: pagoSeptiembre ? Number(pagoSeptiembre.costoTotal) : 368.88,
    pagada: Boolean(pagoSeptiembre),
    inversionId: pagoSeptiembre?.id || null,
    fechaPago: pagoSeptiembre ? new Date(pagoSeptiembre.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
    vencimiento: 'Finales de Septiembre (30/09/2026)'
  }

  const cuotaOctubre: CuotaDetalle = {
    numeroCuota: 2,
    mes: 'Octubre',
    anio: 2026,
    monto: pagoOctubre ? Number(pagoOctubre.costoTotal) : cuotaMensual,
    pagada: Boolean(pagoOctubre),
    inversionId: pagoOctubre?.id || null,
    fechaPago: pagoOctubre ? new Date(pagoOctubre.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
    vencimiento: 'Finales de Octubre (31/10/2026)'
  }

  // Verificar si se pagó la cuota correspondiente a Octubre 2026
  const pagadaEnPeriodo = Boolean(pagoOctubre)
  const saldoCapitalRestante = Math.max(0, totalPrestamo - montoPagadoTotal)
  const fechaCorteRecalculo = 'Finales de Octubre (31/10/2026)'

  const prestamoInfo: PrestamoCapitalInfo = {
    totalPrestamo,
    cuotaMensual,
    totalCuotas,
    cuotasPagadas,
    cuotaActual,
    pagadaEnPeriodo,
    fechaCorteRecalculo,
    saldoCapitalRestante: Number(saldoCapitalRestante.toFixed(2)),
    montoPagadoTotal: Number(montoPagadoTotal.toFixed(2)),
    cuotaSeptiembre,
    cuotaOctubre
  }

  // 6. Partidas del Plan Almacenadas en PostgreSQL (Fuente Única de la Verdad)
  const partidasPlan = await getPartidasPlanDB(targetNegocio)

  // Buscar egresos de Octubre 2026 para conciliar pagos reales de partidas
  const egresosOctubre = inversiones.filter(e => {
    const d = new Date(e.createdAt)
    return d.getMonth() === 9 && d.getFullYear() === 2026
  })

  // Sincronizar estado y conciliación contable de partidas
  const planActualizado = partidasPlan.map(p => {
    if (p.id === 'gasto-cuota-prestamo') {
      return {
        ...p,
        montoSeptiembreReal: cuotaSeptiembre.pagada ? cuotaSeptiembre.monto : 0,
        pagado: cuotaOctubre.pagada,
        inversionId: cuotaOctubre.inversionId,
        montoPagadoReal: cuotaOctubre.pagada ? cuotaOctubre.monto : null,
        fechaPago: cuotaOctubre.fechaPago,
        vencimiento: 'Finales de Octubre (31/10/2026)'
      }
    }

    // Buscar si hay egreso registrado en Octubre para esta partida (Luz, Internet, etc.)
    const egresoMatch = egresosOctubre.find(e => {
      const c = e.itemConcepto.toLowerCase()
      const pNorm = p.concepto.toLowerCase()
      return c.includes(pNorm) || (pNorm.includes('luz') && c.includes('luz'))
    })

    const estaPagado = Boolean(p.pagado || egresoMatch)
    return {
      ...p,
      pagado: estaPagado,
      inversionId: egresoMatch?.id || null,
      montoPagadoReal: egresoMatch ? Number(egresoMatch.costoTotal) : (estaPagado ? Number(p.presupuesto) : null),
      fechaPago: egresoMatch ? new Date(egresoMatch.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
      vencimiento: 'Finales de Octubre (31/10/2026)'
    }
  })

  // Partidas blindadas pendientes (compromisos que retienen caja)
  const partidasBlindadasResumen: PartidaBlindadaResumen[] = planActualizado
    .filter(p => p.tipo === 'Blindado')
    .map(p => ({
      id: p.id,
      concepto: p.concepto,
      presupuesto: Number(p.presupuesto || 0),
      pagado: Boolean(p.pagado),
      montoPendiente: p.pagado ? 0 : Number(p.presupuesto || 0)
    }))

  const totalBlindadoPendiente = partidasBlindadasResumen.reduce((sum, p) => sum + p.montoPendiente, 0)
  const gastoDisponibleLibre = Math.max(0, saldoActualCaja - totalBlindadoPendiente)

  return {
    saldoActualCaja,
    totalIngresosCobrados,
    totalEgresosAcumulados,
    cuentasPorCobrar,
    totalGramosStock,
    totalBobinasTaller,
    coloresActivos: filamentosDisponibles.length,
    coloresRestock: filamentosRestock.length,
    costoEstimadoRestock,
    listaColoresRestock,
    ticketPromedio,
    costoPromedioFabricacion,
    margenPromedioUnitario,
    promedioPedidosMensuales,
    gastosFijosTallerEstimado,
    cuotaPrestamoSugerida,
    reservaCapexSugerida,
    packagingPromedioPorPedido,
    prestamoInfo,
    totalBlindadoPendiente,
    gastoDisponibleLibre,
    partidasBlindadasResumen,
    partidasPlan: planActualizado
  }
}

export async function getResumenBlindadoOficial(negocio?: TipoNegocio) {
  const datos = await getDatosPresupuestoTranquilidad(negocio)
  return {
    saldoActualCaja: datos.saldoActualCaja,
    totalBlindadoMes: datos.totalBlindadoPendiente,
    gastoDisponibleHoy: datos.gastoDisponibleLibre,
    cuotaPrestamoMensual: datos.prestamoInfo.cuotaMensual,
    cuotaPrestamoPendiente: datos.prestamoInfo.pagadaEnPeriodo ? 0 : datos.prestamoInfo.cuotaMensual,
    totalPagadoPrestamoMes: datos.prestamoInfo.montoPagadoTotal,
    reservaCapexMensual: datos.reservaCapexSugerida,
    gastosFijosTaller: 111.00,
    partidasBlindadas: datos.partidasBlindadasResumen
  }
}

export async function actualizarPresupuestoPartida(id: string, nuevoPresupuesto: number) {
  try {
    await prisma.partidaPresupuesto.update({
      where: { id },
      data: { presupuesto: nuevoPresupuesto }
    })
  } catch (err) {
    console.error('Error actualizando presupuesto en BD:', err)
  }
  return { success: true, id, presupuesto: nuevoPresupuesto, timestamp: new Date().toISOString() }
}

export async function conmutarTipoPartidaPresupuesto(id: string, nuevoTipo: 'Blindado' | 'Flexible') {
  try {
    await prisma.partidaPresupuesto.update({
      where: { id },
      data: { tipo: nuevoTipo }
    })
  } catch (err) {
    console.error('Error conmutando tipo en BD:', err)
  }
  return { success: true, id, tipo: nuevoTipo, timestamp: new Date().toISOString() }
}

export async function togglePagadoPartidaPresupuesto(id: string, pagado: boolean) {
  try {
    await prisma.partidaPresupuesto.update({
      where: { id },
      data: { pagado }
    })
  } catch (err) {
    console.error('Error actualizando pagado en BD:', err)
  }
  return { success: true, id, pagado, timestamp: new Date().toISOString() }
}

export async function eliminarPartidaPresupuesto(id: string) {
  try {
    await prisma.partidaPresupuesto.deleteMany({
      where: { id }
    })
  } catch (err) {
    console.error('Error eliminando partida de BD:', err)
  }
  return { success: true, id }
}

export async function guardarPlanPresupuestoCompleto(partidas: any[]) {
  try {
    for (let i = 0; i < partidas.length; i++) {
      const p = partidas[i]
      await prisma.partidaPresupuesto.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          negocio: p.negocio || '3D',
          categoria: p.categoria || 'OPERATIVO',
          concepto: p.concepto,
          subconcepto: p.subconcepto || null,
          montoAgostoReal: Number(p.montoAgostoReal || 0),
          montoSeptiembreReal: Number(p.montoSeptiembreReal || 0),
          presupuesto: Number(p.presupuesto ?? p.monto ?? 0),
          tipo: p.tipo ?? (p.esBlindado ? 'Blindado' : 'Flexible'),
          pagado: Boolean(p.pagado),
          orden: i
        },
        update: {
          categoria: p.categoria || 'OPERATIVO',
          concepto: p.concepto,
          subconcepto: p.subconcepto || null,
          presupuesto: Number(p.presupuesto ?? p.monto ?? 0),
          tipo: p.tipo ?? (p.esBlindado ? 'Blindado' : 'Flexible'),
          pagado: Boolean(p.pagado),
          orden: i
        }
      })
    }
  } catch (err) {
    console.error('Error guardando plan completo en BD:', err)
  }
  return { success: true, count: partidas.length }
}

export async function guardarPartidaPlan(partida: any) {
  try {
    await prisma.partidaPresupuesto.upsert({
      where: { id: partida.id },
      create: {
        id: partida.id,
        negocio: partida.negocio || '3D',
        categoria: partida.categoria || 'OPERATIVO',
        concepto: partida.concepto,
        subconcepto: partida.subconcepto || null,
        montoAgostoReal: Number(partida.montoAgostoReal || 0),
        montoSeptiembreReal: Number(partida.montoSeptiembreReal || 0),
        presupuesto: Number(partida.presupuesto || 0),
        tipo: partida.tipo || 'Flexible',
        pagado: Boolean(partida.pagado)
      },
      update: {
        categoria: partida.categoria || 'OPERATIVO',
        concepto: partida.concepto,
        subconcepto: partida.subconcepto || null,
        presupuesto: Number(partida.presupuesto || 0),
        tipo: partida.tipo || 'Flexible',
        pagado: Boolean(partida.pagado)
      }
    })
  } catch (err) {
    console.error('Error guardando partida individual en BD:', err)
  }
  return { success: true, partida, timestamp: new Date().toISOString() }
}

export async function guardarPartidaPresupuesto(partida: {
  id?: string
  concepto: string
  subconcepto?: string | null
  presupuesto: number
  categoria?: string
  tipo?: 'Blindado' | 'Flexible'
  pagado?: boolean
  negocio?: string
}) {
  const targetNegocio = partida.negocio || (await getActiveNegocioServer())
  const id = partida.id || `partida-${Date.now()}`
  const tipo = partida.tipo || 'Blindado'
  const categoria = partida.categoria || 'OPERATIVO'
  const presupuesto = Number(partida.presupuesto || 0)

  try {
    await prisma.partidaPresupuesto.upsert({
      where: { id },
      create: {
        id,
        negocio: targetNegocio,
        categoria,
        concepto: partida.concepto,
        subconcepto: partida.subconcepto || null,
        presupuesto,
        tipo,
        pagado: Boolean(partida.pagado)
      },
      update: {
        categoria,
        concepto: partida.concepto,
        subconcepto: partida.subconcepto || null,
        presupuesto,
        tipo,
        pagado: Boolean(partida.pagado)
      }
    })
    return { success: true, id, partida: { ...partida, id, tipo, categoria, presupuesto } }
  } catch (err: any) {
    console.error('Error en guardarPartidaPresupuesto:', err)
    if (err?.code === 'P2002') {
      try {
        const updated = await prisma.partidaPresupuesto.update({
          where: {
            concepto_negocio: {
              concepto: partida.concepto,
              negocio: targetNegocio
            }
          },
          data: {
            categoria,
            subconcepto: partida.subconcepto || null,
            presupuesto,
            tipo,
            pagado: Boolean(partida.pagado)
          }
        })
        return { success: true, id: updated.id, partida: updated }
      } catch (innerErr) {
        console.error('Error actualizando por concepto_negocio:', innerErr)
      }
    }
    throw err
  }
}

export async function restablecerPlanBaseDB(negocio: string = '3D') {
  try {
    const defaults = getPartidasDefault()
    await prisma.partidaPresupuesto.deleteMany({
      where: { negocio }
    })
    for (let i = 0; i < defaults.length; i++) {
      const p = defaults[i]
      await prisma.partidaPresupuesto.create({
        data: {
          id: p.id,
          negocio,
          categoria: p.categoria,
          concepto: p.concepto,
          subconcepto: p.subconcepto || null,
          montoAgostoReal: p.montoAgostoReal,
          montoSeptiembreReal: p.montoSeptiembreReal,
          presupuesto: p.presupuesto,
          tipo: p.tipo,
          pagado: p.pagado,
          orden: i
        }
      })
    }
    return { success: true, count: defaults.length }
  } catch (err) {
    console.error('Error restableciendo plan base en BD:', err)
    return { success: false, error: String(err) }
  }
}

function safeRevalidate() {
  try {
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/egresos')
    revalidatePath('/inversiones')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside Next.js request store
  }
}

function parseDateInput(fecha?: string | Date) {
  if (!fecha) return new Date(2026, 9, 31) // Fin de octubre 2026
  if (fecha instanceof Date) return fecha
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) return new Date(fecha)
    const [year, month, day] = fecha.split('-').map(Number)
    if (year && month && day) {
      const target = new Date()
      target.setFullYear(year, month - 1, day)
      target.setHours(12, 0, 0, 0)
      return target
    }
    return new Date(fecha)
  }
  return new Date(fecha)
}

export interface PagarCompromisoInput {
  tipoCompromiso: 'PRESTAMO' | 'PARTIDA'
  partidaId?: string
  numeroCuota?: number
  concepto: string
  monto: number
  fechaPago?: string | Date
  metodoPago?: string
  categoria?: string
  subcategoria?: string
  notas?: string
  persona?: string
  negocio?: TipoNegocio
}

export async function pagarCompromisoBlindado(data: PagarCompromisoInput) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()
  const persona = data.persona || 'Víctor'
  const monto = Number(data.monto)
  if (isNaN(monto) || monto <= 0) {
    throw new Error('El monto a pagar debe ser mayor a 0')
  }

  const fechaObj = parseDateInput(data.fechaPago)

  let categoriaInv: CategoriaInversion = 'SERVICIO'
  let subcategoria = data.subcategoria || 'Servicios Taller'
  let concepto = data.concepto

  if (data.tipoCompromiso === 'PRESTAMO') {
    categoriaInv = 'FINANCIERO'
    subcategoria = 'BCP'
    const numCuota = data.numeroCuota || 2
    concepto = `Pago Cuota ${numCuota}/24 (Octubre) - Préstamo BCP Capital de Trabajo`
  } else {
    const catUpper = (data.categoria || '').toUpperCase()
    if (catUpper === 'INSUMOS') categoriaInv = 'INSUMO'
    else if (catUpper === 'CAPEX') categoriaInv = 'ACTIVO_FIJO'
    else if (catUpper === 'BLINDADO') categoriaInv = 'FINANCIERO'
    else categoriaInv = 'SERVICIO'

    if (!concepto.toLowerCase().includes('octubre')) {
      concepto = `${concepto} - Cuota Octubre 2026`
    }
  }

  if (data.metodoPago) {
    subcategoria = `${subcategoria} (${data.metodoPago})`
  }

  // 1. Asentar Egreso contable oficial en la base de datos
  const inversion = await prisma.inversion.create({
    data: {
      negocio: targetNegocio,
      persona,
      categoria: categoriaInv,
      subcategoria,
      itemConcepto: concepto,
      cantidad: 1,
      costoUnitario: monto,
      costoEnvio: 0,
      costoTotal: monto,
      montoCuota: data.tipoCompromiso === 'PRESTAMO' ? monto : null,
      numeroCuotas: data.tipoCompromiso === 'PRESTAMO' ? 24 : null,
      createdAt: fechaObj
    }
  })

  // 2. Si es partida presupuestaria, actualizar estado pagado
  if (data.partidaId) {
    try {
      await prisma.partidaPresupuesto.update({
        where: { id: data.partidaId },
        data: { pagado: true }
      })
    } catch (e) {
      console.warn('Partida no encontrada por id directo al marcar pagado:', data.partidaId)
    }
  } else if (data.tipoCompromiso === 'PRESTAMO') {
    try {
      await prisma.partidaPresupuesto.updateMany({
        where: {
          OR: [
            { id: 'gasto-cuota-prestamo' },
            { concepto: { contains: 'préstamo', mode: 'insensitive' } }
          ],
          negocio: targetNegocio
        },
        data: { pagado: true }
      })
    } catch (e) {
      // Ignorar si no existe
    }
  }

  safeRevalidate()
  return {
    success: true,
    inversionId: inversion.id,
    monto,
    concepto,
    fecha: inversion.createdAt.toISOString()
  }
}

export interface RevertirCompromisoInput {
  tipoCompromiso: 'PRESTAMO' | 'PARTIDA'
  inversionId?: string | null
  numeroCuota?: number
  partidaId?: string
  concepto?: string
  negocio?: TipoNegocio
}

export async function revertirPagoCompromisoBlindado(data: RevertirCompromisoInput) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()

  // 1. Eliminar el egreso contable de Inversiones (Extorno contable)
  if (data.inversionId) {
    try {
      await prisma.inversion.delete({
        where: { id: data.inversionId }
      })
    } catch (e) {
      console.warn('Inversión no encontrada por id directo al revertir:', data.inversionId)
    }
  } else if (data.tipoCompromiso === 'PRESTAMO' && data.numeroCuota) {
    const inv = await prisma.inversion.findFirst({
      where: {
        categoria: 'FINANCIERO',
        negocio: targetNegocio,
        OR: [
          { itemConcepto: { contains: `Cuota ${data.numeroCuota}`, mode: 'insensitive' } },
          { itemConcepto: { contains: `Cuota ${data.numeroCuota}/`, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    if (inv) {
      await prisma.inversion.delete({ where: { id: inv.id } })
    }
  } else if (data.partidaId) {
    const egreso = await prisma.inversion.findFirst({
      where: {
        negocio: targetNegocio,
        createdAt: {
          gte: new Date(2026, 9, 1),
          lte: new Date(2026, 9, 31, 23, 59, 59)
        },
        itemConcepto: { contains: data.concepto || '', mode: 'insensitive' }
      }
    })
    if (egreso) {
      await prisma.inversion.delete({ where: { id: egreso.id } })
    }
  }

  // 2. Desmarcar como pagado en PartidaPresupuesto para restaurar el fondo blindado
  if (data.partidaId) {
    try {
      await prisma.partidaPresupuesto.update({
        where: { id: data.partidaId },
        data: { pagado: false }
      })
    } catch (e) {
      console.warn('Partida no encontrada para desmarcar pagado:', data.partidaId)
    }
  } else if (data.tipoCompromiso === 'PRESTAMO') {
    // Si se revierte cuota 2 (Octubre), desmarcar pagado en partida
    if (data.numeroCuota === 2) {
      try {
        await prisma.partidaPresupuesto.updateMany({
          where: {
            OR: [
              { id: 'gasto-cuota-prestamo' },
              { concepto: { contains: 'préstamo', mode: 'insensitive' } }
            ],
            negocio: targetNegocio
          },
          data: { pagado: false }
        })
      } catch (e) {
        // Ignorar
      }
    }
  }

  safeRevalidate()
  return {
    success: true,
    reversedCuota: data.numeroCuota,
    partidaId: data.partidaId
  }
}
