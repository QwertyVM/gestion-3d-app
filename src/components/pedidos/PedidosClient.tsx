'use client'

import { useState, useMemo, useEffect } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Package,
  Boxes,
  Truck,
  DollarSign,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { toast } from 'sonner'
import { DateRange, getPresetDateRange, isDateInRange, formatToYMD } from '@/lib/date-utils'
import { EstadoPedido } from '@prisma/client'
import {
  updateEstadoPedido,
  updatePagoPedido,
  deletePagoPedido,
  addPagoPedido,
  toggleSeguimientoPostventa
} from '@/actions/pedidos'
import { RegisterMultiProductOrderModal } from './RegisterMultiProductOrderModal'
import { EditOrderModal } from './EditOrderModal'
import { OrdersFilterBar } from './OrdersFilterBar'
import { OrderDetailDrawer as OrderDetailModal } from './OrderDetailDrawer'
import { BoxLotsModal } from './BoxLotsModal'
import {
  StockCajasResumen,
  getStockCajas,
  asignarCajasAPedido,
  asignarCajaRapida,
  quitarCajasDePedido
} from '@/actions/cajas'
import { KpiCard } from './KpiCard'
import { KpiExplainerModal } from '@/components/ui/KpiExplainerModal'
import { OrderTableRow as OrderRow } from './OrderTableRow'
import { OrderCardMobile } from './OrderCardMobile'
import { getItemColors, formatCurrency } from './orderUtils'
import {
  PedidoView,
  PagoPedidoView,
  ProductoOption,
  FilamentoOption,
  ClienteOption
} from './types'
import { EditPagoModal, EditingPagoState } from './EditPagoModal'

export interface PedidosClientProps {
  pedidosIniciales: PedidoView[]
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  clientesIniciales?: ClienteOption[]
  stockCajasInicial?: StockCajasResumen | null
}

