'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  ShoppingBag, 
  MapPin, 
  AtSign, 
  Mail,
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  User, 
  CreditCard, 
  Globe, 
  Building2, 
  FileText,
  MoreHorizontal,
  Calendar,
  Package,
  Box,
  ExternalLink,
  UserPlus,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useBusiness } from '@/context/BusinessContext'
import { 
  ClienteItem, 
  ClienteDetalleView, 
  createCliente, 
  updateCliente, 
  deleteCliente, 
  getClienteDetalle 
} from '@/actions/clientes'

function InstagramIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
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

function CanalBadge({ canal }: { canal: string }) {
  const normalized = canal.toLowerCase().trim()
  if (normalized === 'whatsapp') {
    return (
      <span className="bg-secondary border border-border/70 text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
        <MessageCircle className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600 shrink-0" />
        <span>WhatsApp</span>
      </span>
    )
  }
  if (normalized === 'instagram') {
    return (
      <span className="bg-secondary border border-border/70 text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
        <InstagramIcon className="h-2.5 w-2.5 text-primary shrink-0" />
        <span>Instagram</span>
      </span>
    )
  }
  return (
    <span className="bg-secondary border border-border/70 text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
      <span>{canal}</span>
    </span>
  )
}

function renderUbicacionCell(distrito?: string | null, direccion?: string | null) {
  const d = distrito?.trim()
  const dir = direccion?.trim()

  // Si tiene distrito registrado diferente a simplemente 'Lima' (ej: Miraflores, San Borja, etc.)
  if (d && d.toLowerCase() !== 'lima') {
    return (
      <span 
        className="bg-secondary/70 border border-border/70 text-foreground text-xs font-medium px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 truncate max-w-full"
        title={dir ? `${d} - ${dir}` : d}
      >
        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{d}</span>
      </span>
    )
  }

  // Si solo figura Lima sin distrito específico
  if (d && d.toLowerCase() === 'lima') {
    return (
      <span className="text-xs text-muted-foreground font-medium" title={dir || undefined}>
        Lima
      </span>
    )
  }

  if (dir) {
    return (
      <span className="text-xs text-muted-foreground font-medium truncate block max-w-full" title={dir}>
        {dir}
      </span>
    )
  }

  return <span className="text-xs text-muted-foreground font-medium">—</span>
}

interface ClientesClientProps {
  initialClientes: ClienteItem[]
}

type FiltroPago = 'TODOS' | 'AL_DIA' | 'CON_DEUDA'

