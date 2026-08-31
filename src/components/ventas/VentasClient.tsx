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
  Minus,
  Trash2,
  Calendar,
  Palette,
  ShoppingBag,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { 
  updateEstadoVenta, 
  registrarAbono, 
  liquidarSaldoTotal, 
  createVenta,
  deleteVenta,
  updateVenta
} from '@/actions/ventas'
import { toast } from 'sonner'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'

export interface FilamentoOption {
  id: string
  nombreColor: string
  numeroBobina?: number
  codigoHex: string
  tipoMaterial: string
  marca: string
  stockGramos?: number
  stockBobinas: number
  estado: string
  alertaCritica?: boolean
}

export interface VentaItem {
  id: string
  fecha: string
  cliente: string
  productoId: string
  costoBaseSnapshot?: number
  nombreProductoSnapshot?: string
  colorFilamentoId?: string | null
  personalizacion?: string | null
  gramosConsumidos?: number
  colorFilamento?: {
    id: string
    nombreColor: string
    numeroBobina?: number
    codigoHex: string
    tipoMaterial: string
    marca: string
    stockGramos?: number
    stockBobinas: number
  } | null
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
    pesoGramos?: number
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
  pesoGramos?: number
  activo: boolean
}

interface VentasClientProps {
  ventas: VentaItem[]
  productos?: ProductoOption[]
  promedioPackaging?: number
  filamentos?: FilamentoOption[]
}

const ITEMS_PER_PAGE = 5

