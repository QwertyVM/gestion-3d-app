'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Sparkles,
  Percent,
  Box,
  Calculator,
  Tag
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export interface VentaItem {
  id: string
  fecha: string
  cliente: string
  productoId: string
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
  const [porcentajePackaging, setPorcentajePackaging] = useState('0')

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

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

  // Prorrateo de Packaging: Solo el porcentaje del costo de packaging (sin sumar la base completa)
  const montoProrrateoPackaging = useMemo(() => {
    const packBase = parseFloat(montoPackagingBase) || 0
    const pct = parseFloat(porcentajePackaging) || 0
    return Number(((packBase * pct) / 100).toFixed(2))
  }, [montoPackagingBase, porcentajePackaging])

  // Suggested Unit Price: Base Product Price + Prorrateo del Packaging
  const precioSugeridoCalculado = useMemo(() => {
    const base = parseFloat(formPrecioBase) || 0
    const packProrrateado = incluirPackaging ? montoProrrateoPackaging : 0
    return Number((base + packProrrateado).toFixed(2))
  }, [formPrecioBase, incluirPackaging, montoProrrateoPackaging])

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

  // Autocomplete price on product / tier select in Create Modal
  const handleProductoOrTierChange = (prodId: string, tier: TipoPrecio) => {
    setFormProductoId(prodId)
    setFormTipoPrecio(tier)
    const found = productos.find(p => p.id === prodId)
    if (found) {
      let base = found.precioComunidad
      if (tier === 'AMIGOS') base = found.precioAmigos
      else if (tier === 'MERCADO') base = found.precioMercado
      else if (tier === 'COMUNIDAD') base = found.precioComunidad

      setFormPrecioBase(base.toString())

      const pack = incluirPackaging ? montoProrrateoPackaging : 0
      const finalUnit = Number((base + pack).toFixed(2))

      setFormPrecioUnitario(finalUnit.toString())
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

  // Apply suggested calculated price to Precio Unitario field
  const handleAplicarPrecioSugerido = () => {
    setFormPrecioUnitario(precioSugeridoCalculado.toString())
    toast.success(`Precio unitario actualizado a ${formatCurrency(precioSugeridoCalculado)}`)
  }

  // Submit Create Order
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.trim() || !formProductoId || !formPrecioUnitario) {
      toast.error('Por favor completa los campos obligatorios')
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
      toast.success('Pedido creado exitosamente')
      setOpenCreateModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            Ventas y Pedidos
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gestión de pedidos con prorrateo de packaging, márgenes porcentuales y cobranzas.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Total Pedidos
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">{totalPedidos}</div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Historial general de ventas</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Total Cobrado
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {formatCurrency(totalCobrado)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Ingreso efectivo a caja</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Saldos por Cobrar
          </span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {formatCurrency(totalSaldoPendiente)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Pendiente de liquidación</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            En Proceso / Entregados
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {enProduccionCount} <span className="text-sm font-normal text-zinc-500">/ {entregadosCount} entregados</span>
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Flujo de producción de taller</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Buscar por cliente, modelo, canal o destino..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 text-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setCurrentPage(1); }}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="EN_PRODUCCION">En Producción</option>
                <option value="ENTREGADO">Entregados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>

              <select
                value={pagoFilter}
                onChange={(e: any) => { setPagoFilter(e.target.value); setCurrentPage(1); }}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los Pagos</option>
                <option value="PENDIENTES_PAGO">Con Saldo Pendiente</option>
                <option value="PAGADOS">100% Pagados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Cliente & Canal</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Modelo / Producto</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Estado Pedido</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Total</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Cobranza / Saldo</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-center">Acciones de Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                  No se encontraron pedidos con los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              paginatedVentas.map((v) => {
                const isPaid = v.saldoPendiente <= 0

                return (
                  <TableRow 
                    key={v.id} 
                    onClick={() => handleOpenDetails(v)}
                    className="border-zinc-800/60 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    {/* Fecha */}
                    <TableCell className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                      {formatDate(v.fecha)}
                    </TableCell>

                    {/* Cliente */}
                    <TableCell className="px-3 py-3 font-semibold text-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-sm group-hover:text-blue-400 transition-colors">{v.cliente}</span>
                        {v.canalVenta && (
                          <span className="text-[11px] text-zinc-500">{v.canalVenta}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Producto & Extras */}
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-200">{v.producto.nombreModelo}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 flex-wrap mt-0.5">
                          <span>{v.cantidad}x • {v.tipoPrecio}</span>
                          {v.costoPackaging && v.costoPackaging > 0 ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[9px] py-0 px-1">
                              +Pack S/{v.costoPackaging.toFixed(1)}
                            </Badge>
                          ) : null}
                          {v.porcentajeAdicional && v.porcentajeAdicional > 0 ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[9px] py-0 px-1">
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
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-all cursor-pointer focus:outline-none ${
                          v.estado === 'ENTREGADO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : v.estado === 'EN_PRODUCCION'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : v.estado === 'PENDIENTE'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        <option value="PENDIENTE" className="bg-zinc-950 text-amber-400">Pendiente</option>
                        <option value="EN_PRODUCCION" className="bg-zinc-950 text-blue-400">En Producción</option>
                        <option value="ENTREGADO" className="bg-zinc-950 text-emerald-400">Entregado</option>
                        <option value="CANCELADO" className="bg-zinc-950 text-red-400">Cancelado</option>
                      </select>
                    </TableCell>

                    {/* Total */}
                    <TableCell className="px-3 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      {formatCurrency(v.total)}
                    </TableCell>

                    {/* Cobranza y Saldo */}
                    <TableCell className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-xs text-zinc-300">
                          Pagado: <span className="font-bold text-emerald-400">{formatCurrency(v.montoPagado)}</span>
                        </span>
                        {v.saldoPendiente > 0 ? (
                          <span className="font-mono text-xs text-amber-400 font-bold">
                            Debe: {formatCurrency(v.saldoPendiente)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> 100% Pagado
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Acciones de Pago */}
                    <TableCell className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {isPaid ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1">
                          <Check className="h-3 w-3" />
                          Pagado
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={(e) => handleOpenAbono(v, e)}
                            className="h-7 px-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                            title="Registrar abono de dinero"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                            Abonar
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleLiquidarTotal(v.id, e)}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                            title="Marcar como 100% Pagado de inmediato"
                          >
                            <Check className="h-3.5 w-3.5 mr-0.5" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/70 text-xs text-zinc-400">
            <div>
              Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredVentas.length} pedidos)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
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
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[560px]">
          {selectedVenta && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900 text-xs">
                    {selectedVenta.producto.lineaCategoria}
                  </Badge>
                  {selectedVenta.saldoPendiente <= 0 ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1">
                      <Check className="h-3 w-3" />
                      100% Pagado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Saldo Pendiente: {formatCurrency(selectedVenta.saldoPendiente)}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Pedido de {selectedVenta.cliente}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  {selectedVenta.producto.nombreModelo} • {selectedVenta.cantidad} {selectedVenta.cantidad === 1 ? 'unidad' : 'unidades'} ({selectedVenta.tipoPrecio})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Resumen Financiero */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Pedido</span>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {formatCurrency(selectedVenta.total)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-400 uppercase font-semibold">Monto Pagado</span>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {formatCurrency(selectedVenta.montoPagado)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-400 uppercase font-semibold">Saldo Pendiente</span>
                    <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                      {formatCurrency(selectedVenta.saldoPendiente)}
                    </div>
                  </div>
                </div>

                {/* Prorrateos y Margen Registrado */}
                {(selectedVenta.costoPackaging || selectedVenta.porcentajeAdicional) ? (
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Desglose de Prorrateo & Margen
                    </span>
                    <div className="flex items-center gap-4 text-zinc-300">
                      {selectedVenta.costoPackaging ? (
                        <span>Prorrateo Packaging: <strong className="text-amber-400">{formatCurrency(selectedVenta.costoPackaging)}</strong> / ud</span>
                      ) : null}
                      {selectedVenta.porcentajeAdicional ? (
                        <span>Margen Adicional: <strong className="text-blue-400">+{selectedVenta.porcentajeAdicional}%</strong></span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Datos de Entrega y Envío */}
                <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                    Logística & Entrega
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block">Canal de Venta:</span>
                      <span className="font-medium">{selectedVenta.canalVenta || 'Directo'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Destino de Envío:</span>
                      <span className="font-medium">{selectedVenta.destinoEnvio || 'Recojo en taller'}</span>
                    </div>
                  </div>
                  {selectedVenta.diaEntregaPrometida && (
                    <div className="pt-1 text-zinc-300">
                      <span className="text-zinc-500 block">Promesa de Entrega:</span>
                      <span className="font-medium text-blue-400">{selectedVenta.diaEntregaPrometida}</span>
                    </div>
                  )}
                </div>

                {/* Cambiar Estado del Pedido */}
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    Cambiar Estado del Pedido
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['PENDIENTE', 'EN_PRODUCCION', 'ENTREGADO', 'CANCELADO'] as EstadoVenta[]).map((est) => (
                      <button
                        key={est}
                        type="button"
                        onClick={() => handleCambiarEstado(selectedVenta.id, est)}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                          selectedVenta.estado === est
                            ? est === 'ENTREGADO'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                              : est === 'EN_PRODUCCION'
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                              : est === 'PENDIENTE'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                              : 'bg-red-600 text-white border-red-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {est === 'PENDIENTE' ? 'Pendiente' : est === 'EN_PRODUCCION' ? 'Producción' : est === 'ENTREGADO' ? 'Entregado' : 'Cancelado'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botones de Gestión de Pago */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                  {selectedVenta.saldoPendiente > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setMontoAbono(selectedVenta.saldoPendiente.toString())
                          setOpenAbonoModal(true)
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Registrar Abono
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleLiquidarTotal(selectedVenta.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Liquidar 100% (Ya Pagó)
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Pago Completado
                    </span>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenDetailsModal(false)}
                    className="text-zinc-400 hover:text-white text-xs"
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
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[420px]">
          {selectedVenta && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Registrar Cobro / Abono
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Cliente: <strong className="text-white">{selectedVenta.cliente}</strong> • Saldo actual: <strong className="text-amber-400">{formatCurrency(selectedVenta.saldoPendiente)}</strong>
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegistrarAbonoSubmit} className="space-y-4 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Monto a Abonar (S/) *</Label>
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
                    className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono font-bold text-lg"
                  />
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1">
                    <span>Monto sugerido (100% saldo):</span>
                    <button
                      type="button"
                      onClick={() => setMontoAbono(selectedVenta.saldoPendiente.toString())}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Pagar todo ({formatCurrency(selectedVenta.saldoPendiente)})
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenAbonoModal(false)}
                    className="text-zinc-400 hover:text-white text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !montoAbono || parseFloat(montoAbono) <= 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
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
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Nuevo Pedido de Venta
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Registra la venta con cálculo automático de prorrateo de packaging y margen adicional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Cliente *</Label>
                <Input 
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                  placeholder="Ej: Bryan Condemarín"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Canal de Venta</Label>
                <Input 
                  value={formCanalVenta}
                  onChange={(e) => setFormCanalVenta(e.target.value)}
                  placeholder="Ej: Instagram, WhatsApp, Feria..."
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>
            </div>

            {/* Producto del Catálogo */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Producto del Catálogo *</Label>
              <select
                value={formProductoId}
                onChange={(e) => handleProductoOrTierChange(e.target.value, formTipoPrecio)}
                required
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {productos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombreModelo} ({p.lineaCategoria})
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Precio & Cantidad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Nivel de Precio *</Label>
                <select
                  value={formTipoPrecio}
                  onChange={(e) => handleProductoOrTierChange(formProductoId, e.target.value as TipoPrecio)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="AMIGOS">1. Precio Amigos</option>
                  <option value="MERCADO">2. Precio Mercado</option>
                  <option value="COMUNIDAD">3. Precio Comunidad</option>
                  <option value="PERSONALIZADO">Personalizado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Cantidad *</Label>
                <Input 
                  type="number"
                  min="1"
                  value={formCantidad}
                  onChange={(e) => setFormCantidad(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECCIÓN: PRORRATEO DE PACKAGING & INCREMENTO DEL EMPAQUE                 */}
            {/* ========================================================================= */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Prorrateo de Packaging del Taller
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-400 font-semibold">
                  <input
                    type="checkbox"
                    checked={incluirPackaging}
                    onChange={(e) => setIncluirPackaging(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                  <span>Incluir Packaging</span>
                </label>
              </div>

              {incluirPackaging && (
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  {/* Costo Base de Packaging */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Costo Base de Packaging (S/):</span>
                      <button
                        type="button"
                        onClick={() => setMontoPackagingBase(promedioPackaging.toFixed(2))}
                        className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span>Usar promedio taller ({formatCurrency(promedioPackaging)})</span>
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.10"
                      min="0"
                      value={montoPackagingBase}
                      onChange={(e) => setMontoPackagingBase(e.target.value)}
                      placeholder={promedioPackaging.toFixed(2)}
                      className="bg-zinc-950 border-zinc-700 text-amber-400 font-mono text-sm font-bold h-8"
                    />
                  </div>

                  {/* Porcentaje de prorrateo a aplicar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="text-zinc-400 flex items-center gap-1 text-xs">
                        <Percent className="h-3 w-3 text-amber-400" />
                        Porcentaje del Packaging a Prorratear a la Venta (%):
                      </Label>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        (Monto a sumar: {porcentajePackaging}% del packaging)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={porcentajePackaging}
                        onChange={(e) => setPorcentajePackaging(e.target.value)}
                        placeholder="10"
                        className="bg-zinc-950 border-zinc-700 text-amber-400 font-mono text-sm font-bold h-8 w-24"
                      />
                      <div className="flex items-center gap-1 flex-1">
                        {['5', '10', '15', '20', '30', '50'].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPorcentajePackaging(pct)}
                            className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                              porcentajePackaging === pct
                                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Desglose en vivo de Prorrateo de Packaging */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 text-zinc-400">
                      <div className="text-[11px]">
                        Pack Base Taller: <strong className="text-zinc-300">{formatCurrency(parseFloat(montoPackagingBase) || 0)}</strong>
                        <span> • Prorrateo ({porcentajePackaging}%): <strong className="text-amber-400 font-bold">+{formatCurrency(montoProrrateoPackaging)}</strong></span>
                      </div>
                      <div>
                        Precio Sugerido Final: <strong className="text-emerald-400 font-mono text-sm font-bold">{formatCurrency(precioSugeridoCalculado)}</strong>
                        <span className="text-[11px] text-zinc-500 ml-1.5">({formatCurrency(parseFloat(formPrecioBase) || 0)} base + {formatCurrency(montoProrrateoPackaging)} prorrateo pack)</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAplicarPrecioSugerido}
                      className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      <Calculator className="h-3.5 w-3.5 mr-1" />
                      Aplicar Precio
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Precio Unitario Final Aplicado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-bold">Precio Unitario Final (S/) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrecioUnitario}
                  onChange={(e) => setFormPrecioUnitario(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono text-base font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-400 font-bold">Pago Inicial / Anticipo (S/)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formMontoPagado}
                  onChange={(e) => setFormMontoPagado(e.target.value)}
                  placeholder="0.00"
                  className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono text-base font-bold"
                />
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
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total del Pedido</span>
                    <div className="text-lg font-bold text-white font-mono">{formatCurrency(total)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-semibold">Saldo Pendiente</span>
                    <div className="text-lg font-bold text-amber-400 font-mono">{formatCurrency(saldo)}</div>
                  </div>
                </div>
              )
            })()}

            {/* Logística */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Destino de Envío</Label>
                <Input 
                  value={formDestinoEnvio}
                  onChange={(e) => setFormDestinoEnvio(e.target.value)}
                  placeholder="Ej: Shalom / Lince / Recojo taller"
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Promesa de Entrega</Label>
                <Input 
                  value={formDiaEntrega}
                  onChange={(e) => setFormDiaEntrega(e.target.value)}
                  placeholder="Ej: 28 Viernes en la mañana"
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenCreateModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Pedido'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
