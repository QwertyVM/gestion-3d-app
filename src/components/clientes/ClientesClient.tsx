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
  UserPlus,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { StatCard } from '@/components/ui/StatCard'
import { toast } from 'sonner'
import { useBusiness } from '@/context/BusinessContext'
import { 
  ClienteItem, 
  ClienteDetalleView, 
  createCliente, 
  updateCliente, 
  deleteCliente
} from '@/actions/clientes'
import { ClienteDetalleDrawer } from './ClienteDetalleDrawer'
import { formatCurrency, getInitials } from '@/lib/utils'

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

  return <span className="text-[11px] text-muted-foreground/50 italic">Sin registrar</span>
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
  const [drawerDetalleOpen, setDrawerDetalleOpen] = useState(false)
  const [selectedClienteNombre, setSelectedClienteNombre] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  // View Client Profile / History (Slide-over Drawer)
  const handleVerDetalle = (c: ClienteItem) => {
    setSelectedClienteNombre(c.nombre)
    setDrawerDetalleOpen(true)
  }

  // Edit Client directly from Drawer
  const handleEditFromDrawer = (detalle: ClienteDetalleView) => {
    setDrawerDetalleOpen(false)
    const targetItem = clientes.find(c => c.id === detalle.id || c.nombre === detalle.nombre)
    if (targetItem) {
      handleOpenEdit(targetItem)
    } else {
      setEditingId(detalle.id || null)
      setFormErrors({})
      setFormData({
        nombre: detalle.nombre,
        dni: detalle.dni || '',
        telefono: detalle.telefono || '',
        email: detalle.email || '',
        canalOrigen: detalle.canalPreferido || detalle.canalOrigen || 'Instagram',
        handleSocial: detalle.handleSocial || '',
        distrito: detalle.distrito || '',
        direccion: detalle.direccion || '',
        notas: detalle.notas || ''
      })
      setModalFormOpen(true)
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
              className="lg:hidden bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors border-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KPI SUMMARY CARDS (CUADRÍCULA SIMÉTRICA Y ESTÁNDAR)                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <StatCard
            label="Cartera Total"
            value={totalClientes}
            sublabel="100% clientes activos"
            icon={<Users className="h-3.5 w-3.5" />}
            badge={{ text: 'Activo', variant: 'success' }}
          />

          <StatCard
            label="Recurrentes"
            value={clientesRecurrentes}
            sublabel={`${tasaRecurrencia}% fidelización (2+ pedidos)`}
            icon={<UserCheck className="h-3.5 w-3.5" />}
            variant="success"
          />

          <StatCard
            label="Por Cobrar"
            value={formatCurrency(totalDeudaAcumulada)}
            sublabel={clientesConDeudaCount > 0 ? `${clientesConDeudaCount} con saldo pendiente` : 'Todos al día ✅'}
            icon={<AlertCircle className="h-3.5 w-3.5" />}
            variant={totalDeudaAcumulada > 0 ? 'destructive' : 'success'}
            badge={totalDeudaAcumulada > 0 ? { text: 'Alerta', variant: 'destructive' } : { text: 'Al Día', variant: 'success' }}
            onClick={() => setFiltroPago(totalDeudaAcumulada > 0 ? 'CON_DEUDA' : 'TODOS')}
          />

          <StatCard
            label="Ticket Promedio"
            value={formatCurrency(ticketPromedio)}
            sublabel="LTV medio por cliente"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
        </div>

        {/* ========================================================================= */}
        {/* 3. BARRA DE HERRAMIENTAS INTEGRADA (SIN CÁPSULA EXTERIOR)                  */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          {/* Fila 1: Buscador a la izquierda + Selector de Ubicación a la derecha */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, teléfono, @usuario de Instagram o distrito..."
                className="h-9 rounded-lg border-border/80 bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring shadow-none"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-52 shrink-0">
              <select
                value={ubicacionFilter}
                onChange={(e) => setUbicacionFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus-visible:ring-1 focus-visible:ring-ring outline-none transition-colors cursor-pointer shadow-none"
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-0.5">
            {/* Segmented Control de Canales */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setCanalFilter('TODOS')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  canalFilter === 'TODOS'
                    ? 'bg-secondary text-foreground border border-border/60 font-semibold'
                    : 'bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-secondary text-foreground border border-border/60 font-semibold'
                        : 'bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    }`}
                  >
                    {canal}
                  </button>
                )
              })}
            </div>

            {/* Segmented Control de Estado de Pago */}
            <div className="flex items-center rounded-lg bg-muted/40 p-0.5 border border-border/60 text-xs font-medium shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setFiltroPago('TODOS')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filtroPago === 'TODOS' ? 'bg-card text-foreground shadow-none font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({clientes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroPago('AL_DIA')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filtroPago === 'AL_DIA' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-none font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Al Día
              </button>
              <button
                type="button"
                onClick={() => setFiltroPago('CON_DEUDA')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filtroPago === 'CON_DEUDA' ? 'bg-card text-rose-600 dark:text-rose-400 shadow-none font-semibold' : 'text-muted-foreground hover:text-foreground'
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
        <div className="hidden lg:block w-full bg-card border border-border/60 rounded-xl shadow-none overflow-hidden">
          <table className="table-fixed w-full border-collapse text-xs">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[11px] font-medium select-none">
                <th className="py-3 px-4 font-medium text-left tracking-wider uppercase">CLIENTE & CONTACTO</th>
                <th className="py-3 px-4 font-medium text-left tracking-wider uppercase">UBICACIÓN</th>
                <th className="py-3 px-4 font-medium text-left tracking-wider uppercase">LTV & HISTORIAL</th>
                <th className="py-3 px-4 font-medium text-center tracking-wider uppercase">ESTADO PAGO</th>
                <th className="py-3 px-4 font-medium text-right pr-4 tracking-wider uppercase">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 bg-card">
                    <EmptyState
                      icon={Users}
                      title="No se encontraron clientes"
                      description="No hay clientes que coincidan con la búsqueda o filtro seleccionado."
                      compact
                      className="border-0 shadow-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => {
                  const initials = getInitials(c.nombre)
                  const canalDisplay = c.canalOrigen || c.canalPreferido || 'Instagram'
                  const tieneDeuda = c.saldoPendiente > 0

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => handleVerDetalle(c)}
                      className="h-16 transition-colors hover:bg-muted/30 border-b border-border/40 cursor-pointer"
                    >
                      {/* Col 1: CLIENTE & CONTACTO (w-[36%]) */}
                      <td className="py-3 px-4 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar Circular */}
                          <div className="w-8 h-8 rounded-full bg-muted text-foreground font-medium text-xs flex items-center justify-center border border-border/60 shrink-0">
                            {initials}
                          </div>

                          {/* Bloque de Texto */}
                          <div className="flex flex-col min-w-0 justify-center">
                            <span 
                              className="text-xs sm:text-sm font-medium text-foreground truncate hover:text-primary transition-colors cursor-pointer text-left block"
                              title={c.nombre}
                            >
                              {c.nombre}
                            </span>
                            
                            {/* Fila de Metadatos */}
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap min-w-0">
                              {/* Chip de Canal */}
                              <CanalBadge canal={canalDisplay} />

                              {/* Teléfono / WhatsApp */}
                              {c.telefono ? (
                                <a
                                  href={getWhatsAppUrl(c.telefono, c.nombre)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] font-medium text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 px-1 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0"
                                  title="Abrir chat de WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3 text-muted-foreground group-hover:text-emerald-500 shrink-0 transition-colors" />
                                  <span>{c.telefono}</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenEdit(c)
                                  }}
                                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                                  title="Registrar teléfono"
                                >
                                  + Teléfono
                                </button>
                              )}

                              {/* Handle Social si existe */}
                              {c.handleSocial && (
                                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5 truncate shrink-0">
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
                        <span className="text-sm font-semibold text-foreground font-mono block tabular-nums tracking-tight">
                          {formatCurrency(c.totalComprado)}
                        </span>
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <span className="tabular-nums">{c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'}</span>
                          <span>•</span>
                          <Tooltip>
                            <TooltipTrigger 
                              onClick={(e) => e.stopPropagation()} 
                              className="cursor-help inline-flex items-center hover:text-foreground transition-colors underline decoration-dotted tabular-nums"
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
                            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 tabular-nums"
                            title={`Debe ${formatCurrency(c.saldoPendiente)}`}
                          >
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span className="truncate">Debe {formatCurrency(c.saldoPendiente)}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
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
                            className="h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-1"
                            title="Ver Ficha y Historial"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ficha</span>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Más opciones"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-card border border-border shadow-md rounded-lg p-1 z-50">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEdit(c)
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-md cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Editar Cliente</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/pedidos?cliente=${encodeURIComponent(c.nombre)}`)
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-md cursor-pointer"
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
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
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
            <EmptyState
              icon={Users}
              title="No se encontraron clientes"
              description="No hay clientes que coincidan con la búsqueda o filtro seleccionado."
              compact
            />
          ) : (
            filteredClientes.map((c) => {
              const initials = getInitials(c.nombre)
              const canalDisplay = c.canalOrigen || c.canalPreferido || 'Instagram'
              const tieneDeuda = c.saldoPendiente > 0

              return (
                <div 
                  key={c.id} 
                  onClick={() => handleVerDetalle(c)}
                  className="bg-card p-3.5 rounded-xl border border-border/60 shadow-none space-y-3 cursor-pointer hover:border-border transition-colors"
                >
                  {/* Fila 1: Avatar, Nombre y Estado Pago */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted text-foreground font-medium text-xs flex items-center justify-center border border-border/60 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">{c.nombre}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                          <CanalBadge canal={canalDisplay} />
                          {c.distrito && <span>• {c.distrito}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {tieneDeuda ? (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-medium px-2 py-0.5 rounded-md tabular-nums">
                          <AlertCircle className="h-3 w-3" />
                          <span>Debe {formatCurrency(c.saldoPendiente)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-medium px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>✓ Al día</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Estadísticas Rápidas */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/20 rounded-lg border border-border/40 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-sans">LTV Comprado</span>
                      <span className="font-semibold text-foreground tabular-nums tracking-tight">{formatCurrency(c.totalComprado)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block font-sans">NovaPoints / Pedidos</span>
                      <span className="font-medium text-foreground tabular-nums">{c.puntos} pts • {c.pedidosCount} ped.</span>
                    </div>
                  </div>

                  {/* Fila 3: Acciones Móvil */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/40 flex-wrap">
                    {c.telefono ? (
                      <a
                        href={getWhatsAppUrl(c.telefono, c.nombre)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-[100px] h-8 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors hover:bg-emerald-500/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}

                    {c.handleSocial ? (
                      <a
                        href={`https://instagram.com/${c.handleSocial.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-[100px] h-8 px-2.5 rounded-lg bg-muted text-foreground border border-border/60 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors hover:bg-muted/80"
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
                      className="flex-1 h-8 px-3 rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
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
        {/* 7. FICHA DETALLADA DE CLIENTE (SLIDE-OVER DRAWER NOVA 360°)               */}
        {/* ========================================================================= */}
        <ClienteDetalleDrawer
          isOpen={drawerDetalleOpen}
          onClose={() => {
            setDrawerDetalleOpen(false)
            setSelectedClienteNombre(null)
          }}
          clienteNombre={selectedClienteNombre}
          onEdit={handleEditFromDrawer}
        />

      </div>
    </TooltipProvider>
  )
}