export function ClientesClient({ initialClientes }: ClientesClientProps) {
  const router = useRouter()
  const { config } = useBusiness()
  const [clientes, setClientes] = useState<ClienteItem[]>(initialClientes)
  const [, startTransition] = useTransition()

  // Filtros y búsqueda
  const [search, setSearch] = useState('')
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('TODOS')
  const [canalFilter, setCanalFilter] = useState<string>('TODOS')
  const [ubicacionFilter, setUbicacionFilter] = useState<string>('TODAS')

  // Modales y Drawer
  const [modalFormOpen, setModalFormOpen] = useState(false)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDetalle, setSelectedDetalle] = useState<ClienteDetalleView | null>(null)
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    canalOrigen: 'Instagram',
    handleSocial: '',
    distrito: '',
    direccion: '',
    notas: ''
  })
  const [formErrors, setFormErrors] = useState<{ nombre?: string }>({})

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Format phone to clean WhatsApp number (Peru 51 default if 9 digits)
  const getWhatsAppUrl = (tel?: string | null, clientName?: string) => {
    if (!tel) return '#'
    let clean = tel.replace(/\D/g, '')
    if (clean.length === 9) clean = `51${clean}`
    const text = encodeURIComponent(`¡Hola ${clientName || ''}! Te escribimos de NOVA Studio...`)
    return `https://wa.me/${clean}?text=${text}`
  }

  // Directorio completo de clientes
  const clientesEnRango = clientes

  // KPIs
  const totalClientes = clientesEnRango.length
  const clientesRecurrentes = useMemo(() => clientesEnRango.filter(c => c.pedidosCount > 1).length, [clientesEnRango])
  const tasaRecurrencia = totalClientes > 0 ? Math.round((clientesRecurrentes / totalClientes) * 100) : 0
  
  const totalDeudaAcumulada = useMemo(() => clientesEnRango.reduce((acc, c) => acc + c.saldoPendiente, 0), [clientesEnRango])
  const clientesConDeudaCount = useMemo(() => clientesEnRango.filter(c => c.saldoPendiente > 0).length, [clientesEnRango])

  const totalFacturadoTotal = useMemo(() => clientesEnRango.reduce((acc, c) => acc + c.totalComprado, 0), [clientesEnRango])
  const ticketPromedio = totalClientes > 0 ? totalFacturadoTotal / totalClientes : 0

  // Canales disponibles para filtro
  const canalesList = useMemo(() => {
    const defaultCanales = ['Instagram', 'WhatsApp', 'Directo', 'Recomendación']
    const set = new Set<string>(defaultCanales)
    clientesEnRango.forEach(c => {
      if (c.canalOrigen) set.add(c.canalOrigen)
      if (c.canalPreferido) set.add(c.canalPreferido)
    })
    return Array.from(set)
  }, [clientesEnRango])

  // Distritos/Ubicaciones disponibles para filtro
  const ubicacionesList = useMemo(() => {
    const set = new Set<string>()
    clientesEnRango.forEach(c => {
      const d = c.distrito?.trim()
      if (d) set.add(d)
    })
    return Array.from(set).sort()
  }, [clientesEnRango])

  // Filtrado de clientes
  const filteredClientes = useMemo(() => {
    return clientesEnRango.filter(c => {
      // Filtro de búsqueda
      const q = search.trim().toLowerCase()
      const matchSearch = !q || 
        c.nombre.toLowerCase().includes(q) ||
        (c.dni && c.dni.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.handleSocial && c.handleSocial.toLowerCase().includes(q)) ||
        (c.distrito && c.distrito.toLowerCase().includes(q)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q))

      // Filtro de estado de pago
      let matchPago = true
      if (filtroPago === 'AL_DIA') matchPago = c.saldoPendiente <= 0
      if (filtroPago === 'CON_DEUDA') matchPago = c.saldoPendiente > 0

      // Filtro de canal
      let matchCanal = true
      if (canalFilter !== 'TODOS') {
        const canalActual = (c.canalOrigen || c.canalPreferido || 'Instagram').toLowerCase()
        matchCanal = canalActual === canalFilter.toLowerCase()
      }

      // Filtro de ubicación
      let matchUbicacion = true
      if (ubicacionFilter === 'SIN_UBICACION') {
        matchUbicacion = !c.distrito && !c.direccion
      } else if (ubicacionFilter !== 'TODAS') {
        matchUbicacion = (c.distrito?.toLowerCase() === ubicacionFilter.toLowerCase())
      }

      return matchSearch && matchPago && matchCanal && matchUbicacion
    })
  }, [clientesEnRango, search, filtroPago, canalFilter, ubicacionFilter])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormErrors({})
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      email: '',
      canalOrigen: 'Instagram',
      handleSocial: '',
      distrito: '',
      direccion: '',
      notas: ''
    })
    setModalFormOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (c: ClienteItem) => {
    setEditingId(c.id)
    setFormErrors({})
    setFormData({
      nombre: c.nombre,
      dni: c.dni || '',
      telefono: c.telefono || '',
      email: c.email || '',
      canalOrigen: c.canalOrigen || c.canalPreferido || 'Instagram',
      handleSocial: c.handleSocial || '',
      distrito: c.distrito || '',
      direccion: c.direccion || '',
      notas: c.notas || ''
    })
    setModalFormOpen(true)
  }

  // View Client Profile / History Modal (Drawer)
  const handleVerDetalle = async (c: ClienteItem) => {
    setIsLoadingDetalle(true)
    setModalDetalleOpen(true)
    setSelectedDetalle(null)

    try {
      const detalle = await getClienteDetalle(c.id || c.nombre)
      setSelectedDetalle(detalle)
    } catch (err: any) {
      toast.error('Error al cargar historial: ' + err.message)
    } finally {
      setIsLoadingDetalle(false)
    }
  }

  // Submit Create / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      setFormErrors({ nombre: 'El nombre del cliente es obligatorio' })
      toast.error('El nombre del cliente es obligatorio')
      return
    }
    setFormErrors({})

    setIsSubmitting(true)
    try {
      if (editingId) {
        const updated = await updateCliente(editingId, {
          nombre: formData.nombre.trim(),
          dni: formData.dni.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          email: formData.email.trim() || undefined,
          canalOrigen: formData.canalOrigen.trim() || undefined,
          handleSocial: formData.handleSocial.trim() || undefined,
          distrito: formData.distrito.trim() || undefined,
          direccion: formData.direccion.trim() || undefined,
          notas: formData.notas.trim() || undefined
        })
        setClientes(prev => prev.map(c => c.id === editingId ? { ...c, ...updated } : c))
        toast.success(`Cliente "${updated.nombre}" actualizado`)
      } else {
        const nuevo = await createCliente({
          nombre: formData.nombre.trim(),
          dni: formData.dni.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          email: formData.email.trim() || undefined,
          canalOrigen: formData.canalOrigen.trim() || undefined,
          handleSocial: formData.handleSocial.trim() || undefined,
          distrito: formData.distrito.trim() || undefined,
          direccion: formData.direccion.trim() || undefined,
          notas: formData.notas.trim() || undefined
        })
        setClientes(prev => [{
          ...nuevo,
          totalComprado: 0,
          totalPagado: 0,
          saldoPendiente: 0,
          puntos: 0,
          pedidosCount: 0,
          piezasCount: 0,
          ultimoPedidoFecha: null,
          canalPreferido: nuevo.canalOrigen || 'Instagram'
        }, ...prev])
        toast.success(`Cliente "${nuevo.nombre}" registrado exitosamente`)
      }

      setModalFormOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete / Archive Client
  const handleDelete = async (c: ClienteItem) => {
    if (!confirm(`¿Estás seguro de eliminar a "${c.nombre}"?`)) return

    try {
      await deleteCliente(c.id)
      setClientes(prev => prev.filter(item => item.id !== c.id))
      toast.success(`Cliente "${c.nombre}" eliminado`)
      startTransition(() => {
        router.refresh()
      })
    } catch (err: any) {
      toast.error('Error al eliminar cliente: ' + err.message)
    }
  }

  return (
    <TooltipProvider delay={150}>
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* ========================================================================= */}
        {/* 1. ENCABEZADO PRINCIPAL (RESPIRA LIBREMENTE SIN CAJA EXTERIOR)             */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Directorio de Clientes
                </h1>
                <Badge variant="outline" className="text-xs font-semibold bg-accent/60 text-accent-foreground border-border px-2.5 py-0.5">
                  {totalClientes} {totalClientes === 1 ? 'cliente' : 'clientes'} • {config.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control de clientes, historial de pedidos, saldos por cobrar y WhatsApp directo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/pedidos"
              className="border border-border text-foreground hover:bg-secondary rounded-xl h-10 px-4 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span>Ver Pedidos</span>
            </Link>

            <Button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KPI SUMMARY CARDS (CUADRÍCULA SIMÉTRICA Y ESTÁNDAR)                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Clientes */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cartera Total</span>
              <span className="h-7 w-7 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-xs">
                <Users className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {totalClientes}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <span className="text-emerald-700 font-bold">100%</span> activos
            </div>
          </div>

          {/* Card 2: Clientes Recurrentes */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recurrentes</span>
              <span className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center text-xs">
                <UserCheck className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 tracking-tight">
              {clientesRecurrentes}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <span className="font-bold text-emerald-700">{tasaRecurrencia}%</span> fidelización (2+ pedidos)
            </div>
          </div>

          {/* Card 3: Cuentas por Cobrar */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Por Cobrar</span>
              <span className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs ${
                totalDeudaAcumulada > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-800'
              }`}>
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${
              totalDeudaAcumulada > 0 ? 'text-destructive' : 'text-emerald-800 dark:text-emerald-300'
            }`}>
              {formatCurrency(totalDeudaAcumulada)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              {clientesConDeudaCount > 0 ? (
                <span className="text-destructive font-bold">{clientesConDeudaCount} cliente(s) con saldo</span>
              ) : (
                <span className="text-emerald-700 font-bold">Todos al día ✅</span>
              )}
            </div>
          </div>

          {/* Card 4: Ticket Promedio */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ticket Promedio</span>
              <span className="h-7 w-7 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(ticketPromedio)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              LTV medio por cliente
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BARRA DE HERRAMIENTAS INTEGRADA (SIN CÁPSULA EXTERIOR)                  */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          {/* Fila 1: Buscador a la izquierda + Selector de Ubicación a la derecha */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, teléfono, @usuario de Instagram o distrito..."
                className="h-10 rounded-xl border-input bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-52 shrink-0">
              <select
                value={ubicacionFilter}
                onChange={(e) => setUbicacionFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors cursor-pointer shadow-2xs"
              >
                <option value="TODAS">Ubicación: Todas</option>
                {ubicacionesList.map(ub => (
                  <option key={ub} value={ub}>{ub}</option>
                ))}
                <option value="SIN_UBICACION">Sin ubicación registrada</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Segmented Canales (Izq) + Segmented Estado de Pago (Der) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1">
            {/* Segmented Control de Canales */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setCanalFilter('TODOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  canalFilter === 'TODOS'
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Todos
              </button>
              {canalesList.map(canal => {
                const isActive = canalFilter.toLowerCase() === canal.toLowerCase()
                return (
                  <button
                    key={canal}
                    type="button"
                    onClick={() => setCanalFilter(canal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                        : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {canal}
                  </button>
                )
              })}
            </div>

            {/* Segmented Control de Estado de Pago */}
            <div className="flex items-center rounded-xl bg-card p-0.5 border border-border text-xs font-semibold shadow-2xs shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setFiltroPago('TODOS')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroPago === 'TODOS' ? 'bg-secondary text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({clientes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroPago('AL_DIA')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroPago === 'AL_DIA' ? 'bg-secondary text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Al Día
              </button>
              <button
                type="button"
                onClick={() => setFiltroPago('CON_DEUDA')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroPago === 'CON_DEUDA' ? 'bg-secondary text-destructive shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Con Deuda ({clientesConDeudaCount})
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. TABLA PRINCIPAL (PROPORCIONES CALIBRADAS: 36% - 18% - 18% - 14% - 14%)  */}
        {/* ========================================================================= */}
        <div className="hidden lg:block w-full bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
          <table className="table-fixed w-full border-collapse text-xs">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="bg-secondary/60 border-b border-border text-muted-foreground text-[11px] font-semibold">
                <th className="py-3.5 px-4 font-bold text-left tracking-wider uppercase">CLIENTE & CONTACTO</th>
                <th className="py-3.5 px-4 font-bold text-left tracking-wider uppercase">UBICACIÓN</th>
                <th className="py-3.5 px-4 font-bold text-left tracking-wider uppercase">LTV & HISTORIAL</th>
                <th className="py-3.5 px-4 font-bold text-center tracking-wider uppercase">ESTADO PAGO</th>
                <th className="py-3.5 px-4 font-bold text-right pr-4 tracking-wider uppercase">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground italic bg-card">
                    No se encontraron clientes con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => {
                  const initials = c.nombre.substring(0, 2).toUpperCase()
                  const canalDisplay = c.canalOrigen || c.canalPreferido || 'Instagram'
                  const tieneDeuda = c.saldoPendiente > 0

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => handleVerDetalle(c)}
                      className="h-16 transition-colors hover:bg-secondary/35 cursor-pointer"
                    >
                      {/* Col 1: CLIENTE & CONTACTO (w-[36%]) */}
                      <td className="py-3 px-4 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar Circular */}
                          <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center border border-border/80 shrink-0 shadow-2xs">
                            {initials}
                          </div>

                          {/* Bloque de Texto */}
                          <div className="flex flex-col min-w-0 justify-center">
                            <span 
                              className="text-sm font-bold text-foreground truncate hover:text-primary transition-colors cursor-pointer text-left block"
                              title={c.nombre}
                            >
                              {c.nombre}
                            </span>
                            
                            {/* Fila de Metadatos */}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap min-w-0">
                              {/* Chip de Canal */}
                              <CanalBadge canal={canalDisplay} />

                              {/* Teléfono / WhatsApp */}
                              {c.telefono ? (
                                <a
                                  href={getWhatsAppUrl(c.telefono, c.nombre)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                                  title="Abrir chat de WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3 fill-emerald-600 text-emerald-600 shrink-0" />
                                  <span>{c.telefono}</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenEdit(c)
                                  }}
                                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                                  title="Registrar teléfono"
                                >
                                  + Teléfono
                                </button>
                              )}

                              {/* Handle Social si existe */}
                              {c.handleSocial && (
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5 truncate shrink-0">
                                  <AtSign className="h-2.5 w-2.5 inline shrink-0" />
                                  {c.handleSocial.replace(/^@/, '')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: UBICACIÓN (w-[18%]) */}
                      <td className="py-3 px-4 min-w-0">
                        {renderUbicacionCell(c.distrito, c.direccion)}
                      </td>

                      {/* Col 3: LTV & HISTORIAL (w-[18%]) */}
                      <td className="py-3 px-4 min-w-0 tabular-nums">
                        <span className="text-sm font-extrabold text-foreground block">
                          {formatCurrency(c.totalComprado)}
                        </span>
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <span>{c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'}</span>
                          <span>•</span>
                          <Tooltip>
                            <TooltipTrigger 
                              onClick={(e) => e.stopPropagation()} 
                              className="cursor-help inline-flex items-center hover:text-primary transition-colors underline decoration-dotted"
                            >
                              <span>{c.puntos} pts</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Puntos acumulados canjeables por descuentos
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>

                      {/* Col 4: ESTADO PAGO (w-[14%]) */}
                      <td className="py-3 px-4 text-center min-w-0">
                        {tieneDeuda ? (
                          <span 
                            className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                            title={`Debe ${formatCurrency(c.saldoPendiente)}`}
                          >
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Debe {formatCurrency(c.saldoPendiente)}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>✓ Al día</span>
                          </span>
                        )}
                      </td>

                      {/* Col 5: ACCIONES (w-[14%]) */}
                      <td className="py-3 px-4 text-right pr-4 min-w-0">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVerDetalle(c)
                            }}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer flex items-center gap-1"
                            title="Ver Ficha y Historial"
                          >
                            <Eye className="h-3.5 w-3.5 text-primary" />
                            <span>Ficha</span>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer"
                              title="Más opciones"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-card border border-border shadow-lg rounded-xl p-1 z-50">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEdit(c)
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Editar Cliente</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/pedidos?cliente=${encodeURIComponent(c.nombre)}`)
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg cursor-pointer"
                              >
                                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Crear Pedido</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(c)
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* 5. VISTA MÓVIL (CARDS RESPONSIVAS)                                        */}
        {/* ========================================================================= */}
        <div className="lg:hidden space-y-3">
          {filteredClientes.length === 0 ? (
            <div className="bg-card p-8 text-center text-xs text-muted-foreground italic rounded-2xl border border-border">
              No se encontraron clientes con los filtros aplicados
            </div>
          ) : (
            filteredClientes.map((c) => {
              const initials = c.nombre.substring(0, 2).toUpperCase()
              const canalDisplay = c.canalOrigen || c.canalPreferido || 'Instagram'
              const tieneDeuda = c.saldoPendiente > 0

              return (
                <div 
                  key={c.id} 
                  onClick={() => handleVerDetalle(c)}
                  className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                >
                  {/* Fila 1: Avatar, Nombre y Estado Pago */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center border border-border/80 shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{c.nombre}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                          <CanalBadge canal={canalDisplay} />
                          {c.distrito && <span>• {c.distrito}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {tieneDeuda ? (
                        <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          <span>Debe {formatCurrency(c.saldoPendiente)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>✓ Al día</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Estadísticas Rápidas */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-secondary/50 rounded-xl border border-border text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-sans">LTV Comprado</span>
                      <span className="font-black text-foreground">{formatCurrency(c.totalComprado)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block font-sans">NovaPoints / Pedidos</span>
                      <span className="font-bold text-foreground">{c.puntos} pts • {c.pedidosCount} ped.</span>
                    </div>
                  </div>

                  {/* Fila 3: Acciones Móvil */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border flex-wrap">
                    {c.telefono ? (
                      <a
                        href={getWhatsAppUrl(c.telefono, c.nombre)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-[100px] h-8 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5 fill-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}

                    {c.handleSocial ? (
                      <a
                        href={`https://instagram.com/${c.handleSocial.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-[100px] h-8 px-2.5 rounded-xl bg-accent text-accent-foreground border border-border font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                        title="Abrir Instagram"
                      >
                        <InstagramIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>Instagram</span>
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVerDetalle(c)
                      }}
                      className="flex-1 h-8 px-3 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Ver Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEdit(c)
                      }}
                      className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground flex items-center justify-center shadow-2xs"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. MODAL: REGISTRAR / EDITAR CLIENTE (NOVA DESIGN SYSTEM)                 */}
        {/* ========================================================================= */}
        <Dialog open={modalFormOpen} onOpenChange={setModalFormOpen}>
          <DialogContent
            showCloseButton={false}
            className="w-full max-w-xl sm:max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden p-0 flex flex-col z-50 ring-0"
          >
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/70 bg-card/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {editingId ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                      {editingId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                      Información de contacto, ubicación y preferencias
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cuerpo con scroll vertical suave */}
              <div className="p-6 space-y-4.5 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-3.5 gap-y-4">
                  {/* Fila 1: Nombre Completo * (col-span-7 / 65%) */}
                  <div className="sm:col-span-7 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Nombre Completo <span className="text-primary font-bold">*</span>
                    </Label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.nombre}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, nombre: e.target.value }))
                          if (formErrors.nombre) setFormErrors(prev => ({ ...prev, nombre: undefined }))
                        }}
                        placeholder="Ej: Juan Pérez / Empresa ABC"
                        autoFocus
                        className={`h-10 w-full rounded-xl border ${
                          formErrors.nombre ? 'border-destructive ring-1 ring-destructive/30' : 'border-input'
                        } bg-card pl-9.5 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs`}
                      />
                    </div>
                    {formErrors.nombre && (
                      <p className="text-[11px] text-destructive mt-1 animate-in fade-in-25">
                        {formErrors.nombre}
                      </p>
                    )}
                  </div>

                  {/* Fila 1: DNI / RUC / CE (col-span-5 / 35%) */}
                  <div className="sm:col-span-5 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      DNI / RUC / CE
                    </Label>
                    <div className="relative flex items-center">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.dni}
                        onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                        placeholder="Ej: 72345678"
                        maxLength={12}
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Teléfono / WhatsApp * (col-span-6 / 50%) */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Teléfono / WhatsApp <span className="text-primary font-bold">*</span>
                    </Label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.telefono}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                        placeholder="Ej: 987654321"
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Canal de Origen (col-span-6 / 50%) */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Canal de Origen
                    </Label>
                    <div className="relative flex items-center">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <select
                        value={formData.canalOrigen}
                        onChange={(e) => setFormData(prev => ({ ...prev, canalOrigen: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-8 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs outline-none cursor-pointer appearance-none"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Directo">Directo</option>
                        <option value="Recomendación">Recomendación</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Feria">Feria</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  {/* Fila 3: Usuario Instagram (col-span-6 / 50%) */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Usuario Instagram
                    </Label>
                    <div className="relative flex items-center">
                      <InstagramIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.handleSocial}
                        onChange={(e) => setFormData(prev => ({ ...prev, handleSocial: e.target.value }))}
                        placeholder="@usuario"
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Fila 3: Correo Electrónico (Opcional) (col-span-6 / 50%) */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Correo Electrónico (Opcional)
                    </Label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="correo@ejemplo.com"
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Fila 4: Distrito / Ciudad (col-span-5 / 40%) */}
                  <div className="sm:col-span-5 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Distrito / Ciudad
                    </Label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.distrito}
                        onChange={(e) => setFormData(prev => ({ ...prev, distrito: e.target.value }))}
                        placeholder="Ej: Miraflores, Lima"
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Fila 4: Dirección de Entrega (col-span-7 / 60%) */}
                  <div className="sm:col-span-7 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      Dirección de Entrega
                    </Label>
                    <div className="relative flex items-center">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.direccion}
                        onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                        placeholder="Ej: Av. Benavides 123"
                        className="h-10 w-full rounded-xl border border-input bg-card pl-9.5 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Fila 5: Notas / Preferencias del Cliente (col-span-12) */}
                  <div className="sm:col-span-12 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1 whitespace-nowrap">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Notas / Preferencias del Cliente
                    </Label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Ej: Le gustan los colores pastel, indicaciones de entrega..."
                      className="min-h-[72px] w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/50 shadow-2xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/70 bg-card/40 flex items-center justify-end gap-3 mt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl h-10 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-5 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingId ? 'Guardando...' : 'Registrando...'}</span>
                    </>
                  ) : (
                    <>
                      {editingId ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{editingId ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* 7. FICHA DETALLADA DE CLIENTE (MODAL / DRAWER ELEVADO NOVA)               */}
        {/* ========================================================================= */}
        <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
          <DialogContent 
            showCloseButton={false} 
            className="w-full max-w-lg sm:max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden p-0 max-h-[88vh] flex flex-col z-50 ring-0"
          >
            <div className="p-6 space-y-4.5 overflow-y-auto">
              
              {/* Encabezado y Acciones de Cabecera */}
              <div className="flex items-center justify-between pb-4 border-b border-border/70">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center border border-border/80 shrink-0">
                    {selectedDetalle?.nombre ? selectedDetalle.nombre.substring(0, 2).toUpperCase() : 'CL'}
                  </div>

                  {/* Centro: Nombre y chips interactivos */}
                  <div className="min-w-0">
                    <DialogTitle className="text-base font-bold text-foreground capitalize truncate">
                      {selectedDetalle?.nombre || 'Cargando cliente...'}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {/* Instagram */}
                      {selectedDetalle?.handleSocial && (
                        <a
                          href={`https://instagram.com/${selectedDetalle.handleSocial.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                          title="Abrir perfil de Instagram"
                        >
                          <InstagramIcon className="h-3 w-3 shrink-0" />
                          <span>@{selectedDetalle.handleSocial.replace(/^@/, '')}</span>
                        </a>
                      )}

                      {/* WhatsApp */}
                      {selectedDetalle?.telefono && (
                        <a
                          href={getWhatsAppUrl(selectedDetalle.telefono, selectedDetalle.nombre)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                          title="Abrir chat de WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600 shrink-0" />
                          <span>{selectedDetalle.telefono}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Derecha: Botones de control con estilo uniforme */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDetalle) {
                        setModalDetalleOpen(false)
                        handleOpenEdit(selectedDetalle)
                      }
                    }}
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 flex items-center justify-center transition-colors cursor-pointer"
                    title="Editar datos del cliente"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalDetalleOpen(false)}
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 flex items-center justify-center transition-colors cursor-pointer"
                    title="Cerrar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isLoadingDetalle ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic">
                  Cargando información y pedidos del cliente...
                </div>
              ) : selectedDetalle ? (
                <div className="space-y-4">
                  
                  {/* Métricas Financieras (Grid de 3 Bloques) */}
                  <div className="grid grid-cols-3 gap-2.5 bg-card border border-border rounded-xl p-3 shadow-2xs">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        LTV Comprado
                      </span>
                      <span className="text-sm font-extrabold text-foreground mt-0.5 block tabular-nums">
                        {formatCurrency(selectedDetalle.totalComprado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Total Pagado
                      </span>
                      <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5 block tabular-nums">
                        {formatCurrency(selectedDetalle.totalPagado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Saldo Pendiente
                      </span>
                      <span className={`text-sm font-extrabold mt-0.5 block tabular-nums ${
                        selectedDetalle.saldoPendiente > 0 ? 'text-destructive' : 'text-foreground'
                      }`}>
                        {formatCurrency(selectedDetalle.saldoPendiente)}
                      </span>
                    </div>
                  </div>

                  {/* Botón de Acción "+ Crear Pedido" */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalDetalleOpen(false)
                      router.push(`/pedidos?cliente=${encodeURIComponent(selectedDetalle.nombre)}`)
                    }}
                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Crear Pedido</span>
                  </button>

                  {/* Notas del cliente si existen */}
                  {selectedDetalle.notas && (
                    <div className="p-3 bg-secondary/60 border border-border rounded-xl text-xs space-y-1">
                      <span className="font-bold text-foreground block uppercase text-[10px]">Notas / Preferencias:</span>
                      <p className="text-foreground leading-relaxed">{selectedDetalle.notas}</p>
                    </div>
                  )}

                  {/* Sección de Historial de Pedidos */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        <span>Historial de Pedidos ({selectedDetalle.pedidos.length})</span>
                      </h4>
                    </div>

                    {selectedDetalle.pedidos.length === 0 ? (
                      <div className="p-8 text-center bg-card border border-border rounded-xl space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                          <Package className="h-6 w-6 stroke-1" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Sin pedidos registrados aún</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Este cliente no cuenta con compras previas en el historial</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setModalDetalleOpen(false)
                            router.push(`/pedidos?cliente=${encodeURIComponent(selectedDetalle.nombre)}`)
                          }}
                          className="h-8 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold cursor-pointer"
                        >
                          Registrar primer pedido
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDetalle.pedidos.map(p => {
                          const isPaid = (p.saldoPendiente || 0) <= 0
                          const codigoDisplay = p.codigo.startsWith('#') ? p.codigo : `#${p.codigo}`

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setModalDetalleOpen(false)
                                router.push(`/pedidos?search=${encodeURIComponent(p.codigo)}`)
                              }}
                              className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-200 flex flex-col gap-2.5 cursor-pointer"
                            >
                              {/* Cabecera de la Tarjeta */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center">
                                  <span className="font-mono text-xs font-bold text-foreground">
                                    {codigoDisplay}
                                  </span>
                                  <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ml-2">
                                    {p.estado}
                                  </span>
                                </div>
                                <span className="text-sm font-extrabold text-foreground ml-auto tabular-nums">
                                  {formatCurrency(p.total)}
                                </span>
                              </div>

                              {/* Cuerpo de la Tarjeta (Ítems Fabricados) */}
                              <div className="space-y-1.5 py-0.5">
                                {p.items.map((it, idx) => (
                                  <div key={idx} className="text-xs font-medium text-foreground/90 leading-relaxed flex items-center gap-1.5">
                                    <Box className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                    <span className="truncate">{it.cantidad}× {it.nombre}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Pie de Tarjeta */}
                              <div className="border-t border-border/50 pt-2 flex items-center justify-between gap-2">
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                                  <span>{new Date(p.fecha).toLocaleDateString('es-PE')}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isPaid ? (
                                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      ✓ Pagado 100%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      Resta {formatCurrency(p.saldoPendiente)}
                                    </span>
                                  )}

                                  <Link
                                    href={`/pedidos?search=${encodeURIComponent(p.codigo)}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setModalDetalleOpen(false)
                                    }}
                                    className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center justify-center cursor-pointer"
                                    title="Ver detalle del pedido"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}

            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  )
}
