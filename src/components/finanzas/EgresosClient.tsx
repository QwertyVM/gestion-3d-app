'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Wrench, 
  ShoppingBag, 
  Truck, 
  Palette, 
  ChevronLeft, 
  ChevronRight,
  Pencil,
  Tag
} from 'lucide-react'
import { createInversion, updateInversion, deleteInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EgresoItem } from './FlujoCajaClient'

interface EgresosClientProps {
  egresos: EgresoItem[]
}

const ITEMS_PER_PAGE = 7

// Preset tags for 3D printing workshop supplies & expenses
const PRESET_TAGS = [
  'Filamento 3D',
  'Embalaje / Cajas',
  'Stickers & Merch',
  'Resina & Químicos',
  'Repuestos & Boquillas',
  'Herramientas & Taller',
  'Maquinaria 3D',
  'Fletes & Envíos',
  'Publicidad & Marketing',
  'Servicios & Energía',
]

export function EgresosClient({ egresos }: EgresosClientProps) {
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
  const [formSubcategoria, setFormSubcategoria] = useState('Filamento 3D')
  const [formConcepto, setFormConcepto] = useState('')
  const [formColor, setFormColor] = useState('')
  const [formPresentacion, setFormPresentacion] = useState('Bobina 1Kg')
  const [formCantidad, setFormCantidad] = useState('1')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState('')

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

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

  // Unique tags existing in data
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach(e => {
      if (e.subcategoria) set.add(e.subcategoria)
    })
    return Array.from(set)
  }, [items])

  // Filtered List
  const filteredEgresos = useMemo(() => {
    return items.filter(eg => {
      const matchSearch = 
        eg.itemConcepto.toLowerCase().includes(search.toLowerCase()) ||
        (eg.especificacionColor && eg.especificacionColor.toLowerCase().includes(search.toLowerCase())) ||
        (eg.presentacion && eg.presentacion.toLowerCase().includes(search.toLowerCase())) ||
        (eg.subcategoria && eg.subcategoria.toLowerCase().includes(search.toLowerCase()))

      const matchCat = categoriaFilter === 'TODOS' || eg.categoria === categoriaFilter
      const matchTag = tagFilter === 'TODOS' || eg.subcategoria === tagFilter

      return matchSearch && matchCat && matchTag
    })
  }, [items, search, categoriaFilter, tagFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEgresos.length / ITEMS_PER_PAGE))
  const paginatedEgresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEgresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEgresos, currentPage])

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormPersona('Víctor')
    setFormCategoria('INSUMO')
    setFormSubcategoria('Filamento 3D')
    setFormConcepto('')
    setFormColor('')
    setFormPresentacion('Bobina 1Kg')
    setFormCantidad('1')
    setFormCostoUnitario('')
    setFormCostoEnvio('0')
    setOpenModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (eg: EgresoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingItem(eg)
    setFormPersona(eg.persona || 'Víctor')
    setFormCategoria(eg.categoria === 'ACTIVO_FIJO' || eg.categoria === 'INSUMO' || eg.categoria === 'SERVICIO' ? eg.categoria : 'INSUMO')
    setFormSubcategoria(eg.subcategoria || 'Filamento 3D')
    setFormConcepto(eg.itemConcepto)
    setFormColor(eg.especificacionColor || '')
    setFormPresentacion(eg.presentacion || '')
    setFormCantidad(eg.cantidad.toString())
    setFormCostoUnitario(eg.costoUnitario.toString())
    setFormCostoEnvio(eg.costoEnvio ? eg.costoEnvio.toString() : '0')
    setOpenEditModal(true)
  }

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConcepto.trim() || !formCostoUnitario) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createInversion({
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria,
        subcategoria: formSubcategoria.trim() || undefined,
        itemConcepto: formConcepto.trim(),
        especificacionColor: formColor.trim() || undefined,
        presentacion: formPresentacion.trim() || undefined,
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
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateInversion(editingItem.id, {
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria,
        subcategoria: formSubcategoria.trim() || undefined,
        itemConcepto: formConcepto.trim(),
        especificacionColor: formColor.trim() || undefined,
        presentacion: formPresentacion.trim() || undefined,
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

  // Tag Badge Renderer with tailored colors
  const renderTagBadge = (tagText?: string | null) => {
    if (!tagText) return null
    const lower = tagText.toLowerCase()
    
    let colorClass = 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
    if (lower.includes('filamento')) {
      colorClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    } else if (lower.includes('caja') || lower.includes('embalaje')) {
      colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    } else if (lower.includes('sticker') || lower.includes('merch')) {
      colorClass = 'bg-pink-500/15 text-pink-300 border-pink-500/30'
    } else if (lower.includes('maquinaria') || lower.includes('impresora')) {
      colorClass = 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    } else if (lower.includes('servicio') || lower.includes('flete') || lower.includes('luz')) {
      colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    } else if (lower.includes('publicidad')) {
      colorClass = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
    }

    return (
      <Badge variant="outline" className={`text-[10px] font-semibold py-0.5 px-2 gap-1 ${colorClass}`}>
        <Tag className="h-2.5 w-2.5" />
        {tagText}
      </Badge>
    )
  }

  // Cost per gram live preview
  const previewCostoPorGramo = useMemo(() => {
    const cant = parseInt(formCantidad) || 1
    const unit = parseFloat(formCostoUnitario) || 0
    const envio = parseFloat(formCostoEnvio) || 0
    const total = (cant * unit) + envio

    if (formCategoria === 'INSUMO' && formPresentacion) {
      const match = formPresentacion.match(/(\d+)\s*(kg|g)/i)
      if (match) {
        const amount = parseFloat(match[1])
        const unitStr = match[2].toLowerCase()
        const totalGrams = (unitStr === 'kg' ? amount * 1000 : amount) * cant
        if (totalGrams > 0) {
          return total / totalGrams
        }
      }
    }
    return null
  }, [formCantidad, formCostoUnitario, formCostoEnvio, formCategoria, formPresentacion])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ArrowDownRight className="h-8 w-8 text-amber-500" />
            Registro de Egresos & Insumos
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Control clasificado por tags de insumos, filamentos, maquinaria, embalajes y fletes.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Nuevo Egreso
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Total Egresos
          </span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {formatCurrency(totalEgresosTotales)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">{egresos.length} registros contabilizados</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maquinaria & Equipos
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalMaquinaria)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Impresora 3D, Secador, etc.</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Insumos & Materiales
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalInsumos)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Filamentos, Resinas, Cajas</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Servicios & Operativos
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalServicios)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">Fletes, Publicidad, Cuotas</span>
        </div>
      </div>

      {/* Toolbar & Filter Tags */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Buscar por concepto, tag, color o presentación..."
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

            {/* Main Category Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setCategoriaFilter('TODOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoriaFilter === 'TODOS'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({egresos.length})
              </button>
              <button
                onClick={() => { setCategoriaFilter('ACTIVO_FIJO'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  categoriaFilter === 'ACTIVO_FIJO'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Wrench className="h-3 w-3" />
                Maquinaria
              </button>
              <button
                onClick={() => { setCategoriaFilter('INSUMO'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  categoriaFilter === 'INSUMO'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="h-3 w-3" />
                Insumos
              </button>
              <button
                onClick={() => { setCategoriaFilter('SERVICIO'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  categoriaFilter === 'SERVICIO'
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Truck className="h-3 w-3" />
                Servicios
              </button>
            </div>
          </div>

          {/* Subcategory / Tag Quick Filter Badges */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Filtrar por Tag:
              </span>
              <button
                onClick={() => { setTagFilter('TODOS'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  tagFilter === 'TODOS'
                    ? 'bg-zinc-200 text-zinc-950 font-bold'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                Todos los tags
              </button>
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setTagFilter(tag); setCurrentPage(1); }}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                    tagFilter === tag
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table without Responsable */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Categoría & Tag</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Concepto / Descripción</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center hidden md:table-cell">Presentación</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Precio Unit.</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right">Total Egreso</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEgresos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                  No se encontraron egresos con los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEgresos.map((eg) => (
                <TableRow 
                  key={eg.id} 
                  onClick={() => handleOpenEdit(eg)}
                  className="border-zinc-800/60 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                >
                  {/* Fecha */}
                  <TableCell className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {formatDate(eg.createdAt)}
                  </TableCell>

                  {/* Categoría & Tag */}
                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {eg.categoria === 'ACTIVO_FIJO' ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                          Maquinaria
                        </Badge>
                      ) : eg.categoria === 'INSUMO' ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-xs">
                          Insumo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs">
                          Servicio
                        </Badge>
                      )}
                      {renderTagBadge(eg.subcategoria)}
                    </div>
                  </TableCell>

                  {/* Concepto & Detalle */}
                  <TableCell className="px-4 py-3 font-medium text-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold group-hover:text-amber-400 transition-colors">{eg.itemConcepto}</span>
                      {eg.especificacionColor && (
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Palette className="h-3 w-3 text-zinc-500" />
                          {eg.especificacionColor}
                        </span>
                      )}
                      {eg.costoPorGramo && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          S/ {eg.costoPorGramo.toFixed(4)} / gramo
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Presentación */}
                  <TableCell className="px-3 py-3 text-center hidden md:table-cell whitespace-nowrap">
                    {eg.presentacion ? (
                      <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs">
                        {eg.presentacion}
                      </Badge>
                    ) : (
                      <span className="text-xs text-zinc-500">-</span>
                    )}
                  </TableCell>

                  {/* Costo Unitario */}
                  <TableCell className="px-3 py-3 text-right font-mono text-zinc-300 whitespace-nowrap">
                    {eg.cantidad > 1 && <span className="text-xs text-zinc-500 mr-1">{eg.cantidad}x</span>}
                    {formatCurrency(eg.costoUnitario)}
                    {eg.costoEnvio && eg.costoEnvio > 0 ? (
                      <span className="block text-[10px] text-zinc-500">+ {formatCurrency(eg.costoEnvio)} flete</span>
                    ) : null}
                  </TableCell>

                  {/* Total Egreso */}
                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-red-400 whitespace-nowrap">
                    -{formatCurrency(eg.costoTotal)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleOpenEdit(eg, e)}
                        className="h-8 w-8 text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10"
                        title="Editar egreso y tag"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleDelete(eg.id, eg.itemConcepto, e)}
                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/70 text-xs text-zinc-400">
            <div>
              Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredEgresos.length} egresos)
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
                        ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20'
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
      {/* MODAL: EDITAR EGRESO                                                      */}
      {/* ========================================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" />
              Editar Egreso & Tag de Insumo
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Modifica los detalles, tag de clasificación, precios o cantidades.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Tipo de Gasto *</Label>
              <select
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="INSUMO">Insumo / Materiales</option>
                <option value="ACTIVO_FIJO">Maquinaria / Equipos</option>
                <option value="SERVICIO">Servicios / Operativos</option>
              </select>
            </div>

            {/* Tag / Subcategoría Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 flex items-center gap-1">
                <Tag className="h-3 w-3 text-amber-400" />
                Tag / Subcategoría del Insumo *
              </Label>
              <Input 
                value={formSubcategoria}
                onChange={(e) => setFormSubcategoria(e.target.value)}
                placeholder="Ej: Filamento 3D, Embalaje / Cajas, Stickers..."
                required
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {PRESET_TAGS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormSubcategoria(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                      formSubcategoria === preset
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Concepto / Descripción del Gasto *</Label>
              <Input 
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Impresora Bambu Lab, Filamento PLA Matte..."
                required
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Color / Especificación</Label>
                <Input 
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="Ej: Blanco Hueso, Equipo Principal"
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Presentación (Gramos / Kg / Und)</Label>
                <Input 
                  value={formPresentacion}
                  onChange={(e) => setFormPresentacion(e.target.value)}
                  placeholder="Ej: Bobina 1Kg, 500g, Unidad..."
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
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

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Costo Unit. (S/) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostoUnitario}
                  onChange={(e) => setFormCostoUnitario(e.target.value)}
                  placeholder="0.00"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Flete / Envío (S/)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostoEnvio}
                  onChange={(e) => setFormCostoEnvio(e.target.value)}
                  placeholder="0.00"
                  className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Total Preview */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Total Calculado</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {formatCurrency(((parseInt(formCantidad) || 1) * (parseFloat(formCostoUnitario) || 0)) + (parseFloat(formCostoEnvio) || 0))}
                </span>
              </div>
              {previewCostoPorGramo !== null && (
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Costo por Gramo</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    S/ {previewCostoPorGramo.toFixed(4)} / g
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              {editingItem && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => handleDelete(editingItem.id, editingItem.itemConcepto)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setOpenEditModal(false)}
                  className="text-zinc-400 hover:text-white text-xs"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVO EGRESO                                             */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              Registrar Nuevo Egreso / Insumo
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Tipo de Gasto *</Label>
              <select
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="INSUMO">Insumo / Materiales</option>
                <option value="ACTIVO_FIJO">Maquinaria / Equipos</option>
                <option value="SERVICIO">Servicios / Operativos</option>
              </select>
            </div>

            {/* Tag / Subcategoría Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 flex items-center gap-1">
                <Tag className="h-3 w-3 text-amber-400" />
                Tag / Subcategoría del Insumo *
              </Label>
              <Input 
                value={formSubcategoria}
                onChange={(e) => setFormSubcategoria(e.target.value)}
                placeholder="Ej: Filamento 3D, Embalaje / Cajas, Stickers..."
                required
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {PRESET_TAGS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormSubcategoria(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                      formSubcategoria === preset
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Concepto / Descripción del Gasto *</Label>
              <Input 
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Filamento PLA Matte Negro, Cajas para envío..."
                required
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Color / Especificación</Label>
                <Input 
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="Ej: Blanco Hueso, Equipo Principal"
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Presentación (Gramos / Kg / Und)</Label>
                <Input 
                  value={formPresentacion}
                  onChange={(e) => setFormPresentacion(e.target.value)}
                  placeholder="Ej: Bobina 1Kg, Sin bobina, Unidad..."
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
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

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Costo Unit. (S/) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostoUnitario}
                  onChange={(e) => setFormCostoUnitario(e.target.value)}
                  placeholder="0.00"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Flete / Envío (S/)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostoEnvio}
                  onChange={(e) => setFormCostoEnvio(e.target.value)}
                  placeholder="0.00"
                  className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Total Preview */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Total Calculado</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {formatCurrency(((parseInt(formCantidad) || 1) * (parseFloat(formCostoUnitario) || 0)) + (parseFloat(formCostoEnvio) || 0))}
                </span>
              </div>
              {previewCostoPorGramo !== null && (
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Costo por Gramo</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    S/ {previewCostoPorGramo.toFixed(4)} / g
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Egreso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
