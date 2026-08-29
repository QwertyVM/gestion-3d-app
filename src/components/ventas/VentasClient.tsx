'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Check, 
  Search, 
  X, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  Truck, 
  DollarSign, 
  Package, 
  ChevronLeft,
  ChevronRight,
  Box,
  Calculator,
  Percent,
  Loader2,
  Tag,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import { 
  updateEstadoVenta, 
  registrarAbono, 
  liquidarSaldoTotal, 
  createVenta 
} from '@/actions/ventas'
import { toast } from 'sonner'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'

export interface VentaItem {
  id: string
  fecha: string
  cliente: string
  productoId: string
  costoBaseSnapshot?: number
  nombreProductoSnapshot?: string
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  total: number
  montoPagado: number
  saldoPendiente: number
  costoPackaging?: number
  porcentajeAdicional?: number
  estado: EstadoVenta
  diaEntregaPrometida?: string | null
  destinoEnvio?: string | null
  canalVenta?: string | null
  createdAt: string
  updatedAt: string
  producto: {
    id: string
    nombreModelo: string
    lineaCategoria: string
    costoBase: number
    precioAmigos: number
    precioMercado: number
    precioComunidad: number
  }
}

export interface ProductoOption {
  id: string
  nombreModelo: string
  lineaCategoria: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad: number
  activo: boolean
}

interface VentasClientProps {
  ventas: VentaItem[]
  productos?: ProductoOption[]
  promedioPackaging?: number
}

const ITEMS_PER_PAGE = 7

