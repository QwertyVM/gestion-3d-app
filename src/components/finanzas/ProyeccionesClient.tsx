'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Wallet,
  Lock,
  Unlock,
  Sparkles,
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
  ShieldCheck,
  Package,
  Calculator,
  Activity,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DatosPresupuestoTranquilidad,
  actualizarPresupuestoPartida,
  guardarPartidaPlan,
  conmutarTipoPartidaPresupuesto,
  togglePagadoPartidaPresupuesto,
  eliminarPartidaPresupuesto,
  guardarPlanPresupuestoCompleto,
  restablecerPlanBaseDB
} from '@/actions/presupuesto'
import { pagarCuotaPrestamo } from '@/actions/inversiones'

export interface ProyeccionesClientProps {
  datos: DatosPresupuestoTranquilidad
}

export type TipoGasto = 'Blindado' | 'Flexible'
export type CategoriaGastoPlan = 'INSUMOS' | 'BLINDADO' | 'OPERATIVO' | 'CAPEX' | 'MARKETING' | 'OTROS'

export interface PartidaPresupuesto {
  id: string
  categoria: CategoriaGastoPlan
  concepto: string
  subconcepto?: string
  montoAgostoReal: number // Histórico cerrado real de Agosto (Solo lectura)
  montoSeptiembreReal: number // Gastado en Septiembre a la fecha (Solo lectura)
  presupuesto: number // Presupuesto Proyectado del Mes (Editable)
  tipo: TipoGasto // 'Blindado' | 'Flexible'
  pagado: boolean

  // Aliases de compatibilidad con código previo
  monto?: number
  esBlindado?: boolean
}

// Alias de retrocompatibilidad
export type ItemGastoPlan = PartidaPresupuesto

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

