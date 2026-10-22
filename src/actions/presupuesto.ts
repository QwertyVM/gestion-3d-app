'use server'

import prisma from '@/lib/prisma'
import { getPedidos } from '@/actions/pedidos'
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

export interface ItemHistorialPago {
  id: string
  inversionId: string
  concepto: string
  mesPeriodo: string
  monto: number
  fechaPago: string
  fechaPagoIso?: string
  metodoPago: string
  notas?: string
  numeroCuota?: number
}

export interface HistorialCompromisoInfo {
  compromisoId: string
  concepto: string
  tipo: 'PRESTAMO' | 'PARTIDA'
  totalCuotas?: number
  cuotasPagadas: number
  totalMontoPagado: number
  montoMensualPresupuesto: number
  saldoRestante?: number
  pagos: ItemHistorialPago[]
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
  historialPagos?: ItemHistorialPago[]
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
  cuotaSeptiembre?: CuotaDetalle | null
  cuotaOctubre?: CuotaDetalle | null
  historialPagos?: ItemHistorialPago[]
  totalPagos?: number
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
  const [inversiones, pedidos, ingresosDirectos, filamentos] = await ejecutarConReintentoDB(() =>
    Promise.all([
      prisma.inversion.findMany({
        where: { negocio: targetNegocio }
      }),
      getPedidos(targetNegocio),
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
  const totalCobradoVentas = pedidos.reduce((sum, p) => sum + Number(p.montoPagado || 0), 0)
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto || 0), 0)
  const totalIngresosCobrados = totalCobradoVentas + totalIngresosDirectos

  const totalEgresosAcumulados = inversiones.reduce((sum, e) => sum + Number(e.costoTotal || 0), 0)
  const saldoActualCaja = Math.max(0, totalIngresosCobrados - totalEgresosAcumulados)

  const cuentasPorCobrar = pedidos.reduce((sum, p) => sum + Number(p.saldoPendiente || 0), 0)

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
  const totalFacturadoVentas = pedidos.reduce((sum, p) => sum + Number(p.total || 0), 0)
  const ticketPromedio = pedidos.length > 0 ? Number((totalFacturadoVentas / pedidos.length).toFixed(2)) : 135.00

  const totalCostosFabricacion = pedidos.reduce((sum, p) => sum + Number(p.costoBaseTotal || 0), 0)

  const costoPromedioFabricacion = pedidos.length > 0 
    ? Number((totalCostosFabricacion / pedidos.length).toFixed(2)) 
    : 38.00

  const margenPromedioUnitario = Math.max(0, ticketPromedio - costoPromedioFabricacion)

  // Pedidos del último mes o promedio estimado
  const promedioPedidosMensuales = Math.max(8, Math.min(40, pedidos.length > 0 ? Math.round(pedidos.length / Math.max(1, 2)) : 18))

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

  // Historial de pagos reales de Préstamo BCP
  const historialPagosBCP: ItemHistorialPago[] = pagosPrestamo.map(p => {
    const d = new Date(p.createdAt)
    const mesNom = d.getMonth() === 8 ? 'Septiembre' : d.getMonth() === 9 ? 'Octubre' : d.toLocaleDateString('es-PE', { month: 'long' })
    const matchCuota = p.itemConcepto.match(/cuota\s*(\d+)/i)
    const numCuota = matchCuota ? Number(matchCuota[1]) : (d.getMonth() === 8 ? 1 : 2)
    return {
      id: p.id,
      inversionId: p.id,
      concepto: p.itemConcepto,
      mesPeriodo: p.especificacionColor || `${mesNom.charAt(0).toUpperCase() + mesNom.slice(1)} ${d.getFullYear()}`,
      monto: Number(p.costoTotal),
      fechaPago: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      fechaPagoIso: d.toISOString(),
      metodoPago: p.subcategoria || 'BCP',
      notas: p.especificacionColor || undefined,
      numeroCuota: numCuota
    }
  })

  // Buscar pagos por mes específico
  // Septiembre 2026: mes 8 en JS
  const pagoSeptiembre = pagosPrestamo.find(p => {
    const d = new Date(p.createdAt)
    return (d.getMonth() === 8 && d.getFullYear() === 2026) || p.itemConcepto?.toLowerCase().includes('cuota 1')
  })

  // Octubre 2026: mes 9 en JS
  const pagoOctubre = pagosPrestamo.find(p => {
    const d = new Date(p.createdAt)
    return (d.getMonth() === 9 && d.getFullYear() === 2026) || p.itemConcepto?.toLowerCase().includes('cuota 2')
  })

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
    cuotaOctubre,
    historialPagos: historialPagosBCP
  }

