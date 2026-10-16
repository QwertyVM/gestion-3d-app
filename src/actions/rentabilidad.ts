'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { getInversiones } from '@/actions/inversiones'
import { getVentas } from '@/actions/ventas'
import { getIngresos } from '@/actions/ingresos'
import { getDatosPresupuestoTranquilidad } from '@/actions/presupuesto'

export interface MesRentabilidadData {
  mesKey: string // "YYYY-MM"
  nombreMes: string // "Septiembre 2024"
  mesNumero: number
  anio: number
  saldoInicial: number
  ventasCobradas: number
  inyeccionCapital: number // Préstamos bancarios y aportes de capital que entraron a caja
  comprasDirectas: number
  gastosPersonal: number // Sueldos de colaboradores / apoyo de taller (Jamile)
  gastosOperativos: number // Publicidad, marketing, envíos, comisiones
  gastosBlindadosPagados: number // Préstamo BCP pagado, luz/internet pagados, alquiler
  compromisosPendientes: number // Blindados pendientes de fin de mes
  totalBlindadosMes: number // gastosBlindadosPagados + compromisosPendientes
  obligacionesFijas: number // gastosPersonal + gastosOperativos + gastosBlindadosPagados (total pagado)
  totalObligacionesMes: number // gastosPersonal + gastosOperativos + totalBlindadosMes
  activosFijosCapex: number
  otrosEgresos: number
  utilidadMes: number
  margenOperativoPct: number
  utilidadProyectadaCierre: number
  margenProyectadoPct: number
  saldoAcumulado: number
  reservaObligaciones: number
  capacidadSueldoSeguro: number // Capacidad total combinada de la empresa
  numSocios: number // Cantidad de socios (2 personas)
  capacidadSueldoPorSocio: number // Capacidad máxima segura individual por socio
  estadoDiagnostico: 'EXCELENTE' | 'RENTABLE' | 'EQUILIBRIO' | 'DEFICIT'
}