export function ProyeccionesClient({ datos }: ProyeccionesClientProps) {
  const router = useRouter()
  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // 1. PARTIDAS INICIALES SINCRONIZADAS CON SERVIDOR
  // =========================================================================
  const getPartidasIniciales = (): PartidaPresupuesto[] => {
    if (datos.partidasPlan && datos.partidasPlan.length > 0) {
      return datos.partidasPlan.map(p => ({
        ...p,
        monto: Number(p.presupuesto || 0),
        esBlindado: p.tipo === 'Blindado'
      }))
    }

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
        montoSeptiembreReal: datos.prestamoInfo?.montoPagadoTotal || 0,
        presupuesto: datos.prestamoInfo?.cuotaMensual || 388.68,
        tipo: 'Blindado',
        pagado: false,
        monto: datos.prestamoInfo?.cuotaMensual || 388.68,
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
  // 2. ESTADO LOCAL Y PERSISTENCIA CLIENTE + SERVIDOR
  // =========================================================================
  const [partidas, setPartidas] = useState<PartidaPresupuesto[]>(getPartidasIniciales)
  const [filtroTab, setFiltroTab] = useState<'TODOS' | 'BLINDADOS' | 'FLEXIBLES' | 'PENDIENTES' | 'PAGADOS'>('TODOS')

  // Cargar estado de servidor prioritario
  useEffect(() => {
    if (datos.partidasPlan && datos.partidasPlan.length > 0) {
      setPartidas(datos.partidasPlan.map(p => ({
        ...p,
        monto: Number(p.presupuesto || 0),
        esBlindado: p.tipo === 'Blindado'
      })))
    }
  }, [datos.partidasPlan])

  // =========================================================================
  // 3. MOTOR REACTIVO DE CÁLCULO EN MEMORIA (USEMEMO)
  // =========================================================================
  const saldoCajaReal = Number(datos.saldoActualCaja || 0)

  // Total Blindado Pendiente (compromiso activo que retiene caja)
  const totalBlindado = useMemo(() => {
    return partidas
      .filter(p => p.tipo === 'Blindado' && !p.pagado)
      .reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  // Total Flexible (presupuesto para compras e insumos)
  const totalFlexible = useMemo(() => {
    return partidas
      .filter(p => p.tipo === 'Flexible')
      .reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  // Gasto Libre Hoy = Saldo Real en Caja - Total Blindado Pendiente
  const gastoLibre = useMemo(() => {
    return Math.max(0, saldoCajaReal - totalBlindado)
  }, [saldoCajaReal, totalBlindado])

  // Ratio de Blindaje (%)
  const ratioBlindaje = useMemo(() => {
    const total = totalBlindado + totalFlexible
    return total > 0 ? ((totalBlindado / total) * 100).toFixed(1) : '0.0'
  }, [totalBlindado, totalFlexible])

  // Métricas adicionales para la tabla y diagnósticos
  const totalPlanificado = useMemo(() => {
    return partidas.reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  const totalBlindadoConsolidado = useMemo(() => {
    return partidas
      .filter(p => p.tipo === 'Blindado')
      .reduce((sum, p) => sum + Number(p.presupuesto || 0), 0)
  }, [partidas])

  const totalGastadoAgosto = useMemo(() => {
    return partidas.reduce((sum, p) => sum + Number(p.montoAgostoReal || 0), 0)
  }, [partidas])

  const totalGastadoSeptiembre = useMemo(() => {
    return partidas.reduce((sum, p) => sum + Number(p.montoSeptiembreReal || 0), 0)
  }, [partidas])

  // Desglose dinámico para la tarjeta de Fondos Blindados
  const desgloseBlindados = useMemo(() => {
    const pendientes = partidas.filter(p => p.tipo === 'Blindado' && !p.pagado)
    if (pendientes.length === 0) return 'Sin compromisos pendientes este ciclo'
    return pendientes
      .map(p => {
        if (p.id === 'gasto-cuota-prestamo') return 'Cuota BCP'
        if (p.id === 'gasto-reserva-capex') return 'Reserva A2L'
        if (p.id === 'gasto-fijos-taller') return 'Luz'
        return p.concepto.replace(' de Préstamo', '').replace(' para Nueva Impresora', '')
      })
      .join(' + ')
  }, [partidas])

  // =========================================================================
  // 4. DEBOUNCE AUTO-GUARDADO Y SINCRONIZACIÓN CON SERVIDOR
  // =========================================================================
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({})
  const [savedIndicators, setSavedIndicators] = useState<Record<string, boolean>>({})

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
        // En caso de fallo de red, se mantiene el estado local
      }
    }, 400)
  }, [router])

  // Modificación in-line fluida del presupuesto
  const handleUpdatePresupuestoInline = (id: string, rawVal: string) => {
    const num = parseFloat(rawVal)
    const sanitizedVal = isNaN(num) ? 0 : Math.max(0, num)

    setPartidas(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            presupuesto: sanitizedVal,
            monto: sanitizedVal
          }
        }
        return p
      })
      return next
    })

    triggerDebouncedSync(id, sanitizedVal)
  }

  // Alternar Tipo: Blindado <-> Flexible con sincronización en tiempo real
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

  // Eliminar partida (directo en PostgreSQL)
  const handleEliminarPartida = async (id: string, concepto: string) => {
    const next = partidas.filter(p => p.id !== id)
    setPartidas(next)
    await eliminarPartidaPresupuesto(id)
    router.refresh()
    toast.info(`Partida "${concepto}" eliminada del plan`)
  }

  // Restablecer Plan Base (directo en PostgreSQL)
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
  // 5. MODAL AGREGAR / EDITAR PARTIDA
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
  // 6. CONTROL Y PAGO DE CUOTA BCP
  // =========================================================================
  const [isPayingCuota, setIsPayingCuota] = useState(false)
  const cuotaPrestamoItem = partidas.find(i => i.id === 'gasto-cuota-prestamo')
  const estaCuotaPagada = Boolean(datos.prestamoInfo?.pagadaEnPeriodo || cuotaPrestamoItem?.pagado)
  const siguienteCuotaNum = datos.prestamoInfo?.cuotaActual || 2
  const cuotaMontoValor = datos.prestamoInfo?.cuotaMensual || 388.68

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
  // 7. FILTRADO DE PARTIDAS
  // =========================================================================
  const itemsFiltrados = useMemo(() => {
    if (filtroTab === 'BLINDADOS') return partidas.filter(i => i.tipo === 'Blindado')
    if (filtroTab === 'FLEXIBLES') return partidas.filter(i => i.tipo === 'Flexible')
    if (filtroTab === 'PENDIENTES') return partidas.filter(i => !i.pagado)
    if (filtroTab === 'PAGADOS') return partidas.filter(i => i.pagado)
    return partidas
  }, [partidas, filtroTab])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-background text-foreground min-h-screen">
      
      {/* ========================================================================= */}
      {/* CABECERA PRINCIPAL Y ACCIÓN SUPERIOR                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">
              Planificación Operativa NOVA
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20">
              Presupuesto Septiembre 2026
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Calculator className="h-7 w-7 text-primary flex-shrink-0" />
            <span>Plan de Gastos y Proyecciones</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Motor reactivo de asignación de capital: cualquier edición impacta en tiempo real sobre los fondos blindados y el saldo libre.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleOpenCrear}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Nuevo Gasto al Plan
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NIVEL 1: DIAGNÓSTICO DE LIQUIDEZ Y ECUACIÓN DE BLINDAJE (KPIS SUPERIORES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Saldo Real en Caja */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              SALDO REAL EN CAJA
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground">
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono">
              {formatCurrency(saldoCajaReal)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            +{formatCurrency(datos.cuentasPorCobrar)} por cobrar de clientes
          </div>
        </div>

        {/* 2. Fondos Blindados Pendientes */}
        <div className="bg-card border border-amber-500/30 rounded-xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              FONDOS BLINDADOS PENDIENTES
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono">
              {formatCurrency(totalBlindado)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground truncate" title={desgloseBlindados}>
            {desgloseBlindados}
          </div>
        </div>

        {/* 3. Gasto Libre Hoy (El KPI Estrella) */}
        <div className="bg-card border-2 border-emerald-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between bg-gradient-to-br from-card to-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              GASTO LIBRE HOY
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 tracking-tight font-mono">
              {formatCurrency(gastoLibre)}
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
            ✓ Dinero disponible para compras sin tocar cuotas
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* NIVEL 2: MÓDULO COMPACTO DEL PRÉSTAMO BCP (COMPROMISO BLINDADO)            */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Izquierda: Identidad Financiera */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight truncate">
                Préstamo Capital de Trabajo (BCP)
              </h2>
              <Badge variant="outline" className="bg-secondary text-foreground border-border text-[10px] font-bold">
                24 Cuotas • TEA 8.70%
              </Badge>
              {estaCuotaPagada ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Cuota {datos.prestamoInfo?.cuotasPagadas || 1}/24 Pagada este Ciclo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Cuota {siguienteCuotaNum}/24 Pendiente
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Desembolso S/ {(datos.prestamoInfo?.totalPrestamo || 8000).toLocaleString('es-PE')} • Próximo recálculo: {datos.prestamoInfo?.fechaCorteRecalculo || '15 de Octubre 2026'}
            </p>
          </div>
        </div>

        {/* Centro: Métricas Compactas */}
        <div className="flex items-center gap-4 text-xs font-mono shrink-0 bg-secondary/50 px-3.5 py-2 rounded-xl border border-border/60">
          <div>
            <span className="text-[10px] text-muted-foreground block font-sans uppercase">Progreso</span>
            <span className="font-extrabold text-foreground">
              {datos.prestamoInfo?.cuotasPagadas || 1}/24
            </span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-[10px] text-muted-foreground block font-sans uppercase">Cuota</span>
            <span className="font-extrabold text-foreground">
              {formatCurrency(cuotaMontoValor)}
            </span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-[10px] text-muted-foreground block font-sans uppercase">Capital Restante</span>
            <span className="font-extrabold text-primary">
              {formatCurrency(datos.prestamoInfo?.saldoCapitalRestante || 7631.12)}
            </span>
          </div>
        </div>

        {/* Derecha: Botón de Amortización Rápida */}
        <div className="shrink-0 flex items-center">
          {!estaCuotaPagada ? (
            <Button
              onClick={handlePagarCuotaDirecto}
              disabled={isPayingCuota}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center transition-all active:scale-[0.98]"
            >
              <CreditCard className="h-4 w-4" />
              {isPayingCuota
                ? 'Registrando...'
                : `Pagar Cuota ${siguienteCuotaNum} (${formatCurrency(cuotaMontoValor)})`}
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>✓ Cuota {datos.prestamoInfo?.cuotasPagadas || 1} al día</span>
              </div>
              <Button
                onClick={handlePagarCuotaDirecto}
                disabled={isPayingCuota}
                variant="outline"
                className="text-xs h-10 px-3.5 rounded-xl border-border hover:bg-secondary cursor-pointer flex items-center gap-1.5 font-semibold text-foreground"
              >
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Pagar Cuota {siguienteCuotaNum}
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* NIVEL 3: BARRA DE HERRAMIENTAS Y TABLA PRESUPUESTARIA INTERACTIVA         */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden space-y-0">
        
        {/* Barra de Herramientas y Filtros */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Segmented Control de Filtros */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setFiltroTab('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroTab === 'TODOS'
                  ? 'bg-foreground text-background shadow-2xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              Todos ({partidas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('BLINDADOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filtroTab === 'BLINDADOS'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              <Lock className="h-3 w-3" />
              Blindados ({partidas.filter(i => i.tipo === 'Blindado').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('FLEXIBLES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filtroTab === 'FLEXIBLES'
                  ? 'bg-secondary text-foreground border border-border/80 shadow-2xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Flexibles ({partidas.filter(i => i.tipo === 'Flexible').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('PENDIENTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroTab === 'PENDIENTES'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              Pendientes ({partidas.filter(i => !i.pagado).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('PAGADOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroTab === 'PAGADOS'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              Pagados ({partidas.filter(i => i.pagado).length})
            </button>
          </div>

          {/* Acciones de la Barra de Herramientas */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetearPlan}
              className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restablecer Plan Base
            </Button>
          </div>
        </div>

        {/* VISTA MÓVIL (< md): Tarjetas responsivas sin scroll horizontal */}
        <div className="block md:hidden p-4 space-y-3">
          {itemsFiltrados.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No hay gastos en esta vista.
            </div>
          ) : (
            itemsFiltrados.map((item) => {
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

                    {/* Badge de Tipo */}
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

                  {/* Grid de Montos Móvil */}
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

                  {/* Input Editable y Acciones Móvil */}
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

        {/* TABLA PRINCIPAL DE PARTIDAS (VISTA DESKTOP >= md) - REGLA: SIN SCROLL HORIZONTAL */}
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
                  Gastado Agosto <span className="text-[10px] font-normal text-muted-foreground block">(Real)</span>
                </th>
                <th className="py-3 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400">
                  Gastado Sept. <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400 block">(Hoy)</span>
                </th>
                <th className="py-3 px-3 font-bold text-right text-primary">
                  Presupuesto <span className="text-[10px] font-normal text-primary block">(Editable)</span>
                </th>
                <th className="py-3 px-3 font-bold text-center text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-xs text-muted-foreground">
                    No hay partidas que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => {
                  const catConfig = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.OTROS
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.pagado ? 'bg-secondary/40 opacity-75' : 'hover:bg-secondary/30'
                      }`}
                    >
                      {/* Concepto & Detalle */}
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

                      {/* Tipo de Gasto con Click Toggle */}
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

                      {/* Gastado Agosto (Real) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        {item.montoAgostoReal > 0 ? (
                          <span className="font-bold text-xs text-foreground tabular-nums">
                            {formatCurrency(item.montoAgostoReal)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal text-xs">—</span>
                        )}
                      </td>

                      {/* Gastado Sept. (Hoy) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(item.montoSeptiembreReal)}
                        </span>
                      </td>

                      {/* Presupuesto (Editable con Auto-Guardado y Feedback Visual) */}
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

                      {/* Acciones */}
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

        {/* TIRA DE TOTALES CONSOLIDADOS (FOOTER DE TABLA) */}
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

      {/* ========================================================================= */}
      {/* NIVEL 4: MÉTRICAS DE SALUD DEL TALLER                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Tarjeta 1: Ratio de Blindaje */}
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
            {formatCurrency(totalBlindadoConsolidado)} asegurados para compromisos fijos y reserva de taller.
          </p>
        </div>

        {/* Tarjeta 2: Presupuesto Insumos */}
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

        {/* Tarjeta 3: Runway de Taller */}
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
              {(saldoCajaReal / Math.max(1, totalBlindado || 1)).toFixed(1)} meses
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Meses de compromisos blindados cubiertos con el saldo en caja actual.
          </p>
        </div>

      </div>

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

    </div>
  )
}

// Aliases de retrocompatibilidad
export const PresupuestoClient = ProyeccionesClient
export const ProjectionsAndBudgetView = ProyeccionesClient
export type PresupuestoClientProps = ProyeccionesClientProps
