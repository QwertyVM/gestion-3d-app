'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowDownRight, 
  Plus, 
  Minus,
  Trash2, 
  Search, 
  X, 
  Wrench, 
  ShoppingBag, 
  Truck, 
  ChevronLeft, 
  ChevronRight,
  Pencil,
  Tag,
  Sparkles,
  Check,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { createInversion, updateInversion, deleteInversion } from '@/actions/inversiones'
import { TagInsumoItem } from '@/actions/tagsInsumos'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EgresoItem } from './FlujoCajaClient'

interface EgresosClientProps {
  egresos: EgresoItem[]
  tags?: TagInsumoItem[]
}

const ITEMS_PER_PAGE = 7

// Categorías principales de gasto con metadatos visuales
const CATEGORIAS_CONFIG = [
  {
    id: 'INSUMO',
    label: 'Insumos & Materiales',
    desc: 'Filamento, Packaging',
    icon: ShoppingBag,
  },
  {
    id: 'ACTIVO_FIJO',
    label: 'Activo Fijo / Equipos',
    desc: 'Maquinaria, Herramientas',
    icon: Wrench,
  },
  {
    id: 'SERVICIO',
    label: 'Servicios & Operativos',
    desc: 'Publicidad, Fletes',
    icon: Truck,
  }
] as const

