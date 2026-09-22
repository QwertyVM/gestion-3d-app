'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
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
  ChevronUp, 
  ChevronDown, 
  Pencil, 
  Tag, 
  Sparkles, 
  Check, 
  Loader2, 
  ExternalLink, 
  Receipt 
} from 'lucide-react'
import { createInversion, updateInversion, deleteInversion, swapInversionOrder } from '@/actions/inversiones'
import { TagInsumoItem } from '@/actions/tagsInsumos'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SearchableCombobox, ComboboxItem } from '@/components/ui/SearchableCombobox'
import { MultiTagInput } from '@/components/ui/MultiTagInput'
import { DateRange, getDefaultDateRange, isDateInRange } from '@/lib/date-utils'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { EgresoItem } from './FlujoCajaClient'

interface EgresosClientProps {
  egresos: EgresoItem[]
  tags?: TagInsumoItem[]
}

const ITEMS_PER_PAGE = 10

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
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('ESTE_MES'))
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
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])

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
    const set = new Set<string>()

    tags.forEach(t => {
      if (t.nombre && t.nombre.trim()) {
        set.add(t.nombre.trim())
      }
    })
    items.forEach(e => {
      if (e.subcategoria) {
        e.subcategoria.split(',').forEach(tag => {
          const clean = tag.trim()
          if (clean) set.add(clean)
        })
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [items, tags])

  // Tags para el dropdown de la barra de filtros
  const dropdownTags = useMemo(() => {
    if (categoriaFilter === 'TODOS') {
      return availableTags
    }
    const set = new Set<string>()
    tags
      .filter(t => t.categoria === categoriaFilter)
      .forEach(t => {
        if (t.nombre && t.nombre.trim()) {
          set.add(t.nombre.trim())
        }
      })
    items
      .filter(e => e.categoria === categoriaFilter && e.subcategoria)
      .forEach(e => {
        if (e.subcategoria) {
          e.subcategoria.split(',').forEach(tag => {
            const clean = tag.trim()
            if (clean) set.add(clean)
          })
        }
      })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [categoriaFilter, tags, items, availableTags])

  const tagsComboboxItems: ComboboxItem[] = useMemo(() => {
    const allOption: ComboboxItem = {
      id: 'TODOS',
      label: categoriaFilter === 'TODOS' ? 'Todos los Tags' : `Tags (${dropdownTags.length})`,
      badge: `${dropdownTags.length}`
    }
    const tagOptions: ComboboxItem[] = dropdownTags.map(tag => {
      const count = items.filter(e => {
        const catMatch = categoriaFilter === 'TODOS' || e.categoria === categoriaFilter
        if (!catMatch || !e.subcategoria) return false
        const itemTags = e.subcategoria.split(',').map(s => s.trim().toLowerCase())
        return itemTags.includes(tag.toLowerCase())
      }).length

      return {
        id: tag,
        label: tag,
        badge: count > 0 ? `${count}` : undefined,
        icon: Tag
      }
    })
    return [allOption, ...tagOptions]
  }, [dropdownTags, categoriaFilter, items])

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Filtered & Sorted List (Descendente por fecha de creación createdAt)
  const filteredEgresos = useMemo(() => {
    return items
      .filter(eg => {
        const matchDate = isDateInRange(eg.createdAt, dateRange.from, dateRange.to)
        if (!matchDate) return false

        const matchSearch = 
          eg.itemConcepto.toLowerCase().includes(search.toLowerCase()) ||
          (eg.subcategoria && eg.subcategoria.toLowerCase().includes(search.toLowerCase())) ||
          (eg.persona && eg.persona.toLowerCase().includes(search.toLowerCase())) ||
          (eg.especificacionColor && eg.especificacionColor.toLowerCase().includes(search.toLowerCase()))

        const matchCat = categoriaFilter === 'TODOS' || eg.categoria === categoriaFilter
        const matchTag = tagFilter === 'TODOS' || (
          eg.subcategoria 
            ? eg.subcategoria.split(',').map(s => s.trim().toLowerCase()).includes(tagFilter.trim().toLowerCase())
            : false
        )

        return matchSearch && matchCat && matchTag
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [items, dateRange, search, categoriaFilter, tagFilter])

  // Indicador de filtros activos
  const isFiltered = search.trim() !== '' || categoriaFilter !== 'TODOS' || tagFilter !== 'TODOS' || dateRange.preset !== 'ESTE_MES'

  // Dynamic Financial KPIs based on filtered items
  const totalEgresosTotales = useMemo(() => {
    return filteredEgresos.reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  const totalMaquinaria = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'ACTIVO_FIJO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  const totalInsumos = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'INSUMO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  const totalServicios = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'SERVICIO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEgresos.length / ITEMS_PER_PAGE))
  const paginatedEgresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEgresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEgresos, currentPage])

  // Handler cambio de categoría en modal
  const handleSelectCategoria = (cat: 'INSUMO' | 'ACTIVO_FIJO' | 'SERVICIO') => {
    setFormCategoria(cat)
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
    setFormFecha(new Date().toISOString().split('T')[0])
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
    setFormFecha(eg.createdAt ? new Date(eg.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
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
        fecha: formFecha || undefined,
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
        fecha: formFecha || undefined,
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

  // Reorder within the same day
  const handleMoveEgreso = async (idCurrent: string, idTarget: string, direction: 'up' | 'down') => {
    const currentItem = items.find(i => i.id === idCurrent)
    const targetItem = items.find(i => i.id === idTarget)
    if (!currentItem || !targetItem) return

    // Optimistic UI update
    setItems(prev => prev.map(item => {
      if (item.id === idCurrent) return { ...item, createdAt: targetItem.createdAt }
      if (item.id === idTarget) return { ...item, createdAt: currentItem.createdAt }
      return item
    }))

    try {
      await swapInversionOrder(idCurrent, idTarget)
      toast.success(direction === 'up' ? 'Posición subida' : 'Posición bajada')
    } catch (err: any) {
      toast.error(err?.message || 'Error al reordenar')
      router.refresh()
    }
  }

  // Tag Badge Renderer con soporte para múltiples tags
  const renderTagBadge = (tagText?: string | null) => {
    if (!tagText) return null
    const tagsList = tagText.split(',').map(t => t.trim()).filter(Boolean)
    if (tagsList.length === 0) return null

    return (
      <div className="flex flex-wrap items-center gap-1">
        {tagsList.map((tag, idx) => {
          const colorStyle = getTagColor(tag)
          return (
            <Badge 
              key={`${tag}-${idx}`} 
              variant="outline" 
              className={`text-[10px] font-semibold py-0 px-1.5 gap-1 ${colorStyle.badge}`}
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </Badge>
          )
        })}
      </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              <ArrowDownRight className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span>Registro de Egresos & Insumos</span>
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Control de compras de insumos, maquinaria, fletes y servicios del taller.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <DateFilterControl
            value={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange)
              setCurrentPage(1)
            }}
          />

          <Link href="/finanzas/tags">
            <Button variant="outline" className="border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] cursor-pointer rounded-xl text-xs h-9 shadow-2xs font-medium px-3">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-[#A36F4C]" />
              Tags
            </Button>
          </Link>

          <Button 
            onClick={handleOpenCreate}
            className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold shadow-xs transition-all cursor-pointer rounded-xl px-3.5 h-9 text-xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Registrar Egreso
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Minimalistas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Egresos */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Total Egresos</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#A36F4C] font-mono tabular-nums">
              {formatCurrency(totalEgresosTotales)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {isFiltered ? `${filteredEgresos.length} de ${items.length} registros` : `${items.length} registros`}
            </span>
          </div>
        </div>

        {/* Maquinaria */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Maquinaria & Equipos</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#944917]">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {formatCurrency(totalMaquinaria)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {isFiltered 
                ? `${filteredEgresos.filter(e => e.categoria === 'ACTIVO_FIJO').length} registros` 
                : 'Impresoras 3D, Herramientas'}
            </span>
          </div>
        </div>

        {/* Insumos */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Insumos & Materiales</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#633E20]">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {formatCurrency(totalInsumos)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {isFiltered 
                ? `${filteredEgresos.filter(e => e.categoria === 'INSUMO').length} registros` 
                : 'Filamentos, Packaging'}
            </span>
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Servicios & Op.</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <Truck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {formatCurrency(totalServicios)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {isFiltered 
                ? `${filteredEgresos.filter(e => e.categoria === 'SERVICIO').length} registros` 
                : 'Fletes, Servicios'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Master Card (Toolbar + Zero-Scroll Table) */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-2xs rounded-2xl">
        {/* Unified Integrated Toolbar */}
        <div className="p-3 sm:p-3.5 border-b border-[#E2D9CC]/70 flex flex-col lg:flex-row items-center justify-between gap-3 bg-[#FFFFFF]">
          {/* Lado Izquierdo: Campo de Búsqueda */}
          <div className="relative w-full lg:w-72 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
            <Input 
              placeholder="Buscar egreso o insumo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs md:text-sm rounded-xl h-9 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
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
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 w-full lg:w-auto">
            {/* Segmented Control / Tabs */}
            <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] overflow-x-auto max-w-full">
              <button
                onClick={() => { setCategoriaFilter('TODOS'); setTagFilter('TODOS'); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoriaFilter === 'TODOS'
                    ? 'bg-[#241C15] text-white shadow-2xs'
                    : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                onClick={() => { setCategoriaFilter('INSUMO'); setTagFilter('TODOS'); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoriaFilter === 'INSUMO'
                    ? 'bg-[#8C6D1F] text-white shadow-2xs'
                    : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                }`}
              >
                Insumos
              </button>
              <button
                onClick={() => { setCategoriaFilter('ACTIVO_FIJO'); setTagFilter('TODOS'); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoriaFilter === 'ACTIVO_FIJO'
                    ? 'bg-[#633E20] text-white shadow-2xs'
                    : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                }`}
              >
                Activos Fijos
              </button>
              <button
                onClick={() => { setCategoriaFilter('SERVICIO'); setTagFilter('TODOS'); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoriaFilter === 'SERVICIO'
                    ? 'bg-[#1E5E3A] text-white shadow-2xs'
                    : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
                }`}
              >
                Servicios
              </button>
            </div>

            {/* Combobox interactivo dinámico para 'Filtrar por Tag' */}
            <div className="w-full sm:w-48 flex-shrink-0">
              <SearchableCombobox
                items={tagsComboboxItems}
                value={tagFilter}
                onChange={(val) => {
                  setTagFilter(val || 'TODOS')
                  setCurrentPage(1)
                }}
                size="sm"
                icon={Tag}
                placeholder="Filtrar por Tag..."
                searchPlaceholder="Buscar etiqueta..."
                clearable={false}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-[#E2D9CC]/70">
          {filteredEgresos.length === 0 ? (
            <div className="p-8 text-center text-[#75695D] text-xs">
              No se encontraron egresos con los filtros aplicados.
            </div>
          ) : (
            paginatedEgresos.map((eg) => {
              const globalIndex = filteredEgresos.findIndex(item => item.id === eg.id)
              const prevNeighbor = globalIndex > 0 ? filteredEgresos[globalIndex - 1] : null
              const nextNeighbor = globalIndex < filteredEgresos.length - 1 ? filteredEgresos[globalIndex + 1] : null

              const egDay = eg.createdAt.split('T')[0]
              const canMoveUp = !!prevNeighbor && prevNeighbor.createdAt.split('T')[0] === egDay
              const canMoveDown = !!nextNeighbor && nextNeighbor.createdAt.split('T')[0] === egDay

              return (
                <div 
                  key={eg.id} 
                  onClick={() => handleOpenEdit(eg)}
                  className="p-3.5 space-y-2 bg-[#FFFFFF] hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-[#241C15] block truncate">{eg.itemConcepto}</span>
                      <span className="text-[11px] text-[#75695D] font-mono block mt-0.5">
                        {formatDate(eg.createdAt)} • {eg.persona}
                      </span>
                    </div>

                    <span className="text-sm font-mono font-bold text-[#A34335] flex-shrink-0 tabular-nums">
                      -{formatCurrency(eg.costoTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {eg.categoria === 'ACTIVO_FIJO' ? (
                        <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-semibold">
                          Maquinaria
                        </Badge>
                      ) : eg.categoria === 'INSUMO' ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-semibold">
                          Insumo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-[#1E5E3A] border-emerald-200 text-[10px] font-semibold">
                          Servicio
                        </Badge>
                      )}

                      {eg.subcategoria && renderTagBadge(eg.subcategoria)}
                    </div>

                    <div className="text-right text-[11px] text-[#75695D] font-mono">
                      {eg.cantidad > 1 && <span>{eg.cantidad}x </span>}
                      <span>{formatCurrency(eg.costoUnitario)}</span>
                      {eg.costoEnvio && eg.costoEnvio > 0 ? (
                        <span className="text-[10px] text-[#75695D]"> (+{formatCurrency(eg.costoEnvio)} flete)</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Acciones Móviles */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/40 text-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 bg-[#F4EFEA] border border-[#E2D9CC] rounded-lg p-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={!canMoveUp}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (prevNeighbor) handleMoveEgreso(eg.id, prevNeighbor.id, 'up')
                        }}
                        className="h-6 w-6 text-[#75695D] hover:text-[#241C15] disabled:opacity-20 cursor-pointer"
                        title="Subir posición"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={!canMoveDown}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (nextNeighbor) handleMoveEgreso(eg.id, nextNeighbor.id, 'down')
                        }}
                        className="h-6 w-6 text-[#75695D] hover:text-[#241C15] disabled:opacity-20 cursor-pointer"
                        title="Bajar posición"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleOpenEdit(eg, e)}
                        className="h-7 px-2 text-[11px] text-[#75695D] hover:text-[#A36F4C] hover:bg-[#EFE5D8] rounded-lg cursor-pointer"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(eg.id, eg.itemConcepto, e)}
                        className="h-7 px-2 text-[11px] text-[#75695D] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop View: Clean Zero-Scroll Table (5 Columns / table-fixed) */}
        <div className="hidden md:block">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-[#FAF8F5]/80 border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="w-[130px] px-4 py-3 text-xs font-bold text-[#75695D] text-left">
                  Fecha & Categoría
                </TableHead>
                <TableHead className="px-3 py-3 text-xs font-bold text-[#75695D] text-left">
                  Concepto & Tags
                </TableHead>
                <TableHead className="w-[115px] px-3 py-3 text-xs font-bold text-[#75695D] text-right">
                  Costo Unit. & Cant.
                </TableHead>
                <TableHead className="w-[115px] px-3 py-3 text-xs font-bold text-[#75695D] text-right">
                  Total Egreso
                </TableHead>
                <TableHead className="w-[120px] px-3 py-3 text-xs font-bold text-[#75695D] text-right">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEgresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[#75695D] text-xs">
                    No se encontraron egresos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEgresos.map((eg) => {
                  const globalIndex = filteredEgresos.findIndex(item => item.id === eg.id)
                  const prevNeighbor = globalIndex > 0 ? filteredEgresos[globalIndex - 1] : null
                  const nextNeighbor = globalIndex < filteredEgresos.length - 1 ? filteredEgresos[globalIndex + 1] : null

                  const egDay = eg.createdAt.split('T')[0]
                  const canMoveUp = !!prevNeighbor && prevNeighbor.createdAt.split('T')[0] === egDay
                  const canMoveDown = !!nextNeighbor && nextNeighbor.createdAt.split('T')[0] === egDay

                  return (
                    <TableRow 
                      key={eg.id} 
                      onClick={() => handleOpenEdit(eg)}
                      className="border-b border-[#E2D9CC]/60 hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer group"
                    >
                      {/* 1. Fecha & Categoría */}
                      <TableCell className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <span className="text-xs text-[#75695D] font-mono block">
                            {formatDate(eg.createdAt)}
                          </span>
                          <div>
                            {eg.categoria === 'ACTIVO_FIJO' ? (
                              <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-bold px-1.5 py-0">
                                Maquinaria
                              </Badge>
                            ) : eg.categoria === 'INSUMO' ? (
                              <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold px-1.5 py-0">
                                Insumo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-50 text-[#1E5E3A] border-emerald-200 text-[10px] font-bold px-1.5 py-0">
                                Servicio
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Concepto & Tags */}
                      <TableCell className="px-3 py-3 align-top min-w-0">
                        <div className="min-w-0">
                          <span 
                            title={eg.itemConcepto}
                            className="text-xs font-semibold text-[#241C15] block truncate group-hover:text-[#A36F4C] transition-colors"
                          >
                            {eg.itemConcepto}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#75695D] flex-wrap">
                            {eg.subcategoria && renderTagBadge(eg.subcategoria)}
                            {eg.persona && (
                              <span className="text-[11px] text-[#75695D]">
                                • {eg.persona}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Costo Unitario & Cantidad */}
                      <TableCell className="px-3 py-3 align-top text-right whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-[#241C15] block">
                          {eg.cantidad > 1 && <span className="text-xs text-[#75695D] font-normal mr-1">{eg.cantidad}x</span>}
                          {formatCurrency(eg.costoUnitario)}
                        </span>
                        {eg.costoEnvio && eg.costoEnvio > 0 ? (
                          <span className="text-[10px] text-[#75695D] block font-normal">
                            +{formatCurrency(eg.costoEnvio)} flete
                          </span>
                        ) : null}
                      </TableCell>

                      {/* 4. Total Egreso */}
                      <TableCell className="px-4 py-3 align-top text-right whitespace-nowrap">
                        <span className="font-mono font-bold tabular-nums text-xs sm:text-sm text-[#A34335] block">
                          -{formatCurrency(eg.costoTotal)}
                        </span>
                      </TableCell>

                      {/* 5. Acciones */}
                      <TableCell className="px-3 py-3 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Reorder Micro Buttons con espacio reservado invisible para alineación perfecta */}
                          <div className={`flex items-center bg-[#F4EFEA] border border-[#E2D9CC] rounded-lg p-0.5 ${canMoveUp || canMoveDown ? '' : 'invisible'}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={!canMoveUp}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (prevNeighbor) handleMoveEgreso(eg.id, prevNeighbor.id, 'up')
                              }}
                              className="h-5 w-5 text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-20 cursor-pointer rounded p-0"
                              title="Subir posición"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={!canMoveDown}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (nextNeighbor) handleMoveEgreso(eg.id, nextNeighbor.id, 'down')
                              }}
                              className="h-5 w-5 text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-20 cursor-pointer rounded p-0"
                              title="Bajar posición"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => handleOpenEdit(eg, e)}
                            className="h-7 w-7 text-[#75695D] hover:text-[#A36F4C] hover:bg-[#EFE5D8] rounded-lg cursor-pointer"
                            title="Editar egreso"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => handleDelete(eg.id, eg.itemConcepto, e)}
                            className="h-7 w-7 text-[#75695D] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Eliminar egreso"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#FAF8F5]/80 text-xs text-[#75695D]">
            <div>
              Mostrando <span className="text-[#241C15] font-bold">{paginatedEgresos.length}</span> de <span className="text-[#241C15] font-bold">{filteredEgresos.length}</span> egresos (Página {currentPage} de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 cursor-pointer shadow-2xs ${
                      currentPage === page 
                        ? "bg-[#241C15] text-white hover:bg-[#3D332A] font-bold" 
                        : "border-[#E2D9CC] bg-[#FFFFFF] text-[#75695D] hover:bg-[#EAE4DC] hover:text-[#241C15]"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Registrar Nuevo Egreso */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-[#FAF8F5] border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-xl max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-3xl z-50">
          <form onSubmit={handleCreateSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C]">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-[#241C15]">
                    Registrar Nuevo Egreso
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Añade compras de insumos, fletes o activos para el taller.
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

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              {/* Selector de Categoría */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#241C15]">
                  Categoría Principal *
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
                            ? 'bg-[#FFFFFF] border-[#A36F4C] ring-1 ring-[#A36F4C]/40 text-[#241C15] shadow-xs'
                            : 'bg-[#F4EFEA] border-[#E2D9CC] text-[#75695D] hover:border-[#DCD3C6] hover:text-[#241C15]'
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

              {/* Fecha y Persona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Fecha del Egreso *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Responsable / Persona *</Label>
                  <Input 
                    value={formPersona}
                    onChange={(e) => setFormPersona(e.target.value)}
                    placeholder="Víctor"
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto / Nombre del Insumo *</Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Filamento PLA Hyper Creality Negro 1kg..."
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

              {/* Multi-Tags */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#A36F4C]" />
                    Tags / Etiquetas
                  </span>
                  <Link 
                    href="/finanzas/tags" 
                    className="text-[11px] text-[#A36F4C] font-semibold hover:underline flex items-center gap-1"
                  >
                    Gestionar tags <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>

                <MultiTagInput
                  value={formSubcategoria}
                  onChange={(newTags) => setFormSubcategoria(newTags.join(', '))}
                  suggestions={activeCategoryTags.map(t => t.nombre)}
                  placeholder="Escribe un tag y presiona Enter..."
                />
              </div>

              {/* Costos y Cantidades */}
              <div className="p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold">Cantidad *</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold">Costo Unit. (S/) *</Label>
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

              {/* Live Preview */}
              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D9CC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#75695D] uppercase font-bold block">Total a Registrar</span>
                  <span className="text-xl font-extrabold text-[#A34335] font-mono">
                    {formatCurrency(liveCostMetrics.totalCalculado)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold block">Costo Real / Unidad</span>
                  <span className="text-sm font-bold text-[#241C15] font-mono">
                    {formatCurrency(liveCostMetrics.costoRealUnitario)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Egreso */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent showCloseButton={false} className="bg-[#FAF8F5] border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-xl max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-3xl z-50">
          <form onSubmit={handleEditSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C]">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-[#241C15]">
                    Editar Egreso & Insumo
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Modifica los detalles, tags, costos o cantidades adquiridas.
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

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              {/* Selector de Categoría */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#241C15]">
                  Categoría Principal *
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
                            ? 'bg-[#FFFFFF] border-[#A36F4C] ring-1 ring-[#A36F4C]/40 text-[#241C15] shadow-xs'
                            : 'bg-[#F4EFEA] border-[#E2D9CC] text-[#75695D] hover:border-[#DCD3C6] hover:text-[#241C15]'
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

              {/* Fecha y Persona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Fecha del Egreso *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Responsable / Persona *</Label>
                  <Input 
                    value={formPersona}
                    onChange={(e) => setFormPersona(e.target.value)}
                    placeholder="Víctor"
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto / Nombre del Insumo *</Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Filamento PLA Hyper Creality Negro 1kg..."
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                />
              </div>

              {/* Multi-Tags */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#A36F4C]" />
                    Tags / Etiquetas
                  </span>
                  <Link 
                    href="/finanzas/tags" 
                    className="text-[11px] text-[#A36F4C] font-semibold hover:underline flex items-center gap-1"
                  >
                    Gestionar tags <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>

                <MultiTagInput
                  value={formSubcategoria}
                  onChange={(newTags) => setFormSubcategoria(newTags.join(', '))}
                  suggestions={activeCategoryTags.map(t => t.nombre)}
                  placeholder="Escribe un tag y presiona Enter..."
                />
              </div>

              {/* Costos y Cantidades */}
              <div className="p-3.5 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold">Cantidad *</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold">Costo Unit. (S/) *</Label>
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

              {/* Live Preview */}
              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D9CC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#75695D] uppercase font-bold block">Total a Registrar</span>
                  <span className="text-xl font-extrabold text-[#A34335] font-mono">
                    {formatCurrency(liveCostMetrics.totalCalculado)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#75695D] uppercase font-bold block">Costo Real / Unidad</span>
                  <span className="text-sm font-bold text-[#241C15] font-mono">
                    {formatCurrency(liveCostMetrics.costoRealUnitario)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between flex-shrink-0">
              {editingItem && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => handleDelete(editingItem.id, editingItem.itemConcepto)}
                  className="text-[#A34335] hover:text-red-700 hover:bg-red-50 text-xs rounded-xl cursor-pointer font-bold active:scale-[0.98]"
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
                  className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