export function PedidosClient({
  pedidosIniciales,
  productos,
  filamentos,
  clientesIniciales = [],
  stockCajasInicial = null
}: PedidosClientProps) {
  const [pedidos, setPedidos] = useState<PedidoView[]>(pedidosIniciales)
  const [stockCajas, setStockCajas] = useState<StockCajasResumen | null>(stockCajasInicial)
  const [clientesList, setClientesList] = useState<ClienteOption[]>(clientesIniciales || [])
  const [isBoxLotsModalOpen, setIsBoxLotsModalOpen] = useState(false)
  const [selectedCajasFilter, setSelectedCajasFilter] = useState<'TODOS' | 'CON_CAJA' | 'SIN_CAJA'>('TODOS')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 200)
    return () => clearTimeout(handler)
  }, [search])

  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>('ACTIVOS')
  const [selectedPagoFilter, setSelectedPagoFilter] = useState<string>('TODOS')
  const [selectedPostventaFilter, setSelectedPostventaFilter] = useState<'TODOS' | 'PENDIENTE' | 'REALIZADO'>('TODOS')
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [preselectedProductId, setPreselectedProductId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const paramProd = params.get('productoId')
      const stored = sessionStorage.getItem('nova_preselected_product_id')
      const prodId = paramProd || stored
      if (prodId) {
        setPreselectedProductId(prodId)
        setIsNewOrderModalOpen(true)
        if (stored) sessionStorage.removeItem('nova_preselected_product_id')
      }
      const paramNew = params.get('new')
      if (paramNew === 'true') {
        setIsNewOrderModalOpen(true)
      }
      const paramSearch = params.get('search') || params.get('cliente')
      if (paramSearch) {
        setSearch(paramSearch)
        setSelectedEstadoFilter('TODOS')
      }
    }
  }, [])

  // Sincronizar clientes si cambian las props iniciales
  useEffect(() => {
    if (clientesIniciales && clientesIniciales.length > 0) {
      setClientesList(clientesIniciales)
    }
  }, [clientesIniciales])

  const [selectedPedidoDetail, setSelectedPedidoDetail] = useState<PedidoView | null>(null)

  // Estado para Edición de Abono
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false)
  const [editingPago, setEditingPago] = useState<EditingPagoState | null>(null)
  const [isSubmittingEditPago, setIsSubmittingEditPago] = useState(false)

  // Estado para Edición / Mantenimiento de Pedido
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoView | null>(null)

  // Estado para Vista de Tabla Interactiva y Paginación
  const [sortField, setSortField] = useState<'fecha' | 'codigo' | 'cliente' | 'cantidad' | 'total' | 'saldoPendiente' | 'estado'>('codigo')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('TODO'))
  const [selectedKpiExplainer, setSelectedKpiExplainer] = useState<string | null>(null)

  // =========================================================================
  // POSTVENTA HANDLERS
  // =========================================================================
  const handleTogglePostventa = async (pedidoId: string, nuevoEstado: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nowIso = new Date().toISOString()
    setPedidos(prev => prev.map(p => {
      if (p.id === pedidoId) {
        return {
          ...p,
          seguimientoPostventa: nuevoEstado,
          fechaPostventa: nuevoEstado ? nowIso : null
        }
      }
      return p
    }))
    if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
      setSelectedPedidoDetail(prev => prev ? {
        ...prev,
        seguimientoPostventa: nuevoEstado,
        fechaPostventa: nuevoEstado ? nowIso : null
      } : null)
    }

    try {
      const res = await toggleSeguimientoPostventa(pedidoId, nuevoEstado)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
      }
    } catch (err) {
      console.error('Error toggling postventa:', err)
    }
  }

  const handleSaveNotasPostventa = async (pedidoId: string, notas: string) => {
    try {
      const target = pedidos.find(p => p.id === pedidoId) || selectedPedidoDetail
      const isPostventa = target ? target.seguimientoPostventa : false
      const res = await toggleSeguimientoPostventa(pedidoId, isPostventa, notas)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
      }
    } catch (err) {
      console.error('Error saving postventa notas:', err)
    }
  }

  // =========================================================================
  // MANTENIMIENTO / EDICIÓN DE PEDIDO
  // =========================================================================
  const handleOpenEditModal = (p: PedidoView) => {
    setEditingPedido(p)
    setIsEditModalOpen(true)
  }

  const handleOrderUpdated = (updatedPedido: PedidoView, newClient?: ClienteOption) => {
    setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? updatedPedido : p))
    if (selectedPedidoDetail?.id === updatedPedido.id) {
      setSelectedPedidoDetail(updatedPedido)
    }
    if (newClient) {
      setClientesList(prev => [newClient, ...prev.filter(c => c.id !== newClient.id)])
    }
  }

  // =========================================================================
  // TRANSICIONAR ESTADO DEL PEDIDO
  // =========================================================================
  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    try {
      const res = await updateEstadoPedido(pedidoId, nuevoEstado)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
      } else {
        alert(res.error || 'Error al cambiar estado')
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado')
    }
  }

  // =========================================================================
  // REGISTRAR ABONO / PAGO A UN PEDIDO DESDE EL MODAL DE DETALLE
  // =========================================================================
  const handleRegistrarAbonoFromDetail = async (data: {
    monto: number
    metodoPago: string
    tipo: string
    notas?: string
    fecha?: string
  }): Promise<boolean> => {
    if (!selectedPedidoDetail) return false
    try {
      const res = await addPagoPedido(selectedPedidoDetail.id, data)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === selectedPedidoDetail.id ? (res.pedido as PedidoView) : p))
        setSelectedPedidoDetail(res.pedido as PedidoView)
        return true
      } else {
        alert(res.error || 'No se pudo registrar el abono')
        return false
      }
    } catch (err: any) {
      alert(err.message || 'Error al registrar abono')
      return false
    }
  }

  // =========================================================================
  // GESTIÓN DE ABONOS (EDITAR / ELIMINAR)
  // =========================================================================
  const handleOpenEditPago = (pago: PagoPedidoView) => {
    const rawF = pago.fecha ? String(pago.fecha) : ''
    const formattedFecha = rawF.includes('T') ? rawF.split('T')[0] : (rawF || formatToYMD(new Date()))
    setEditingPago({
      id: pago.id,
      fecha: formattedFecha,
      monto: String(pago.monto || ''),
      metodoPago: pago.metodoPago || 'YAPE',
      tipo: pago.tipo || 'ABONO',
      notas: pago.notas || '',
      pedidoId: pago.pedidoId
    })
    setIsEditPagoModalOpen(true)
  }

  const handleEditPagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPago) return
    const monto = parseFloat(editingPago.monto)
    if (isNaN(monto) || monto < 0) {
      alert('Ingresa un monto válido mayor o igual a 0.')
      return
    }

    setIsSubmittingEditPago(true)
    try {
      const res = await updatePagoPedido(editingPago.id, {
        fecha: editingPago.fecha,
        monto,
        metodoPago: editingPago.metodoPago,
        tipo: editingPago.tipo,
        notas: editingPago.notas.trim() || undefined
      })

      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === editingPago.pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === editingPago.pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
        setIsEditPagoModalOpen(false)
        setEditingPago(null)
      } else {
        alert(res.error || 'No se pudo actualizar el abono')
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar abono')
    } finally {
      setIsSubmittingEditPago(false)
    }
  }

  const handleDeletePago = async (pagoId: string, pedidoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro de abono? Esta acción recalculará el saldo del pedido.')) return
    try {
      const res = await deletePagoPedido(pagoId)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
      } else {
        alert(res.error || 'No se pudo eliminar el abono')
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el abono')
    }
  }

  // =========================================================================
  // GESTIÓN DE STOCK Y ASIGNACIÓN DE CAJAS DE PACKAGING
  // =========================================================================
  const reloadStockCajas = async () => {
    try {
      const res = await getStockCajas()
      setStockCajas(res)
    } catch (err) {
      console.error('Error reloading box stock:', err)
    }
  }

  const handleAssignBoxes = async (
    pedidoId: string,
    cajas: { inversionId?: string | null; nombreCaja: string; cantidad: number; costoUnitario: number }[]
  ): Promise<boolean> => {
    try {
      const res = await asignarCajasAPedido({ pedidoId, cajas })
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
        await reloadStockCajas()
        toast.success('Cajas asignadas correctamente al pedido')
        return true
      } else {
        toast.error(res.error || 'Error al asignar cajas')
        return false
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar cajas')
      return false
    }
  }

  const handleRemoveBoxes = async (pedidoId: string): Promise<boolean> => {
    try {
      const res = await quitarCajasDePedido(pedidoId)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
        await reloadStockCajas()
        toast.success('Asignación de cajas removida')
        return true
      } else {
        toast.error(res.error || 'Error al remover cajas')
        return false
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al remover cajas')
      return false
    }
  }

  const handleQuickAssignBox = async (pedidoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetLot = stockCajas?.loteReciente50 || stockCajas?.lotes?.find(l => l.stockDisponible > 0)
    if (!targetLot || targetLot.stockDisponible <= 0) {
      toast.error('No hay stock disponible en el inventario de cajas')
      return
    }

    try {
      const res = await asignarCajaRapida(pedidoId, targetLot.id, 1)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as PedidoView) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as PedidoView)
        }
        await reloadStockCajas()
        toast.success(`1 caja asignada al pedido (${targetLot.concepto})`)
      } else {
        toast.error(res.error || 'No se pudo asignar la caja')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar caja')
    }
  }

  // =========================================================================
  // FILTRADO Y KPIS
  // =========================================================================
  const filteredPedidos = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return pedidos.filter(p => {
      if (!isDateInRange(p.fecha, dateRange.from, dateRange.to)) return false

      if (q) {
        const matchSearch = p.cliente.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          (p.telefono && p.telefono.includes(q)) ||
          (p.handleSocial && p.handleSocial.toLowerCase().includes(q)) ||
          (p.destinoEnvio && p.destinoEnvio.toLowerCase().includes(q)) ||
          p.items.some(i => {
            if (i.nombreProductoSnapshot.toLowerCase().includes(q)) return true
            const cols = getItemColors(i, filamentos)
            return cols.some(c => c.nombreColor.toLowerCase().includes(q))
          })

        if (!matchSearch) return false
      }

      if (selectedEstadoFilter !== 'TODOS') {
        if (selectedEstadoFilter === 'ACTIVOS') {
          if (p.estado === 'ENTREGADO' || p.estado === 'CANCELADO') return false
        } else if (selectedEstadoFilter === 'EMPAQUETANDO') {
          if (p.estado !== 'EMPAQUETANDO' && p.estado !== 'LISTO_ENTREGA') return false
        } else if (p.estado !== selectedEstadoFilter) {
          return false
        }
      }

      if (selectedPagoFilter === 'PAGADO' && p.saldoPendiente > 0) return false
      if (selectedPagoFilter === 'PENDIENTE' && p.saldoPendiente <= 0) return false
      if (selectedPagoFilter === 'ANTICIPO' && (p.montoPagado <= 0 || p.saldoPendiente <= 0)) return false

      if (selectedPostventaFilter === 'PENDIENTE' && p.seguimientoPostventa) return false
      if (selectedPostventaFilter === 'REALIZADO' && !p.seguimientoPostventa) return false

      if (selectedCajasFilter === 'CON_CAJA' && (!p.totalCajas || p.totalCajas === 0)) return false
      if (selectedCajasFilter === 'SIN_CAJA' && (p.totalCajas && p.totalCajas > 0)) return false

      return true
    })
  }, [pedidos, debouncedSearch, selectedEstadoFilter, selectedPagoFilter, selectedPostventaFilter, selectedCajasFilter, dateRange, filamentos])

  const statusCounts = useMemo(() => {
    const base = pedidos.filter(p => isDateInRange(p.fecha, dateRange.from, dateRange.to))
    return {
      ACTIVOS: base.filter(p => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO').length,
      EN_PRODUCCION: base.filter(p => p.estado === 'EN_PRODUCCION').length,
      EN_TALLER: base.filter(p => p.estado === 'EN_TALLER').length,
      EMPAQUETANDO: base.filter(p => p.estado === 'EMPAQUETANDO' || p.estado === 'LISTO_ENTREGA').length,
      ENTREGADO: base.filter(p => p.estado === 'ENTREGADO').length,
      TODOS: base.length,
    }
  }, [pedidos, dateRange])

  const handleSort = (field: 'fecha' | 'codigo' | 'cliente' | 'cantidad' | 'total' | 'saldoPendiente' | 'estado') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const sortedPedidos = useMemo(() => {
    return [...filteredPedidos].sort((a, b) => {
      // Prioridad 1: Siempre primero los pedidos NO entregados (activos)
      const getPriority = (estado: string) => {
        if (estado === 'ENTREGADO') return 2
        if (estado === 'CANCELADO') return 3
        return 1
      }

      const priorityDiff = getPriority(a.estado) - getPriority(b.estado)
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      let comparison = 0
      if (sortField === 'codigo') {
        comparison = a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
      } else if (sortField === 'fecha') {
        comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        if (comparison === 0) {
          comparison = a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
        }
      } else if (sortField === 'cliente') {
        comparison = a.cliente.localeCompare(b.cliente)
      } else if (sortField === 'cantidad') {
        comparison = a.totalItemsCount - b.totalItemsCount
      } else if (sortField === 'total') {
        comparison = a.total - b.total
      } else if (sortField === 'saldoPendiente') {
        comparison = a.saldoPendiente - b.saldoPendiente
      } else if (sortField === 'estado') {
        comparison = a.estado.localeCompare(b.estado)
      }

      // Desempate garantizado: siempre desempatar por correlativo de pedido
      if (comparison === 0 && sortField !== 'codigo') {
        comparison = a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredPedidos, sortField, sortOrder])

  const totalPages = Math.ceil(sortedPedidos.length / (itemsPerPage === 9999 ? 1 : itemsPerPage)) || 1
  const paginatedPedidos = useMemo(() => {
    if (itemsPerPage === 9999) return sortedPedidos
    const start = (currentPage - 1) * itemsPerPage
    return sortedPedidos.slice(start, start + itemsPerPage)
  }, [sortedPedidos, currentPage, itemsPerPage])

  const kpis = useMemo(() => {
    const pedidosEnRango = pedidos.filter(p => isDateInRange(p.fecha, dateRange.from, dateRange.to))
    const totalPedidos = pedidosEnRango.length
    const pagoValidados = pedidosEnRango.filter(p => p.estado === 'PAGO_VALIDADO').length
    const enProduccion = pedidosEnRango.filter(p => p.estado === 'EN_PRODUCCION').length
    const enTaller = pedidosEnRango.filter(p => p.estado === 'EN_TALLER').length
    const empaquetando = pedidosEnRango.filter(p => p.estado === 'EMPAQUETANDO' || p.estado === 'LISTO_ENTREGA').length
    const pendientes = pedidosEnRango.filter(p => p.estado === 'PENDIENTE').length
    const listos = pedidosEnRango.filter(p => p.estado === 'LISTO_ENTREGA').length
    const entregados = pedidosEnRango.filter(p => p.estado === 'ENTREGADO').length

    const totalFacturado = pedidosEnRango.filter(p => p.estado !== 'CANCELADO').reduce((s, p) => s + p.total, 0)
    const totalCobrado = pedidosEnRango.reduce((s, p) => s + p.montoPagado, 0)
    const saldoPorCobrar = pedidosEnRango.filter(p => p.estado !== 'CANCELADO').reduce((s, p) => s + p.saldoPendiente, 0)
    const totalPiezas = pedidosEnRango.reduce((s, p) => s + p.totalItemsCount, 0)

    return {
      totalPedidos,
      pagoValidados,
      enProduccion,
      enTaller,
      empaquetando,
      pendientes,
      listos,
      entregados,
      totalFacturado,
      totalCobrado,
      saldoPorCobrar,
      totalPiezas
    }
  }, [pedidos, dateRange])

  const { minFechaData, maxFechaData } = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return { minFechaData: undefined, maxFechaData: undefined }
    let min: string | undefined
    let max: string | undefined
    for (const p of pedidos) {
      if (p.fecha) {
        const fStr = String(p.fecha)
        if (!min || fStr < min) min = fStr
        if (!max || fStr > max) max = fStr
      }
    }
    return { minFechaData: min, maxFechaData: max }
  }, [pedidos])

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Gestión de Pedidos
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground tabular-nums border border-border/50 font-medium">
              {kpis.totalPedidos}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro, control de pagos y envíos por cliente.
          </p>
        </div>

        <Button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="lg:hidden bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-3 h-8 rounded-lg shadow-none transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-[0.98] border-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Pedido</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI CARDS COMPACTAS Y ELEGANTES (5 MÉTRICAS EN GRID SIMÉTRICA)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <KpiCard
          label="Total Pedidos"
          value={kpis.totalPedidos}
          sublabel={`(${kpis.totalPiezas} piezas)`}
          icon={<Boxes className="h-3.5 w-3.5" />}
          onInfoClick={() => setSelectedKpiExplainer('pedidos_total')}
        />
        <KpiCard
          label="Preparando"
          value={kpis.enProduccion + kpis.enTaller}
          sublabel="en taller"
          icon={<Package className="h-3.5 w-3.5" />}
          onInfoClick={() => setSelectedKpiExplainer('pedidos_preparando')}
        />
        <KpiCard
          label="Por Entregar"
          value={kpis.listos}
          sublabel="listos"
          icon={<Truck className="h-3.5 w-3.5" />}
          onInfoClick={() => setSelectedKpiExplainer('pedidos_por_entregar')}
        />
        <KpiCard
          label="Por Cobrar"
          value={formatCurrency(kpis.saldoPorCobrar)}
          sublabel="saldo pendiente"
          icon={<DollarSign className="h-3.5 w-3.5" />}
          onInfoClick={() => setSelectedKpiExplainer('pedidos_por_cobrar')}
        />
        <KpiCard
          label="Cobrado"
          value={formatCurrency(kpis.totalCobrado)}
          sublabel="en caja"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          className="col-span-2 md:col-span-1"
          onInfoClick={() => setSelectedKpiExplainer('pedidos_cobrado')}
        />
      </div>

      {selectedCajasFilter === 'SIN_CAJA' && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtrando:</span>
            <span>Mostrando únicamente pedidos que aún no tienen caja asignada ({filteredPedidos.length} encontrados)</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCajasFilter('TODOS')}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Quitar filtro
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTROS Y BÚSQUEDA (ORDERS FILTER BAR)                                 */}
      {/* ========================================================================= */}
      <OrdersFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        selectedEstadoFilter={selectedEstadoFilter}
        onEstadoFilterChange={(val) => {
          setSelectedEstadoFilter(val)
          setCurrentPage(1)
        }}
        selectedPagoFilter={selectedPagoFilter}
        onPagoFilterChange={(val) => {
          setSelectedPagoFilter(val)
          setCurrentPage(1)
        }}
        dateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range)
          setCurrentPage(1)
        }}
        minDate={minFechaData}
        maxDate={maxFechaData}
        statusCounts={statusCounts}
      />

      {/* ========================================================================= */}
      {/* 4. TABLA DE PEDIDOS (CERO SCROLL HORIZONTAL, TABLE-FIXED W-FULL)          */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/60 rounded-xl shadow-none overflow-hidden">
        {filteredPedidos.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No se encontraron pedidos"
            description="No hay pedidos que coincidan con los filtros de búsqueda o fecha seleccionados."
            action={
              (search || selectedEstadoFilter !== 'ACTIVOS' || selectedPagoFilter !== 'TODOS' || selectedPostventaFilter !== 'TODOS') ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setSelectedEstadoFilter('ACTIVOS')
                    setSelectedPagoFilter('TODOS')
                    setSelectedPostventaFilter('TODOS')
                    setDateRange(getPresetDateRange('TODO'))
                    setCurrentPage(1)
                  }}
                  className="rounded-lg border-border"
                >
                  Restablecer filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Vista Desktop (>= lg): Tabla table-fixed con CERO scroll horizontal */}
            <div className="hidden lg:block w-full overflow-hidden">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-muted/20 border-b border-border/60 text-[11px] font-medium text-muted-foreground tracking-wider uppercase select-none">
                  <TableRow className="border-none hover:bg-transparent">
                    {/* 1. PEDIDO (12% / pl-5) */}
                    <TableHead className="w-[12%] pl-5 pr-3 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('codigo')}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer tracking-wider uppercase select-none"
                      >
                        <span>PEDIDO</span>
                        {sortField === 'codigo' || sortField === 'fecha' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableHead>

                    {/* 2. CLIENTE (17% / px-3) */}
                    <TableHead className="w-[17%] px-3 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('cliente')}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer tracking-wider uppercase select-none"
                      >
                        <span>CLIENTE</span>
                        {sortField === 'cliente' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableHead>

                    {/* 3. PRODUCTOS & FILAMENTOS (21% / px-3) */}
                    <TableHead className="w-[21%] px-3 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('cantidad')}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer tracking-wider uppercase select-none"
                      >
                        <span>PRODUCTOS & FILAMENTOS</span>
                        {sortField === 'cantidad' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableHead>

                    {/* 4. ENTREGA & DESTINO (15% / px-3) */}
                    <TableHead className="w-[15%] px-3 py-3 text-left text-[11px] font-medium text-muted-foreground tracking-wider uppercase select-none">
                      <span>ENTREGA & DESTINO</span>
                    </TableHead>

                    {/* 5. ESTADO & POSTVENTA (17% / px-3) */}
                    <TableHead className="w-[17%] px-3 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('estado')}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer tracking-wider uppercase select-none"
                      >
                        <span>ESTADO & POSTVENTA</span>
                        {sortField === 'estado' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableHead>

                    {/* 6. TOTAL & BALANCE (18% / pr-5) */}
                    <TableHead className="w-[18%] pl-3 pr-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('total')}
                        className="inline-flex items-center justify-end gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer tracking-wider uppercase select-none"
                      >
                        <span>TOTAL & BALANCE</span>
                        {sortField === 'total' || sortField === 'saldoPendiente' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedPedidos.map((p) => (
                    <OrderRow
                      key={p.id}
                      pedido={p}
                      filamentos={filamentos}
                      onSelectPedido={setSelectedPedidoDetail}
                      onCambiarEstado={handleCambiarEstado}
                      onTogglePostventa={handleTogglePostventa}
                      onQuickAssignBox={handleQuickAssignBox}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vista Móvil (< lg): Tarjetas Touch-Friendly Fluidas (CERO scroll horizontal) */}
            <div className="block lg:hidden p-3 space-y-3">
              {paginatedPedidos.map((p) => (
                <OrderCardMobile
                  key={p.id}
                  pedido={p}
                  filamentos={filamentos}
                  onSelectPedido={setSelectedPedidoDetail}
                  onCambiarEstado={handleCambiarEstado}
                  onTogglePostventa={handleTogglePostventa}
                  onQuickAssignBox={handleQuickAssignBox}
                />
              ))}
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* PIE DE TABLA: SELECTOR DE REGISTROS Y PAGINACIÓN AL PIE                    */}
        {/* ========================================================================= */}
        {filteredPedidos.length > 0 && (
          <div className="p-3 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs font-medium text-foreground cursor-pointer focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-muted-foreground ml-1">
                de <strong className="text-foreground tabular-nums">{sortedPedidos.length}</strong> pedidos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">
                Página <span className="tabular-nums">{currentPage}</span> de <span className="tabular-nums">{Math.max(1, totalPages)}</span>
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: NUEVO PEDIDO MULTIPRODUCTO (1 O MÁS PRODUCTOS)                  */}
      {/* ========================================================================= */}
      <RegisterMultiProductOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false)
          setPreselectedProductId(undefined)
        }}
        productos={productos}
        filamentos={filamentos}
        clientesList={clientesList}
        stockCajas={stockCajas}
        initialProductoId={preselectedProductId}
        onOrderCreated={(newPedido, newClient) => {
          setPedidos(prev => [newPedido as any, ...prev])
          if (newClient) {
            setClientesList(prev => [newClient, ...prev])
          }
          reloadStockCajas()
        }}
        onClientAdded={(newClient) => {
          setClientesList(prev => [newClient, ...prev.filter(c => c.id !== newClient.id)])
        }}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: DETALLE Y TICKET DE PEDIDO (PRINT / WHATSAPP / ABONOS)          */}
      {/* ========================================================================= */}
      <OrderDetailModal
        pedido={selectedPedidoDetail}
        filamentos={filamentos}
        stockCajas={stockCajas}
        isOpen={!!selectedPedidoDetail}
        onClose={() => setSelectedPedidoDetail(null)}
        onEditOrder={handleOpenEditModal}
        onTogglePostventa={handleTogglePostventa}
        onSaveNotasPostventa={handleSaveNotasPostventa}
        onOpenEditPago={handleOpenEditPago}
        onDeletePago={handleDeletePago}
        onRegistrarAbono={handleRegistrarAbonoFromDetail}
        onAssignBoxes={handleAssignBoxes}
        onRemoveBoxes={handleRemoveBoxes}
      />

      {/* ========================================================================= */}
      {/* 6.5. MODAL MODULAR: EDITAR FECHA / MONTO DE ABONO                        */}
      {/* ========================================================================= */}
      <EditPagoModal
        isOpen={isEditPagoModalOpen}
        onClose={() => {
          setIsEditPagoModalOpen(false)
          setEditingPago(null)
        }}
        editingPago={editingPago}
        setEditingPago={setEditingPago}
        onSubmit={handleEditPagoSubmit}
        isSubmitting={isSubmittingEditPago}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL: EDITAR / MANTENIMIENTO DE PEDIDO                                */}
      {/* ========================================================================= */}
      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPedido(null)
        }}
        editingPedido={editingPedido}
        productos={productos}
        filamentos={filamentos}
        clientesList={clientesList}
        stockCajas={stockCajas}
        onOrderUpdated={(updated, client) => {
          handleOrderUpdated(updated, client)
          reloadStockCajas()
        }}
      />

      {/* ========================================================================= */}
      {/* 8. MODAL: HISTORIAL DE COMPRAS Y LOTES DE CAJAS                           */}
      {/* ========================================================================= */}
      <BoxLotsModal
        isOpen={isBoxLotsModalOpen}
        onClose={() => setIsBoxLotsModalOpen(false)}
        stockCajas={stockCajas}
        onSelectOrder={(pedidoId) => {
          setIsBoxLotsModalOpen(false)
          const p = pedidos.find(item => item.id === pedidoId)
          if (p) setSelectedPedidoDetail(p)
        }}
      />

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