// Paleta de estilos Light Mode por color de tag
const TAG_COLOR_CLASSES: Record<string, { badge: string; chip: string; chipActive: string }> = {
  amber: {
    badge: 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]',
    chip: 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border-[#E2D9CC]',
    chipActive: 'bg-[#EFE5D8] text-[#633E20] font-bold shadow-sm border-[#D4BEA7]',
  },
  blue: {
    badge: 'bg-[#EBF3FC] text-[#245D99] border-[#B9D5F3]',
    chip: 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border-[#E2D9CC]',
    chipActive: 'bg-[#EBF3FC] text-[#245D99] font-bold shadow-sm border-[#B9D5F3]',
  },
  emerald: {
    badge: 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]',
    chip: 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border-[#E2D9CC]',
    chipActive: 'bg-[#EBF7EE] text-[#1E5E3A] font-bold shadow-sm border-[#B4E3C0]',
  },
  purple: {
    badge: 'bg-[#F3EDFA] text-[#6A389D] border-[#D6C2ED]',
    chip: 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border-[#E2D9CC]',
    chipActive: 'bg-[#F3EDFA] text-[#6A389D] font-bold shadow-sm border-[#D6C2ED]',
  },
  pink: {
    badge: 'bg-[#FDF0EE] text-[#A34335] border-[#F2C0B8]',
    chip: 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border-[#E2D9CC]',
    chipActive: 'bg-[#FDF0EE] text-[#A34335] font-bold shadow-sm border-[#F2C0B8]',
  },
  indigo: {
    badge: 'bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]',
    chip: 'bg-[#F4EFEA] text-[#75695D] hover:text-[#241C15] border-[#E2D9CC]',
    chipActive: 'bg-[#EFE5D8] text-[#633E20] font-bold shadow-sm border-[#D4BEA7]',
  },
}

export function EgresosClient({ egresos, tags = [] }: EgresosClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<EgresoItem[]>(egresos)

  useEffect(() => {
    setItems(egresos)
  }, [egresos])

  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<'TODOS' | 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO'>('TODOS')
  const [tagFilter, setTagFilter] = useState<string>('TODOS')
  const [openModal, setOpenModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Item being edited
  const [editingItem, setEditingItem] = useState<EgresoItem | null>(null)

  // Form states (Create & Edit)
  const [formPersona, setFormPersona] = useState('Víctor')
  const [formCategoria, setFormCategoria] = useState<'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO'>('INSUMO')
  const [formConcepto, setFormConcepto] = useState('')
  const [formSubcategoria, setFormSubcategoria] = useState('')
  const [formCantidad, setFormCantidad] = useState('1')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState('0')

  // Obtener estilo de color asignado a un tag
  const getTagColor = (tagText?: string | null) => {
    if (!tagText) return TAG_COLOR_CLASSES.indigo
    const found = tags.find(t => t.nombre.trim().toLowerCase() === tagText.trim().toLowerCase())
    const colorKey = found?.color || 'indigo'
    return TAG_COLOR_CLASSES[colorKey] || TAG_COLOR_CLASSES.indigo
  }

  // Lista de tags filtrados dinámicamente por la categoría activa del formulario
  const activeCategoryTags = useMemo(() => {
    return tags.filter(t => t.categoria === formCategoria)
  }, [tags, formCategoria])

  // Lista única de todos los nombres de tags para filtros generales
  const availableTags = useMemo(() => {
    const list: string[] = []
    const excluded = ['otros', 'insumos varios']

    tags.forEach(t => {
      if (t.nombre && !excluded.includes(t.nombre.trim().toLowerCase()) && !list.includes(t.nombre.trim())) {
        list.push(t.nombre.trim())
      }
    })
    items.forEach(e => {
      if (e.subcategoria && e.subcategoria.trim() && !excluded.includes(e.subcategoria.trim().toLowerCase()) && !list.includes(e.subcategoria.trim())) {
        list.push(e.subcategoria.trim())
      }
    })
    return list
  }, [items, tags])

  // Tags para el dropdown de la barra de filtros, filtrados según la categoría activa
  const dropdownTags = useMemo(() => {
    if (categoriaFilter === 'TODOS') {
      return availableTags
    }
    const matching: string[] = []
    tags
      .filter(t => t.categoria === categoriaFilter)
      .forEach(t => {
        if (t.nombre && !matching.includes(t.nombre.trim())) {
          matching.push(t.nombre.trim())
        }
      })
    items
      .filter(e => e.categoria === categoriaFilter && e.subcategoria)
      .forEach(e => {
        if (e.subcategoria && !matching.includes(e.subcategoria.trim())) {
          matching.push(e.subcategoria.trim())
        }
      })
    return matching
  }, [categoriaFilter, tags, items, availableTags])

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Financial KPIs
  const totalEgresosTotales = useMemo(() => {
    return items.reduce((acc, e) => acc + e.costoTotal, 0)
  }, [items])

  const totalMaquinaria = useMemo(() => {
    return items
      .filter(e => e.categoria === 'ACTIVO_FIJO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [items])

  const totalInsumos = useMemo(() => {
    return items
      .filter(e => e.categoria === 'INSUMO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [items])

  const totalServicios = useMemo(() => {
    return items
      .filter(e => e.categoria === 'SERVICIO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [items])

  // Filtered List
  const filteredEgresos = useMemo(() => {
    return items.filter(eg => {
      const matchSearch = 
        eg.itemConcepto.toLowerCase().includes(search.toLowerCase()) ||
        (eg.subcategoria && eg.subcategoria.toLowerCase().includes(search.toLowerCase()))

      const matchCat = categoriaFilter === 'TODOS' || eg.categoria === categoriaFilter
      const matchTag = tagFilter === 'TODOS' || eg.subcategoria?.trim().toLowerCase() === tagFilter.trim().toLowerCase()

      return matchSearch && matchCat && matchTag
    })
  }, [items, search, categoriaFilter, tagFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEgresos.length / ITEMS_PER_PAGE))
  const paginatedEgresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEgresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEgresos, currentPage])

  // Handler cambio de categoría en modal
  const handleSelectCategoria = (cat: 'INSUMO' | 'ACTIVO_FIJO' | 'SERVICIO') => {
    setFormCategoria(cat)
    const matching = tags.filter(t => t.categoria === cat)
    if (matching.length > 0) {
      setFormSubcategoria(matching[0].nombre)
    } else {
      setFormSubcategoria('')
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormPersona('Víctor')
    setFormCategoria('INSUMO')
    setFormConcepto('')
    const insumoTags = tags.filter(t => t.categoria === 'INSUMO')
    setFormSubcategoria(insumoTags.length > 0 ? insumoTags[0].nombre : '')
    setFormCantidad('1')
    setFormCostoUnitario('')
    setFormCostoEnvio('0')
    setOpenModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (eg: EgresoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const cat = eg.categoria === 'ACTIVO_FIJO' || eg.categoria === 'INSUMO' || eg.categoria === 'SERVICIO' ? eg.categoria : 'INSUMO'
    setEditingItem(eg)
    setFormPersona(eg.persona || 'Víctor')
    setFormCategoria(cat)
    setFormConcepto(eg.itemConcepto)
    const catTags = tags.filter(t => t.categoria === cat)
    setFormSubcategoria(eg.subcategoria || (catTags[0]?.nombre || ''))
    setFormCantidad(eg.cantidad.toString())
    setFormCostoUnitario(eg.costoUnitario.toString())
    setFormCostoEnvio(eg.costoEnvio ? eg.costoEnvio.toString() : '0')
    setOpenEditModal(true)
  }

  // Stepper handlers for quantity
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

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConcepto.trim() || !formCostoUnitario) {
      toast.error('Por favor completa el nombre del insumo y su costo unitario')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createInversion({
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria,
        subcategoria: formSubcategoria.trim() || null,
        itemConcepto: formConcepto.trim(),
        especificacionColor: null,
        presentacion: null,
        cantidad: parseInt(formCantidad) || 1,
        costoUnitario: parseFloat(formCostoUnitario) || 0,
        costoEnvio: parseFloat(formCostoEnvio) || 0,
      })

      setItems(prev => [created as any, ...prev])
      toast.success('Egreso registrado exitosamente')
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar egreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!formConcepto.trim() || !formCostoUnitario) {
      toast.error('Por favor completa el nombre del insumo y su costo unitario')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateInversion(editingItem.id, {
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria,
        subcategoria: formSubcategoria.trim() || null,
        itemConcepto: formConcepto.trim(),
        especificacionColor: null,
        presentacion: null,
        cantidad: parseInt(formCantidad) || 1,
        costoUnitario: parseFloat(formCostoUnitario) || 0,
        costoEnvio: parseFloat(formCostoEnvio) || 0,
      })

      setItems(prev => prev.map(item => item.id === editingItem.id ? (updated as any) : item))
      toast.success('Egreso actualizado exitosamente')
      setOpenEditModal(false)
      setEditingItem(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar egreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete
  const handleDelete = async (id: string, concepto: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (confirm(`¿Estás seguro de eliminar el egreso "${concepto}"?`)) {
      try {
        await deleteInversion(id)
        setItems(prev => prev.filter(item => item.id !== id))
        toast.success('Egreso eliminado')
        if (openEditModal) setOpenEditModal(false)
        router.refresh()
      } catch (err) {
        toast.error('Error al eliminar')
      }
    }
  }

  // Tag Badge Renderer con estilo Light Mode
  const renderTagBadge = (tagText?: string | null) => {
    if (!tagText) return null
    const colorStyle = getTagColor(tagText)

    return (
      <Badge variant="outline" className={`text-[10px] font-semibold py-0.5 px-2 gap-1 ${colorStyle.badge}`}>
        <Tag className="h-2.5 w-2.5" />
        {tagText}
      </Badge>
    )
  }

  // Live Cost Metrics Preview for Forms
  const liveCostMetrics = useMemo(() => {
    const cant = Math.max(1, parseInt(formCantidad) || 1)
    const unit = Math.max(0, parseFloat(formCostoUnitario) || 0)
    const envio = Math.max(0, parseFloat(formCostoEnvio) || 0)
    const subtotal = cant * unit
    const totalCalculado = subtotal + envio
    const costoRealUnitario = totalCalculado / cant

    return {
      subtotal,
      totalCalculado,
      costoRealUnitario,
    }
  }, [formCantidad, formCostoUnitario, formCostoEnvio])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              <ArrowDownRight className="h-6 w-6 stroke-[2.5]" />
            </div>
            Registro de Egresos & Insumos
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Control clasificado por tags de insumos, maquinaria, fletes y servicios del taller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/finanzas/tags">
            <Button variant="outline" className="border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] cursor-pointer rounded-xl text-xs h-10 shadow-sm font-medium">
              <Tag className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
              Gestionar Tags
            </Button>
          </Link>

          <Button 
            onClick={handleOpenCreate}
            className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer rounded-xl px-4 py-2.5 text-xs h-10 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Registrar Nuevo Egreso
          </Button>
        </div>
      </div>

      {/* KPI Cards Light Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Total Egresos
          </span>
          <div className="text-2xl font-extrabold text-[#A36F4C] font-mono mt-1">
            {formatCurrency(totalEgresosTotales)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">{items.length} registros contabilizados</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#944917] flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maquinaria & Equipos
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {formatCurrency(totalMaquinaria)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Impresora 3D, Secador, etc.</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#633E20] flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Insumos & Materiales
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {formatCurrency(totalInsumos)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Filamentos, Resinas, Packaging</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Servicios & Operativos
          </span>
          <div className="text-2xl font-extrabold text-[#241C15] font-mono mt-1">
            {formatCurrency(totalServicios)}
          </div>
          <span className="text-xs text-[#75695D] mt-0.5 block">Fletes, Publicidad, Cuotas</span>
        </div>
      </div>

      {/* 1-Row Compact Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Lado Izquierdo: Campo de Búsqueda */}
        <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar egreso o insumo..."
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

        {/* Lado Derecho: Segmented Control Tabs & Dropdown de Tags */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Segmented Control / Tabs */}
          <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] overflow-x-auto max-w-full">
            <button
              onClick={() => { setCategoriaFilter('TODOS'); setTagFilter('TODOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                categoriaFilter === 'TODOS'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => { setCategoriaFilter('INSUMO'); setTagFilter('TODOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                categoriaFilter === 'INSUMO'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Insumos
            </button>
            <button
              onClick={() => { setCategoriaFilter('ACTIVO_FIJO'); setTagFilter('TODOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                categoriaFilter === 'ACTIVO_FIJO'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Activos Fijos
            </button>
            <button
              onClick={() => { setCategoriaFilter('SERVICIO'); setTagFilter('TODOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                categoriaFilter === 'SERVICIO'
                  ? 'bg-[#A36F4C] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15] font-medium'
              }`}
            >
              Servicios & Op.
            </button>
          </div>

          {/* Dropdown Select dinámico para 'Filtrar por Tag' basado en la categoría */}
          <div className="relative">
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#F4EFEA] border border-[#E2D9CC] text-[#241C15] rounded-xl px-3 py-1.5 text-xs font-medium focus:border-[#A36F4C] focus:ring-1 focus:ring-[#A36F4C] cursor-pointer outline-none h-9 pr-7 appearance-none transition-all shadow-sm"
            >
              <option value="TODOS">
                {categoriaFilter === 'TODOS' ? 'Todos los Tags' : `Tags de Categoría (${dropdownTags.length})`}
              </option>
              {dropdownTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D]">
              <Tag className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Light Mode */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-md rounded-2xl">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="w-full min-w-[700px]">
            <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Fecha</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Categoría</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-left">Tag / Subcategoría</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Concepto / Insumo</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Costo Unit.</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Total Egreso</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredEgresos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-[#75695D]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShoppingBag className="h-8 w-8 text-[#A89B8D]" />
                    <span>No se encontraron egresos o insumos con los filtros actuales</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEgresos.map((eg) => (
                <TableRow 
                  key={eg.id} 
                  onClick={() => handleOpenEdit(eg)}
                  className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                >
                  {/* Fecha */}
                  <TableCell className="px-4 py-3 text-xs text-[#75695D] font-mono whitespace-nowrap">
                    {formatDate(eg.createdAt)}
                  </TableCell>

                  {/* Categoría Principal */}
                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {eg.categoria === 'ACTIVO_FIJO' ? (
                      <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-xs font-semibold">
                        Maquinaria
                      </Badge>
                    ) : eg.categoria === 'INSUMO' ? (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-semibold">
                        Insumo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-[#1E5E3A] border-emerald-200 text-xs font-semibold">
                        Servicio
                      </Badge>
                    )}
                  </TableCell>

                  {/* Tag / Subcategoría */}
                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {eg.subcategoria ? (
                      renderTagBadge(eg.subcategoria)
                    ) : (
                      <span className="text-xs text-[#75695D] italic">—</span>
                    )}
                  </TableCell>

                  {/* Concepto / Nombre */}
                  <TableCell className="px-4 py-3 font-medium text-[#241C15]">
                    <span className="text-sm font-bold group-hover:text-[#A36F4C] transition-colors">{eg.itemConcepto}</span>
                  </TableCell>

                  {/* Costo Unitario */}
                  <TableCell className="px-3 py-3 text-right font-mono text-[#241C15] font-semibold whitespace-nowrap">
                    {eg.cantidad > 1 && <span className="text-xs text-[#75695D] font-normal mr-1">{eg.cantidad}x</span>}
                    {formatCurrency(eg.costoUnitario)}
                    {eg.costoEnvio && eg.costoEnvio > 0 ? (
                      <span className="block text-[10px] text-[#75695D] font-normal">+ {formatCurrency(eg.costoEnvio)} flete</span>
                    ) : null}
                  </TableCell>

                  {/* Total Egreso */}
                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-[#A34335] whitespace-nowrap">
                    -{formatCurrency(eg.costoTotal)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleOpenEdit(eg, e)}
                        className="h-8 w-8 text-[#75695D] hover:text-[#A36F4C] hover:bg-[#EFE5D8] rounded-lg cursor-pointer"
                        title="Editar egreso"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleDelete(eg.id, eg.itemConcepto, e)}
                        className="h-8 w-8 text-[#75695D] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Eliminar egreso"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#F4EFEA] text-xs text-[#75695D]">
            <div>
              Mostrando página <span className="text-[#241C15] font-bold">{currentPage}</span> de <span className="text-[#241C15] font-bold">{totalPages}</span> ({filteredEgresos.length} egresos)
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
                        ? 'bg-[#A36F4C] text-[#FFFFFF] shadow-sm'
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
      {/* MODAL: REGISTRAR NUEVO EGRESO / INSUMO (LIGHT MODE NOVA)                  */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[580px] max-h-[90vh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl">
          {/* Header Fijo */}
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Registrar Nuevo Egreso / Insumo
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                  Registra compras de filamentos, packaging, máquinas o servicios operativos.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Formulario Limpio */}
          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* 1. Selector Visual de Categoría Principal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#241C15] flex items-center justify-between">
                <span>Categoría Principal <span className="text-[#A36F4C]">*</span></span>
                <span className="text-[11px] text-[#75695D] font-normal">Destino de gasto</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CATEGORIAS_CONFIG.map(cat => {
                  const isSelected = formCategoria === cat.id
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategoria(cat.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'bg-[#FDFBF7] border-[#A36F4C] ring-1 ring-[#A36F4C]/40 text-[#241C15] shadow-sm'
                          : 'bg-[#FFFFFF] border-[#E2D9CC] text-[#75695D] hover:border-[#DCD3C6] hover:text-[#241C15]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-[#A36F4C]' : 'text-[#75695D]'}`} />
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#A36F4C]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#241C15]">{cat.label}</div>
                        <div className="text-[10px] text-[#75695D] line-clamp-1">{cat.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Concepto / Nombre del Insumo (ARRIBA DEL TAG) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#241C15]">
                Concepto / Nombre del Insumo <span className="text-[#A36F4C]">*</span>
              </Label>
              <Input 
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Filamento PLA Matte Negro, Cajas de Envío 15x15x15..."
                required
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
              />
            </div>

            {/* 3. Subcategoría Dinámica por Categoría Asociada */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#A36F4C]" />
                  Subcategoría / Tag <span className="text-[#A36F4C]">*</span>
                </Label>
                <Link 
                  href="/finanzas/tags" 
                  className="text-[11px] text-[#A36F4C] font-semibold hover:underline flex items-center gap-1"
                >
                  Gestionar tags <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>

              {/* Chips con los tags asociados a la categoría seleccionada */}
              {activeCategoryTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeCategoryTags.map(tag => {
                    const colorStyle = getTagColor(tag.nombre)
                    const isSelected = formSubcategoria.trim().toLowerCase() === tag.nombre.trim().toLowerCase()
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setFormSubcategoria(tag.nombre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? colorStyle.chipActive
                            : colorStyle.chip
                        }`}
                      >
                        <Tag className="h-3 w-3" />
                        {tag.nombre}
                        {isSelected && <Check className="h-3 w-3 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2D9CC] text-xs text-[#75695D]">
                  <span>No hay tags asociados a esta categoría.</span>
                  <Link href="/finanzas/tags" className="text-[#A36F4C] font-bold hover:underline">
                    + Crear tag en CRUD
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Costos y Cantidades */}
            <div className="p-4 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cantidad con Stepper +/- */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold">Cantidad <span className="text-[#A36F4C]">*</span></Label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrementCantidad}
                      className="h-9 px-2.5 bg-[#FFFFFF] border border-r-0 border-[#DCD3C6] rounded-l-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <Input 
                      type="number"
                      min="1"
                      value={formCantidad}
                      onChange={(e) => setFormCantidad(e.target.value)}
                      required
                      className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-center font-mono font-bold text-sm h-9 rounded-none focus:border-[#A36F4C]"
                    />
                    <button
                      type="button"
                      onClick={handleIncrementCantidad}
                      className="h-9 px-2.5 bg-[#FFFFFF] border border-l-0 border-[#DCD3C6] rounded-r-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Costo Unitario */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold">Costo Unit. (S/) <span className="text-[#A36F4C]">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostoUnitario}
                      onChange={(e) => setFormCostoUnitario(e.target.value)}
                      placeholder="0.00"
                      required
                      className="pl-8 bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-sm font-mono font-bold h-9 rounded-xl focus:border-[#A36F4C]"
                    />
                  </div>
                </div>

                {/* Flete / Envío */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold">Flete / Envío (S/)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostoEnvio}
                      onChange={(e) => setFormCostoEnvio(e.target.value)}
                      placeholder="0.00"
                      className="pl-8 bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-sm font-mono h-9 rounded-xl focus:border-[#A36F4C]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Live Metrics Preview Card Light Mode */}
            <div className="p-4 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cálculo & Métricas en Vivo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {/* Costo Total */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold">Total Calculado</span>
                  <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono">
                    {formatCurrency(liveCostMetrics.totalCalculado)}
                  </div>
                  <span className="text-[10px] text-[#75695D] block">Subtotal + Flete</span>
                </div>

                {/* Costo Real Unitario */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold">Costo Real Unit.</span>
                  <div className="text-base font-semibold text-[#944917] font-mono">
                    {formatCurrency(liveCostMetrics.costoRealUnitario)}
                  </div>
                  <span className="text-[10px] text-[#75695D] block">Incluye flete prorrateado</span>
                </div>

                {/* Desglose Flete */}
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold">Desglose Flete</span>
                  <div className="text-sm font-semibold text-[#4A3E35] font-mono">
                    {formatCurrency(parseFloat(formCostoEnvio) || 0)}
                  </div>
                  <span className="text-[10px] text-[#75695D] block">Costo logístico</span>
                </div>
              </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-2" />
          </form>

          {/* Footer Fijo */}
          <div className="px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-end gap-3 flex-shrink-0">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpenModal(false)}
              className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Egreso'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR EGRESO / INSUMO (LIGHT MODE NOVA)                          */}
      {/* ========================================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] sm:max-w-[580px] max-h-[90vh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl">
          {/* Header Fijo */}
          <div className="px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                  Editar Egreso & Insumo
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                  Modifica los detalles, tag de clasificación, costos o cantidades adquiridas.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenEditModal(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Formulario Limpio */}
          <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* 1. Selector Visual de Categoría Principal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#241C15] flex items-center justify-between">
                <span>Categoría Principal <span className="text-[#A36F4C]">*</span></span>
                <span className="text-[11px] text-[#75695D] font-normal">Destino de gasto</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CATEGORIAS_CONFIG.map(cat => {
                  const isSelected = formCategoria === cat.id
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategoria(cat.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'bg-[#FDFBF7] border-[#A36F4C] ring-1 ring-[#A36F4C]/40 text-[#241C15] shadow-sm'
                          : 'bg-[#FFFFFF] border-[#E2D9CC] text-[#75695D] hover:border-[#DCD3C6] hover:text-[#241C15]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-[#A36F4C]' : 'text-[#75695D]'}`} />
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#A36F4C]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#241C15]">{cat.label}</div>
                        <div className="text-[10px] text-[#75695D] line-clamp-1">{cat.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Concepto / Nombre del Insumo (ARRIBA DEL TAG) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#241C15]">
                Concepto / Nombre del Insumo <span className="text-[#A36F4C]">*</span>
              </Label>
              <Input 
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Filamento PLA Matte Negro, Cajas de Envío 15x15x15..."
                required
                className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
              />
            </div>

            {/* 3. Subcategoría Dinámica por Categoría Asociada */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#A36F4C]" />
                  Subcategoría / Tag <span className="text-[#A36F4C]">*</span>
                </Label>
                <Link 
                  href="/finanzas/tags" 
                  className="text-[11px] text-[#A36F4C] font-semibold hover:underline flex items-center gap-1"
                >
                  Gestionar tags <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>

              {/* Chips con los tags asociados a la categoría seleccionada */}
              {activeCategoryTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeCategoryTags.map(tag => {
                    const colorStyle = getTagColor(tag.nombre)
                    const isSelected = formSubcategoria.trim().toLowerCase() === tag.nombre.trim().toLowerCase()
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setFormSubcategoria(tag.nombre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? colorStyle.chipActive
                            : colorStyle.chip
                        }`}
                      >
                        <Tag className="h-3 w-3" />
                        {tag.nombre}
                        {isSelected && <Check className="h-3 w-3 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2D9CC] text-xs text-[#75695D]">
                  <span>No hay tags asociados a esta categoría.</span>
                  <Link href="/finanzas/tags" className="text-[#A36F4C] font-bold hover:underline">
                    + Crear tag en CRUD
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Costos y Cantidades */}
            <div className="p-4 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cantidad con Stepper +/- */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold">Cantidad <span className="text-[#A36F4C]">*</span></Label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrementCantidad}
                      className="h-9 px-2.5 bg-[#FFFFFF] border border-r-0 border-[#DCD3C6] rounded-l-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <Input 
                      type="number"
                      min="1"
                      value={formCantidad}
                      onChange={(e) => setFormCantidad(e.target.value)}
                      required
                      className="bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-center font-mono font-bold text-sm h-9 rounded-none focus:border-[#A36F4C]"
                    />
                    <button
                      type="button"
                      onClick={handleIncrementCantidad}
                      className="h-9 px-2.5 bg-[#FFFFFF] border border-l-0 border-[#DCD3C6] rounded-r-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Costo Unitario */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold">Costo Unit. (S/) <span className="text-[#A36F4C]">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostoUnitario}
                      onChange={(e) => setFormCostoUnitario(e.target.value)}
                      placeholder="0.00"
                      required
                      className="pl-8 bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-sm font-mono font-bold h-9 rounded-xl focus:border-[#A36F4C]"
                    />
                  </div>
                </div>

                {/* Flete / Envío */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold">Flete / Envío (S/)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D]">S/</span>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostoEnvio}
                      onChange={(e) => setFormCostoEnvio(e.target.value)}
                      placeholder="0.00"
                      className="pl-8 bg-[#FFFFFF] border-[#DCD3C6] text-[#241C15] text-sm font-mono h-9 rounded-xl focus:border-[#A36F4C]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Live Metrics Preview Card Light Mode */}
            <div className="p-4 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A36F4C] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cálculo & Métricas en Vivo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {/* Costo Total */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold">Total Calculado</span>
                  <div className="text-2xl font-extrabold text-[#1E5E3A] font-mono">
                    {formatCurrency(liveCostMetrics.totalCalculado)}
                  </div>
                  <span className="text-[10px] text-[#75695D] block">Subtotal + Flete</span>
                </div>

                {/* Costo Real Unitario */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold">Costo Real Unit.</span>
                  <div className="text-base font-semibold text-[#944917] font-mono">
                    {formatCurrency(liveCostMetrics.costoRealUnitario)}
                  </div>
                  <span className="text-[10px] text-[#75695D] block">Incluye flete prorrateado</span>
                </div>

                {/* Desglose Flete */}
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold">Desglose Flete</span>
                  <div className="text-sm font-semibold text-[#4A3E35] font-mono">
                    {formatCurrency(parseFloat(formCostoEnvio) || 0)}
                  </div>
                  <span className="text-[10px] text-[#75695D] block">Costo logístico</span>
                </div>
              </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-2" />
          </form>

          {/* Footer Fijo */}
          <div className="px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            {editingItem && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleDelete(editingItem.id, editingItem.itemConcepto)}
                className="text-[#A34335] hover:text-red-700 hover:bg-red-50 text-xs rounded-xl cursor-pointer font-bold"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Eliminar Egreso
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenEditModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2 rounded-xl cursor-pointer font-medium"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