export function VentasClient({ 
  ventas, 
  productos = [], 
  promedioPackaging = 9.80 
}: VentasClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<VentaItem[]>(ventas)

  useEffect(() => {
    setItems(ventas)
  }, [ventas])

  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS')
  const [pagoFilter, setPagoFilter] = useState<'TODOS' | 'PENDIENTES_PAGO' | 'PAGADOS'>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [selectedVenta, setSelectedVenta] = useState<VentaItem | null>(null)
  const [openDetailsModal, setOpenDetailsModal] = useState(false)
  const [openAbonoModal, setOpenAbonoModal] = useState(false)
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Abono form state
  const [montoAbono, setMontoAbono] = useState('')

  // Create order form state
  const [formCliente, setFormCliente] = useState('')
  const [formProductoId, setFormProductoId] = useState(productos[0]?.id || '')
  const [formCantidad, setFormCantidad] = useState('1')
  const [formTipoPrecio, setFormTipoPrecio] = useState<TipoPrecio>('COMUNIDAD')
  const [formPrecioBase, setFormPrecioBase] = useState('0')
  const [formPrecioUnitario, setFormPrecioUnitario] = useState('')
  const [formMontoPagado, setFormMontoPagado] = useState('')
  const [formEstado, setFormEstado] = useState<EstadoVenta>('PENDIENTE')
  const [formCanalVenta, setFormCanalVenta] = useState('Instagram')
  const [formDestinoEnvio, setFormDestinoEnvio] = useState('')
  const [formDiaEntrega, setFormDiaEntrega] = useState('')

  // Packaging Base & Percentage states
  const [incluirPackaging, setIncluirPackaging] = useState(false)
  const [montoPackagingBase, setMontoPackagingBase] = useState(promedioPackaging.toFixed(2))
  const [porcentajePackaging, setPorcentajePackaging] = useState('10')

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Financial KPIs
  const totalPedidos = items.length
  const totalCobrado = useMemo(() => items.reduce((acc, v) => acc + (v.montoPagado || 0), 0), [items])
  const totalSaldoPendiente = useMemo(() => items.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0), [items])
  const entregadosCount = useMemo(() => items.filter(v => v.estado === 'ENTREGADO').length, [items])
  const enProduccionCount = useMemo(() => items.filter(v => v.estado === 'EN_PRODUCCION' || v.estado === 'PENDIENTE').length, [items])

  // Filtered sales
  const filteredVentas = useMemo(() => {
    return items.filter(v => {
      const matchSearch = 
        v.cliente.toLowerCase().includes(search.toLowerCase()) || 
        v.producto.nombreModelo.toLowerCase().includes(search.toLowerCase()) ||
        (v.canalVenta && v.canalVenta.toLowerCase().includes(search.toLowerCase())) ||
        (v.destinoEnvio && v.destinoEnvio.toLowerCase().includes(search.toLowerCase()))

      const matchEstado = estadoFilter === 'TODOS' || v.estado === estadoFilter

      let matchPago = true
      if (pagoFilter === 'PENDIENTES_PAGO') matchPago = v.saldoPendiente > 0
      if (pagoFilter === 'PAGADOS') matchPago = v.saldoPendiente <= 0

      return matchSearch && matchEstado && matchPago
    })
  }, [items, search, estadoFilter, pagoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVentas.length / ITEMS_PER_PAGE))
  const paginatedVentas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredVentas.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredVentas, currentPage])

  // Prorrateo de Packaging
  const montoProrrateoPackaging = useMemo(() => {
    const packBase = parseFloat(montoPackagingBase) || 0
    const pct = parseFloat(porcentajePackaging) || 0
    return Number(((packBase * pct) / 100).toFixed(2))
  }, [montoPackagingBase, porcentajePackaging])

  // Suggested Unit Price
  const precioSugeridoCalculado = useMemo(() => {
    const base = parseFloat(formPrecioBase) || 0
    const packProrrateado = incluirPackaging ? montoProrrateoPackaging : 0
    return Number((base + packProrrateado).toFixed(2))
  }, [formPrecioBase, incluirPackaging, montoProrrateoPackaging])

  // Combobox items definitions
  const productosComboboxItems: ComboboxItem[] = useMemo(() => {
    return productos.map(p => ({
      id: p.id,
      label: p.nombreModelo,
      sublabel: `${p.lineaCategoria} • Costo Base: S/ ${p.costoBase.toFixed(2)}`,
      badge: `S/ ${p.precioComunidad.toFixed(2)}`,
      icon: Package,
    }))
  }, [productos])

  const nivelesPrecioComboboxItems: ComboboxItem[] = useMemo(() => [
    { id: 'AMIGOS', label: '1. Precio Amigo', sublabel: 'Margen preferencial', badge: '35% margen' },
    { id: 'MERCADO', label: '2. Precio Mercado', sublabel: 'Precio estándar venta', badge: '60% margen' },
    { id: 'COMUNIDAD', label: '3. Precio Comunidad', sublabel: 'Precio seguidores / comunidad', badge: '80% margen' },
    { id: 'PERSONALIZADO', label: '4. Personalizado', sublabel: 'Monto ingresado manualmente' },
  ], [])

  const pagoFilterComboboxItems: ComboboxItem[] = useMemo(() => [
    { id: 'TODOS', label: 'Todos los Pagos' },
    { id: 'PENDIENTES_PAGO', label: 'Por Cobrar', badge: `${items.filter(v => v.saldoPendiente > 0).length}` },
    { id: 'PAGADOS', label: '100% Pagados', badge: `${items.filter(v => v.saldoPendiente <= 0).length}` },
  ], [items])

  // Selected product helper
  const selectedProduct = useMemo(() => {
    return productos.find(p => p.id === formProductoId)
  }, [productos, formProductoId])

  // Change order status directly
  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoVenta, e?: React.ChangeEvent<HTMLSelectElement> | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation()
    try {
      setItems(prev => prev.map(v => v.id === id ? { ...v, estado: nuevoEstado } : v))
      await updateEstadoVenta(id, nuevoEstado)
      if (selectedVenta && selectedVenta.id === id) {
        setSelectedVenta(prev => prev ? { ...prev, estado: nuevoEstado } : null)
      }
      toast.success(`Estado actualizado a ${nuevoEstado}`)
      router.refresh()
    } catch (err) {
      toast.error('Error al cambiar el estado del pedido')
    }
  }

  // Settle full payment (100% pagado)
  const handleLiquidarTotal = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setItems(prev => prev.map(v => v.id === id ? { ...v, montoPagado: v.total, saldoPendiente: 0 } : v))
      await liquidarSaldoTotal(id)
      if (selectedVenta && selectedVenta.id === id) {
        setSelectedVenta(prev => prev ? { ...prev, montoPagado: prev.total, saldoPendiente: 0 } : null)
      }
      toast.success('¡Pedido marcado como 100% Pagado!')
      setOpenAbonoModal(false)
      router.refresh()
    } catch (err) {
      toast.error('Error al liquidar el pago')
    }
  }

  // Register partial payment
  const handleRegistrarAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVenta) return
    const monto = parseFloat(montoAbono)
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto de abono válido')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await registrarAbono(selectedVenta.id, monto)
      setItems(prev => prev.map(v => v.id === selectedVenta.id ? { ...v, montoPagado: updated.montoPagado, saldoPendiente: updated.saldoPendiente } : v))
      toast.success(`Abono de ${formatCurrency(monto)} registrado con éxito`)
      setOpenAbonoModal(false)
      setMontoAbono('')
      setOpenDetailsModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar abono')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Abono Modal
  const handleOpenAbono = (v: VentaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedVenta(v)
    setMontoAbono(v.saldoPendiente.toString())
    setOpenAbonoModal(true)
  }

  // Open Details Modal
  const handleOpenDetails = (v: VentaItem) => {
    setSelectedVenta(v)
    setOpenDetailsModal(true)
  }

  // Bidirectional Synchronization: Product or Tier selected
  const handleProductoOrTierChange = (prodId: string, tier: TipoPrecio) => {
    setFormProductoId(prodId)
    setFormTipoPrecio(tier)
    const found = productos.find(p => p.id === prodId)
    if (found) {
      const pack = incluirPackaging ? montoProrrateoPackaging : 0
      let base = found.precioComunidad
      if (tier === 'AMIGOS') base = found.precioAmigos
      else if (tier === 'MERCADO') base = found.precioMercado
      else if (tier === 'COMUNIDAD') base = found.precioComunidad

      setFormPrecioBase(base.toString())
      if (tier !== 'PERSONALIZADO') {
        const finalUnit = Number((base + pack).toFixed(2))
        setFormPrecioUnitario(finalUnit.toString())
      }
    }
  }

  // Bidirectional Synchronization: Manual Unit Price Input Change
  const handlePrecioUnitarioChange = (valStr: string) => {
    setFormPrecioUnitario(valStr)
    const num = parseFloat(valStr)
    if (isNaN(num) || !selectedProduct) {
      setFormTipoPrecio('PERSONALIZADO')
      return
    }

    const pack = incluirPackaging ? montoProrrateoPackaging : 0
    const pAmigos = Number((selectedProduct.precioAmigos + pack).toFixed(2))
    const pMercado = Number((selectedProduct.precioMercado + pack).toFixed(2))
    const pComunidad = Number((selectedProduct.precioComunidad + pack).toFixed(2))

    // Compare with tolerance of 0.005
    if (Math.abs(num - pAmigos) < 0.005) {
      setFormTipoPrecio('AMIGOS')
      setFormPrecioBase(selectedProduct.precioAmigos.toString())
    } else if (Math.abs(num - pMercado) < 0.005) {
      setFormTipoPrecio('MERCADO')
      setFormPrecioBase(selectedProduct.precioMercado.toString())
    } else if (Math.abs(num - pComunidad) < 0.005) {
      setFormTipoPrecio('COMUNIDAD')
      setFormPrecioBase(selectedProduct.precioComunidad.toString())
    } else {
      setFormTipoPrecio('PERSONALIZADO')
    }
  }

  // Packaging toggle with price recalculation
  const handleTogglePackaging = (checked: boolean) => {
    setIncluirPackaging(checked)
    if (!selectedProduct) return
    const packBase = parseFloat(montoPackagingBase) || 0
    const pct = parseFloat(porcentajePackaging) || 0
    const pack = checked ? Number(((packBase * pct) / 100).toFixed(2)) : 0

    if (formTipoPrecio === 'AMIGOS') {
      setFormPrecioUnitario((selectedProduct.precioAmigos + pack).toFixed(2))
    } else if (formTipoPrecio === 'MERCADO') {
      setFormPrecioUnitario((selectedProduct.precioMercado + pack).toFixed(2))
    } else if (formTipoPrecio === 'COMUNIDAD') {
      setFormPrecioUnitario((selectedProduct.precioComunidad + pack).toFixed(2))
    }
  }

  // Packaging percentage select with price recalculation
  const handleSelectPackagingPct = (pct: string) => {
    setPorcentajePackaging(pct)
    if (!selectedProduct || !incluirPackaging) return
    const packBase = parseFloat(montoPackagingBase) || 0
    const pNum = parseFloat(pct) || 0
    const pack = Number(((packBase * pNum) / 100).toFixed(2))

    if (formTipoPrecio === 'AMIGOS') {
      setFormPrecioUnitario((selectedProduct.precioAmigos + pack).toFixed(2))
    } else if (formTipoPrecio === 'MERCADO') {
      setFormPrecioUnitario((selectedProduct.precioMercado + pack).toFixed(2))
    } else if (formTipoPrecio === 'COMUNIDAD') {
      setFormPrecioUnitario((selectedProduct.precioComunidad + pack).toFixed(2))
    }
  }

  // Steppers for quantity
  const handleIncrementCantidad = () => {
    const current = parseInt(formCantidad) || 1
    setFormCantidad((current + 1).toString())
  }

  const handleDecrementCantidad = () => {
    const current = parseInt(formCantidad) || 1
    if (current > 1) {
      setFormCantidad((current - 1).toString())
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    const firstProd = productos[0]
    const defaultPrice = firstProd?.precioComunidad || 135
    setFormCliente('')
    setFormProductoId(firstProd?.id || '')
    setFormCantidad('1')
    setFormTipoPrecio('COMUNIDAD')
    setFormPrecioBase(defaultPrice.toString())
    setFormPrecioUnitario(defaultPrice.toString())
    setFormMontoPagado('0')
    setFormEstado('PENDIENTE')
    setFormCanalVenta('Instagram')
    setFormDestinoEnvio('')
    setFormDiaEntrega('')
    setIncluirPackaging(false)
    setMontoPackagingBase(promedioPackaging.toFixed(2))
    setPorcentajePackaging('10')
    setOpenCreateModal(true)
  }

  // Apply suggested calculated price
  const handleAplicarPrecioSugerido = () => {
    setFormPrecioUnitario(precioSugeridoCalculado.toString())
    if (selectedProduct) {
      handlePrecioUnitarioChange(precioSugeridoCalculado.toString())
    }
    toast.success(`Precio unitario actualizado a ${formatCurrency(precioSugeridoCalculado)}`)
  }

  // Submit Create Order
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.trim() || !formProductoId || !formPrecioUnitario) {
      toast.error('Por favor completa el cliente, producto y precio unitario')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createVenta({
        cliente: formCliente.trim(),
        productoId: formProductoId,
        cantidad: parseInt(formCantidad) || 1,
        tipoPrecio: formTipoPrecio,
        precioUnitario: parseFloat(formPrecioUnitario) || 0,
        montoPagado: parseFloat(formMontoPagado) || 0,
        costoPackaging: incluirPackaging ? montoProrrateoPackaging : 0,
        porcentajeAdicional: incluirPackaging ? (parseFloat(porcentajePackaging) || 0) : 0,
        estado: formEstado,
        canalVenta: formCanalVenta.trim() || undefined,
        destinoEnvio: formDestinoEnvio.trim() || undefined,
        diaEntregaPrometida: formDiaEntrega.trim() || undefined,
      })

      const prod = productos.find(p => p.id === formProductoId)
      const fullCreated = {
        ...created,
        producto: prod || {
          id: formProductoId,
          nombreModelo: 'Producto',
          lineaCategoria: 'General',
          costoBase: 0,
          precioAmigos: 0,
          precioMercado: 0,
          precioComunidad: 0,
        }
      }

      setItems(prev => [fullCreated as any, ...prev])
      toast.success('Pedido registrado exitosamente')
      setOpenCreateModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              <ShoppingCart className="h-6 w-6 stroke-[2.5]" />
            </div>
            Ventas y Pedidos
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Gestión comercial de pedidos, cobranzas, entregas y prorrateo de packaging del taller.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer rounded-xl px-4 py-2.5 text-xs h-10 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
          Nuevo Pedido
        </Button>
      </div>

      {/* KPI Cards Light Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-2">
            <Package className="h-4 w-4" />
            Total Pedidos
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">{totalPedidos}</div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Historial comercial general</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Total Cobrado
          </span>
          <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono mt-1">
            {formatCurrency(totalCobrado)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Ingreso efectivo a caja</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D1F] flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Saldos por Cobrar
          </span>
          <div className="text-2xl font-extrabold text-[#8C6D1F] font-mono mt-1">
            {formatCurrency(totalSaldoPendiente)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Pendiente de liquidación</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#633E20] flex items-center gap-2">
            <Truck className="h-4 w-4" />
            En Proceso / Entregados
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {enProduccionCount} <span className="text-sm font-normal text-[#75695D]">/ {entregadosCount} entregados</span>
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Flujo de producción en taller</span>
        </div>
      </div>

      {/* 1-Row Compact Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Lado Izquierdo: Campo de Búsqueda */}
        <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar por cliente, modelo, canal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs md:text-sm rounded-xl h-9 focus:border-[#A36F4C] focus:ring-1 focus:ring-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
          />
          {search && (
            <button 
              onClick={() => { setSearch(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Lado Derecho: Segmented Control Tabs & Dropdown de Pago */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Segmented Control / Tabs */}
          <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] overflow-x-auto max-w-full">
            <button
              onClick={() => { setEstadoFilter('TODOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                estadoFilter === 'TODOS'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => { setEstadoFilter('PENDIENTE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                estadoFilter === 'PENDIENTE'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Pendientes ({items.filter(v => v.estado === 'PENDIENTE').length})
            </button>
            <button
              onClick={() => { setEstadoFilter('EN_PRODUCCION'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                estadoFilter === 'EN_PRODUCCION'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              En Producción ({items.filter(v => v.estado === 'EN_PRODUCCION').length})
            </button>
            <button
              onClick={() => { setEstadoFilter('ENTREGADO'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                estadoFilter === 'ENTREGADO'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Entregados ({items.filter(v => v.estado === 'ENTREGADO').length})
            </button>
          </div>

          {/* Combobox Interactivo para Estado de Pago */}
          <div className="w-full sm:w-52 flex-shrink-0">
            <SearchableCombobox
              items={pagoFilterComboboxItems}
              value={pagoFilter}
              onChange={(val) => {
                setPagoFilter(val as any || 'TODOS')
                setCurrentPage(1)
              }}
              size="sm"
              icon={DollarSign}
              placeholder="Estado de Pago..."
              clearable={false}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Orders Table Light Mode */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="w-full min-w-[700px]">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
            <TableRow className="border-[#E2D9CC] hover:bg-transparent">
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Cliente & Canal</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Modelo / Producto</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Estado Pedido</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Total</TableHead>
              <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Cobranza / Saldo</TableHead>
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-center">Acciones de Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-[#75695D]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShoppingCart className="h-8 w-8 text-[#A89B8D]" />
                    <span>No se encontraron pedidos con los filtros seleccionados</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedVentas.map((v) => {
                const isPaid = v.saldoPendiente <= 0

                return (
                  <TableRow 
                    key={v.id} 
                    onClick={() => handleOpenDetails(v)}
                    className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                  >
                    {/* Fecha */}
                    <TableCell className="px-4 py-3 text-xs text-[#75695D] font-mono whitespace-nowrap">
                      {formatDate(v.fecha)}
                    </TableCell>

                    {/* Cliente */}
                    <TableCell className="px-3 py-3 font-bold text-[#241C15]">
                      <div className="flex flex-col">
                        <span className="text-sm group-hover:text-[#A36F4C] transition-colors">{v.cliente}</span>
                        {v.canalVenta && (
                          <span className="text-[11px] text-[#75695D] font-normal">{v.canalVenta}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Producto & Extras */}
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#241C15]">{v.producto.nombreModelo}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#75695D] flex-wrap mt-0.5">
                          <span>{v.cantidad}x • {v.tipoPrecio}</span>
                          {v.costoPackaging && v.costoPackaging > 0 ? (
                            <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[9px] py-0 px-1 font-bold">
                              +Pack S/{v.costoPackaging.toFixed(1)}
                            </Badge>
                          ) : null}
                          {v.porcentajeAdicional && v.porcentajeAdicional > 0 ? (
                            <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[9px] py-0 px-1 font-bold">
                              +{v.porcentajeAdicional}%
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    {/* Selector de Estado interactivo directo */}
                    <TableCell className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={v.estado}
                        onChange={(e) => handleCambiarEstado(v.id, e.target.value as EstadoVenta)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1 border transition-all cursor-pointer focus:outline-none shadow-sm ${
                          v.estado === 'ENTREGADO'
                            ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                            : v.estado === 'EN_PRODUCCION'
                            ? 'bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]'
                            : v.estado === 'PENDIENTE'
                            ? 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'
                            : 'bg-[#FDF2F0] text-[#A34335] border-[#F2C0B8]'
                        }`}
                      >
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PRODUCCION">En Producción</option>
                        <option value="ENTREGADO">Entregado</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </TableCell>

                    {/* Total */}
                    <TableCell className="px-3 py-3 text-right font-mono font-extrabold text-[#241C15] whitespace-nowrap">
                      {formatCurrency(v.total)}
                    </TableCell>

                    {/* Cobranza y Saldo */}
                    <TableCell className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-xs text-[#75695D]">
                          Pagado: <span className="font-bold text-[#1E5E3A]">{formatCurrency(v.montoPagado)}</span>
                        </span>
                        {v.saldoPendiente > 0 ? (
                          <span className="font-mono text-xs text-[#8C6D1F] font-bold">
                            Debe: {formatCurrency(v.saldoPendiente)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#1E5E3A] font-bold flex items-center gap-0.5">
                            <Check className="h-3 w-3 stroke-[2.5]" /> 100% Pagado
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Acciones de Pago */}
                    <TableCell className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {isPaid ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs gap-1 font-bold">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          Pagado
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={(e) => handleOpenAbono(v, e)}
                            className="h-7 px-2.5 bg-[#FDF6E2] hover:bg-[#F9ECC7] text-[#8C6D1F] border border-[#E8D49B] text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                            title="Registrar abono de dinero"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                            Abonar
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleLiquidarTotal(v.id, e)}
                            className="h-7 px-2.5 bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                            title="Marcar como 100% Pagado"
                          >
                            <Check className="h-3.5 w-3.5 mr-0.5 stroke-[2.5]" />
                            Ya pagó
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#F4EFEA] text-xs text-[#75695D]">
            <div>
              Mostrando página <span className="text-[#241C15] font-bold">{currentPage}</span> de <span className="text-[#241C15] font-bold">{totalPages}</span> ({filteredVentas.length} pedidos)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#A36F4C] text-white shadow-sm'
                        : 'bg-[#FFFFFF] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-sm"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: FICHA Y GESTIÓN COMPLETA DEL PEDIDO                                */}
      {/* ========================================================================= */}
      <Dialog open={openDetailsModal} onOpenChange={setOpenDetailsModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[560px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          {selectedVenta && (
            <>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                    <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[#633E20] border-[#D4BEA7] bg-[#EFE5D8] text-[10px] font-bold">
                        {selectedVenta.producto.lineaCategoria}
                      </Badge>
                      {selectedVenta.saldoPendiente <= 0 ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] gap-1 font-bold">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          100% Pagado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold">
                          <Clock className="h-2.5 w-2.5" />
                          Saldo: {formatCurrency(selectedVenta.saldoPendiente)}
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-lg font-bold text-[#241C15] tracking-tight">
                      Pedido de {selectedVenta.cliente}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#75695D]">
                      {selectedVenta.producto.nombreModelo} • {selectedVenta.cantidad} {selectedVenta.cantidad === 1 ? 'unidad' : 'unidades'} ({selectedVenta.tipoPrecio})
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenDetailsModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Resumen Financiero */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6]">
                  <div>
                    <span className="text-[10px] text-[#75695D] uppercase font-bold">Total Pedido</span>
                    <div className="text-lg font-extrabold text-[#241C15] font-mono mt-0.5">
                      {formatCurrency(selectedVenta.total)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#1E5E3A] uppercase font-bold">Monto Pagado</span>
                    <div className="text-lg font-extrabold text-[#1E5E3A] font-mono mt-0.5">
                      {formatCurrency(selectedVenta.montoPagado)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C6D1F] uppercase font-bold">Saldo Pendiente</span>
                    <div className="text-lg font-extrabold text-[#8C6D1F] font-mono mt-0.5">
                      {formatCurrency(selectedVenta.saldoPendiente)}
                    </div>
                  </div>
                </div>

                {/* Prorrateos y Margen Registrado */}
                {(selectedVenta.costoPackaging || selectedVenta.porcentajeAdicional) ? (
                  <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] text-xs space-y-1">
                    <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
                      Desglose de Prorrateo & Margen
                    </span>
                    <div className="flex items-center gap-4 text-[#241C15]">
                      {selectedVenta.costoPackaging ? (
                        <span>Prorrateo Packaging: <strong className="text-[#8C6D1F]">{formatCurrency(selectedVenta.costoPackaging)}</strong> / ud</span>
                      ) : null}
                      {selectedVenta.porcentajeAdicional ? (
                        <span>Margen Adicional: <strong className="text-[#A36F4C]">+{selectedVenta.porcentajeAdicional}%</strong></span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Datos de Entrega y Envío */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#75695D] block mb-1">
                    Logística & Entrega
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[#241C15]">
                    <div>
                      <span className="text-[#75695D] block text-[11px]">Canal de Venta:</span>
                      <span className="font-semibold">{selectedVenta.canalVenta || 'Directo'}</span>
                    </div>
                    <div>
                      <span className="text-[#75695D] block text-[11px]">Destino de Envío:</span>
                      <span className="font-semibold">{selectedVenta.destinoEnvio || 'Recojo en taller'}</span>
                    </div>
                  </div>
                  {selectedVenta.diaEntregaPrometida && (
                    <div className="pt-1 text-[#241C15]">
                      <span className="text-[#75695D] block text-[11px]">Promesa de Entrega:</span>
                      <span className="font-bold text-[#A36F4C]">{selectedVenta.diaEntregaPrometida}</span>
                    </div>
                  )}
                </div>

                {/* Cambiar Estado del Pedido */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">
                    Cambiar Estado del Pedido
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['PENDIENTE', 'EN_PRODUCCION', 'ENTREGADO', 'CANCELADO'] as EstadoVenta[]).map((est) => (
                      <button
                        key={est}
                        type="button"
                        onClick={() => handleCambiarEstado(selectedVenta.id, est)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedVenta.estado === est
                            ? est === 'ENTREGADO'
                              ? 'bg-[#1E5E3A] text-white border-[#1E5E3A] shadow-sm'
                              : est === 'EN_PRODUCCION'
                              ? 'bg-[#A36F4C] text-white border-[#A36F4C] shadow-sm'
                              : est === 'PENDIENTE'
                              ? 'bg-[#8C6D1F] text-white border-[#8C6D1F] shadow-sm'
                              : 'bg-[#A34335] text-white border-[#A34335]'
                            : 'bg-[#F4EFEA] border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        {est === 'PENDIENTE' ? 'Pendiente' : est === 'EN_PRODUCCION' ? 'Producción' : est === 'ENTREGADO' ? 'Entregado' : 'Cancelado'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botones de Gestión de Pago */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E2D9CC]">
                  {selectedVenta.saldoPendiente > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setMontoAbono(selectedVenta.saldoPendiente.toString())
                          setOpenAbonoModal(true)
                        }}
                        className="bg-[#FDF6E2] hover:bg-[#F9ECC7] text-[#8C6D1F] border border-[#E8D49B] text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Registrar Abono
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleLiquidarTotal(selectedVenta.id)}
                        className="bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                      >
                        <Check className="h-4 w-4 mr-1 stroke-[2.5]" />
                        Liquidar 100% (Ya Pagó)
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#1E5E3A] font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Pago Completado
                    </span>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenDetailsModal(false)}
                    className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs rounded-xl cursor-pointer font-medium"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ABONO / PAGO                                             */}
      {/* ========================================================================= */}
      <Dialog open={openAbonoModal} onOpenChange={setOpenAbonoModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[420px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          {selectedVenta && (
            <>
              <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] flex items-center justify-center text-[#1E5E3A] shadow-sm">
                    <DollarSign className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                      Registrar Cobro / Abono
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#75695D]">
                      Cliente: <strong className="text-[#241C15]">{selectedVenta.cliente}</strong> • Saldo: <strong className="text-[#8C6D1F]">{formatCurrency(selectedVenta.saldoPendiente)}</strong>
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenAbonoModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRegistrarAbonoSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Monto a Abonar (S/) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-[#75695D]">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedVenta.saldoPendiente}
                      value={montoAbono}
                      onChange={(e) => setMontoAbono(e.target.value)}
                      placeholder="0.00"
                      required
                      autoFocus
                      className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono font-extrabold text-lg rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#75695D] pt-1">
                    <span>Monto sugerido (100% saldo):</span>
                    <button
                      type="button"
                      onClick={() => setMontoAbono(selectedVenta.saldoPendiente.toString())}
                      className="text-[#A36F4C] hover:underline font-bold cursor-pointer"
                    >
                      Pagar todo ({formatCurrency(selectedVenta.saldoPendiente)})
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenAbonoModal(false)}
                    className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !montoAbono || parseFloat(montoAbono) <= 0}
                    className="bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Confirmar Cobro'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: NUEVO PEDIDO CON PRORRATEO DE PACKAGING Y MARGEN                   */}
      {/* ========================================================================= */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 shadow-2xl rounded-2xl">
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Nuevo Pedido de Venta
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D]">
                  Registra la venta con cálculo automático de prorrateo de packaging y margen adicional.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenCreateModal(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cliente *</Label>
                <Input 
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                  placeholder="Ej: Bryan Condemarín"
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Canal de Venta</Label>
                <Input 
                  value={formCanalVenta}
                  onChange={(e) => setFormCanalVenta(e.target.value)}
                  placeholder="Ej: Instagram, WhatsApp, Feria..."
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            {/* Producto del Catálogo con Autocompletado y Búsqueda */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Producto del Catálogo *</Label>
              <SearchableCombobox
                items={productosComboboxItems}
                value={formProductoId}
                onChange={(val) => handleProductoOrTierChange(val, formTipoPrecio)}
                placeholder="Buscar y seleccionar producto..."
                searchPlaceholder="Buscar por modelo o categoría..."
                icon={Package}
                inputClassName="bg-[#F4EFEA]"
              />
            </div>

            {/* Tipo de Precio & Cantidad con Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Nivel de Precio *</Label>
                  {formTipoPrecio === 'PERSONALIZADO' ? (
                    <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold px-1.5 py-0">
                      Personalizado
                    </Badge>
                  ) : formTipoPrecio === 'AMIGOS' ? (
                    <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold px-1.5 py-0">
                      Amigo
                    </Badge>
                  ) : formTipoPrecio === 'MERCADO' ? (
                    <Badge variant="outline" className="bg-[#EFE5D8] text-[#944917] border-[#D4BEA7] text-[10px] font-bold px-1.5 py-0">
                      Mercado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-bold px-1.5 py-0">
                      Comunidad
                    </Badge>
                  )}
                </div>
                <SearchableCombobox
                  items={nivelesPrecioComboboxItems}
                  value={formTipoPrecio}
                  onChange={(val) => handleProductoOrTierChange(formProductoId, val as TipoPrecio)}
                  placeholder="Seleccionar nivel..."
                  icon={Tag}
                  clearable={false}
                  inputClassName="bg-[#F4EFEA]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cantidad *</Label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleDecrementCantidad}
                    className="h-10 w-10 flex items-center justify-center bg-[#F4EFEA] border border-r-0 border-[#DCD3C6] rounded-l-xl text-[#75695D] hover:bg-[#EAE4DC] hover:text-[#241C15] transition-colors cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <Input 
                    type="number"
                    min="1"
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(e.target.value)}
                    required
                    className="rounded-none text-center bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm font-mono font-bold h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] focus:z-10"
                  />
                  <button
                    type="button"
                    onClick={handleIncrementCantidad}
                    className="h-10 w-10 flex items-center justify-center bg-[#F4EFEA] border border-l-0 border-[#DCD3C6] rounded-r-xl text-[#75695D] hover:bg-[#EAE4DC] hover:text-[#241C15] transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN: PRORRATEO DE PACKAGING */}
            <div className="p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-[#A36F4C]" />
                  <span className="text-xs font-bold text-[#241C15]">
                    Prorrateo de Packaging del Taller
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#A36F4C] font-bold">
                  <input
                    type="checkbox"
                    checked={incluirPackaging}
                    onChange={(e) => handleTogglePackaging(e.target.checked)}
                    className="rounded border-[#DCD3C6] text-[#A36F4C] focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                  <span>Incluir Packaging</span>
                </label>
              </div>

              {incluirPackaging && (
                <div className="space-y-3 pt-2 border-t border-[#E2D9CC]">
                  {/* Costo Base de Packaging */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#75695D] font-medium">Costo Base de Packaging (S/):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMontoPackagingBase(promedioPackaging.toFixed(2))
                          if (selectedProduct) {
                            const pNum = parseFloat(porcentajePackaging) || 0
                            const pack = Number(((promedioPackaging * pNum) / 100).toFixed(2))
                            if (formTipoPrecio === 'AMIGOS') setFormPrecioUnitario((selectedProduct.precioAmigos + pack).toFixed(2))
                            else if (formTipoPrecio === 'MERCADO') setFormPrecioUnitario((selectedProduct.precioMercado + pack).toFixed(2))
                            else if (formTipoPrecio === 'COMUNIDAD') setFormPrecioUnitario((selectedProduct.precioComunidad + pack).toFixed(2))
                          }
                        }}
                        className="text-[#A36F4C] hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Usar promedio ({formatCurrency(promedioPackaging)})</span>
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                      <Input
                        type="number"
                        step="0.10"
                        min="0"
                        value={montoPackagingBase}
                        onChange={(e) => {
                          setMontoPackagingBase(e.target.value)
                          const base = parseFloat(e.target.value) || 0
                          const pNum = parseFloat(porcentajePackaging) || 0
                          const pack = Number(((base * pNum) / 100).toFixed(2))
                          if (selectedProduct && formTipoPrecio !== 'PERSONALIZADO') {
                            if (formTipoPrecio === 'AMIGOS') setFormPrecioUnitario((selectedProduct.precioAmigos + pack).toFixed(2))
                            else if (formTipoPrecio === 'MERCADO') setFormPrecioUnitario((selectedProduct.precioMercado + pack).toFixed(2))
                            else if (formTipoPrecio === 'COMUNIDAD') setFormPrecioUnitario((selectedProduct.precioComunidad + pack).toFixed(2))
                          }
                        }}
                        placeholder={promedioPackaging.toFixed(2)}
                        className="pl-8 bg-[#FFFFFF] border-[#DCD3C6] text-[#8C6D1F] font-mono text-sm font-bold h-8 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Porcentaje de prorrateo a aplicar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="text-[#241C15] flex items-center gap-1 text-xs font-bold">
                        <Percent className="h-3 w-3 text-[#A36F4C]" />
                        Porcentaje a Prorratear a la Venta (%):
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={porcentajePackaging}
                        onChange={(e) => handleSelectPackagingPct(e.target.value)}
                        placeholder="10"
                        className="bg-[#FFFFFF] border-[#DCD3C6] text-[#A36F4C] font-mono text-sm font-bold h-8 w-24 rounded-xl"
                      />
                      <div className="flex items-center gap-1 flex-1">
                        {['5', '10', '15', '20', '30', '50'].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleSelectPackagingPct(pct)}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              porcentajePackaging === pct
                                ? 'bg-[#A36F4C] text-white shadow-sm'
                                : 'bg-[#FFFFFF] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15]'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Desglose en vivo de Prorrateo */}
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2D9CC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 text-[#75695D]">
                      <div className="text-[11px]">
                        Pack Base: <strong className="text-[#241C15]">{formatCurrency(parseFloat(montoPackagingBase) || 0)}</strong>
                        <span> • Prorrateo ({porcentajePackaging}%): <strong className="text-[#8C6D1F] font-bold">+{formatCurrency(montoProrrateoPackaging)}</strong></span>
                      </div>
                      <div>
                        Precio Sugerido Final: <strong className="text-[#1E5E3A] font-mono text-sm font-bold">{formatCurrency(precioSugeridoCalculado)}</strong>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAplicarPrecioSugerido}
                      className="h-7 px-2.5 bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold whitespace-nowrap rounded-xl cursor-pointer shadow-sm"
                    >
                      <Calculator className="h-3.5 w-3.5 mr-1" />
                      Aplicar Precio
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Precio Unitario Final Aplicado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Precio Unitario Final (S/) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecioUnitario}
                    onChange={(e) => handlePrecioUnitarioChange(e.target.value)}
                    required
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono text-base font-bold rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#1E5E3A] font-bold uppercase tracking-wider">Pago Inicial / Anticipo (S/)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMontoPagado}
                    onChange={(e) => setFormMontoPagado(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono text-base font-bold rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>
            </div>

            {/* Total Calculado & Saldo */}
            {(() => {
              const cant = parseInt(formCantidad) || 1
              const unit = parseFloat(formPrecioUnitario) || 0
              const total = cant * unit
              const pagado = parseFloat(formMontoPagado) || 0
              const saldo = Math.max(0, total - pagado)

              return (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6]">
                  <div>
                    <span className="text-[10px] text-[#75695D] uppercase font-bold">Total del Pedido</span>
                    <div className="text-lg font-extrabold text-[#241C15] font-mono">{formatCurrency(total)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C6D1F] uppercase font-bold">Saldo Pendiente</span>
                    <div className="text-lg font-extrabold text-[#8C6D1F] font-mono">{formatCurrency(saldo)}</div>
                  </div>
                </div>
              )
            })()}

            {/* Logística */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Destino de Envío</Label>
                <Input 
                  value={formDestinoEnvio}
                  onChange={(e) => setFormDestinoEnvio(e.target.value)}
                  placeholder="Ej: Shalom / Lince / Recojo taller"
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Promesa de Entrega</Label>
                <Input 
                  value={formDiaEntrega}
                  onChange={(e) => setFormDiaEntrega(e.target.value)}
                  placeholder="Ej: 28 Viernes en la mañana"
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2D9CC]">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenCreateModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear Pedido'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
