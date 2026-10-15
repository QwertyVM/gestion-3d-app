'use client'

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Wallet,
  Lock,
  Sparkles,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShoppingBag,
  Truck,
  Calendar,
  Landmark,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Package,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react'
import {
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { toast } from 'sonner'
import { formatDate, cn } from '@/lib/utils'
import { DateRange, getDefaultDateRange, isDateInRange, MESES_ES, formatToYMD } from '@/lib/date-utils'
import { useBusiness } from '@/context/BusinessContext'
import {
  DatosPresupuestoTranquilidad,
  actualizarPresupuestoPartida,
  guardarPartidaPlan,
  guardarPartidaPresupuesto,
  conmutarTipoPartidaPresupuesto,
  togglePagadoPartidaPresupuesto,
  eliminarPartidaPresupuesto,
  guardarPlanPresupuestoCompleto,
  restablecerPlanBaseDB,
  CuotaDetalle,
  ItemHistorialPago
} from '@/actions/presupuesto'
import { pagarCuotaPrestamo } from '@/actions/inversiones'
import { CashFlowAnalyticsCard } from './CashFlowAnalyticsCard'
import { CompromisosBlindadosSection } from './CompromisosBlindadosSection'
import { KpiExplainerModal } from '@/components/ui/KpiExplainerModal'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import type { BlindadoFormData } from './AddBlindadoModal'

// =========================================================================
// INTERFACES Y TIPOS
// =========================================================================

export interface EgresoItem {
  id: string
  persona: string
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL' | 'MERCADERIA' | 'FINANCIERO'
  subcategoria?: string | null
  itemConcepto: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio?: number | null
  costoTotal: number
  costoPorGramo?: number | null
  createdAt: string
}

export interface PagoVentaItem {
  id: string
  ventaId: string
  fecha: string
  monto: number
  metodoPago: string
  tipo: string
  notas?: string | null
}

export interface VentaItem {
  id: string
  codigo?: string
  fecha: string
  cliente: string
  cantidad: number
  precioUnitario: number
  total: number
  montoPagado: number
  saldoPendiente: number
  estado: string
  producto: {
    nombreModelo: string
    lineaCategoria: string
  }
  pagos?: PagoVentaItem[]
}

export interface IngresoDirectoItem {
  id: string
  fecha: string
  cliente: string
  concepto: string
  categoria: string
  monto: number
  metodoPago?: string
  notas?: string
}

export interface MonthlyMovimiento {
  id: string
  fecha: string
  tipo: string
  categoria: string
  concepto: string
  entidad: string
  monto: number
  esIngreso: boolean
  esActivoFijo?: boolean
  detalle?: string
}

export type TipoGasto = 'Blindado' | 'Flexible'
export type CategoriaGastoPlan = 'INSUMOS' | 'BLINDADO' | 'OPERATIVO' | 'CAPEX' | 'MARKETING' | 'OTROS'

export interface PartidaPresupuesto {
  id: string
  categoria: CategoriaGastoPlan
  concepto: string
  subconcepto?: string
  montoAgostoReal: number
  montoSeptiembreReal: number
  presupuesto: number
  tipo: TipoGasto
  pagado: boolean
  monto?: number
  esBlindado?: boolean
  inversionId?: string | null
  montoPagadoReal?: number | null
  fechaPago?: string | null
  vencimiento?: string
  cuotaSeptiembre?: CuotaDetalle | null
  cuotaOctubre?: CuotaDetalle | null
  historialPagos?: ItemHistorialPago[]
  totalPagos?: number
}

export type ItemGastoPlan = PartidaPresupuesto

export interface CashFlowHubViewProps {
  egresos: EgresoItem[]
  ventas: VentaItem[]
  ingresosDirectos?: IngresoDirectoItem[]
  datosPresupuesto?: DatosPresupuestoTranquilidad
}

const ITEMS_PER_PAGE = 10

const CATEGORIA_CONFIG: Record<CategoriaGastoPlan, { label: string; badgeColor: string }> = {
  INSUMOS: {
    label: 'Insumos & Material',
    badgeColor: 'bg-accent text-accent-foreground border-border'
  },
  BLINDADO: {
    label: 'Deuda / Préstamo',
    badgeColor: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
  },
  OPERATIVO: {
    label: 'Fijo / Taller',
    badgeColor: 'bg-secondary text-foreground border-border'
  },
  CAPEX: {
    label: 'Reserva Máquinas',
    badgeColor: 'bg-accent/70 text-accent-foreground border-border'
  },
  MARKETING: {
    label: 'Pauta & Publicidad',
    badgeColor: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
  },
  OTROS: {
    label: 'Otros Gastos',
    badgeColor: 'bg-secondary text-muted-foreground border-border'
  }
}

// Tooltip Flotante Enriquecido para Gráfica de Evolución (Nova Design System)
function CustomCashFlowTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresos || 0)
    const egresos = Number(data.egresos || 0)
    const saldo = Number(data.saldoAcumulado || 0)

    return (
      <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs space-y-1 min-w-[200px]">
        <div className="font-semibold text-foreground flex items-center gap-1.5 border-b border-border/70 pb-1 mb-1">
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{data.fechaCompleta || label}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
          <span>Entradas del día:</span>
          <span className="font-mono font-bold">
            +S/ {ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center text-destructive font-medium">
          <span>Salidas del día:</span>
          <span className="font-mono font-bold">
            -S/ {egresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-border/70">
          <span className="font-bold text-foreground">Saldo al cierre:</span>
          <span className="font-mono font-extrabold text-foreground">
            S/ {saldo.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    )
  }
  return null
}

function getPartidasFallback(): PartidaPresupuesto[] {
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
      pagado: false,
      monto: 288.00,
      esBlindado: false
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
      pagado: false,
      monto: 68.00,
      esBlindado: false
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
      pagado: false,
      monto: 388.68,
      esBlindado: true
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
      pagado: false,
      monto: 878.00,
      esBlindado: false
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
      pagado: false,
      monto: 111.00,
      esBlindado: true
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
      pagado: false,
      monto: 100.00,
      esBlindado: false
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
      pagado: false,
      monto: 150.00,
      esBlindado: false
    }
  ]
}

// =========================================================================
// COMPONENTE PRINCIPAL: CASHFLOW HUB VIEW
// =========================================================================

