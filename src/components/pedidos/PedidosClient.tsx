'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  Receipt,
  FileText,
  Share2,
  Copy,
  Printer,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Palette,
  Layers,
  Sparkles,
  Percent,
  CreditCard,
  Send,
  Boxes,
  ExternalLink,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  AtSign,
  MapPin,
  UserCheck,
  UserPlus,
  Lock,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { DateRange, getPresetDateRange, isDateInRange, formatToYMD } from '@/lib/date-utils'
import { EstadoPedido, TipoPrecio } from '@prisma/client'
import { createPedido, updateEstadoPedido, updatePedido, addPagoPedido, updatePagoPedido, deletePagoPedido, deletePedido, toggleSeguimientoPostventa } from '@/actions/pedidos'
import { createCliente } from '@/actions/clientes'
import { formatDate } from '@/lib/utils'
import { MultiColorPicker } from '@/components/ui/MultiColorPicker'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'
import { RegisterMultiProductOrderModal } from './RegisterMultiProductOrderModal'
import { EditOrderModal } from './EditOrderModal'
import { OrderDetailModal } from './OrderDetailModal'
import { KpiCard } from './KpiCard'
import { OrderRow } from './OrderRow'
import { ColorDot } from './ColorDot'
import { getItemColors, consolidateOrderItems, formatCurrency } from './orderUtils'

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function getInstagramUrl(handle: string) {
  const clean = handle.replace(/^@/, '').trim()
  return `https://instagram.com/${clean}`
}

function getInstagramDirectUrl(handle: string) {
  const clean = handle.replace(/^@/, '').trim()
  return `https://ig.me/m/${clean}`
}

function getWhatsAppPostventaUrl(phone: string, clientName: string, codigo: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone
  const msg = encodeURIComponent(`¡Hola ${clientName}! 👋 Te escribimos de NOVA para saber cómo te fue con tu pedido ${codigo}. ¡Esperamos que todo haya quedado genial! Cuéntanos si todo llegó bien o si tienes alguna consulta.`)
  return `https://wa.me/${fullPhone}?text=${msg}`
}

export interface ItemPedidoView {
  id: string
  pedidoId: string
  productoId: string
  nombreProductoSnapshot: string
  costoBaseSnapshot: number
  colorFilamentoId: string | null
  coloresIds?: string[]
  colores?: FilamentoOption[]
  personalizacion: string | null
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  costoPackaging: number
  porcentajeAdicional: number
  gramosConsumidos: number
  subtotal: number
  producto?: {
    id: string
    lineaCategoria: string
    nombreModelo: string
    costoBase: number
    precioMayor: number
    precioMenor: number
    activo: boolean
  } | null
  colorFilamento?: {
    id: string
    nombreColor: string
    numeroBobina?: number | null
    codigoHex?: string | null
    tipoMaterial: string
    marca?: string | null
    stockGramos?: number | null
    stockBobinas: number
  } | null
}

export interface PagoPedidoView {
  id: string
  pedidoId: string
  fecha: string
  monto: number
  metodoPago: string
  tipo: string
  notas: string | null
}