export function VentasClient({ 
  ventas, 
  productos = [], 
  promedioPackaging = 9.80,
  filamentos = [] 
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
  const [isChangingColor, setIsChangingColor] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiquidating, setIsLiquidating] = useState(false)

  // Abono form state
  const [montoAbono, setMontoAbono] = useState('')

  // Create order form state
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [formCliente, setFormCliente] = useState('')
  const [formProductoId, setFormProductoId] = useState('')
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

  // Personalización & Filament Color States
  const [incluirPersonalizacion, setIncluirPersonalizacion] = useState(false)
  const [formColorFilamentoId, setFormColorFilamentoId] = useState('')
  const [formPersonalizacion, setFormPersonalizacion] = useState('')
  const [formGramosConsumidos, setFormGramosConsumidos] = useState('100')

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

  const filamentosComboboxItems: ComboboxItem[] = useMemo(() => {
    return [
      { id: '', label: '(Sin color específico)', sublabel: 'Color no especificado' },
      ...filamentos.map(f => ({
        id: f.id,
        label: f.nombreColor,
        sublabel: 'Color disponible en taller',
        badge: '🟢 Disponible',
        icon: Palette
      }))
    ]
  }, [filamentos])

  const selectedFilamento = useMemo(() => {
    return filamentos.find(f => f.id === formColorFilamentoId)
  }, [filamentos, formColorFilamentoId])

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

  // Delete Sale / Order
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteVenta = async (id: string, cliente?: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el pedido de "${cliente || 'este cliente'}"? Esta acción no se puede deshacer.`)) {
      try {
        setDeletingId(id)
        await deleteVenta(id)
        setItems(prev => prev.filter(v => v.id !== id))
        toast.success(`Pedido de ${cliente || 'cliente'} eliminado correctamente`)
        setOpenDetailsModal(false)
        router.refresh()
      } catch (err: any) {
        console.error(err)
        toast.error(err?.message || 'Error al eliminar el pedido')
      } finally {
        setDeletingId(null)
      }
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
    setIsChangingColor(false)
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

  // Update Sale Date
  const handleUpdateFechaVenta = async (id: string, newFechaStr: string) => {
    if (!newFechaStr) return
    try {
      const updated = await updateVenta(id, { fecha: newFechaStr })
      setItems(prev => prev.map(v => v.id === id ? { ...v, fecha: updated.fecha } : v))
      setSelectedVenta(prev => prev ? { ...prev, fecha: updated.fecha } : null)
      toast.success('Fecha de pedido actualizada correctamente')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Error al actualizar la fecha')
    }
  }

  // Assign or Change Color in Order Details
  const handleAsignarColorVenta = async (ventaId: string, colorId: string | null) => {
    try {
      const updated = await updateVenta(ventaId, { colorFilamentoId: colorId })
      setItems(prev => prev.map(v => v.id === ventaId ? {
        ...v,
        colorFilamentoId: colorId,
        colorFilamento: updated.colorFilamento
      } : v))

      if (selectedVenta && selectedVenta.id === ventaId) {
        setSelectedVenta(prev => prev ? {
          ...prev,
          colorFilamentoId: colorId,
          colorFilamento: updated.colorFilamento
        } : null)
      }

      if (colorId) {
        const fil = filamentos.find(f => f.id === colorId)
        toast.success(`Color asignado: "${fil?.nombreColor || 'Color actualizado'}"`)
      } else {
        toast.info('Color desasignado del pedido')
      }
      router.refresh()
    } catch (err: any) {
      toast.error('Error al actualizar color: ' + err.message)
    }
  }

  // Update Personalization in Order Details
  const handleUpdatePersonalizacion = async (ventaId: string, personalizacionText: string) => {
    try {
      const updated = await updateVenta(ventaId, { personalizacion: personalizacionText.trim() || null })
      setItems(prev => prev.map(v => v.id === ventaId ? {
        ...v,
        personalizacion: updated.personalizacion
      } : v))

      if (selectedVenta && selectedVenta.id === ventaId) {
        setSelectedVenta(prev => prev ? {
          ...prev,
          personalizacion: updated.personalizacion
        } : null)
      }
      toast.success('Personalización guardada')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al actualizar personalización: ' + err.message)
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    const firstProd = productos[0]
    const defaultPrice = firstProd?.precioComunidad || 135
    setFormFecha(new Date().toISOString().split('T')[0])
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
    setIncluirPersonalizacion(false)
    setFormColorFilamentoId('')
    setFormPersonalizacion('')
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
      const prod = productos.find(p => p.id === formProductoId)
      const cant = parseInt(formCantidad) || 1
      const pesoUnitario = prod 
        ? (prod.pesoGramos != null && prod.pesoGramos > 0 ? Number(prod.pesoGramos) : Number((Number(prod.costoBase) / 0.065).toFixed(1))) 
        : 0
      const pesoTotalEstimado = Math.round(pesoUnitario * cant)

      const created = await createVenta({
        fecha: formFecha || undefined,
        cliente: formCliente.trim(),
        productoId: formProductoId,
        colorFilamentoId: formColorFilamentoId ? formColorFilamentoId : null,
        personalizacion: formPersonalizacion.trim() ? formPersonalizacion.trim() : null,
        gramosConsumidos: pesoTotalEstimado,
        cantidad: cant,
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

      const selectedFil = filamentos.find(f => f.id === formColorFilamentoId)

      const fullCreated = {
        ...created,
        colorFilamento: created.colorFilamento || (selectedFil ? {
          id: selectedFil.id,
          nombreColor: selectedFil.nombreColor,
          codigoHex: selectedFil.codigoHex,
          tipoMaterial: selectedFil.tipoMaterial,
          marca: selectedFil.marca,
          stockBobinas: selectedFil.stockBobinas
        } : null),
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
              <TableHead className="text-[#241C15] font-bold px-4 py-3 text-center">Acciones</TableHead>
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
                        
                        {/* Filamento asignado con alerta en amarillo si tiene bajo stock (< 300g) */}
                        {v.colorFilamento && (() => {
                          const filamentoEnTaller = filamentos.find(f => f.id === v.colorFilamentoId || f.nombreColor === v.colorFilamento?.nombreColor)
                          const stockGramosActual = filamentoEnTaller?.stockGramos ?? v.colorFilamento?.stockGramos ?? 1000
                          const esBajoStock = stockGramosActual < 300 || Boolean(filamentoEnTaller?.alertaCritica)

                          return (
                            <div 
                              className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md shadow-2xs self-start border transition-colors ${
                                esBajoStock
                                  ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
                                  : 'bg-[#FAF8F5] text-[#241C15] border-[#E2D9CC]'
                              }`}
                              title={esBajoStock ? `⚠️ Bobina con stock bajo: ${stockGramosActual}g restantes` : `Color: ${v.colorFilamento.nombreColor}`}
                            >
                              <span 
                                className="h-2.5 w-2.5 rounded-full border border-black/20 inline-block flex-shrink-0 shadow-xs"
                                style={{ backgroundColor: v.colorFilamento.codigoHex }}
                              />
                              <span className="text-xs font-bold">
                                {v.colorFilamento.nombreColor}
                              </span>
                              {esBajoStock && (
                                <span className="text-[10px] font-extrabold text-[#854D0E] bg-[#FEF08A] px-1 py-0.2 rounded inline-flex items-center gap-0.5 border border-[#FACC15]">
                                  <AlertTriangle className="h-2.5 w-2.5 text-[#A16207] stroke-[2.5]" />
                                  {stockGramosActual}g
                                </span>
                              )}
                            </div>
                          )
                        })()}

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

                    {/* Acciones */}
                    <TableCell className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {isPaid ? (
                          <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs gap-1 font-bold py-1">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            Pagado
                          </Badge>
                        ) : (
                          <>
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
                          </>
                        )}

                        {/* Botón Eliminar Pedido */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteVenta(v.id, v.cliente)
                          }}
                          disabled={deletingId === v.id}
                          className="h-7 w-7 text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Eliminar pedido / venta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[540px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          {selectedVenta && (() => {
            const pctPagado = selectedVenta.total > 0 
              ? Math.min(100, Math.round((selectedVenta.montoPagado / selectedVenta.total) * 100))
              : 100

            return (
              <div className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
                {/* 1. Cabecera Limpia & Contextual */}
                <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#F4EFEA] border border-[#E2D9CC] flex items-center justify-center text-[#A36F4C] flex-shrink-0 shadow-2xs">
                      <ShoppingBag className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-base sm:text-lg font-black text-[#241C15] tracking-tight truncate">
                        Pedido de {selectedVenta.cliente}
                      </DialogTitle>
                      <DialogDescription 
                        className="text-xs text-[#75695D] font-medium max-w-[280px] sm:max-w-md truncate mt-0.5" 
                        title={`${selectedVenta.producto.nombreModelo} • ${selectedVenta.cantidad} ${selectedVenta.cantidad === 1 ? 'unidad' : 'unidades'}`}
                      >
                        {selectedVenta.producto.nombreModelo} • {selectedVenta.cantidad} {selectedVenta.cantidad === 1 ? 'unidad' : 'unidades'}
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedVenta.saldoPendiente > 0 ? (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-bold font-mono px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Abonado {pctPagado}% - Falta {formatCurrency(selectedVenta.saldoPendiente)}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold font-mono px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
                        <Check className="h-3.5 w-3.5 stroke-[2.5] flex-shrink-0" />
                        <span>Pagado al 100%</span>
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => setOpenDetailsModal(false)}
                      className="text-[#75695D] hover:text-[#241C15] p-2 rounded-full hover:bg-[#F4EFEA] transition-colors cursor-pointer ml-1 flex-shrink-0"
                      aria-label="Cerrar modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Cuerpo del Modal */}
                <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 touch-pan-y">
                  {/* Tarjeta Resumen Financiero con Barra de Progreso */}
                  <div className="bg-[#F8F6F2] border border-[#E2D9CC] rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-left items-center">
                      <div>
                        <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">Total Pedido</span>
                        <div className="text-sm sm:text-base font-bold text-[#241C15] font-mono mt-0.5">
                          {formatCurrency(selectedVenta.total)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#1E5E3A] uppercase tracking-wider block">Monto Pagado</span>
                        <div className="text-sm sm:text-base font-bold text-[#1E5E3A] font-mono mt-0.5">
                          {formatCurrency(selectedVenta.montoPagado)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#A36F4C] uppercase tracking-wider block">Saldo Pendiente</span>
                        <div className="text-base sm:text-lg font-bold text-[#A36F4C] font-mono mt-0.5">
                          {formatCurrency(selectedVenta.saldoPendiente)}
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progreso de Pago */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-[#EAE4DC] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#1E5E3A] h-full rounded-full transition-all duration-300"
                          style={{ width: `${pctPagado}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#75695D] font-mono">
                        <span>Progreso de cobranza</span>
                        <span className="font-bold text-[#1E5E3A]">{pctPagado}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloque de Color de Filamento */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-[#A36F4C]" />
                        Color de Filamento
                      </span>
                      {selectedVenta.colorFilamento && (
                        <button
                          type="button"
                          onClick={() => handleAsignarColorVenta(selectedVenta.id, null)}
                          className="text-[11px] text-[#A34335] hover:underline font-semibold cursor-pointer"
                        >
                          Quitar color
                        </button>
                      )}
                    </div>

                    {/* Vista Activa con Advertencia de Bajo Stock */}
                    {(() => {
                      const filamentoEnTaller = filamentos.find(f => f.id === selectedVenta.colorFilamentoId || f.nombreColor === selectedVenta.colorFilamento?.nombreColor)
                      const stockGramosActual = filamentoEnTaller?.stockGramos ?? selectedVenta.colorFilamento?.stockGramos ?? 1000
                      const esBajoStock = selectedVenta.colorFilamento && (stockGramosActual < 300 || Boolean(filamentoEnTaller?.alertaCritica))

                      return (
                        <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          esBajoStock 
                            ? 'bg-[#FEFCE8] border-[#FDE047] ring-1 ring-[#FDE047]/60' 
                            : 'bg-[#FAF8F5] border-[#E2D9CC]'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="h-6 w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0"
                              style={{ backgroundColor: selectedVenta.colorFilamento?.codigoHex || '#A855F7' }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#241C15] block">
                                  {selectedVenta.colorFilamento ? selectedVenta.colorFilamento.nombreColor : 'Sin color asignado'}
                                </span>
                                {esBajoStock && (
                                  <span className="text-[10px] font-extrabold text-[#854D0E] bg-[#FEF08A] px-1.5 py-0.2 rounded border border-[#FACC15] inline-flex items-center gap-0.5">
                                    <AlertTriangle className="h-3 w-3 text-[#A16207]" />
                                    {stockGramosActual}g restante
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-semibold ${
                                esBajoStock 
                                  ? 'text-[#A16207]' 
                                  : selectedVenta.colorFilamento ? 'text-[#1E5E3A]' : 'text-[#75695D]'
                              }`}>
                                {esBajoStock 
                                  ? '⚠️ Bobina con bajo stock (<300g)' 
                                  : selectedVenta.colorFilamento ? '🟢 Color asignado' : '⚪ Opcional para producción'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsChangingColor(prev => !prev)}
                            className="text-xs font-bold text-[#633E20] bg-white hover:bg-[#F4EFEA] border border-[#D4BEA7] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            {isChangingColor ? 'Ocultar lista' : selectedVenta.colorFilamento ? 'Cambiar color' : 'Asignar color'}
                          </button>
                        </div>
                      )
                    })()}

                    {/* Contenedor de Paleta / Chips con 3 Estados Semánticos */}
                    {isChangingColor && (
                      <div className="p-3.5 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] shadow-sm space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
                            Toca el color disponible en taller:
                          </span>
                          <span className="text-[10px] text-[#8C6D1F] font-mono font-semibold">
                            🟡 Amarillo = Stock Crítico (&lt;300g)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1 touch-pan-y">
                          {filamentos.map(f => {
                            const isSelected = selectedVenta.colorFilamento?.id === f.id || selectedVenta.colorFilamento?.nombreColor === f.nombreColor
                            const gramos = f.stockGramos ?? 1000
                            const esBajoStock = gramos < 300 || Boolean(f.alertaCritica)

                            // 3 Variantes de Estado:
                            // C: Seleccionado / Activo
                            // B: Restock o Stock Crítico (< 300g) -> Tono Amarillento de Alerta
                            // A: Stock Óptimo (> 300g) -> Fondo blanco neutral
                            const chipClasses = isSelected
                              ? 'bg-[#EFE5D8] text-[#633E20] border-[#A36F4C] ring-2 ring-[#A36F4C] shadow-2xs font-bold'
                              : esBajoStock
                                ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] hover:bg-[#FEF08A] hover:border-[#EAB308] font-medium shadow-2xs'
                                : 'bg-[#FFFFFF] text-[#241C15] border-[#E2D9CC] hover:bg-[#FAF8F5] hover:border-[#A36F4C] font-medium shadow-2xs'

                            const tooltipText = esBajoStock
                              ? '⚠️ Filamento con poco stock o en restock. Consultar disponibilidad antes de confirmar.'
                              : `${f.nombreColor} (${gramos}g disponibles en taller)`

                            return (
                              <button
                                key={f.id}
                                type="button"
                                title={tooltipText}
                                onClick={() => {
                                  handleAsignarColorVenta(selectedVenta.id, isSelected ? null : f.id)
                                  setIsChangingColor(false)
                                }}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all cursor-pointer text-left active:scale-[0.98] ${chipClasses}`}
                              >
                                {/* Dot Circular */}
                                <span 
                                  className="w-3 h-3 rounded-full border border-black/15 flex-shrink-0 shadow-xs"
                                  style={{ backgroundColor: f.codigoHex }}
                                />

                                {/* Nombre y Gramaje */}
                                <div className="flex items-center justify-between min-w-0 flex-1 gap-1">
                                  <span className="truncate">{f.nombreColor}</span>
                                  {esBajoStock ? (
                                    <span className="text-[10px] font-extrabold flex items-center gap-0.5 flex-shrink-0 text-[#854D0E]">
                                      <span>⚠️</span>
                                      <span>{gramos}g</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-[#75695D] flex-shrink-0">
                                      {gramos}g
                                    </span>
                                  )}
                                </div>

                                {/* Check de confirmación si está activo */}
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 text-[#633E20] stroke-[2.5] flex-shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estado Operativo & Fecha de Entrega Simétricos */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
                        Estado del Pedido
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#241C15] font-medium">
                        <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
                        <span className="text-[11px] text-[#75695D]">Promesa Entrega:</span>
                        <input
                          type="date"
                          value={selectedVenta.fecha ? new Date(selectedVenta.fecha).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleUpdateFechaVenta(selectedVenta.id, e.target.value)}
                          className="bg-white border border-[#E2D9CC] text-[#241C15] font-mono text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#A36F4C] cursor-pointer"
                          title="Modificar fecha de entrega"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {(['PENDIENTE', 'EN_PRODUCCION', 'ENTREGADO', 'CANCELADO'] as EstadoVenta[]).map((est) => {
                        const isActive = selectedVenta.estado === est
                        return (
                          <button
                            key={est}
                            type="button"
                            onClick={() => handleCambiarEstado(selectedVenta.id, est)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-[0.98] text-center ${
                              isActive
                                ? 'bg-[#A36F4C] text-white border-[#A36F4C] shadow-xs'
                                : 'bg-white border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
                            }`}
                          >
                            {est === 'PENDIENTE' ? 'Pendiente' : est === 'EN_PRODUCCION' ? 'Producción' : est === 'ENTREGADO' ? 'Entregado' : 'Cancelado'}
                          </button>
                        )
                      })}
                    </div>

                    {/* Chips informativos de logística */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E2D9CC]/60 text-[11px]">
                      <span className="bg-white border border-[#E2D9CC] px-2 py-0.5 rounded-lg text-[#75695D]">
                        Canal: <strong className="text-[#241C15]">{selectedVenta.canalVenta || 'WhatsApp'}</strong>
                      </span>
                      <span className="bg-white border border-[#E2D9CC] px-2 py-0.5 rounded-lg text-[#75695D]">
                        Envío: <strong className="text-[#241C15]">{selectedVenta.destinoEnvio || 'Shalom'}</strong>
                      </span>
                      {selectedVenta.costoPackaging && selectedVenta.costoPackaging > 0 ? (
                        <span className="bg-white border border-[#E2D9CC] px-2 py-0.5 rounded-lg text-[#75695D]">
                          Pack: <strong className="text-[#8C6D1F]">+{formatCurrency(selectedVenta.costoPackaging)}</strong>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 3. Footer & Acciones de Cobranza Consistentes (h-11, rounded-xl) */}
                <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FAF8F5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
                  {/* Izquierda: Botón eliminar */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDeleteVenta(selectedVenta.id, selectedVenta.cliente)}
                    disabled={deletingId === selectedVenta.id}
                    className="border border-red-200 text-[#DC2626] hover:bg-red-50 hover:text-red-700 h-11 px-3.5 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4 text-[#DC2626]" />
                    Eliminar Pedido
                  </Button>

                  {/* Derecha: Grupo de acciones primarias */}
                  <div className="flex items-center justify-end gap-2.5">
                    {selectedVenta.saldoPendiente > 0 ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => {
                            setMontoAbono(selectedVenta.saldoPendiente.toString())
                            setOpenAbonoModal(true)
                          }}
                          className="bg-white hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] text-xs font-bold h-11 px-4 rounded-xl cursor-pointer shadow-2xs active:scale-[0.98] flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4 text-[#A36F4C]" />
                          + Registrar Abono
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleLiquidarTotal(selectedVenta.id)}
                          className="bg-[#1E5E3A] hover:bg-[#16482C] text-white text-xs font-bold h-11 px-4 rounded-xl cursor-pointer shadow-sm active:scale-[0.98] flex items-center gap-1.5"
                        >
                          <Check className="h-4 w-4 stroke-[2.5]" />
                          Liquidar Saldo ({formatCurrency(selectedVenta.saldoPendiente)})
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] text-xs font-bold font-mono">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>Pagado al 100%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ABONO / PAGO                                             */}
      {/* ========================================================================= */}
      <Dialog open={openAbonoModal} onOpenChange={setOpenAbonoModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[420px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          {selectedVenta && (
            <form onSubmit={handleRegistrarAbonoSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
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

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
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
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex justify-end gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenAbonoModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !montoAbono || parseFloat(montoAbono) <= 0}
                  className="bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Cobro'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: NUEVO PEDIDO CON PRORRATEO DE PACKAGING Y MARGEN                   */}
      {/* ========================================================================= */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[620px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          <form onSubmit={handleCreateSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
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

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Fecha *</Label>
                  <Input 
                    type="date"
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

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
                  placeholder="Ej: Instagram, WhatsApp..."
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
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
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
                        className="pl-10 bg-[#FFFFFF] border-[#DCD3C6] text-[#8C6D1F] font-mono text-sm font-bold h-9 rounded-xl"
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
                </div>
              )}
            </div>

            {/* SECCIÓN: COLOR DE FILAMENTO CON CHECK DE STOCK EN TIEMPO REAL */}
            <div className="p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#A36F4C]" />
                  <span className="text-xs font-bold text-[#241C15]">
                    Color de Filamento (Opcional)
                  </span>
                </div>
                {formColorFilamentoId && (
                  <button
                    type="button"
                    onClick={() => setFormColorFilamentoId('')}
                    className="text-[11px] text-[#A34335] hover:underline font-semibold cursor-pointer"
                  >
                    Quitar selección
                  </button>
                )}
              </div>

              {/* Grid de Chips de Colores Disponibles con Gramaje */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#75695D] font-medium block">
                  Toca el color disponible en taller para asociar a este pedido:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {filamentos.map(f => {
                    const isSelected = formColorFilamentoId === f.id
                    const g = f.stockGramos ?? 1000
                    const esBajoStock = g < 300 || Boolean(f.alertaCritica)

                    const chipClasses = isSelected
                      ? 'bg-[#EFE5D8] text-[#633E20] border-[#A36F4C] ring-2 ring-[#A36F4C] shadow-2xs font-bold'
                      : esBajoStock
                        ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] hover:bg-[#FEF08A] hover:border-[#EAB308] font-medium shadow-2xs'
                        : 'bg-[#FFFFFF] text-[#241C15] border-[#E2D9CC] hover:bg-[#FAF8F5] hover:border-[#A36F4C] font-medium shadow-2xs'

                    const tooltipText = esBajoStock
                      ? '⚠️ Filamento con poco stock o en restock. Consultar disponibilidad antes de confirmar.'
                      : `${f.nombreColor} (${g}g disponibles en taller)`

                    return (
                      <button
                        key={f.id}
                        type="button"
                        title={tooltipText}
                        onClick={() => setFormColorFilamentoId(isSelected ? '' : f.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all cursor-pointer text-left active:scale-[0.98] ${chipClasses}`}
                      >
                        <span 
                          className="w-3 h-3 rounded-full border border-black/15 flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: f.codigoHex }}
                        />
                        <div className="flex items-center justify-between min-w-0 flex-1 gap-1">
                          <span className="truncate">{f.nombreColor}</span>
                          {esBajoStock ? (
                            <span className="text-[10px] font-extrabold flex items-center gap-0.5 flex-shrink-0 text-[#854D0E]">
                              <span>⚠️</span>
                              <span>{g}g</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#75695D] flex-shrink-0">
                              {g}g
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#633E20] stroke-[2.5] flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* VALIDACIÓN DINÁMICA EN TIEMPO REAL: PESO REQUERIDO VS STOCK EN BOBINA */}
              {(() => {
                if (!formColorFilamentoId || !formProductoId) return null
                const prod = productos.find(p => p.id === formProductoId)
                const pesoUnitario = prod 
                  ? (prod.pesoGramos != null && prod.pesoGramos > 0 ? Number(prod.pesoGramos) : Number((Number(prod.costoBase) / 0.065).toFixed(1))) 
                  : 0
                const pesoTotal = Math.round(pesoUnitario * (parseInt(formCantidad) || 1))
                const fil = filamentos.find(f => f.id === formColorFilamentoId)
                const gramosRestantes = fil?.stockGramos ?? 1000

                if (gramosRestantes < pesoTotal) {
                  return (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-150">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Stock insuficiente en bobina abierta</span>
                        <p className="text-[11px] text-red-700 leading-tight">
                          Requiere <strong>{pesoTotal}g</strong> ({pesoUnitario}g × {formCantidad || 1} un.) y solo quedan <strong>{gramosRestantes}g</strong>. Abre una bobina sellada o cambia de color.
                        </p>
                      </div>
                    </div>
                  )
                }

                if (gramosRestantes < 300 || (gramosRestantes - pesoTotal < 100)) {
                  return (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#C2410C] flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-150">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">⚠️ Filamento con poco stock ({gramosRestantes}g restantes)</span>
                        <p className="text-[11px] text-amber-800 leading-tight">
                          Consumo estimado: <strong>{pesoTotal}g</strong>. Quedarán aprox. <strong>{gramosRestantes - pesoTotal}g</strong> tras la impresión.
                        </p>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="p-2.5 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] text-xs text-[#1E5E3A] flex items-center gap-2 shadow-2xs animate-in fade-in duration-150">
                    <CheckCircle2 className="h-4 w-4 text-[#1E5E3A] flex-shrink-0" />
                    <span className="font-medium">
                      <strong>Stock disponible:</strong> {gramosRestantes}g restantes — Suficiente para este pedido ({pesoTotal}g requeridos).
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Precio Unitario Final Aplicado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Precio Unitario Final (S/) *</Label>
                  <div className="relative flex items-center w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrecioUnitario}
                      onChange={(e) => handlePrecioUnitarioChange(e.target.value)}
                      required
                      className="pl-10 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono text-base font-bold rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#1E5E3A] font-bold uppercase tracking-wider">Pago Inicial / Anticipo (S/)</Label>
                  <div className="relative flex items-center w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formMontoPagado}
                      onChange={(e) => setFormMontoPagado(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono text-base font-bold rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
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
            </div>

            {/* Footer Fijo con Botones Funcionales */}
            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenCreateModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
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