export function CashFlowHubView({
  egresos,
  ventas,
  ingresosDirectos = [],
  datosPresupuesto
}: CashFlowHubViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isBG } = useBusiness()

  const formatCurrency = (val: number) =>
    `S/\u00A0${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // NAVEGACIÓN Y PERSISTENCIA DE PESTAÑAS (URL SEARCH PARAM)
  // =========================================================================
  const vistaParam = searchParams.get('vista')
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(() => {
    return vistaParam === 'blindaje'
  })

  useEffect(() => {
    if (searchParams.get('vista') === 'blindaje' || searchParams.get('tab') === 'blindaje') {
      setIsPlanModalOpen(true)
    }
  }, [searchParams])

  // =========================================================================
  // ESTADO DE PARTIDAS PRESUPUESTARIAS (EN MEMORIA + DB)
  // =========================================================================
  const [partidas, setPartidas] = useState<PartidaPresupuesto[]>(() => {
    if (datosPresupuesto?.partidasPlan && datosPresupuesto.partidasPlan.length > 0) {
      return datosPresupuesto.partidasPlan.map(p => ({
        ...p,
        monto: Number(p.presupuesto || 0),
        esBlindado: p.tipo === 'Blindado',
        inversionId: p.inversionId,
        montoPagadoReal: p.montoPagadoReal,
        fechaPago: p.fechaPago,
        vencimiento: p.vencimiento,
        cuotaSeptiembre: p.cuotaSeptiembre,
        cuotaOctubre: p.cuotaOctubre,
        historialPagos: p.historialPagos,
        totalPagos: p.totalPagos
      }))
    }
    return getPartidasFallback()
  })

  useEffect(() => {
    if (datosPresupuesto?.partidasPlan && datosPresupuesto.partidasPlan.length > 0) {
      setPartidas(datosPresupuesto.partidasPlan.map(p => ({
        ...p,
        monto: Number(p.presupuesto || 0),
        esBlindado: p.tipo === 'Blindado',
        inversionId: p.inversionId,
        montoPagadoReal: p.montoPagadoReal,
        fechaPago: p.fechaPago,
        vencimiento: p.vencimiento,
        cuotaSeptiembre: p.cuotaSeptiembre,
        cuotaOctubre: p.cuotaOctubre,
        historialPagos: p.historialPagos,
        totalPagos: p.totalPagos
      })))
    }
  }, [datosPresupuesto?.partidasPlan])

  // =========================================================================
  // NIVEL 1: MOTOR REACTIVO UNIFICADO DE LIQUIDEZ Y BLINDAJE (USEMEMO)
  // =========================================================================
  // 1. Saldo contable real proveniente de transacciones acumuladas
  const totalCobradoVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventas])

  const totalIngresosDirectos = useMemo(() => {
    return ingresosDirectos.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [ingresosDirectos])

  const totalIngresosCobrados = useMemo(() => {
    return totalCobradoVentas + totalIngresosDirectos
  }, [totalCobradoVentas, totalIngresosDirectos])

  const totalEgresos = useMemo(() => {
    return egresos.reduce((acc, e) => acc + (e.costoTotal || 0), 0)
  }, [egresos])

  const cuentasPorCobrar = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventas])

  const saldoNetoCaja = useMemo(() => {
    return totalIngresosCobrados - totalEgresos
  }, [totalIngresosCobrados, totalEgresos])

  // =========================================================================
  // CONTROL DE AMORTIZACIÓN DEL PRÉSTAMO BCP & DATOS BASE
  // =========================================================================
  const [isPayingCuota, setIsPayingCuota] = useState(false)
  const cuotaPrestamoItem = partidas.find(i => i.id === 'gasto-cuota-prestamo')
  const tienePrestamoBCP = true
  const estaCuotaPagada = Boolean(datosPresupuesto?.prestamoInfo?.pagadaEnPeriodo || cuotaPrestamoItem?.pagado)
  const siguienteCuotaNum = datosPresupuesto?.prestamoInfo?.cuotaActual || (estaCuotaPagada ? 2 : 1)
  const cuotaMontoValor = datosPresupuesto?.prestamoInfo?.cuotaMensual || 388.68
  const cuotasPagadas = datosPresupuesto?.prestamoInfo?.cuotasPagadas || (estaCuotaPagada ? 1 : 0)
  const cuotasTotales = datosPresupuesto?.prestamoInfo?.totalCuotas || 24
  const saldoCapitalRestante = datosPresupuesto?.prestamoInfo?.saldoCapitalRestante || 7631.12
  const tasaTea = '8.70%'

  const bcpData = useMemo(() => ({
    cuotaActual: siguienteCuotaNum,
    totalCuotas: cuotasTotales,
    montoCuota: cuotaMontoValor,
    capitalRestante: saldoCapitalRestante,
    pagada: estaCuotaPagada,
    cuotaSeptiembre: datosPresupuesto?.prestamoInfo?.cuotaSeptiembre,
    cuotaOctubre: datosPresupuesto?.prestamoInfo?.cuotaOctubre,
    historialPagos: datosPresupuesto?.prestamoInfo?.historialPagos
  }), [siguienteCuotaNum, cuotasTotales, cuotaMontoValor, saldoCapitalRestante, estaCuotaPagada, datosPresupuesto?.prestamoInfo])

  // Partidas blindadas adicionales (Luz, Internet, Reservas)
  const partidasBlindadas = useMemo(() => {
    return partidas.filter(p =>
      (p.tipo === 'Blindado' || p.esBlindado) &&
      p.id !== 'gasto-cuota-prestamo' &&
      !p.concepto.toLowerCase().includes('préstamo bcp') &&
      !p.concepto.toLowerCase().includes('cuota mensual de préstamo')
    )
  }, [partidas])

  // 2. Motor reactivo de total blindado (Préstamo BCP pendiente + partidas blindadas)
  const totalBlindado = useMemo(() => {
    const bcpMonto = tienePrestamoBCP && !estaCuotaPagada ? bcpData.montoCuota : 0
    const sumaPartidas = partidasBlindadas
      .filter(p => !p.pagado)
      .reduce((acc, p) => acc + Number(p.monto ?? p.presupuesto ?? 0), 0)
    return bcpMonto + sumaPartidas
  }, [tienePrestamoBCP, estaCuotaPagada, bcpData.montoCuota, partidasBlindadas])

  const totalBlindadoPendiente = totalBlindado

  // 3. Ecuación de liquidez pura en tiempo real
  const gastoLibreHoy = useMemo(() => {
    return Math.max(0, saldoNetoCaja - totalBlindado)
  }, [saldoNetoCaja, totalBlindado])

  // Desglose dinámico de fondos blindados para la tarjeta de KPI
  const desgloseBlindados = useMemo(() => {
    const items: string[] = []
    if (tienePrestamoBCP && !estaCuotaPagada) {
      items.push(`Cuota BCP (${formatCurrency(bcpData.montoCuota)})`)
    }
    partidasBlindadas
      .filter(p => !p.pagado)
      .forEach(p => {
        items.push(`${p.concepto} (${formatCurrency(Number(p.monto ?? p.presupuesto ?? 0))})`)
      })
    if (items.length === 0) return 'Sin compromisos blindados pendientes'
    return `${items.join(' + ')} comprometidos`
  }, [tienePrestamoBCP, estaCuotaPagada, bcpData.montoCuota, partidasBlindadas])

  // Handlers para agregar, editar y eliminar partidas blindadas con persistencia inmediata
  const handleSavePartidaBlindada = async (formData: BlindadoFormData) => {
    if (formData.id) {
      const targetId = formData.id
      const updatedPartida: PartidaPresupuesto = {
        id: targetId,
        concepto: formData.concepto,
        subconcepto: formData.subconcepto,
        presupuesto: formData.monto,
        monto: formData.monto,
        categoria: formData.categoria as CategoriaGastoPlan,
        tipo: 'Blindado',
        esBlindado: true,
        pagado: false,
        montoAgostoReal: 0,
        montoSeptiembreReal: 0
      }

      setPartidas(prev => prev.map(p => p.id === targetId ? { ...p, ...updatedPartida } : p))
      toast.success(`Compromiso "${formData.concepto}" actualizado`)

      try {
        await guardarPartidaPresupuesto({
          id: targetId,
          concepto: formData.concepto,
          subconcepto: formData.subconcepto,
          presupuesto: formData.monto,
          categoria: formData.categoria,
          tipo: 'Blindado',
          pagado: false,
          negocio: isBG ? 'BG' : '3D'
        })
      } catch (err) {
        console.error('Error al guardar partida blindada en BD:', err)
      }
    } else {
      const newId = `blindado-${Date.now()}`
      const nuevaPartida: PartidaPresupuesto = {
        id: newId,
        concepto: formData.concepto,
        subconcepto: formData.subconcepto,
        presupuesto: formData.monto,
        monto: formData.monto,
        categoria: formData.categoria as CategoriaGastoPlan,
        tipo: 'Blindado',
        esBlindado: true,
        pagado: false,
        montoAgostoReal: 0,
        montoSeptiembreReal: 0
      }

      setPartidas(prev => [nuevaPartida, ...prev])
      toast.success(`Compromiso "${formData.concepto}" blindado exitosamente`)

      try {
        await guardarPartidaPresupuesto({
          id: newId,
          concepto: formData.concepto,
          subconcepto: formData.subconcepto,
          presupuesto: formData.monto,
          categoria: formData.categoria,
          tipo: 'Blindado',
          pagado: false,
          negocio: isBG ? 'BG' : '3D'
        })
      } catch (err) {
        console.error('Error al guardar nueva partida blindada en BD:', err)
      }
    }
  }

  const handleDeletePartidaBlindada = async (id: string) => {
    setPartidas(prev => prev.filter(p => p.id !== id))
    toast.success('Compromiso eliminado. Fondos liberados.')
    try {
      await eliminarPartidaPresupuesto(id)
    } catch (err) {
      console.error('Error al eliminar partida blindada de BD:', err)
    }
  }

  // =========================================================================
  // CONTROL MAESTRO DE PERÍODO UNIFICADO (MASTER DATE CONTROLLER)
  // =========================================================================
  type PeriodoPreset = 'mes' | 'mes_anterior' | 'trimestre' | 'año' | 'historico'

  const [periodo, setPeriodo] = useState<PeriodoPreset>('mes')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS'>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)
  const [showChart, setShowChart] = useState(true)
  const [selectedKpiExplainer, setSelectedKpiExplainer] = useState<string | null>(null)

  // Handlers para el Selector de Período Maestro
  const handleCambiarPeriodo = (nuevoPeriodo: PeriodoPreset) => {
    setPeriodo(nuevoPeriodo)
    const now = new Date()
    if (nuevoPeriodo === 'mes') {
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    } else if (nuevoPeriodo === 'mes_anterior') {
      setCurrentDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    } else if (nuevoPeriodo === 'trimestre') {
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    } else if (nuevoPeriodo === 'año') {
      setCurrentDate(new Date(now.getFullYear(), 0, 1))
    } else {
      setCurrentDate(now)
    }
    setCurrentPage(1)
  }

  const handleRetrocederPeriodo = () => {
    setCurrentDate(prev => {
      if (periodo === 'mes' || periodo === 'mes_anterior') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      }
      if (periodo === 'trimestre') {
        return new Date(prev.getFullYear(), prev.getMonth() - 3, 1)
      }
      if (periodo === 'año') {
        return new Date(prev.getFullYear() - 1, prev.getMonth(), 1)
      }
      return prev
    })
    setCurrentPage(1)
  }

  const handleAvanzarPeriodo = () => {
    setCurrentDate(prev => {
      if (periodo === 'mes' || periodo === 'mes_anterior') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      }
      if (periodo === 'trimestre') {
        return new Date(prev.getFullYear(), prev.getMonth() + 3, 1)
      }
      if (periodo === 'año') {
        return new Date(prev.getFullYear() + 1, prev.getMonth(), 1)
      }
      return prev
    })
    setCurrentPage(1)
  }

  // Label amigable para el período activo en el paginador
  const labelPeriodoActivo = useMemo(() => {
    if (periodo === 'historico') {
      return 'Histórico Completo'
    }
    if (periodo === 'mes' || periodo === 'mes_anterior') {
      const mesNombre = MESES_ES[currentDate.getMonth()] || ''
      return `${mesNombre} ${currentDate.getFullYear()}`
    }
    if (periodo === 'trimestre') {
      const q = Math.floor(currentDate.getMonth() / 3) + 1
      const qNames = ['Ene - Mar', 'Abr - Jun', 'Jul - Set', 'Oct - Dic']
      return `T${q} ${currentDate.getFullYear()} (${qNames[q - 1]})`
    }
    if (periodo === 'año') {
      return `Año ${currentDate.getFullYear()}`
    }
    return 'Período Activo'
  }, [periodo, currentDate])

  // Rango de fechas derivado reactivamente
  const dateRange = useMemo<DateRange>(() => {
    if (periodo === 'historico') {
      return { from: null, to: null, preset: 'TODO' }
    }
    if (periodo === 'mes' || periodo === 'mes_anterior') {
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const firstDay = new Date(y, m, 1)
      const lastDay = new Date(y, m + 1, 0)
      return {
        from: formatToYMD(firstDay),
        to: formatToYMD(lastDay),
        preset: periodo === 'mes' ? 'ESTE_MES' : 'MES_ANTERIOR'
      }
    }
    if (periodo === 'trimestre') {
      const y = currentDate.getFullYear()
      const q = Math.floor(currentDate.getMonth() / 3)
      const firstDay = new Date(y, q * 3, 1)
      const lastDay = new Date(y, q * 3 + 3, 0)
      return {
        from: formatToYMD(firstDay),
        to: formatToYMD(lastDay),
        preset: 'ULTIMOS_3_MESES'
      }
    }
    if (periodo === 'año') {
      const y = currentDate.getFullYear()
      return {
        from: `${y}-01-01`,
        to: `${y}-12-31`,
        preset: 'ESTE_ANIO'
      }
    }
    return { from: null, to: null, preset: 'TODO' }
  }, [periodo, currentDate])

  const { minFechaData, maxFechaData } = useMemo(() => {
    let min: string | undefined
    let max: string | undefined
    const checkDate = (d?: string | Date | null) => {
      if (!d) return
      const s = typeof d === 'string' ? d : d.toISOString()
      if (!min || s < min) min = s
      if (!max || s > max) max = s
    }
    ventas?.forEach((v: any) => checkDate(v.fecha))
    ingresosDirectos?.forEach((d: any) => checkDate(d.fecha))
    egresos?.forEach((e: any) => checkDate(e.createdAt))
    return { minFechaData: min, maxFechaData: max }
  }, [ventas, ingresosDirectos, egresos])

  // Sincronización en cascada: Colecciones filtradas exclusivamente para el lapso de fechas activo
  const ventasEnRango = useMemo(() => {
    return ventas.map(v => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        const pagosEnRango = v.pagos.filter(p => isDateInRange(p.fecha, dateRange.from, dateRange.to))
        if (pagosEnRango.length === 0) return null
        const montoPagadoEnRango = pagosEnRango.reduce((acc, p) => acc + (p.monto || 0), 0)
        return {
          ...v,
          pagos: pagosEnRango,
          montoPagado: montoPagadoEnRango
        }
      } else {
        if (isDateInRange(v.fecha, dateRange.from, dateRange.to)) {
          return v
        }
        return null
      }
    }).filter(Boolean) as VentaItem[]
  }, [ventas, dateRange])

  const ingresosDirectosEnRango = useMemo(() => {
    return ingresosDirectos.filter(i => isDateInRange(i.fecha, dateRange.from, dateRange.to))
  }, [ingresosDirectos, dateRange])

  const egresosEnRango = useMemo(() => {
    return egresos.filter(e => isDateInRange(e.createdAt, dateRange.from, dateRange.to))
  }, [egresos, dateRange])

  // Datos para la gráfica de evolución temporal con agrupación adaptativa y escala Y dinámica
  const chartTimelineData = useMemo(() => {
    const monthsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
    const dayMap = new Map<string, { ingresos: number; egresos: number }>()

    const addMovement = (dateStr: string | null | undefined, ingresos: number, egresos: number) => {
      if (!dateStr) return
      const day = dateStr.split('T')[0]
      if (!day || day.length < 10) return
      const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
      curr.ingresos += ingresos
      curr.egresos += egresos
      dayMap.set(day, curr)
    }

    ventas.forEach(v => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach(p => {
          if (p.monto > 0) addMovement(p.fecha, p.monto, 0)
        })
      } else if (v.montoPagado > 0) {
        addMovement(v.fecha, v.montoPagado, 0)
      }
    })

    ingresosDirectos.forEach(i => {
      if (i.monto > 0) addMovement(i.fecha, i.monto, 0)
    })

    egresos.forEach(e => {
      if (e.costoTotal > 0) addMovement(e.createdAt, 0, e.costoTotal)
    })

    // CASO A: 'mes' o 'mes_anterior' -> Agrupación por DÍA del mes con auto-ajuste de escala Y
    if (periodo === 'mes' || periodo === 'mes_anterior') {
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const mesAbrev = monthsShort[m]
      let runningBalance = 0
      const points = []

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dayData = dayMap.get(dayStr) || { ingresos: 0, egresos: 0 }
        const neto = dayData.ingresos - dayData.egresos
        runningBalance += neto

        points.push({
          rawDate: dayStr,
          fechaLabel: `${d} ${mesAbrev}`,
          fechaCompleta: `${d} de ${MESES_ES[m]} de ${y}`,
          dayNum: d,
          ingresos: Number(dayData.ingresos.toFixed(2)),
          egresos: Number(dayData.egresos.toFixed(2)),
          neto: Number(neto.toFixed(2)),
          saldoAcumulado: Number(runningBalance.toFixed(2)),
        })
      }
      return points
    }

    // CASO B: 'trimestre' -> Agrupación por SEMANAS
    if (periodo === 'trimestre') {
      const y = currentDate.getFullYear()
      const q = Math.floor(currentDate.getMonth() / 3)
      const qStart = new Date(y, q * 3, 1)
      const qEnd = new Date(y, q * 3 + 3, 0)

      let runningBalance = 0
      const points = []
      let weekNum = 1
      let weekStart = new Date(qStart)

      while (weekStart <= qEnd) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        if (weekEnd > qEnd) {
          weekEnd.setTime(qEnd.getTime())
        }

        const startYMD = formatToYMD(weekStart)
        const endYMD = formatToYMD(weekEnd)

        let wIngresos = 0
        let wEgresos = 0

        dayMap.forEach((val, dayKey) => {
          if (dayKey >= startYMD && dayKey <= endYMD) {
            wIngresos += val.ingresos
            wEgresos += val.egresos
          }
        })

        const neto = wIngresos - wEgresos
        runningBalance += neto

        const sDay = weekStart.getDate()
        const sMon = monthsShort[weekStart.getMonth()]
        const eDay = weekEnd.getDate()
        const eMon = monthsShort[weekEnd.getMonth()]

        points.push({
          rawDate: startYMD,
          fechaLabel: `Sem ${weekNum}`,
          fechaCompleta: `Semana ${weekNum} (${sDay} ${sMon} - ${eDay} ${eMon} ${weekEnd.getFullYear()})`,
          ingresos: Number(wIngresos.toFixed(2)),
          egresos: Number(wEgresos.toFixed(2)),
          neto: Number(neto.toFixed(2)),
          saldoAcumulado: Number(runningBalance.toFixed(2)),
        })

        weekNum++
        weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() + 1)
      }
      return points
    }

    // CASO C: 'año' -> Agrupación por MESES del año
    if (periodo === 'año') {
      const y = currentDate.getFullYear()
      let runningBalance = 0
      const points = []

      for (let m = 0; m < 12; m++) {
        const mStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
        const lastD = new Date(y, m + 1, 0).getDate()
        const mEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`

        let mIngresos = 0
        let mEgresos = 0

        dayMap.forEach((val, dayKey) => {
          if (dayKey >= mStart && dayKey <= mEnd) {
            mIngresos += val.ingresos
            mEgresos += val.egresos
          }
        })

        const neto = mIngresos - mEgresos
        runningBalance += neto

        points.push({
          rawDate: mStart,
          fechaLabel: monthsShort[m],
          fechaCompleta: `${MESES_ES[m]} ${y}`,
          ingresos: Number(mIngresos.toFixed(2)),
          egresos: Number(mEgresos.toFixed(2)),
          neto: Number(neto.toFixed(2)),
          saldoAcumulado: Number(runningBalance.toFixed(2)),
        })
      }
      return points
    }

    // CASO D: 'historico' -> Agrupación por MESES de toda la historia
    const allDays = Array.from(dayMap.keys()).sort()
    if (allDays.length === 0) {
      const now = new Date()
      return [{
        rawDate: formatToYMD(now),
        fechaLabel: monthsShort[now.getMonth()],
        fechaCompleta: `${MESES_ES[now.getMonth()]} ${now.getFullYear()}`,
        ingresos: 0,
        egresos: 0,
        neto: 0,
        saldoAcumulado: 0
      }]
    }

    const firstDay = allDays[0]
    const lastDay = allDays[allDays.length - 1]
    const [startYear, startMonth] = firstDay.split('-').map(Number)
    const [endYear, endMonth] = lastDay.split('-').map(Number)

    let runningBalance = 0
    const points = []
    let curY = startYear
    let curM = startMonth

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const mIndex = curM - 1
      const mStart = `${curY}-${String(curM).padStart(2, '0')}-01`
      const lastD = new Date(curY, curM, 0).getDate()
      const mEnd = `${curY}-${String(curM).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`

      let mIngresos = 0
      let mEgresos = 0

      dayMap.forEach((val, dayKey) => {
        if (dayKey >= mStart && dayKey <= mEnd) {
          mIngresos += val.ingresos
          mEgresos += val.egresos
        }
      })

      const neto = mIngresos - mEgresos
      runningBalance += neto

      const isMultiYear = startYear !== endYear
      const label = isMultiYear ? `${monthsShort[mIndex]} ${String(curY).slice(2)}` : monthsShort[mIndex]

      points.push({
        rawDate: mStart,
        fechaLabel: label,
        fechaCompleta: `${MESES_ES[mIndex]} ${curY}`,
        ingresos: Number(mIngresos.toFixed(2)),
        egresos: Number(mEgresos.toFixed(2)),
        neto: Number(neto.toFixed(2)),
        saldoAcumulado: Number(runningBalance.toFixed(2)),
      })

      curM++
      if (curM > 12) {
        curM = 1
        curY++
      }
    }
    return points
  }, [ventas, ingresosDirectos, egresos, periodo, currentDate])

  // Granularidad adaptativa del eje X
  const xAxisInterval = useMemo(() => {
    if (periodo === 'mes' || periodo === 'mes_anterior') {
      return (index: number) => {
        const d = index + 1
        return d === 1 || d % 5 === 0
      }
    }
    if (periodo === 'trimestre') {
      return (index: number) => index % 2 === 0
    }
    return 0
  }, [periodo])

  // Movimientos unificados ordenados cronológicamente
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string
      fecha: string
      tipo: 'INGRESO_VENTA' | 'INGRESO_DIRECTO' | 'EGRESO_MAQUINARIA' | 'EGRESO_INSUMO' | 'EGRESO_SERVICIO'
      concepto: string
      entidad: string
      monto: number
      detalle?: string
      isPositive: boolean
    }> = []

    ventas.forEach((v, vIdx) => {
      const rawCodigo = v.codigo || (v as any).codigo || `PED-${String(ventas.length - vIdx).padStart(3, '0')}`
      const codigoClean = rawCodigo.replace(/^#/, '').trim()
      const pedidoTag = `#${codigoClean}`

      // Sanitizar el nombre del modelo o descripción evitando redundancias como "PED-033: PED-033:" o "PED-033: "
      const rawNombre = (v.producto?.nombreModelo || (v as any).nombreProductoSnapshot || '').trim()
      let cleanNombre = rawNombre
      let prevNombre = ''
      while (cleanNombre !== prevNombre) {
        prevNombre = cleanNombre
        cleanNombre = cleanNombre
          .replace(new RegExp(`^#?${codigoClean}:?\\s*`, 'i'), '')
          .replace(/^#?PED-\d+:?\\s*/i, '')
          .trim()
      }

      const baseDesc = cleanNombre || 'Modelo 3D'
      const modelDesc = (baseDesc.includes('(') || baseDesc.includes('modelos') || baseDesc.includes('pzs'))
        ? baseDesc
        : (v.cantidad > 1 ? `${baseDesc} (x${v.cantidad})` : baseDesc)

      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p, idx) => {
          if (p.monto > 0) {
            const isSingleFull = ((v.pagos?.length || 0) === 1 && v.saldoPendiente <= 0) || p.tipo === 'PAGO_TOTAL'
            const numAbono = idx + 1
            const titulo = isSingleFull
              ? `Pago Total • Pedido ${pedidoTag}`
              : `Abono #${numAbono} • Pedido ${pedidoTag}`

            const metodo = p.metodoPago || 'Yape'
            let notaExtra = ''
            if (p.notas) {
              const cleanNota = p.notas
                .replace(new RegExp(`^Abono inicial #?${codigoClean}`, 'i'), '')
                .replace(new RegExp(`^Pago inicial #?${codigoClean}`, 'i'), '')
                .trim()
              if (cleanNota && !cleanNota.toLowerCase().includes(codigoClean.toLowerCase())) {
                notaExtra = ` • ${cleanNota}`
              }
            }
            const resto = v.saldoPendiente > 0 ? ` • Resta: ${formatCurrency(v.saldoPendiente)}` : ''
            const detalle = `${modelDesc} • ${metodo}${notaExtra}${resto}`

            movements.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              fecha: p.fecha,
              tipo: 'INGRESO_VENTA',
              concepto: titulo,
              entidad: v.cliente,
              monto: p.monto,
              detalle,
              isPositive: true,
            })
          }
        })
      } else if (v.montoPagado > 0) {
        const titulo = `Abono #1 • Pedido ${pedidoTag}`
        const resto = v.saldoPendiente > 0 ? ` • Resta: ${formatCurrency(v.saldoPendiente)}` : ''
        const detalle = `${modelDesc} • Yape${resto}`

        movements.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          concepto: titulo,
          entidad: v.cliente,
          monto: v.montoPagado,
          detalle,
          isPositive: true,
        })
      }
    })

    ingresosDirectos.forEach(i => {
      movements.push({
        id: `ing-${i.id}`,
        fecha: i.fecha,
        tipo: 'INGRESO_DIRECTO',
        concepto: `${i.categoria}: ${i.concepto}`,
        entidad: i.cliente,
        monto: i.monto,
        detalle: i.metodoPago ? `Método: ${i.metodoPago}` : undefined,
        isPositive: true,
      })
    })

    egresos.forEach(e => {
      if (e.categoria === 'ACTIVO_FIJO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_MAQUINARIA',
          concepto: `${isBG ? 'Equipamiento' : 'Maquinaria/Equipo'}: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.presentacion || (isBG ? 'Activo / Equipamiento' : 'Activo / Equipo 3D'),
          isPositive: false,
        })
      } else if (e.categoria === 'MERCADERIA' || (isBG && e.categoria === 'INSUMO')) {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: isBG ? `Compra Juegos: ${e.itemConcepto}` : `Insumo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.subcategoria ? `Tags: ${e.subcategoria}` : (isBG ? 'Stock Juegos de Mesa' : 'Material'),
          isPositive: false,
        })
      } else if (e.categoria === 'FINANCIERO') {
        const isPrestamo = e.itemConcepto?.toLowerCase().includes('préstamo') ||
                           e.itemConcepto?.toLowerCase().includes('prestamo') ||
                           e.itemConcepto?.toLowerCase().includes('cuota')
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_SERVICIO',
          concepto: isPrestamo ? `Préstamo / Cuota: ${e.itemConcepto}` : `Bancario / ITF: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.subcategoria ? `Banco: ${e.subcategoria}` : (isPrestamo ? 'Amortización Préstamo BCP' : 'ITF / Comisión Bancaria'),
          isPositive: false,
        })
      } else if (e.categoria === 'INSUMO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: `Insumo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.especificacionColor ? `Color: ${e.especificacionColor}` : (e.presentacion || 'Material'),
          isPositive: false,
        })
      } else {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_SERVICIO',
          concepto: `Gasto Operativo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.subcategoria || 'Servicio / Flete / Operativo',
          isPositive: false,
        })
      }
    })

    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, ingresosDirectos, egresos, isBG])

  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const matchDate = isDateInRange(m.fecha, dateRange.from, dateRange.to)
      if (!matchDate) return false

      const matchSearch =
        m.concepto.toLowerCase().includes(search.toLowerCase()) ||
        m.entidad.toLowerCase().includes(search.toLowerCase()) ||
        (m.detalle && m.detalle.toLowerCase().includes(search.toLowerCase()))

      let matchTipo = true
      if (tipoFilter === 'INGRESOS') matchTipo = m.isPositive
      if (tipoFilter === 'EGRESOS') matchTipo = !m.isPositive

      return matchSearch && matchTipo
    })
  }, [allMovements, dateRange, search, tipoFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMovements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMovements, currentPage])

  // =========================================================================
  // CONTROL Y LÓGICA DE PARTIDAS PRESUPUESTARIAS (PESTAÑA BLINDAJE)
  // =========================================================================
  const [filtroTabPartidas, setFiltroTabPartidas] = useState<'TODOS' | 'BLINDADOS' | 'FLEXIBLES' | 'PENDIENTES' | 'PAGADOS'>('TODOS')
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({})
  const [savedIndicators, setSavedIndicators] = useState<Record<string, boolean>>({})

  // Debounce para guardar el presupuesto editado en BD
  const triggerDebouncedSync = useCallback((id: string, nuevoPresupuesto: number) => {
    if (debounceTimerRef.current[id]) {
      clearTimeout(debounceTimerRef.current[id])
    }

    debounceTimerRef.current[id] = setTimeout(async () => {
      try {
        await actualizarPresupuestoPartida(id, nuevoPresupuesto)
        setSavedIndicators(prev => ({ ...prev, [id]: true }))
        setTimeout(() => {
          setSavedIndicators(prev => ({ ...prev, [id]: false }))
        }, 2000)
        router.refresh()
      } catch {
        // En caso de fallo de red, se mantiene el estado en memoria
      }
    }, 400)
  }, [router])

  // Modificación in-line reactiva
  const handleUpdatePresupuestoInline = (id: string, rawVal: string) => {
    const num = parseFloat(rawVal)
    const sanitizedVal = isNaN(num) ? 0 : Math.max(0, num)

    setPartidas(prev => {
      return prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            presupuesto: sanitizedVal,
            monto: sanitizedVal
          }
        }
        return p
      })
    })

    triggerDebouncedSync(id, sanitizedVal)
  }

  // Alternar Tipo: Blindado <-> Flexible
  const handleToggleTipo = async (id: string) => {
    const item = partidas.find(p => p.id === id)
    if (!item) return
    const nuevoTipo: TipoGasto = item.tipo === 'Blindado' ? 'Flexible' : 'Blindado'

    const next = partidas.map(p => {
      if (p.id === id) {
        return {
          ...p,
          tipo: nuevoTipo,
          esBlindado: nuevoTipo === 'Blindado'
        }
      }
      return p
    })

    setPartidas(next)
    await conmutarTipoPartidaPresupuesto(id, nuevoTipo)
    router.refresh()
  }

  // Toggle pagado
  const handleTogglePagado = async (id: string) => {
    const item = partidas.find(p => p.id === id)
    if (!item) return
    const nuevoEstado = !item.pagado

    const next = partidas.map(p => {
      if (p.id === id) {
        return { ...p, pagado: nuevoEstado }
      }
      return p
    })

    setPartidas(next)
    if (nuevoEstado) {
      toast.success(`Gasto "${item.concepto}" marcado como pagado`)
    }
    await togglePagadoPartidaPresupuesto(id, nuevoEstado)
    router.refresh()
  }

  // Eliminar partida
  const handleEliminarPartida = async (id: string, concepto: string) => {
    const next = partidas.filter(p => p.id !== id)
    setPartidas(next)
    await eliminarPartidaPresupuesto(id)
    router.refresh()
    toast.info(`Partida "${concepto}" eliminada del plan`)
  }

  // Restablecer Plan Base
  const handleResetearPlan = async () => {
    const res = await restablecerPlanBaseDB('3D')
    if (res.success) {
      toast.success('Plan de gastos restaurado a valores base del taller')
      router.refresh()
    } else {
      toast.error('Error al restaurar el plan base en la base de datos')
    }
  }

  // =========================================================================
  // ACCIÓN DE AMORTIZACIÓN DEL PRÉSTAMO BCP
  // =========================================================================
  const handlePagarCuotaDirecto = async () => {
    if (!confirm(`¿Confirmas el registro del pago de la Cuota ${siguienteCuotaNum}/24 por S/ ${cuotaMontoValor.toFixed(2)}?\n\nSe registrará automáticamente en Egresos como FINANCIERO y liberará el fondo blindado correspondiente.`)) {
      return
    }

    setIsPayingCuota(true)
    try {
      await pagarCuotaPrestamo({
        monto: cuotaMontoValor,
        numeroCuota: siguienteCuotaNum,
        persona: 'Víctor',
        negocio: '3D'
      })

      const next = partidas.map(item => {
        if (item.id === 'gasto-cuota-prestamo') {
          return {
            ...item,
            pagado: true,
            montoSeptiembreReal: cuotaMontoValor
          }
        }
        return item
      })

      setPartidas(next)
      await guardarPlanPresupuestoCompleto(next)
      router.refresh()
      toast.success(`Cuota ${siguienteCuotaNum}/24 registrada exitosamente en Egresos`)
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el pago de la cuota')
    } finally {
      setIsPayingCuota(false)
    }
  }

  // =========================================================================
  // FILTRADO Y MÉTRICAS DE PARTIDAS PRESUPUESTARIAS
  // =========================================================================
  const itemsFiltradosPartidas = useMemo(() => {
    if (filtroTabPartidas === 'BLINDADOS') return partidas.filter(i => i.tipo === 'Blindado')
    if (filtroTabPartidas === 'FLEXIBLES') return partidas.filter(i => i.tipo === 'Flexible')
    if (filtroTabPartidas === 'PENDIENTES') return partidas.filter(i => !i.pagado)
    if (filtroTabPartidas === 'PAGADOS') return partidas.filter(i => i.pagado)
    return partidas
  }, [partidas, filtroTabPartidas])

  const totalFlexible = useMemo(() => {
    return partidas
      .filter(p => p.tipo === 'Flexible')
      .reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  const totalPlanificado = useMemo(() => {
    return partidas.reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  const totalBlindadoConsolidado = useMemo(() => {
    return partidas
      .filter(p => p.tipo === 'Blindado')
      .reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  const ratioBlindaje = useMemo(() => {
    const total = totalBlindadoConsolidado + totalFlexible
    return total > 0 ? ((totalBlindadoConsolidado / total) * 100).toFixed(1) : '0.0'
  }, [totalBlindadoConsolidado, totalFlexible])

  // =========================================================================
  // MODAL DE AGREGAR / EDITAR PARTIDA
  // =========================================================================
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PartidaPresupuesto | null>(null)
  const [formConcepto, setFormConcepto] = useState('')
  const [formSubconcepto, setFormSubconcepto] = useState('')
  const [formCategoria, setFormCategoria] = useState<CategoriaGastoPlan>('OPERATIVO')
  const [formTipo, setFormTipo] = useState<TipoGasto>('Flexible')
  const [formPresupuesto, setFormPresupuesto] = useState('50')

  const handleOpenCrear = () => {
    setEditingItem(null)
    setFormConcepto('')
    setFormSubconcepto('')
    setFormCategoria('OPERATIVO')
    setFormTipo('Flexible')
    setFormPresupuesto('50')
    setModalOpen(true)
  }

  const handleOpenEditar = (item: PartidaPresupuesto) => {
    setEditingItem(item)
    setFormConcepto(item.concepto)
    setFormSubconcepto(item.subconcepto || '')
    setFormCategoria(item.categoria)
    setFormTipo(item.tipo)
    setFormPresupuesto(String(item.presupuesto))
    setModalOpen(true)
  }

  const handleGuardarModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConcepto.trim()) {
      toast.error('Ingresa un concepto para el gasto')
      return
    }

    const valPresupuesto = Math.max(0, parseFloat(formPresupuesto) || 0)

    let nextPartidas: PartidaPresupuesto[]
    if (editingItem) {
      nextPartidas = partidas.map(p => {
        if (p.id === editingItem.id) {
          return {
            ...p,
            concepto: formConcepto.trim(),
            subconcepto: formSubconcepto.trim() || undefined,
            categoria: formCategoria,
            tipo: formTipo,
            esBlindado: formTipo === 'Blindado',
            presupuesto: valPresupuesto,
            monto: valPresupuesto
          }
        }
        return p
      })
      toast.success('Gasto actualizado en el plan')
    } else {
      const nuevoItem: PartidaPresupuesto = {
        id: `gasto-custom-${Date.now()}`,
        concepto: formConcepto.trim(),
        subconcepto: formSubconcepto.trim() || undefined,
        categoria: formCategoria,
        montoAgostoReal: 0.00,
        montoSeptiembreReal: 0.00,
        presupuesto: valPresupuesto,
        monto: valPresupuesto,
        tipo: formTipo,
        esBlindado: formTipo === 'Blindado',
        pagado: false
      }
      nextPartidas = [...partidas, nuevoItem]
      toast.success('Nueva partida agregada al plan')
    }

    setPartidas(nextPartidas)
    await guardarPlanPresupuestoCompleto(nextPartidas)
    router.refresh()
    setModalOpen(false)
  }

  // =========================================================================
  // RENDERIZADO DEL HUB CENTRALIZADO EN 3 NIVELES
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-background text-foreground min-h-screen">
      
      {/* CABECERA PRINCIPAL CON SELECTOR DE PERÍODO MAESTRO UNIFICADO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40 mb-6">
        {/* Lado Izquierdo: Títulos y Badges */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground px-2 py-0.5 rounded-md border border-border/60">
              FINANZAS NOVA
            </span>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Salud Financiera en Vivo
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Flujo de Caja & Salud Financiera
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-11">
            Centro de control unificado: balance real de caja, compromisos blindados y capacidad de gasto libre en tiempo real.
          </p>
        </div>

        {/* Lado Derecho: Controles en 1 Sola Línea */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          {/* Selector de Presets Temporales */}
          <div className="bg-secondary/80 border border-border/80 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('mes')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
                periodo === 'mes'
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('mes_anterior')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
                periodo === 'mes_anterior'
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mes Anterior
            </button>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('trimestre')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
                periodo === 'trimestre'
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('año')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
                periodo === 'año'
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Año
            </button>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('historico')}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
                periodo === 'historico'
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            Histórico
          </button>
        </div>

        {/* Botón Plan de Gastos */}
        <Button
          variant="outline"
          onClick={() => setIsPlanModalOpen(true)}
          className="border-border text-foreground hover:bg-secondary text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Plan de Gastos ({partidas.length})</span>
        </Button>
      </div>
    </div>

      {/* ========================================================================= */}
      {/* NIVEL 1: TRÍPTICO DE LIQUIDEZ Y DIAGNÓSTICO FINANCIERO (KPIS FIJOS)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        
        {/* Tarjeta 1 - Saldo Real en Caja */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                SALDO NETO EN CAJA
              </span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('finanzas_saldo_caja')}
                title="Ver fórmula y auditoría de saldo de caja"
              />
            </div>
            <div className="p-2 rounded-lg bg-secondary text-primary shrink-0">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="my-3">
            <div className={`text-2xl font-extrabold tracking-tight font-mono ${saldoNetoCaja >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {formatCurrency(saldoNetoCaja)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground leading-normal">
            Ingresos {formatCurrency(totalIngresosCobrados)} - Egresos {formatCurrency(totalEgresos)} • +{formatCurrency(cuentasPorCobrar)} por cobrar
          </div>
        </div>

        {/* Tarjeta 2 - Fondos Blindados del Mes */}
        <div className="bg-card border border-amber-500/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider truncate">
                FONDOS BLINDADOS
              </span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('finanzas_fondos_blindados')}
                title="Ver fórmula y desglose de partidas blindadas"
              />
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono">
              {formatCurrency(totalBlindadoPendiente)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground leading-normal">
            {desgloseBlindados}
          </div>
        </div>

        {/* Tarjeta 3 - Gasto Libre Hoy (Capacidad Real) */}
        <div className="bg-card border-2 border-emerald-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between bg-gradient-to-br from-card to-emerald-500/5 group hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 truncate">
                GASTO LIBRE HOY
              </span>
              <KpiInfoTrigger
                onClick={() => setSelectedKpiExplainer('finanzas_gasto_libre')}
                title="Ver fórmula y cálculo de liquidez neta disponible"
              />
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 tracking-tight font-mono">
              {formatCurrency(gastoLibreHoy)}
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-normal">
            ✓ Disponible para compras sin tocar cuotas
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* NIVEL 2: PANEL CENTRAL DE TENDENCIA & ESTRUCTURA (H-[300PX])              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-stretch">
        {/* Columna A: Gráfica de Evolución de Caja */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[300px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Evolución de Caja
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-700 shrink-0" />
                Entradas (+)
              </span>
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                Salidas (-)
              </span>
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-2 h-2 rounded-full bg-foreground shrink-0" />
                Saldo
              </span>
            </div>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartTimelineData} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="ingresosAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="egresosAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A34335" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#A34335" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="saldoAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#241C15" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#241C15" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.5} />
                <XAxis
                  dataKey="fechaLabel"
                  stroke="#75695D"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E2D9CC' }}
                  interval={xAxisInterval as any}
                />
                <YAxis
                  stroke="#75695D"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E2D9CC' }}
                  tickFormatter={(value) => {
                    if (value === 0) return 'S/\u00A00';
                    if (Math.abs(value) >= 1000) return `S/\u00A0${(value / 1000).toFixed(0)}k`;
                    return `S/\u00A0${value}`;
                  }}
                />
                <RechartsTooltip content={<CustomCashFlowTooltip />} />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  name="ingresos"
                  stroke="#047857"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ingresosAreaGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="egresos"
                  name="egresos"
                  stroke="#A34335"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#egresosAreaGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="saldoAcumulado"
                  name="saldoAcumulado"
                  stroke="#241C15"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#saldoAreaGrad)"
                  dot={{ fill: '#241C15', r: 2.5, strokeWidth: 1, stroke: '#FFFFFF' }}
                  activeDot={{ r: 4, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Columna B: Estructura Financiera con Barras de Composición */}
        <div className="lg:col-span-5 flex flex-col h-[300px]">
          <CashFlowAnalyticsCard
            ventas={ventasEnRango}
            egresos={egresosEnRango}
            ingresosDirectos={ingresosDirectosEnRango}
            className="h-[300px]"
          />
        </div>
      </div>

      <CompromisosBlindadosSection
        partidasBlindadas={partidasBlindadas}
        tienePrestamoBCP={tienePrestamoBCP}
        bcpData={bcpData}
        totalBlindado={totalBlindado}
        isPayingCuota={isPayingCuota}
        handlePagarCuotaBCP={handlePagarCuotaDirecto}
        onSavePartida={handleSavePartidaBlindada}
        onDeletePartida={handleDeletePartidaBlindada}
        gastoLibreActual={gastoLibreHoy}
        mesNombre="Octubre"
      />

      {/* ========================================================================= */}
      {/* NIVEL 4: REGISTRO DETALLADO DE MOVIMIENTOS DE CAJA (TABLA CONTABLE)       */}
      {/* ========================================================================= */}
      <div className="space-y-4">

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar concepto o cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-8 bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground text-xs md:text-sm rounded-xl h-9 focus:border-primary focus:bg-card"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Período: <strong className="text-foreground">{labelPeriodoActivo}</strong></span>
              </div>

              <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tipoFilter === 'TODOS'
                      ? 'bg-foreground text-background shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  Todos ({filteredMovements.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoFilter('INGRESOS'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    tipoFilter === 'INGRESOS'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                  Ingresos
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoFilter('EGRESOS'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    tipoFilter === 'EGRESOS'
                      ? 'bg-destructive text-destructive-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
                  Egresos
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Transacciones (Zero Scroll) */}
          <Card className="bg-card border-border overflow-hidden shadow-xs rounded-2xl">
            {/* Vista Móvil: Tarjetas */}
            <div className="block md:hidden divide-y divide-border/70">
              {paginatedMovements.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No se encontraron movimientos registrados con los filtros aplicados.
                </div>
              ) : (
                paginatedMovements.map((mov) => (
                  <div key={mov.id} className="p-3.5 space-y-2 bg-card hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-foreground block truncate">{mov.concepto}</span>
                        {mov.detalle && (
                          <span className="text-[11px] text-muted-foreground block truncate mt-0.5 leading-normal">
                            {mov.detalle}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                          {formatDate(mov.fecha)} • {mov.entidad}
                        </span>
                      </div>

                      <span className={`text-sm font-mono font-bold flex-shrink-0 tabular-nums ${
                        mov.isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'
                      }`}>
                        {mov.isPositive ? `+${formatCurrency(mov.monto)}` : `-${formatCurrency(mov.monto)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs pt-1">
                      <div>
                        {mov.tipo === 'INGRESO_VENTA' ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold gap-1">
                            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                            Venta
                          </Badge>
                        ) : mov.tipo === 'INGRESO_DIRECTO' ? (
                          <Badge variant="outline" className="bg-accent text-accent-foreground border-border text-[10px] font-bold gap-1">
                            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                            Ingreso Directo
                          </Badge>
                        ) : mov.tipo === 'EGRESO_MAQUINARIA' ? (
                          <Badge variant="outline" className="bg-accent text-accent-foreground border-border text-[10px] font-semibold gap-1">
                            <Wrench className="h-3 w-3" />
                            Maquinaria
                          </Badge>
                        ) : mov.tipo === 'EGRESO_INSUMO' ? (
                          <Badge variant="outline" className="bg-secondary text-foreground border-border text-[10px] font-semibold gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            Insumo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary text-muted-foreground border-border text-[10px] font-semibold gap-1">
                            <Truck className="h-3 w-3" />
                            Gasto Operativo
                          </Badge>
                        )}
                      </div>

                      {mov.detalle && (
                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {mov.detalle}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Vista Desktop: Tabla Limpia Table-Fixed (Sin Scroll Horizontal) */}
            <div className="hidden md:block">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-secondary/60 border-b border-border">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-28 px-4 py-3 text-xs font-bold text-muted-foreground text-left">Fecha</TableHead>
                    <TableHead className="w-36 px-3 py-3 text-xs font-bold text-muted-foreground text-left">Tipo</TableHead>
                    <TableHead className="px-3 py-3 text-xs font-bold text-muted-foreground text-left">Concepto & Detalle</TableHead>
                    <TableHead className="w-40 px-3 py-3 text-xs font-bold text-muted-foreground text-left">Entidad / Cliente</TableHead>
                    <TableHead className="w-36 px-4 py-3 text-xs font-bold text-muted-foreground text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                        No se encontraron movimientos registrados con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMovements.map((mov) => (
                      <TableRow key={mov.id} className="border-b border-border/60 hover:bg-secondary/30 transition-colors">
                        <TableCell className="px-4 py-2.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {formatDate(mov.fecha)}
                        </TableCell>

                        <TableCell className="px-3 py-2.5 whitespace-nowrap">
                          {mov.tipo === 'INGRESO_VENTA' ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[11px] font-bold gap-1">
                              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                              Venta
                            </Badge>
                          ) : mov.tipo === 'INGRESO_DIRECTO' ? (
                            <Badge variant="outline" className="bg-accent text-accent-foreground border-border text-[11px] font-bold gap-1">
                              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                              Ingreso Directo
                            </Badge>
                          ) : mov.tipo === 'EGRESO_MAQUINARIA' ? (
                            <Badge variant="outline" className="bg-accent text-accent-foreground border-border text-[11px] font-semibold gap-1">
                              <Wrench className="h-3 w-3" />
                              Maquinaria
                            </Badge>
                          ) : mov.tipo === 'EGRESO_INSUMO' ? (
                            <Badge variant="outline" className="bg-secondary text-foreground border-border text-[11px] font-semibold gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              Insumo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-secondary text-muted-foreground border-border text-[11px] font-semibold gap-1">
                              <Truck className="h-3 w-3" />
                              Gasto Operativo
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="px-3 py-2.5 min-w-0">
                          <span className="font-bold text-xs text-foreground block truncate">
                            {mov.concepto}
                          </span>
                          {mov.detalle && (
                            <span className="text-[11px] text-muted-foreground block truncate mt-0.5 leading-normal">
                              {mov.detalle}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground whitespace-nowrap truncate">
                          {mov.entidad}
                        </TableCell>

                        <TableCell className={`px-4 py-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap text-xs sm:text-sm ${
                          mov.isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'
                        }`}>
                          {mov.isPositive ? `+${formatCurrency(mov.monto)}` : `-${formatCurrency(mov.monto)}`}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-secondary/40">
                <span className="text-xs text-muted-foreground">
                  Mostrando {paginatedMovements.length} de {filteredMovements.length} movimientos
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl text-xs h-8 px-3 border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <span className="text-xs font-semibold text-foreground px-3 py-1 bg-secondary rounded-lg border border-border/60">
                    Página {currentPage} de {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl text-xs h-8 px-3 border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

      {/* ========================================================================= */}
      {/* MODAL GESTIÓN COMPLETA DEL PLAN DE GASTOS & BLINDAJE                      */}
      {/* ========================================================================= */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Plan de Gastos & Compromisos Blindados</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Configura metas presupuestarias, blindaje de cuotas y reservas operativas del taller.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetearPlan}
                className="h-9 px-3 rounded-xl border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Restablecer Plan Base
              </Button>
              <Button
                onClick={handleOpenCrear}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Nuevo Gasto al Plan
              </Button>
            </div>
          </div>

          {/* Tabla Interactiva de Partidas Presupuestarias */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            {/* Barra de Filtros de Partidas */}
            <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFiltroTabPartidas('TODOS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filtroTabPartidas === 'TODOS'
                      ? 'bg-foreground text-background shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  Todos ({partidas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTabPartidas('BLINDADOS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    filtroTabPartidas === 'BLINDADOS'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  <Lock className="h-3 w-3" />
                  Blindados ({partidas.filter(i => i.tipo === 'Blindado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTabPartidas('FLEXIBLES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    filtroTabPartidas === 'FLEXIBLES'
                      ? 'bg-secondary text-foreground border border-border/80 shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Flexibles ({partidas.filter(i => i.tipo === 'Flexible').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTabPartidas('PENDIENTES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filtroTabPartidas === 'PENDIENTES'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  Pendientes ({partidas.filter(i => !i.pagado).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTabPartidas('PAGADOS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filtroTabPartidas === 'PAGADOS'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  Pagados ({partidas.filter(i => i.pagado).length})
                </button>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  onClick={handleOpenCrear}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Nuevo Gasto al Plan</span>
                </Button>
              </div>
            </div>

            {/* Vista Móvil: Tarjetas (Zero Scroll) */}
            <div className="block md:hidden p-4 space-y-3">
              {itemsFiltradosPartidas.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                  No hay gastos en esta vista.
                </div>
              ) : (
                itemsFiltradosPartidas.map((item) => {
                  const catConfig = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.OTROS
                  return (
                    <div
                      key={item.id}
                      className={`bg-card border rounded-xl p-4 shadow-2xs space-y-3 transition-colors ${
                        item.pagado ? 'bg-secondary/40 border-border opacity-80' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePagado(item.id)}
                            className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                              item.pagado
                                ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                                : 'bg-card border-border text-transparent hover:border-emerald-700'
                            }`}
                            title={item.pagado ? 'Marcar como pendiente' : 'Marcar como pagado'}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${catConfig.badgeColor}`}>
                                {catConfig.label}
                              </span>
                              <span className={`font-bold text-xs ${item.pagado ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {item.concepto}
                              </span>
                              {item.pagado && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                                  Pagado
                                </span>
                              )}
                            </div>
                            {item.subconcepto && (
                              <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                                {item.subconcepto}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTipo(item.id)}
                          className={
                            item.tipo === 'Blindado'
                              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0'
                              : 'bg-secondary text-foreground border border-border/80 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0'
                          }
                          title="Haz clic para alternar tipo de gasto"
                        >
                          {item.tipo === 'Blindado' ? (
                            <Lock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span>{item.tipo}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs bg-secondary/50 p-2.5 rounded-xl border border-border/70">
                        <div>
                          <span className="text-[9px] text-muted-foreground block font-sans">Agosto (Real)</span>
                          <span className="font-bold text-foreground text-[11px]">
                            {item.montoAgostoReal > 0 ? formatCurrency(item.montoAgostoReal) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-700 block font-sans">Hoy (Sept)</span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                            {formatCurrency(item.montoSeptiembreReal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-primary block font-sans font-bold">Presupuesto</span>
                          <span className="font-black text-primary text-[11px]">
                            {formatCurrency(item.presupuesto)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2">
                        <div className="relative flex items-center w-32">
                          <span className="absolute left-2.5 text-xs font-semibold text-muted-foreground pointer-events-none">
                            S/
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={item.presupuesto === 0 ? '' : item.presupuesto}
                            placeholder="0.00"
                            onChange={(e) => handleUpdatePresupuestoInline(item.id, e.target.value)}
                            className="h-9 w-full rounded-xl border border-input bg-card pl-8 pr-2.5 text-right font-bold text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                          />
                          {savedIndicators[item.id] && (
                            <span className="absolute -right-5 text-emerald-600 animate-in fade-in duration-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditar(item)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                            title="Editar detalle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEliminarPartida(item.id, item.concepto)
                            }}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary cursor-pointer"
                            title="Eliminar partida"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Vista Desktop: Tabla Table-Fixed (Sin Scroll Horizontal) */}
            <div className="hidden md:block w-full overflow-hidden">
              <table className="w-full table-fixed text-xs text-left border-collapse">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-secondary/60 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-bold text-foreground">Concepto / Categoría</th>
                    <th className="py-3 px-2 font-bold text-center text-foreground">Tipo</th>
                    <th className="py-3 px-3 font-bold text-right text-foreground">
                      Gastado Mes Anterior <span className="text-[10px] font-normal text-muted-foreground block">(Real)</span>
                    </th>
                    <th className="py-3 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400">
                      Gastado Mes Actual <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400 block">(Hoy)</span>
                    </th>
                    <th className="py-3 px-3 font-bold text-right text-primary">
                      Presupuesto Editable (S/) <span className="text-[10px] font-normal text-primary block">(En Vivo)</span>
                    </th>
                    <th className="py-3 px-3 font-bold text-center text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itemsFiltradosPartidas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 px-4 text-center text-xs text-muted-foreground">
                        No hay partidas que coincidan con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    itemsFiltradosPartidas.map((item) => {
                      const catConfig = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.OTROS
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            item.pagado ? 'bg-secondary/40 opacity-75' : 'hover:bg-secondary/30'
                          }`}
                        >
                          <td className="py-3 px-4 min-w-0">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleTogglePagado(item.id)}
                                className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                                  item.pagado
                                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                                    : 'bg-card border-border text-transparent hover:border-emerald-700'
                                }`}
                                title={item.pagado ? 'Gasto marcado como pagado' : 'Marcar como pagado'}
                              >
                                <Check className="h-3 w-3 stroke-[3]" />
                              </button>

                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catConfig.badgeColor}`}>
                                    {catConfig.label}
                                  </span>
                                  <span className={`font-bold text-xs truncate ${item.pagado ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {item.concepto}
                                  </span>
                                  {item.pagado && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                                      Pagado
                                    </span>
                                  )}
                                </div>
                                {item.subconcepto && (
                                  <span className="text-[11px] text-muted-foreground block truncate" title={item.subconcepto}>
                                    {item.subconcepto}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleTipo(item.id)}
                              className={
                                item.tipo === 'Blindado'
                                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 transition-transform'
                                  : 'bg-secondary text-foreground border border-border/80 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 transition-transform'
                              }
                              title="Haz clic para alternar entre Blindado y Flexible"
                            >
                              {item.tipo === 'Blindado' ? (
                                <Lock className="w-3 h-3 text-amber-600" />
                              ) : (
                                <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span>{item.tipo}</span>
                            </button>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                            {item.montoAgostoReal > 0 ? (
                              <span className="font-bold text-xs text-foreground tabular-nums">
                                {formatCurrency(item.montoAgostoReal)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal text-xs">—</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                            <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(item.montoSeptiembreReal)}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="relative flex items-center w-32">
                                <span className="absolute left-2.5 text-xs font-semibold text-muted-foreground pointer-events-none">
                                  S/
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  value={item.presupuesto === 0 ? '' : item.presupuesto}
                                  placeholder="0.00"
                                  onChange={(e) => handleUpdatePresupuestoInline(item.id, e.target.value)}
                                  className="h-9 w-full rounded-xl border border-input bg-card pl-8 pr-2.5 text-right font-bold text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                                />
                              </div>
                              {savedIndicators[item.id] ? (
                                <span className="inline-flex items-center text-emerald-600 animate-in fade-in duration-200">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditar(item)}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                                title="Editar detalle"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEliminarPartida(item.id, item.concepto)
                                }}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary cursor-pointer"
                                title="Eliminar partida"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Fila de Totales Consolidados (Footer de Tabla) */}
            <div className="bg-secondary/40 font-bold text-xs border-t-2 border-border/80 py-3.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-foreground">
                Total Partidas: <span className="font-mono">{partidas.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-800 dark:text-amber-300">
                  Total Blindado: <span className="font-mono">{formatCurrency(totalBlindadoConsolidado)}</span>
                </span>
                <span className="text-border">|</span>
                <span className="text-foreground">
                  Total Flexible: <span className="font-mono">{formatCurrency(totalFlexible)}</span>
                </span>
              </div>
              <div className="text-foreground">
                Presupuesto Planificado: <span className="font-mono font-extrabold text-foreground">{formatCurrency(totalPlanificado)}</span>
              </div>
            </div>
          </div>

          {/* Métricas de Salud del Taller */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  RATIO DE BLINDAJE
                </span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono">
                  {ratioBlindaje}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(totalBlindadoConsolidado)} asegurados para compromisos fijos y cuota de capital.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  PRESUPUESTO INSUMOS
                </span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700">
                  <Package className="w-4 h-4 text-emerald-700" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 tracking-tight font-mono">
                  {formatCurrency(totalFlexible)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Fondos flexibles asignados para compra de filamento y materiales operativos.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  RUNWAY DE TALLER
                </span>
                <div className="p-2 rounded-lg bg-accent text-accent-foreground">
                  <Clock className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-accent-foreground tracking-tight font-mono">
                  {(saldoNetoCaja / Math.max(1, totalBlindadoPendiente || 1)).toFixed(1)} meses
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Meses de compromisos blindados cubiertos con el saldo actual en caja.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL PARA AGREGAR / EDITAR PARTIDA DE GASTO                              */}
      {/* ========================================================================= */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[460px] bg-card border-border rounded-xl p-6 shadow-xl">
          <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <span>{editingItem ? 'Editar Partida de Gasto' : 'Agregar Nuevo Gasto al Plan'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajusta el concepto, presupuesto proyectado y nivel de blindaje para el mes.
          </DialogDescription>

          <form onSubmit={handleGuardarModal} className="space-y-4 mt-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Concepto del Gasto</Label>
              <Input
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Reposición de Filamentos, Mantenimiento..."
                className="bg-card border-input text-xs rounded-xl h-10 text-foreground"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Detalle o Fórmula de Cálculo</Label>
              <Input
                value={formSubconcepto}
                onChange={(e) => setFormSubconcepto(e.target.value)}
                placeholder="Ej: 6 bobinas x S/ 48.00"
                className="bg-card border-input text-xs rounded-xl h-10 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Categoría</Label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value as CategoriaGastoPlan)}
                  className="w-full bg-card border border-input rounded-xl h-10 px-3 text-xs text-foreground font-medium cursor-pointer"
                >
                  <option value="INSUMOS">Insumos & Material</option>
                  <option value="BLINDADO">Deuda / Préstamo</option>
                  <option value="OPERATIVO">Fijo / Taller</option>
                  <option value="CAPEX">Reserva Máquinas (CAPEX)</option>
                  <option value="MARKETING">Pauta & Publicidad</option>
                  <option value="OTROS">Otros Gastos</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Tipo de Gasto</Label>
                <button
                  type="button"
                  onClick={() => setFormTipo(formTipo === 'Blindado' ? 'Flexible' : 'Blindado')}
                  className={
                    formTipo === 'Blindado'
                      ? 'w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 shadow-xs'
                      : 'w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border bg-secondary text-foreground border-border'
                  }
                >
                  {formTipo === 'Blindado' ? (
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{formTipo === 'Blindado' ? 'Blindado' : 'Flexible'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-bold text-primary">Presupuesto Proyectado (S/)</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-muted-foreground pointer-events-none">
                  S/
                </span>
                <Input
                  type="number"
                  step="any"
                  value={formPresupuesto}
                  onChange={(e) => setFormPresupuesto(e.target.value)}
                  className="bg-card border-input pl-8 text-xs font-mono font-bold rounded-xl h-10 text-foreground"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 px-4 rounded-xl border-border text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                {editingItem ? 'Guardar Cambios' : 'Agregar al Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Explicador de Fórmulas y Transacciones de KPI */}
      <KpiExplainerModal
        isOpen={!!selectedKpiExplainer}
        onClose={() => setSelectedKpiExplainer(null)}
        kpiId={selectedKpiExplainer}
        from={dateRange.from}
        to={dateRange.to}
      />
    </div>
  )
}