export interface PedidoView {
  id: string
  codigo: string
  fecha: string
  cliente: string
  dni?: string | null
  telefono: string | null
  canalVenta: string | null
  handleSocial?: string | null
  destinoEnvio: string | null
  diaEntregaPrometida: string | null
  notas: string | null
  metodoPago?: string | null
  estado: EstadoPedido
  costoEnvio: number
  subtotal: number
  total: number
  montoPagado: number
  saldoPendiente: number
  seguimientoPostventa: boolean
  fechaPostventa?: string | null
  notasPostventa?: string | null
  items: ItemPedidoView[]
  pagos: PagoPedidoView[]
  totalItemsCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductoOption {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioMayor: number
  precioMenor: number
  activo: boolean
}

export interface FilamentoOption {
  id: string
  nombreColor: string
  codigoHex?: string | null
  tipoMaterial: string
  marca?: string | null
  stockGramos?: number | null
  stockBobinas: number
  numeroBobina?: number | null
  estado?: string
}

export interface ClienteOption {
  id: string
  nombre: string
  telefono?: string | null
  canalOrigen?: string | null
  canalPreferido?: string | null
  handleSocial?: string | null
  direccion?: string | null
  distrito?: string | null
  dni?: string | null
}

interface PedidosClientProps {
  pedidosIniciales: PedidoView[]
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  clientesIniciales?: ClienteOption[]
}

export interface FormItemState {
  id: string
  productoId: string
  colorFilamentoId: string
  coloresIds: string[]
  personalizacion: string
  cantidad: number | string
  tipoPrecio: TipoPrecio
  precioUnitario: number | string
  costoPackaging: number | string
  porcentajeAdicional: number
  gramosConsumidos: number
}

function getDefaultFilamentoId(fils: FilamentoOption[]): string {
  if (!fils || fils.length === 0) return ''
  const negro = fils.find(f => f.nombreColor.toLowerCase().includes('negro'))
  if (negro) return negro.id
  return fils[0]?.id || ''
}


const ESTADOS_CONFIG: Record<EstadoPedido, { label: string; colorBg: string; colorText: string; colorBorder: string; icon: any }> = {
  PENDIENTE: {
    label: 'Pendiente',
    colorBg: 'bg-[#FDF6E2]',
    colorText: 'text-[#8C6D1F]',
    colorBorder: 'border-[#E8D49B]',
    icon: Clock
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    colorBg: 'bg-[#ECFDF5]',
    colorText: 'text-[#065F46]',
    colorBorder: 'border-[#A7F3D0]',
    icon: CheckCircle2
  },
  EN_PRODUCCION: {
    label: 'Preparando',
    colorBg: 'bg-[#EBF3FB]',
    colorText: 'text-[#2B6CB0]',
    colorBorder: 'border-[#BEE3F8]',
    icon: Package
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    colorBg: 'bg-[#FAF0F8]',
    colorText: 'text-[#805AD5]',
    colorBorder: 'border-[#E9D8FD]',
    icon: Package
  },
  ENTREGADO: {
    label: 'Entregado',
    colorBg: 'bg-[#EBF7EE]',
    colorText: 'text-[#1E5E3A]',
    colorBorder: 'border-[#B4E3C0]',
    icon: CheckCircle2
  },
  CANCELADO: {
    label: 'Cancelado',
    colorBg: 'bg-red-50',
    colorText: 'text-[#A34335]',
    colorBorder: 'border-red-200',
    icon: X
  }
}

export function PedidosClient({ pedidosIniciales, productos, filamentos, clientesIniciales = [] }: PedidosClientProps) {
  const [pedidos, setPedidos] = useState<PedidoView[]>(pedidosIniciales)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 200)
    return () => clearTimeout(handler)
  }, [search])
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>('TODOS')
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
    }
  }, [])

  const [selectedPedidoDetail, setSelectedPedidoDetail] = useState<PedidoView | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Estado para Edición de Abono
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false)
  const [editingPago, setEditingPago] = useState<{
    id: string
    fecha: string
    monto: string
    metodoPago: string
    tipo: string
    notas: string
    pedidoId: string
  } | null>(null)
  const [isSubmittingEditPago, setIsSubmittingEditPago] = useState(false)

  // Estado para Edición / Mantenimiento de Pedido
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoView | null>(null)

  // Estado para Vista de Tabla Interactiva y Paginación
  const [sortField, setSortField] = useState<'fecha' | 'codigo' | 'cliente' | 'cantidad' | 'total' | 'saldoPendiente' | 'estado'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('TODO'))

  // =========================================================================
  // ESTADO DEL FORMULARIO MULTIPRODUCTO
  // =========================================================================
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [formCliente, setFormCliente] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCanal, setFormCanal] = useState('WhatsApp')
  const [formHandleSocial, setFormHandleSocial] = useState('')
  const [formDestino, setFormDestino] = useState('')
  const [formDiaEntrega, setFormDiaEntrega] = useState('')
  const [formNotas, setFormNotas] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState<string>('')
  const [formMontoPagado, setFormMontoPagado] = useState<string>('')
  const [formMetodoPago, setFormMetodoPago] = useState('YAPE')
  const [formNotasPago, setFormNotasPago] = useState('')
  const [formDescontarStock, setFormDescontarStock] = useState(true)

  // Selector avanzado de clientes (Existente vs Nuevo)
  const [clientesList, setClientesList] = useState<ClienteOption[]>(clientesIniciales || [])
  const [clientSelectMode, setClientSelectMode] = useState<'EXISTING' | 'NEW'>(
    clientesIniciales && clientesIniciales.length > 0 ? 'EXISTING' : 'NEW'
  )
  const [selectedClientOption, setSelectedClientOption] = useState<ClienteOption | null>(null)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)

  // Sincronizar clientes si cambian las props iniciales
  useEffect(() => {
    if (clientesIniciales && clientesIniciales.length > 0) {
      setClientesList(clientesIniciales)
    }
  }, [clientesIniciales])

  // Opciones de productos 3D para el buscador predictivo
  const productosComboboxItems: ComboboxItem[] = useMemo(() => {
    return (productos || []).map(p => {
      const displayName = p.nombreModelo.includes(' - ')
        ? p.nombreModelo.replace(' - ', ' ➔ ')
        : p.nombreModelo

      return {
        id: p.id,
        label: displayName,
        sublabel: `${p.lineaCategoria || 'General'} • Base: S/ ${Number(p.costoBase || 0).toFixed(2)}`,
        badge: `S/ ${Number(p.precioMenor || 0).toFixed(2)}`,
        icon: Boxes,
      }
    })
  }, [productos])

  // Filtrado de clientes para el dropdown
  const filteredClientOptions = useMemo(() => {
    if (!clientSearchTerm.trim()) {
      return (clientesList || []).slice(0, 30)
    }
    const q = clientSearchTerm.trim().toLowerCase()
    const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return (clientesList || []).filter(c => {
      const n = (c.nombre || '').toLowerCase()
      const nNorm = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const t = c.telefono || ''
      const h = ((c.handleSocial || '')).toLowerCase()
      return n.includes(q) || nNorm.includes(qNorm) || t.includes(q) || h.includes(q)
    }).slice(0, 20)
  }, [clientesList, clientSearchTerm])

  // Detección preventiva de duplicados/similitud en modo "NUEVO"
  const similarExistingClient = useMemo(() => {
    if (clientSelectMode !== 'NEW' || !formCliente.trim()) return null
    const cleanInput = formCliente.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return (clientesList || []).find(c => {
      const cleanC = (c.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return cleanC === cleanInput || (cleanInput.length >= 4 && cleanC.includes(cleanInput))
    }) || null
  }, [clientSelectMode, formCliente, clientesList])

  const handleSelectClient = (c: ClienteOption) => {
    setSelectedClientOption(c)
    setClientSelectMode('EXISTING')
    setFormCliente(c.nombre)
    if (c.telefono) setFormTelefono(c.telefono)
    if (c.handleSocial) setFormHandleSocial(c.handleSocial)
    if (c.canalOrigen || c.canalPreferido) setFormCanal(c.canalOrigen || c.canalPreferido || 'WhatsApp')
    if (c.direccion || c.distrito) setFormDestino(c.direccion || c.distrito || '')
    setIsClientDropdownOpen(false)
    setClientSearchTerm('')
  }

  const handleSwitchToNewClient = (presetName = '') => {
    setSelectedClientOption(null)
    setClientSelectMode('NEW')
    setFormCliente(presetName || clientSearchTerm.trim() || formCliente || '')
    setIsClientDropdownOpen(false)
  }

  const [isRegisteringClientInline, setIsRegisteringClientInline] = useState(false)

  const handleRegisterClientInline = async () => {
    if (!formCliente.trim()) {
      toast.error('Ingresa al menos el nombre del cliente')
      return
    }
    setIsRegisteringClientInline(true)
    try {
      const created = await createCliente({
        nombre: formCliente.trim(),
        telefono: formTelefono.trim() || undefined,
        handleSocial: formHandleSocial.trim() || undefined,
        canalOrigen: formCanal,
        direccion: formDestino.trim() || undefined
      })
      const newOption: ClienteOption = {
        id: created.id,
        nombre: created.nombre,
        telefono: created.telefono,
        handleSocial: created.handleSocial,
        canalOrigen: created.canalOrigen,
        canalPreferido: created.canalOrigen,
        direccion: created.direccion
      }
      setClientesList(prev => [newOption, ...prev.filter(c => c.id !== newOption.id)])
      setSelectedClientOption(newOption)
      setClientSelectMode('EXISTING')
      toast.success(`Cliente "${created.nombre}" guardado y vinculado`)
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar cliente')
    } finally {
      setIsRegisteringClientInline(false)
    }
  }

  const handleTogglePostventa = async (pedidoId: string, nuevoEstado: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nowIso = new Date().toISOString()
    // Actualización optimista inmediata
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
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
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
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
        }
      }
    } catch (err) {
      console.error('Error saving postventa notas:', err)
    }
  }

  // Lista dinámica de ítems
  const [formItems, setFormItems] = useState<FormItemState[]>(() => {
    const defaultProd = productos[0]
    const defaultFilId = getDefaultFilamentoId(filamentos)
    return [
      {
        id: 'item-1',
        productoId: defaultProd ? defaultProd.id : '',
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MENOR',
        precioUnitario: defaultProd ? defaultProd.precioMenor : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ]
  })

  // =========================================================================
  // HELPER PARA AGREGAR / EDITAR ÍTEMS EN EL FORMULARIO
  // =========================================================================
  const addItem = () => {
    const defaultProd = productos[0]
    const defaultFilId = getDefaultFilamentoId(filamentos)
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productoId: defaultProd ? defaultProd.id : '',
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MENOR',
        precioUnitario: defaultProd ? defaultProd.precioMenor : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ])
  }

  const removeItem = (id: string) => {
    if (formItems.length <= 1) return
    setFormItems(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<FormItemState>) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const merged = { ...item, ...updates }

      // Si cambió el producto, recalcular precio base
      if (updates.productoId && updates.productoId !== item.productoId) {
        const p = productos.find(prod => prod.id === updates.productoId)
        if (p) {
          let pUnit = p.precioMenor
          if (merged.tipoPrecio === 'MAYOR' || (merged.tipoPrecio as string) === 'AMIGOS') pUnit = p.precioMayor
          else if (merged.tipoPrecio === 'MENOR' || (merged.tipoPrecio as string) === 'MERCADO') pUnit = p.precioMenor
          merged.precioUnitario = pUnit
        }
      }

      // Si cambió el tier de precio
      if (updates.tipoPrecio && updates.tipoPrecio !== item.tipoPrecio) {
        const p = productos.find(prod => prod.id === merged.productoId)
        if (p) {
          if (updates.tipoPrecio === 'MAYOR' || (updates.tipoPrecio as string) === 'AMIGOS') merged.precioUnitario = p.precioMayor
          else if (updates.tipoPrecio === 'MENOR' || (updates.tipoPrecio as string) === 'MERCADO') merged.precioUnitario = p.precioMenor
        }
      }

      return merged
    }))
  }

  // Cálculos dinámicos del formulario
  const formSubtotalCalculado = useMemo(() => {
    return formItems.reduce((sum, it) => {
      const u = Number(it.precioUnitario) || 0
      const pack = Number(it.costoPackaging) || 0
      const q = Math.max(1, Number(it.cantidad) || 1)
      return sum + ((u + pack) * q)
    }, 0)
  }, [formItems])

  const formTotalCalculado = useMemo(() => {
    const env = Number(formCostoEnvio) || 0
    return Number((formSubtotalCalculado + env).toFixed(2))
  }, [formSubtotalCalculado, formCostoEnvio])

  const formSaldoPendienteCalculado = useMemo(() => {
    const pag = Number(formMontoPagado) || 0
    return Math.max(0, Number((formTotalCalculado - pag).toFixed(2)))
  }, [formTotalCalculado, formMontoPagado])

  // =========================================================================
  // RESET FORMULARIO
  // =========================================================================
  const resetForm = () => {
    const defaultProd = productos[0]
    const defaultFilId = getDefaultFilamentoId(filamentos)
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormCliente('')
    setFormTelefono('')
    setFormCanal('WhatsApp')
    setFormHandleSocial('')
    setSelectedClientOption(null)
    setClientSelectMode((clientesList || []).length > 0 ? 'EXISTING' : 'NEW')
    setClientSearchTerm('')
    setIsClientDropdownOpen(false)
    setFormDestino('')
    setFormDiaEntrega('')
    setFormNotas('')
    setFormCostoEnvio('')
    setFormMontoPagado('')
    setFormMetodoPago('YAPE')
    setFormNotasPago('')
    setFormDescontarStock(true)
    setFormItems([
      {
        id: 'item-1',
        productoId: defaultProd ? defaultProd.id : '',
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MENOR',
        precioUnitario: defaultProd ? defaultProd.precioMenor : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ])
  }

  // =========================================================================
  // GUARDAR NUEVO PEDIDO MULTIPRODUCTO
  // =========================================================================
  const handleSubmitNuevoPedido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientSelectMode === 'EXISTING' && !selectedClientOption) {
      toast.error('Por favor busca y selecciona un cliente registrado, o haz clic en "+ Registrar Nuevo".')
      return
    }

    if (!formCliente.trim()) {
      toast.error('Por favor ingresa el nombre del cliente.')
      return
    }

    if (formItems.some(i => !i.productoId)) {
      alert('Todos los ítems deben tener un producto seleccionado.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPedido({
        fecha: formFecha,
        cliente: formCliente.trim(),
        telefono: formTelefono.trim() || undefined,
        canalVenta: formCanal,
        handleSocial: formHandleSocial.trim() || undefined,
        destinoEnvio: formDestino.trim() || undefined,
        diaEntregaPrometida: formDiaEntrega.trim() || undefined,
        notas: formNotas.trim() || undefined,
        costoEnvio: Number(formCostoEnvio) || 0,
        montoPagado: Number(formMontoPagado) || 0,
        metodoPago: formMetodoPago,
        notasPago: formNotasPago.trim() || undefined,
        descontarStock: formDescontarStock,
        items: formItems.map(it => ({
          productoId: it.productoId,
          colorFilamentoId: it.coloresIds?.[0] || it.colorFilamentoId || undefined,
          coloresIds: it.coloresIds || [],
          personalizacion: it.personalizacion.trim() || undefined,
          cantidad: Number(it.cantidad) || 1,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: Number(it.precioUnitario) || 0,
          costoPackaging: Number(it.costoPackaging) || 0,
          porcentajeAdicional: Number(it.porcentajeAdicional) || 0,
          gramosConsumidos: Number(it.gramosConsumidos) || 0
        }))
      })

      if (res.success && res.pedido) {
        setPedidos(prev => [res.pedido as any, ...prev])
        const cleanName = formCliente.trim()
        if (!clientesList.some(c => c.nombre.toLowerCase() === cleanName.toLowerCase())) {
          setClientesList(prev => [
            {
              id: `auto-${cleanName.toLowerCase()}`,
              nombre: cleanName,
              telefono: formTelefono.trim() || null,
              handleSocial: formHandleSocial.trim() || null,
              canalPreferido: formCanal,
              canalOrigen: formCanal,
              direccion: formDestino.trim() || null
            },
            ...prev
          ])
        }
        setIsNewOrderModalOpen(false)
        resetForm()
        toast.success(`Pedido ${res.pedido.codigo} registrado exitosamente`)
      } else {
        alert(res.error || 'No se pudo crear el pedido')
      }
    } catch (err: any) {
      alert(err.message || 'Error inesperado al crear el pedido')
    } finally {
      setIsSubmitting(false)
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
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
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
        setPedidos(prev => prev.map(p => p.id === selectedPedidoDetail.id ? (res.pedido as any) : p))
        setSelectedPedidoDetail(res.pedido as any)
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
        setPedidos(prev => prev.map(p => p.id === editingPago.pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === editingPago.pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
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
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
        }
      } else {
        alert(res.error || 'No se pudo eliminar el abono')
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el abono')
    }
  }

  // =========================================================================
  // ELIMINAR PEDIDO
  // =========================================================================
  const handleEliminarPedido = async (id: string, codigo: string) => {
    if (!confirm(`¿Estás seguro de eliminar el pedido ${codigo}?`)) return
    try {
      const res = await deletePedido(id)
      if (res.success) {
        setPedidos(prev => prev.filter(p => p.id !== id))
        if (selectedPedidoDetail?.id === id) setSelectedPedidoDetail(null)
      } else {
        alert(res.error || 'No se pudo eliminar el pedido')
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar pedido')
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

      if (selectedEstadoFilter !== 'TODOS' && p.estado !== selectedEstadoFilter) return false

      if (selectedPagoFilter === 'PAGADO' && p.saldoPendiente > 0) return false
      if (selectedPagoFilter === 'PENDIENTE' && p.saldoPendiente <= 0) return false
      if (selectedPagoFilter === 'ANTICIPO' && (p.montoPagado <= 0 || p.saldoPendiente <= 0)) return false

      if (selectedPostventaFilter === 'PENDIENTE' && p.seguimientoPostventa) return false
      if (selectedPostventaFilter === 'REALIZADO' && !p.seguimientoPostventa) return false

      return true
    })
  }, [pedidos, debouncedSearch, selectedEstadoFilter, selectedPagoFilter, selectedPostventaFilter, dateRange, filamentos])

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
      let comparison = 0
      if (sortField === 'fecha') {
        comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      } else if (sortField === 'codigo') {
        comparison = a.codigo.localeCompare(b.codigo)
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Gestión de Pedidos
            </h1>
            <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full border border-border">
              {kpis.totalPedidos}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro, control de pagos y envíos por cliente.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setIsNewOrderModalOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-[0.98] border-0"
        >
          <Plus className="h-4 w-4 stroke-[2]" />
          <span>+ Nuevo Pedido</span>
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
        />
        <KpiCard
          label="Preparando"
          value={kpis.enProduccion}
          sublabel="en taller"
          icon={<Package className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Por Entregar"
          value={kpis.listos}
          sublabel="listos"
          icon={<Truck className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Por Cobrar"
          value={formatCurrency(kpis.saldoPorCobrar)}
          sublabel="saldo pendiente"
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Cobrado"
          value={formatCurrency(kpis.totalCobrado)}
          sublabel="en caja"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTROS Y BÚSQUEDA (TOOLBAR SIMÉTRICA)                                 */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-xl p-1.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Buscador Integrado */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por cliente, código o modelo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="h-8 text-xs bg-background border-input rounded-lg pl-8 pr-7 w-full lg:w-72 focus-visible:ring-1 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCurrentPage(1)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Controles a la derecha */}
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-between lg:justify-end">
          {/* Segmented Control de Estados (Desktop) */}
          <div className="hidden sm:inline-flex bg-muted/60 p-0.5 rounded-lg items-center gap-0.5">
            {[
              { value: 'TODOS', label: 'Todos' },
              { value: 'EN_PRODUCCION', label: 'Preparando' },
              { value: 'LISTO_ENTREGA', label: 'Por Entregar' },
              { value: 'ENTREGADO', label: 'Entregado' }
            ].map((opt) => {
              const isSelected = selectedEstadoFilter === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedEstadoFilter(opt.value)
                    setCurrentPage(1)
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-card text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Selector Dropdown de Estados (Mobile) */}
          <select
            value={selectedEstadoFilter}
            onChange={(e) => {
              setSelectedEstadoFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="sm:hidden h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="EN_PRODUCCION">Preparando</option>
            <option value="LISTO_ENTREGA">Por Entregar</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGO_VALIDADO">Pago Validado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          {/* Selector de Pagos */}
          <select
            value={selectedPagoFilter}
            onChange={(e) => {
              setSelectedPagoFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="h-8 text-xs bg-background border border-input rounded-lg px-2.5 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            title="Filtrar por cobranza"
          >
            <option value="TODOS">Pagos: Todos</option>
            <option value="PENDIENTE">Con Saldo</option>
            <option value="PAGADO">100% Pagado</option>
          </select>

          {/* Navegador temporal compacto [ < ] [ 📅 Histórico ▾ ] [ > ] */}
          <DateFilterControl
            value={dateRange}
            onChange={(range) => {
              setDateRange(range)
              setCurrentPage(1)
            }}
            label="Fecha"
            align="right"
            size="sm"
            minDate={minFechaData}
            maxDate={maxFechaData}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA DE PEDIDOS (CERO SCROLL HORIZONTAL, TABLE-FIXED W-FULL)          */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {filteredPedidos.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Boxes className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No se encontraron pedidos</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No hay pedidos que coincidan con los filtros de búsqueda o fecha seleccionados.
            </p>
            {(search || selectedEstadoFilter !== 'TODOS' || selectedPagoFilter !== 'TODOS' || selectedPostventaFilter !== 'TODOS') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSelectedEstadoFilter('TODOS')
                  setSelectedPagoFilter('TODOS')
                  setSelectedPostventaFilter('TODOS')
                  setDateRange(getPresetDateRange('TODO'))
                  setCurrentPage(1)
                }}
                className="mt-4 h-8 px-3 rounded-lg border-border bg-card hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
              >
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <Table className="w-full table-fixed">
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[22%] px-4 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort('fecha')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <span>Pedido & Cliente</span>
                      {sortField === 'fecha' || sortField === 'codigo' || sortField === 'cliente' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                      )}
                    </button>
                  </TableHead>

                  <TableHead className="w-[32%] px-4 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort('cantidad')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <span>Productos & Filamentos</span>
                      {sortField === 'cantidad' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                      )}
                    </button>
                  </TableHead>

                  <TableHead className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Entrega & Destino
                  </TableHead>

                  <TableHead className="w-[14%] px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('estado')}
                      className="flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer mx-auto"
                    >
                      <span>Estado & Postventa</span>
                      {sortField === 'estado' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                      )}
                    </button>
                  </TableHead>

                  <TableHead className="w-[14%] px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('total')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto"
                    >
                      <span>Total & Balance</span>
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
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PIE DE TABLA: SELECTOR DE REGISTROS Y PAGINACIÓN AL PIE                    */}
        {/* ========================================================================= */}
        {filteredPedidos.length > 0 && (
          <div className="p-3 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground cursor-pointer focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-muted-foreground ml-1">
                de <strong className="text-foreground">{sortedPedidos.length}</strong> pedidos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">
                Página {currentPage} de {Math.max(1, totalPages)}
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
        initialProductoId={preselectedProductId}
        onOrderCreated={(newPedido, newClient) => {
          setPedidos(prev => [newPedido as any, ...prev])
          if (newClient) {
            setClientesList(prev => [newClient, ...prev])
          }
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
        isOpen={!!selectedPedidoDetail}
        onClose={() => setSelectedPedidoDetail(null)}
        onEditOrder={handleOpenEditModal}
        onTogglePostventa={handleTogglePostventa}
        onSaveNotasPostventa={handleSaveNotasPostventa}
        onOpenEditPago={handleOpenEditPago}
        onDeletePago={handleDeletePago}
        onRegistrarAbono={handleRegistrarAbonoFromDetail}
      />

      {/* ========================================================================= */}
      {/* 6.5. MODAL: EDITAR FECHA / MONTO DE ABONO                                 */}
      {/* ========================================================================= */}
      {isEditPagoModalOpen && editingPago && (
        <div className="fixed inset-0 isolate z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-muted/40 border-b border-border p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-accent flex items-center justify-center shadow-xs">
                  <DollarSign className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Editar Registro de Abono</h3>
                  <p className="text-xs text-muted-foreground">Ajusta la fecha contable, monto o método de este abono.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditPagoModalOpen(false)
                  setEditingPago(null)
                }}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditPagoSubmit} className="p-5 sm:p-6 space-y-4">
              {/* Fecha */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Fecha Real de Cobranza *
                </Label>
                <Input
                  type="date"
                  value={editingPago.fecha}
                  onChange={(e) => setEditingPago(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                  required
                  className="bg-background border-border text-foreground font-mono text-sm font-semibold rounded-xl focus:border-primary"
                />
                <p className="text-[10px] text-muted-foreground">
                  Esta fecha se reflejará exactamente en el Flujo de Caja e ingresos de ese día.
                </p>
              </div>

              {/* Monto */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
                  Monto Cobrado (S/) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">S/</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPago.monto}
                    onChange={(e) => setEditingPago(prev => prev ? { ...prev, monto: e.target.value } : null)}
                    required
                    placeholder="0.00"
                    className="pl-9 bg-background border-border text-foreground font-mono text-base font-bold rounded-xl focus:border-primary"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
                  Método de Pago *
                </Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['YAPE', 'PLIN', 'BCP', 'EFECTIVO'].map(metodo => {
                    const isSel = editingPago.metodoPago === metodo
                    return (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => setEditingPago(prev => prev ? { ...prev, metodoPago: metodo } : null)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs' 
                            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {metodo}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tipo de Abono */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
                  Tipo de Abono *
                </Label>
                <select
                  value={editingPago.tipo}
                  onChange={(e) => setEditingPago(prev => prev ? { ...prev, tipo: e.target.value } : null)}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                >
                  <option value="ANTICIPO">Anticipo / Adelanto</option>
                  <option value="SALDO_ENTREGA">Liquidación / Saldo Final</option>
                  <option value="ABONO">Abono Parcial</option>
                </select>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-semibold uppercase tracking-wider">
                  Notas o N° de Operación (Opcional)
                </Label>
                <Input
                  value={editingPago.notas}
                  onChange={(e) => setEditingPago(prev => prev ? { ...prev, notas: e.target.value } : null)}
                  placeholder="Ej: Operación 481920..."
                  className="bg-background border-border text-foreground text-xs rounded-xl"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditPagoModalOpen(false)
                    setEditingPago(null)
                  }}
                  className="px-4 h-9 text-xs font-medium border-border bg-card hover:bg-muted text-muted-foreground rounded-xl cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEditPago}
                  className="px-5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl cursor-pointer"
                >
                  {isSubmittingEditPago ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}