export interface RentabilidadSueldosResumen {
  negocio: TipoNegocio
  mesSeleccionado: MesRentabilidadData
  meses: MesRentabilidadData[]
  totalHistoricoVentas: number
  totalHistoricoInyeccion: number
  totalHistoricoCompras: number
  totalHistoricoPersonal: number
  totalHistoricoOperativos: number
  totalHistoricoBlindados: number
  totalHistoricoObligaciones: number
  totalHistoricoUtilidad: number
  promedioUtilidadMensual: number
  promedioObligacionesMensual: number
  reservaRecomendadaSugerida: number
  saldoCajaActual: number
  numSocios: number
  capacidadSueldoActual: number
  capacidadSueldoPorSocioActual: number
}

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function getRentabilidadSueldos(
  negocioOverride?: TipoNegocio,
  mesKeySeleccionado?: string
): Promise<RentabilidadSueldosResumen> {
  const negocio = negocioOverride || await getActiveNegocioServer()

  // 1. Obtener datos reales de la base de datos
  const [inversiones, ventas, ingresosDirectos, presupuestoData] = await Promise.all([
    getInversiones(negocio),
    getVentas(negocio),
    getIngresos(negocio),
    getDatosPresupuestoTranquilidad(negocio)
  ])

  // 2. Mapa mensual cronológico
  const monthMap: Record<string, {
    ventasCobradas: number
    inyeccionCapital: number
    comprasDirectas: number
    gastosPersonal: number
    gastosOperativos: number
    gastosBlindadosPagados: number
    activosFijosCapex: number
    otrosEgresos: number
  }> = {}

  const ensureMonth = (key: string) => {
    if (!monthMap[key]) {
      monthMap[key] = {
        ventasCobradas: 0,
        inyeccionCapital: 0,
        comprasDirectas: 0,
        gastosPersonal: 0,
        gastosOperativos: 0,
        gastosBlindadosPagados: 0,
        activosFijosCapex: 0,
        otrosEgresos: 0,
      }
    }
  }

  // A. Procesar Ventas y Pagos reales
  ventas.forEach(v => {
    if (Array.isArray(v.pagos) && v.pagos.length > 0) {
      v.pagos.forEach(p => {
        if (!p.fecha || p.monto <= 0) return
        const key = p.fecha.slice(0, 7) // "YYYY-MM"
        ensureMonth(key)
        monthMap[key].ventasCobradas += Number(p.monto)
      })
    } else if (v.montoPagado > 0 && v.fecha) {
      const key = v.fecha.slice(0, 7)
      ensureMonth(key)
      monthMap[key].ventasCobradas += Number(v.montoPagado)
    }
  })

  // B. Procesar Ingresos Directos (Ventas directas vs préstamos e inyección de capital)
  ingresosDirectos.forEach(i => {
    if (!i.fecha || i.monto <= 0) return
    const key = i.fecha.slice(0, 7)
    ensureMonth(key)
    const catLower = (i.categoria || '').toLowerCase()
    const conLower = (i.concepto || '').toLowerCase()

    const isPrestamoOFinanciamiento =
      catLower.includes('préstamo') ||
      catLower.includes('prestamo') ||
      catLower.includes('financiamiento') ||
      catLower.includes('aporte') ||
      catLower.includes('capital') ||
      conLower.includes('préstamo') ||
      conLower.includes('prestamo') ||
      conLower.includes('desembolso') ||
      conLower.includes('aporte') ||
      conLower.includes('capital')

    // Préstamos y aportes van a inyección de capital para la caja real; ventas comerciales van a ventasCobradas
    if (isPrestamoOFinanciamiento) {
      monthMap[key].inyeccionCapital += Number(i.monto)
    } else {
      monthMap[key].ventasCobradas += Number(i.monto)
    }
  })

  // C. Procesar Egresos / Inversiones con SEPARACIÓN DE GASTOS BLINDADOS
  inversiones.forEach(e => {
    if (!e.createdAt || e.costoTotal <= 0) return
    const key = e.createdAt.slice(0, 7)
    ensureMonth(key)
    const cat = e.categoria
    const subLower = (e.subcategoria || '').toLowerCase()
    const conLower = (e.itemConcepto || '').toLowerCase()

    const isBlindado =
      cat === 'FINANCIERO' ||
      subLower.includes('bcp') ||
      subLower.includes('banco') ||
      subLower.includes('cuota') ||
      conLower.includes('préstamo') ||
      conLower.includes('prestamo') ||
      conLower.includes('cuota') ||
      conLower.includes('alquiler') ||
      conLower.includes('luz') ||
      conLower.includes('internet')

    const isPersonal =
      cat === 'PERSONAL' ||
      subLower.includes('sueldo') ||
      subLower.includes('planilla') ||
      conLower.includes('sueldo') ||
      conLower.includes('jamile') ||
      conLower.includes('personal')

    if (cat === 'INSUMO' || cat === 'MERCADERIA') {
      monthMap[key].comprasDirectas += Number(e.costoTotal)
    } else if (isPersonal) {
      monthMap[key].gastosPersonal += Number(e.costoTotal)
    } else if (cat === 'ACTIVO_FIJO' || subLower.includes('maquinaria')) {
      monthMap[key].activosFijosCapex += Number(e.costoTotal)
    } else if (isBlindado) {
      monthMap[key].gastosBlindadosPagados += Number(e.costoTotal)
    } else if (
      cat === 'SERVICIO' ||
      subLower.includes('publicidad') ||
      subLower.includes('marketing') ||
      subLower.includes('logística') ||
      subLower.includes('logistica') ||
      subLower.includes('envío') ||
      subLower.includes('envio') ||
      subLower.includes('servicio')
    ) {
      monthMap[key].gastosOperativos += Number(e.costoTotal)
    } else {
      monthMap[key].otrosEgresos += Number(e.costoTotal)
    }
  })

  // 3. Si no hay meses registrados en el sistema, asegurar el mes en curso
  const currentNow = new Date()
  const currentKey = `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, '0')}`
  ensureMonth(currentKey)

  // 4. Ordenar meses cronológicamente
  const sortedKeys = Object.keys(monthMap).sort()

  // 5. Calcular carry-over, saldo acumulado y rentabilidad en cascada recursiva
  let runningBalance = 0
  const mesesCalculados: MesRentabilidadData[] = []

  // Promedio móvil de obligaciones fijas para reserva técnica
  const totalObligacionesArr = Object.values(monthMap).map(m => m.gastosPersonal + m.gastosOperativos + m.gastosBlindadosPagados)
  const sumaObligaciones = totalObligacionesArr.reduce((a, b) => a + b, 0)
  const promedioObligaciones = totalObligacionesArr.length > 0 ? (sumaObligaciones / totalObligacionesArr.length) : 300

  sortedKeys.forEach(k => {
    const data = monthMap[k]
    const [yearStr, monthStr] = k.split('-')
    const anio = parseInt(yearStr, 10)
    const mesNumero = parseInt(monthStr, 10)
    const nombreMes = `${MESES_NOMBRES[mesNumero - 1]} ${anio}`

    const saldoInicial = Number(runningBalance.toFixed(2))

    const ventasCobradas = Number(data.ventasCobradas.toFixed(2))
    const inyeccionCapital = Number(data.inyeccionCapital.toFixed(2))
    const comprasDirectas = Number(data.comprasDirectas.toFixed(2))
    const gastosPersonal = Number(data.gastosPersonal.toFixed(2))
    const gastosOperativos = Number(data.gastosOperativos.toFixed(2))
    const gastosBlindadosPagados = Number(data.gastosBlindadosPagados.toFixed(2))
    const obligacionesFijas = Number((gastosPersonal + gastosOperativos + gastosBlindadosPagados).toFixed(2))
    const activosFijosCapex = Number(data.activosFijosCapex.toFixed(2))
    const otrosEgresos = Number(data.otrosEgresos.toFixed(2))

    // Utilidad Pura del Mes (Resultado Operativo P&L sin financiamiento ni capex)
    const utilidadMes = Number((ventasCobradas - comprasDirectas - obligacionesFijas).toFixed(2))

    const margenOperativoPct = ventasCobradas > 0
      ? Number(((utilidadMes / ventasCobradas) * 100).toFixed(1))
      : 0

    // Compromisos blindados pendientes (BCP + Partidas blindadas de fin de mes pendientes)
    let compromisosPendientes = 0
    if (k === currentKey && Array.isArray(presupuestoData?.partidasBlindadasResumen)) {
      presupuestoData.partidasBlindadasResumen.forEach(p => {
        if (!p.pagado) {
          const monto = Number(p.montoPendiente ?? p.presupuesto ?? 0)
          if (monto > 0) compromisosPendientes += monto
        }
      })
    }
    compromisosPendientes = Number(compromisosPendientes.toFixed(2))
    const totalBlindadosMes = Number((gastosBlindadosPagados + compromisosPendientes).toFixed(2))
    const totalObligacionesMes = Number((gastosOperativos + totalBlindadosMes).toFixed(2))

    // Utilidad Proyectada al Cierre del Mes (restando compromisos que vencerán a fin de mes)
    const utilidadProyectadaCierre = Number((utilidadMes - compromisosPendientes).toFixed(2))
    const margenProyectadoPct = ventasCobradas > 0
      ? Number(((utilidadProyectadaCierre / ventasCobradas) * 100).toFixed(1))
      : 0

    // Saldo acumulado real en caja al cierre del mes (Flujo de Tesorería)
    // Entradas: Ventas Cobradas + Inyección de Préstamos / Capital
    // Salidas: Insumos + Gastos Operativos + Cuotas Préstamo pagadas + Capex (maquinaria) + Otros egresos
    const flujoNetoTotalMes = Number(
      (ventasCobradas + inyeccionCapital - comprasDirectas - obligacionesFijas - activosFijosCapex - otrosEgresos).toFixed(2)
    )
    runningBalance += flujoNetoTotalMes
    const saldoAcumulado = Number(runningBalance.toFixed(2))

    // Reserva obligatoria (Compromisos blindados del mes + Fondo mínimo)
    const reservaObligaciones = Number(Math.max(totalBlindadosMes, promedioObligaciones, 100).toFixed(2))

    // Capacidad real para asignarse sueldo seguro (Blindando de antemano compromisos pendientes y fondo de seguridad)
    const numSocios = 2
    const capacidadSueldoSeguro = Number(Math.max(0, saldoAcumulado - compromisosPendientes - 150).toFixed(2))
    const capacidadSueldoPorSocio = Number((capacidadSueldoSeguro / numSocios).toFixed(2))

    let estadoDiagnostico: 'EXCELENTE' | 'RENTABLE' | 'EQUILIBRIO' | 'DEFICIT' = 'EQUILIBRIO'
    const margenParaDiag = compromisosPendientes > 0 ? margenProyectadoPct : margenOperativoPct
    const utilidadParaDiag = compromisosPendientes > 0 ? utilidadProyectadaCierre : utilidadMes

    if (margenParaDiag >= 35 && utilidadParaDiag > 0) {
      estadoDiagnostico = 'EXCELENTE'
    } else if (margenParaDiag > 10 && utilidadParaDiag > 0) {
      estadoDiagnostico = 'RENTABLE'
    } else if (utilidadParaDiag >= 0 || saldoAcumulado >= compromisosPendientes) {
      estadoDiagnostico = 'EQUILIBRIO'
    } else {
      estadoDiagnostico = 'DEFICIT'
    }

    mesesCalculados.push({
      mesKey: k,
      nombreMes,
      mesNumero,
      anio,
      saldoInicial,
      ventasCobradas,
      inyeccionCapital,
      comprasDirectas,
      gastosPersonal,
      gastosOperativos,
      gastosBlindadosPagados,
      compromisosPendientes,
      totalBlindadosMes,
      obligacionesFijas,
      totalObligacionesMes,
      activosFijosCapex,
      otrosEgresos,
      utilidadMes,
      margenOperativoPct,
      utilidadProyectadaCierre,
      margenProyectadoPct,
      saldoAcumulado,
      reservaObligaciones,
      capacidadSueldoSeguro,
      numSocios,
      capacidadSueldoPorSocio,
      estadoDiagnostico,
    })
  })

  // 6. Seleccionar el mes activo
  const targetKey = mesKeySeleccionado && monthMap[mesKeySeleccionado]
    ? mesKeySeleccionado
    : (monthMap[currentKey] ? currentKey : sortedKeys[sortedKeys.length - 1])

  const mesSeleccionado = mesesCalculados.find(m => m.mesKey === targetKey) || mesesCalculados[mesesCalculados.length - 1]

  // 7. Métricas consolidadas
  const totalHistoricoVentas = Number(mesesCalculados.reduce((acc, m) => acc + m.ventasCobradas, 0).toFixed(2))
  const totalHistoricoInyeccion = Number(mesesCalculados.reduce((acc, m) => acc + m.inyeccionCapital, 0).toFixed(2))
  const totalHistoricoCompras = Number(mesesCalculados.reduce((acc, m) => acc + m.comprasDirectas, 0).toFixed(2))
  const totalHistoricoPersonal = Number(mesesCalculados.reduce((acc, m) => acc + m.gastosPersonal, 0).toFixed(2))
  const totalHistoricoOperativos = Number(mesesCalculados.reduce((acc, m) => acc + m.gastosOperativos, 0).toFixed(2))
  const totalHistoricoBlindados = Number(mesesCalculados.reduce((acc, m) => acc + m.totalBlindadosMes, 0).toFixed(2))
  const totalHistoricoObligaciones = Number(mesesCalculados.reduce((acc, m) => acc + m.obligacionesFijas, 0).toFixed(2))
  const totalHistoricoUtilidad = Number(mesesCalculados.reduce((acc, m) => acc + m.utilidadMes, 0).toFixed(2))

  const promedioUtilidadMensual = mesesCalculados.length > 0
    ? Number((totalHistoricoUtilidad / mesesCalculados.length).toFixed(2))
    : 0

  const reservaRecomendadaSugerida = Number(promedioObligaciones.toFixed(2))
  const saldoCajaActual = mesSeleccionado.saldoAcumulado
  const capacidadSueldoActual = mesSeleccionado.capacidadSueldoSeguro
  const numSocios = 2

  return {
    negocio,
    mesSeleccionado,
    meses: mesesCalculados,
    totalHistoricoVentas,
    totalHistoricoInyeccion,
    totalHistoricoCompras,
    totalHistoricoPersonal,
    totalHistoricoOperativos,
    totalHistoricoBlindados,
    totalHistoricoObligaciones,
    totalHistoricoUtilidad,
    promedioUtilidadMensual,
    promedioObligacionesMensual: Number(promedioObligaciones.toFixed(2)),
    reservaRecomendadaSugerida,
    saldoCajaActual,
    numSocios,
    capacidadSueldoActual,
    capacidadSueldoPorSocioActual: Number((capacidadSueldoActual / numSocios).toFixed(2)),
  }
}