  // 6. Partidas del Plan Almacenadas en PostgreSQL (Fuente Única de la Verdad)
  const partidasPlan = await getPartidasPlanDB(targetNegocio)

  // Sincronizar estado y conciliación contable de partidas con TODOS los egresos reales
  const planActualizado = partidasPlan.map(p => {
    if (p.id === 'gasto-cuota-prestamo') {
      return {
        ...p,
        montoSeptiembreReal: cuotaSeptiembre.pagada ? cuotaSeptiembre.monto : 0,
        pagado: cuotaOctubre.pagada,
        inversionId: cuotaOctubre.inversionId,
        montoPagadoReal: cuotaOctubre.pagada ? cuotaOctubre.monto : null,
        fechaPago: cuotaOctubre.fechaPago,
        vencimiento: 'Finales de Octubre (31/10/2026)',
        cuotaSeptiembre,
        cuotaOctubre,
        historialPagos: historialPagosBCP,
        totalPagos: cuotasPagadas
      }
    }

    // Buscar TODOS los egresos que corresponden a esta partida (en cualquier fecha)
    const egresosDePartida = inversiones.filter(e => {
      if (e.categoria === 'FINANCIERO') return false
      if (e.presentacion === p.id) return true
      const c = (e.itemConcepto || '').toLowerCase()
      const pNorm = (p.concepto || '').toLowerCase()
      if (pNorm && c.includes(pNorm)) return true
      if (pNorm.includes('luz') && c.includes('luz')) return true
      if (pNorm.includes('internet') && c.includes('internet')) return true
      return false
    })

    // Pago de Septiembre 2026
    const egresoSep = egresosDePartida.find(e => {
      const d = new Date(e.createdAt)
      return (d.getMonth() === 8 && d.getFullYear() === 2026) ||
             (e.itemConcepto && e.itemConcepto.toLowerCase().includes('septiembre')) ||
             (e.especificacionColor && e.especificacionColor.toLowerCase().includes('septiembre'))
    })

    // Pago de Octubre 2026
    const egresoOct = egresosDePartida.find(e => {
      const d = new Date(e.createdAt)
      return (d.getMonth() === 9 && d.getFullYear() === 2026) ||
             (e.itemConcepto && e.itemConcepto.toLowerCase().includes('octubre')) ||
             (e.especificacionColor && e.especificacionColor.toLowerCase().includes('octubre'))
    })

    const montoSepReal = egresoSep
      ? Number(egresoSep.costoTotal)
      : Number(p.montoSeptiembreReal || 0)

    const cuotaSepPartida: CuotaDetalle = {
      numeroCuota: 1,
      mes: 'Septiembre',
      anio: 2026,
      monto: montoSepReal > 0 ? montoSepReal : Number(p.presupuesto || 0),
      pagada: Boolean(egresoSep || montoSepReal > 0),
      inversionId: egresoSep?.id || null,
      fechaPago: egresoSep ? new Date(egresoSep.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : (montoSepReal > 0 ? 'Septiembre 2026' : null),
      vencimiento: 'Finales de Septiembre (30/09/2026)'
    }

    const estaPagadoOct = Boolean(p.pagado || egresoOct)
    const cuotaOctPartida: CuotaDetalle = {
      numeroCuota: 2,
      mes: 'Octubre',
      anio: 2026,
      monto: egresoOct ? Number(egresoOct.costoTotal) : Number(p.presupuesto || 0),
      pagada: estaPagadoOct,
      inversionId: egresoOct?.id || null,
      fechaPago: egresoOct ? new Date(egresoOct.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
      vencimiento: 'Finales de Octubre (31/10/2026)'
    }

    const historialPagosPartida: ItemHistorialPago[] = egresosDePartida.map(e => {
      const d = new Date(e.createdAt)
      const mesNom = d.getMonth() === 8 ? 'Septiembre' : d.getMonth() === 9 ? 'Octubre' : d.toLocaleDateString('es-PE', { month: 'long' })
      return {
        id: e.id,
        inversionId: e.id,
        concepto: e.itemConcepto,
        mesPeriodo: e.especificacionColor || `${mesNom.charAt(0).toUpperCase() + mesNom.slice(1)} ${d.getFullYear()}`,
        monto: Number(e.costoTotal),
        fechaPago: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        fechaPagoIso: d.toISOString(),
        metodoPago: e.subcategoria || 'BCP',
        notas: e.especificacionColor || undefined
      }
    })

    return {
      ...p,
      montoSeptiembreReal: montoSepReal,
      pagado: estaPagadoOct,
      inversionId: egresoOct?.id || null,
      montoPagadoReal: egresoOct ? Number(egresoOct.costoTotal) : (estaPagadoOct ? Number(p.presupuesto) : null),
      fechaPago: egresoOct ? new Date(egresoOct.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
      vencimiento: 'Finales de Octubre (31/10/2026)',
      cuotaSeptiembre: cuotaSepPartida,
      cuotaOctubre: cuotaOctPartida,
      historialPagos: historialPagosPartida,
      totalPagos: historialPagosPartida.length
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

export async function calcularResumenBlindado(
  inversiones: any[],
  partidasPlan: ItemPartidaPlan[],
  saldoActualCaja: number = 0
) {
  const cuotaMensual = 388.68
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

  const montoPagadoTotal = pagosPrestamo.reduce((acc, p) => acc + Number(p.costoTotal || 0), 0)

  const pagoOctubre = pagosPrestamo.find(p => {
    const d = new Date(p.createdAt)
    return (d.getMonth() === 9 && d.getFullYear() === 2026) || p.itemConcepto?.toLowerCase().includes('cuota 2')
  })

  const pagadaEnPeriodo = Boolean(pagoOctubre)

  const planActualizado = partidasPlan.map(p => {
    if (p.id === 'gasto-cuota-prestamo') {
      return {
        ...p,
        pagado: pagadaEnPeriodo
      }
    }

    const egresosDePartida = inversiones.filter(e => {
      if (e.categoria === 'FINANCIERO') return false
      const conceptoLower = (e.itemConcepto || '').toLowerCase()
      const pConceptoLower = (p.concepto || '').toLowerCase()
      const pSubLower = (p.subconcepto || '').toLowerCase()
      return conceptoLower.includes(pConceptoLower) || (pSubLower && conceptoLower.includes(pSubLower.slice(0, 10)))
    })

    const egresoOct = egresosDePartida.find(e => {
      const d = new Date(e.createdAt)
      return (d.getMonth() === 9 && d.getFullYear() === 2026) ||
             (e.itemConcepto && e.itemConcepto.toLowerCase().includes('octubre')) ||
             (e.especificacionColor && e.especificacionColor.toLowerCase().includes('octubre'))
    })

    const estaPagadoOct = Boolean(p.pagado || egresoOct)
    return {
      ...p,
      pagado: estaPagadoOct
    }
  })

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
    totalBlindadoMes: totalBlindadoPendiente,
    gastoDisponibleHoy: gastoDisponibleLibre,
    cuotaPrestamoMensual: cuotaMensual,
    cuotaPrestamoPendiente: pagadaEnPeriodo ? 0 : cuotaMensual,
    totalPagadoPrestamoMes: montoPagadoTotal,
    reservaCapexMensual: 878.00,
    gastosFijosTaller: 111.00,
    partidasBlindadas: partidasBlindadasResumen
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
  mesPeriodo?: string
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
  const mesNum = fechaObj.getMonth() // 8 = Septiembre, 9 = Octubre (en JS 0-indexed)
  const anioNum = fechaObj.getFullYear()

  // Determinar período contable
  let mesPeriodo = data.mesPeriodo
  if (!mesPeriodo) {
    if (mesNum === 8 && anioNum === 2026) mesPeriodo = 'Septiembre 2026'
    else if (mesNum === 9 && anioNum === 2026) mesPeriodo = 'Octubre 2026'
    else {
      const mesStr = fechaObj.toLocaleDateString('es-PE', { month: 'long' })
      mesPeriodo = `${mesStr.charAt(0).toUpperCase() + mesStr.slice(1)} ${anioNum}`
    }
  }

  const esSeptiembre = mesPeriodo.toLowerCase().includes('septiembre') || (mesNum === 8 && anioNum === 2026)

  let categoriaInv: CategoriaInversion = 'SERVICIO'
  let subcategoria = data.subcategoria || 'Servicios Taller'
  let concepto = data.concepto

  if (data.tipoCompromiso === 'PRESTAMO') {
    categoriaInv = 'FINANCIERO'
    subcategoria = 'BCP'
    const numCuota = data.numeroCuota || (esSeptiembre ? 1 : 2)
    concepto = `Pago Cuota ${numCuota}/24 (${mesPeriodo}) - Préstamo BCP Capital de Trabajo`
  } else {
    const catUpper = (data.categoria || '').toUpperCase()
    if (catUpper === 'INSUMOS') categoriaInv = 'INSUMO'
    else if (catUpper === 'CAPEX') categoriaInv = 'ACTIVO_FIJO'
    else if (catUpper === 'BLINDADO') categoriaInv = 'FINANCIERO'
    else categoriaInv = 'SERVICIO'

    if (!concepto.toLowerCase().includes(mesPeriodo.toLowerCase())) {
      concepto = `${concepto} - Cuota ${mesPeriodo}`
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
      itemConcepto: data.notas ? `${concepto} (${data.notas})` : concepto,
      presentacion: data.partidaId || (data.tipoCompromiso === 'PRESTAMO' ? 'PRESTAMO_BCP' : null),
      especificacionColor: mesPeriodo,
      cantidad: 1,
      costoUnitario: monto,
      costoEnvio: 0,
      costoTotal: monto,
      montoCuota: data.tipoCompromiso === 'PRESTAMO' ? monto : null,
      numeroCuotas: data.tipoCompromiso === 'PRESTAMO' ? 24 : null,
      createdAt: fechaObj
    }
  })

  // 2. Si es partida presupuestaria, actualizar estado o monto histórico
  if (data.partidaId) {
    try {
      if (esSeptiembre) {
        // Registro de Septiembre: actualizar montoSeptiembreReal
        await prisma.partidaPresupuesto.update({
          where: { id: data.partidaId },
          data: { montoSeptiembreReal: monto }
        })
      } else {
        // Pago de Octubre / mes en curso: marcar pagado
        await prisma.partidaPresupuesto.update({
          where: { id: data.partidaId },
          data: { pagado: true }
        })
      }
    } catch (e) {
      console.warn('Partida no encontrada por id directo al actualizar:', data.partidaId)
    }
  } else if (data.tipoCompromiso === 'PRESTAMO') {
    if (!esSeptiembre || data.numeroCuota === 2) {
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
      } catch (e) {}
    }
  }

  safeRevalidate()
  return {
    success: true,
    inversionId: inversion.id,
    monto,
    concepto,
    mesPeriodo,
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

  let invABorrar = null

  // 1. Eliminar el egreso contable de Inversiones (Extorno contable)
  if (data.inversionId) {
    try {
      invABorrar = await prisma.inversion.findUnique({
        where: { id: data.inversionId }
      })
      if (invABorrar) {
        await prisma.inversion.delete({ where: { id: data.inversionId } })
      }
    } catch (e) {
      console.warn('Inversión no encontrada por id directo al revertir:', data.inversionId)
    }
  } else if (data.tipoCompromiso === 'PRESTAMO' && data.numeroCuota) {
    invABorrar = await prisma.inversion.findFirst({
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
    if (invABorrar) {
      await prisma.inversion.delete({ where: { id: invABorrar.id } })
    }
  } else if (data.partidaId) {
    invABorrar = await prisma.inversion.findFirst({
      where: {
        negocio: targetNegocio,
        OR: [
          { presentacion: data.partidaId },
          { itemConcepto: { contains: data.concepto || '', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    if (invABorrar) {
      await prisma.inversion.delete({ where: { id: invABorrar.id } })
    }
  }

  // 2. Determinar si correspondía a Septiembre o a Octubre
  const d = invABorrar ? new Date(invABorrar.createdAt) : new Date()
  const esSeptiembre = invABorrar?.especificacionColor?.toLowerCase().includes('septiembre') ||
                       invABorrar?.itemConcepto?.toLowerCase().includes('septiembre') ||
                       (d.getMonth() === 8 && d.getFullYear() === 2026) ||
                       data.numeroCuota === 1

  if (data.partidaId) {
    try {
      if (esSeptiembre) {
        await prisma.partidaPresupuesto.update({
          where: { id: data.partidaId },
          data: { montoSeptiembreReal: 0 }
        })
      } else {
        await prisma.partidaPresupuesto.update({
          where: { id: data.partidaId },
          data: { pagado: false }
        })
      }
    } catch (e) {
      console.warn('Partida no encontrada para actualizar estado tras reversión:', data.partidaId)
    }
  } else if (data.tipoCompromiso === 'PRESTAMO') {
    if (!esSeptiembre || data.numeroCuota === 2) {
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
      } catch (e) {}
    }
  }

  safeRevalidate()
  return {
    success: true,
    reversedCuota: data.numeroCuota,
    partidaId: data.partidaId
  }
}

export async function getHistorialCompromisos(negocio?: TipoNegocio): Promise<HistorialCompromisoInfo[]> {
  const datos = await getDatosPresupuestoTranquilidad(negocio)
  const result: HistorialCompromisoInfo[] = []

  // 1. Préstamo BCP
  result.push({
    compromisoId: 'prestamo-bcp',
    concepto: 'Préstamo BCP Capital de Trabajo',
    tipo: 'PRESTAMO',
    totalCuotas: datos.prestamoInfo.totalCuotas,
    cuotasPagadas: datos.prestamoInfo.cuotasPagadas,
    totalMontoPagado: datos.prestamoInfo.montoPagadoTotal,
    montoMensualPresupuesto: datos.prestamoInfo.cuotaMensual,
    saldoRestante: datos.prestamoInfo.saldoCapitalRestante,
    pagos: datos.prestamoInfo.historialPagos || []
  })

  // 2. Partidas
  for (const p of datos.partidasPlan) {
    const totalMonto = (p.historialPagos || []).reduce((acc, h) => acc + h.monto, 0)
    result.push({
      compromisoId: p.id,
      concepto: p.concepto,
      tipo: 'PARTIDA',
      totalCuotas: undefined,
      cuotasPagadas: p.totalPagos || (p.historialPagos?.length || 0),
      totalMontoPagado: totalMonto,
      montoMensualPresupuesto: Number(p.presupuesto || 0),
      pagos: p.historialPagos || []
    })
  }

  return result
}
