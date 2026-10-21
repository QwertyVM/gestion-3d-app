import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { isDateInRange } from '@/lib/date-utils'
import { getDatosPresupuestoTranquilidad, ItemPartidaPlan } from '@/actions/presupuesto'

export interface FinancialSummaryDTO {
  totalCobradoVentas: number
  totalIngresosDirectos: number
  totalIngresosCobrados: number
  totalEgresos: number
  cuentasPorCobrar: number
  saldoNetoCaja: number
  totalBlindado: number
  gastoLibreHoy: number
  totalPedidos: number
  totalFlexible: number
  totalPlanificado: number
  ratioBlindaje: number
}

export interface CashFlowTimelinePoint {
  date: string
  ingresos: number
  egresos: number
  flujoNeto: number
  saldoAcumulado: number
}

export class FinancialEngineService {
  /**
   * Facade para calcular la salud financiera y flujo de caja consolidado
   * unificando el motor de cálculo en servidor.
   */
  public static async getSummary(
    negocioParam?: TipoNegocio,
    from?: string | null,
    to?: string | null
  ): Promise<FinancialSummaryDTO> {
    const targetNegocio = negocioParam || await getActiveNegocioServer()

    const [pedidos, inversiones, ingresosDirectos, datosPresupuesto] = await Promise.all([
      prisma.pedido.findMany({
        where: { negocio: targetNegocio },
        include: { pagos: true }
      }),
      prisma.inversion.findMany({
        where: { negocio: targetNegocio }
      }),
      prisma.ingreso.findMany({
        where: { negocio: targetNegocio }
      }),
      getDatosPresupuestoTranquilidad(targetNegocio)
    ])

    // Filtrar por fechas si aplican
    const toDateStr = (d: any) => d instanceof Date ? d.toISOString() : String(d)
    const filteredPedidos = pedidos.filter(p => isDateInRange(toDateStr(p.fecha), from, to))
    const filteredInversiones = inversiones.filter(inv => isDateInRange(toDateStr(inv.createdAt), from, to))
    const filteredIngresosDirectos = ingresosDirectos.filter(i => isDateInRange(toDateStr(i.fecha), from, to))

    // 1. Ingresos por ventas de catálogo (cobranzas efectivas de abonos)
    const totalCobradoVentas = Number(filteredPedidos.reduce((sum, p) => {
      if (p.pagos && p.pagos.length > 0) {
        const sumPagos = p.pagos
          .filter(pg => isDateInRange(toDateStr(pg.fecha), from, to))
          .reduce((acc, pg) => acc + Number(pg.monto), 0)
        return sum + sumPagos
      }
      return sum + Number(p.montoPagado || 0)
    }, 0).toFixed(2))

    // 2. Ingresos directos / aportes
    const totalIngresosDirectos = Number(filteredIngresosDirectos.reduce((sum, i) => sum + Number(i.monto), 0).toFixed(2))
    const totalIngresosCobrados = Number((totalCobradoVentas + totalIngresosDirectos).toFixed(2))

    // 3. Egresos
    const totalEgresos = Number(filteredInversiones.reduce((sum, inv) => sum + Number(inv.costoTotal), 0).toFixed(2))

    // 4. Cuentas por cobrar
    const cuentasPorCobrar = Number(filteredPedidos.reduce((sum, p) => sum + Number(p.saldoPendiente || 0), 0).toFixed(2))

    // 5. Saldo neto
    const saldoNetoCaja = Number((totalIngresosCobrados - totalEgresos).toFixed(2))

    // 6. Fondos blindados
    const partidasBlindadas = (datosPresupuesto?.partidasPlan || []).filter((p: ItemPartidaPlan) => p.tipo === 'Blindado')
    const totalBlindado = datosPresupuesto?.totalBlindadoPendiente ?? Number(partidasBlindadas.reduce((sum: number, p: ItemPartidaPlan) => sum + (p.presupuesto || p.montoAgostoReal || 0), 0).toFixed(2))

    // 7. Gasto libre
    const gastoLibreHoy = datosPresupuesto?.gastoDisponibleLibre ?? Number(Math.max(0, saldoNetoCaja - totalBlindado).toFixed(2))

    // 8. Totales presupuestarios
    const totalFlexible = Number((datosPresupuesto?.partidasPlan || [])
      .filter((p: ItemPartidaPlan) => p.tipo === 'Flexible')
      .reduce((sum: number, p: ItemPartidaPlan) => sum + (p.presupuesto || 0), 0).toFixed(2))
    const totalPlanificado = Number((totalBlindado + totalFlexible).toFixed(2))
    const ratioBlindaje = totalPlanificado > 0 ? Number(((totalBlindado / totalPlanificado) * 100).toFixed(1)) : 0

    return {
      totalCobradoVentas,
      totalIngresosDirectos,
      totalIngresosCobrados,
      totalEgresos,
      cuentasPorCobrar,
      saldoNetoCaja,
      totalBlindado,
      gastoLibreHoy,
      totalPedidos: filteredPedidos.length,
      totalFlexible,
      totalPlanificado,
      ratioBlindaje
    }
  }
}
