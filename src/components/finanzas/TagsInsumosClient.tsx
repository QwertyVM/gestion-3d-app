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
  Tag, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  ArrowLeft, 
  ShoppingBag, 
  DollarSign, 
  Wrench,
  Truck,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createTagInsumo, updateTagInsumo, deleteTagInsumo, TagInsumoItem, CategoriaTag } from '@/actions/tagsInsumos'
import { toast } from 'sonner'
import { useBusiness } from '@/context/BusinessContext'
import { Dice5, Landmark, Store } from 'lucide-react'

interface TagsInsumosClientProps {
  tags: TagInsumoItem[]
}

const ITEMS_PER_PAGE = 10

const CATEGORIAS_TAG_3D: { id: CategoriaTag; label: string; icon: any; desc: string }[] = [
  { id: 'INSUMO', label: 'Insumos & Materiales', icon: ShoppingBag, desc: 'Filamentos, Packaging, Consumibles' },
  { id: 'PERSONAL', label: 'Personal & Sueldos', icon: Users, desc: 'Colaboradores, Apoyo taller, Jamile' },
  { id: 'ACTIVO_FIJO', label: 'Activo Fijo / Equipos', icon: Wrench, desc: 'Impresoras 3D, Herramientas' },
  { id: 'SERVICIO', label: 'Servicios & Operativos', icon: Truck, desc: 'Fletes, Publicidad, Cuotas' },
]

const CATEGORIAS_TAG_BG: { id: CategoriaTag; label: string; icon: any; desc: string }[] = [
  { id: 'MERCADERIA', label: 'Juegos & Stock', icon: Dice5, desc: 'Distribuidores, Editoriales: Devir, Asmodee' },
  { id: 'PERSONAL', label: 'Personal & Sueldos', icon: Users, desc: 'Atención tienda, eventos, colaboradores' },
  { id: 'FINANCIERO', label: 'Gastos Bancarios & ITF', icon: Landmark, desc: 'BCP, Interbank, BBVA, etc.' },
  { id: 'SERVICIO', label: 'Servicios & Operativos', icon: Truck, desc: 'Envíos, Courier, Sleeves, Publicidad' },
  { id: 'ACTIVO_FIJO', label: 'Activos & Equipamiento', icon: Store, desc: 'Mesas de juego, estanterías, demos' },
]

const COLOR_OPTIONS = [
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  { id: 'blue', name: 'Terracota', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  { id: 'emerald', name: 'Verde Taller', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  { id: 'pink', name: 'Cobre Suave', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  { id: 'indigo', name: 'Neutro', bg: 'bg-muted/60', text: 'text-foreground', border: 'border-border/60' },
]

export function TagsInsumosClient({ tags }: TagsInsumosClientProps) {
  const router = useRouter()
  const { isBG } = useBusiness()
  const [items, setItems] = useState<TagInsumoItem[]>(tags)
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<'TODOS' | CategoriaTag>('TODOS')
  const [openModal, setOpenModal] = useState(false)
  const [editingTag, setEditingTag] = useState<TagInsumoItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const CATEGORIAS_TAG = isBG ? CATEGORIAS_TAG_BG : CATEGORIAS_TAG_3D

  // Form states
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formColor, setFormColor] = useState('amber')
  const [formCategoria, setFormCategoria] = useState<CategoriaTag>(isBG ? 'MERCADERIA' : 'INSUMO')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (val: number) => 
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const getCategoryLabel = (cat: string) => {
    if (cat === 'MERCADERIA') return 'Juegos & Stock'
    if (cat === 'PERSONAL') return 'Personal & Sueldos'
    if (cat === 'FINANCIERO') return 'Gastos Bancarios & ITF'
    if (cat === 'ACTIVO_FIJO') return isBG ? 'Equipamiento' : 'Maquinaria & Equipos'
    if (cat === 'INSUMO') return isBG ? 'Juegos & Stock' : 'Insumos & Materiales'
    return 'Servicios & Operativos'
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoriaFilter])

  // Categorías order mapping
  const CATEGORIA_SORT_ORDER: Record<string, number> = {
    MERCADERIA: 1,
    INSUMO: 1,
    PERSONAL: 2,
    FINANCIERO: 3,
    SERVICIO: 4,
    ACTIVO_FIJO: 5,
  }

  // Filtered and sorted tags
  const filteredTags = useMemo(() => {
    const list = items.filter(t => {
      const matchSearch = 
        t.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(search.toLowerCase()))
      
      const matchCat = categoriaFilter === 'TODOS' || t.categoria === categoriaFilter
      return matchSearch && matchCat
    })

    return [...list].sort((a, b) => {
      const catOrderA = CATEGORIA_SORT_ORDER[a.categoria] ?? 99
      const catOrderB = CATEGORIA_SORT_ORDER[b.categoria] ?? 99
      if (catOrderA !== catOrderB) {
        return catOrderA - catOrderB
      }
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    })
  }, [items, search, categoriaFilter])

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / ITEMS_PER_PAGE))
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTags.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTags, currentPage])

  const totalTagsFiltrados = filteredTags.length
  const totalItemsFiltrados = useMemo(() => filteredTags.reduce((acc, t) => acc + t.totalEgresos, 0), [filteredTags])
  const totalGastoFiltrado = useMemo(() => filteredTags.reduce((acc, t) => acc + t.gastoAcumulado, 0), [filteredTags])

  // Open Create
  const handleOpenCreate = () => {
    setEditingTag(null)
    setFormNombre('')
    setFormDescripcion('')
    setFormColor('amber')
    setFormCategoria('INSUMO')
    setOpenModal(true)
  }

  // Open Edit
  const handleOpenEdit = (tag: TagInsumoItem) => {
    setEditingTag(tag)
    setFormNombre(tag.nombre)
    setFormDescripcion(tag.descripcion || '')
    setFormColor(tag.color || 'amber')
    setFormCategoria(tag.categoria || 'INSUMO')
    setOpenModal(true)
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNombre.trim()) {
      toast.error('El nombre del tag es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingTag) {
        const updated = await updateTagInsumo(editingTag.id, {
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim() || null,
          color: formColor,
          categoria: formCategoria,
        })
        setItems(prev => prev.map(t => t.id === editingTag.id ? { ...t, ...updated } : t))
        toast.success(`Tag "${formNombre}" actualizado exitosamente`)
      } else {
        const created = await createTagInsumo({
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim() || null,
          color: formColor,
          categoria: formCategoria,
        })
        setItems(prev => [...prev, created as any])
        toast.success(`Tag "${formNombre}" creado exitosamente`)
      }
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete
  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el tag "${nombre}"?`)) {
      try {
        await deleteTagInsumo(id)
        setItems(prev => prev.filter(t => t.id !== id))
        toast.success(`Tag "${nombre}" eliminado`)
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message || 'Error al eliminar tag')
      }
    }
  }

  const getTagColorClasses = (colorId: string) => {
    const opt = COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[0]
    return `${opt.bg} ${opt.text} ${opt.border}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href="/finanzas/egresos" 
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60 shrink-0"
              title="Volver a Egresos"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <span>Gestión de Tags & Subcategorías</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clasificación dinámica de compras, materiales y servicios por etiquetas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/finanzas/egresos">
            <Button variant="outline" className="border-border/60 bg-background text-foreground hover:bg-muted/50 cursor-pointer rounded-lg text-xs h-9 font-medium px-3 shadow-none">
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Ver Egresos
            </Button>
          </Link>

          <Button 
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none transition-all cursor-pointer rounded-lg px-3 h-9 text-xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo Tag
          </Button>
        </div>
      </div>

      {/* KPI Cards Minimalistas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">{categoriaFilter === 'TODOS' && !search ? 'Tags Creados' : 'Tags Filtrados'}</span>
            <div className="p-1 rounded-md bg-muted/60 text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-foreground font-mono tabular-nums tracking-tight">
              {totalTagsFiltrados} <span className="text-xs font-normal text-muted-foreground font-sans">{totalTagsFiltrados === 1 ? 'etiqueta' : 'etiquetas'}</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
              {categoriaFilter === 'TODOS' && !search ? 'Clasificación activa' : 'Según filtros'}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">Insumos Asignados</span>
            <div className="p-1 rounded-md bg-muted/60 text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-foreground font-mono tabular-nums tracking-tight">
              {totalItemsFiltrados} <span className="text-xs font-normal text-muted-foreground font-sans">{totalItemsFiltrados === 1 ? 'compra' : 'compras'}</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
              {categoriaFilter === 'TODOS' && !search ? 'Compras etiquetadas' : 'En tags seleccionados'}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider select-none">Gasto Total Etiquetado</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
              {formatCurrency(totalGastoFiltrado)}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
              {categoriaFilter === 'TODOS' && !search ? 'Acumulado en compras' : 'Total en filtro activo'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Master Card (Toolbar + Zero-Scroll Table) */}
      <Card className="bg-card border border-border/60 overflow-hidden shadow-none rounded-xl">
        {/* Unified Integrated Toolbar */}
        <div className="p-3 sm:p-3.5 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-card">
          {/* Lado Izquierdo: Campo de Búsqueda */}
          <div className="relative w-full sm:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar tag o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-background border-border/80 text-foreground placeholder:text-muted-foreground text-xs md:text-sm rounded-lg h-9 focus-visible:ring-1 focus-visible:ring-ring transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lado Derecho: Segmented Control Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 overflow-x-auto max-w-full w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => { setCategoriaFilter('TODOS'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                categoriaFilter === 'TODOS'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({items.length})
            </button>
            {CATEGORIAS_TAG.map(cat => {
              const Icon = cat.icon
              const count = items.filter(t => t.categoria === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategoriaFilter(cat.id); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    categoriaFilter === cat.id
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-border/40">
          {paginatedTags.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No hay tags registrados con los filtros actuales.
            </div>
          ) : (
            paginatedTags.map((tag) => (
              <div 
                key={tag.id} 
                onClick={() => handleOpenEdit(tag)}
                className="p-3.5 space-y-2 bg-card hover:bg-muted/20 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Badge variant="outline" className={`text-xs font-medium py-0.5 px-2 gap-1.5 ${getTagColorClasses(tag.color)}`}>
                      <Tag className="h-3 w-3" />
                      {tag.nombre}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground block">
                      {getCategoryLabel(tag.categoria)}
                    </span>
                    {tag.descripcion && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {tag.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-semibold text-foreground text-sm block tabular-nums">
                      {formatCurrency(tag.gastoAcumulado)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      {tag.totalEgresos} {tag.totalEgresos === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Clean Zero-Scroll Table (5 Columns / table-fixed) */}
        <div className="hidden md:block">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-muted/20 border-b border-border/60">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-[180px] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none text-left">
                  Tag & Categoría
                </TableHead>
                <TableHead className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none text-left">
                  Descripción / Uso
                </TableHead>
                <TableHead className="w-[130px] px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none text-center">
                  Compras / Ítems
                </TableHead>
                <TableHead className="w-[130px] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none text-right">
                  Gasto Acumulado
                </TableHead>
                <TableHead className="w-[80px] px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none text-right">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-muted-foreground text-xs">
                    No hay tags registrados con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTags.map((tag) => (
                  <TableRow 
                    key={tag.id}
                    onClick={() => handleOpenEdit(tag)}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer group"
                  >
                    {/* 1. Tag & Categoría */}
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="space-y-1">
                        <Badge variant="outline" className={`text-xs font-medium py-0.5 px-2 gap-1.5 ${getTagColorClasses(tag.color)}`}>
                          <Tag className="h-3 w-3" />
                          {tag.nombre}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {getCategoryLabel(tag.categoria)}
                        </span>
                      </div>
                    </TableCell>

                    {/* 2. Descripción */}
                    <TableCell className="px-3 py-3 align-middle min-w-0">
                      <span 
                        title={tag.descripcion || ''} 
                        className="text-xs text-foreground block truncate"
                      >
                        {tag.descripcion || <span className="text-muted-foreground/60 italic">Sin descripción</span>}
                      </span>
                    </TableCell>

                    {/* 3. Compras / Ítems */}
                    <TableCell className="px-3 py-3 align-middle text-center whitespace-nowrap">
                      <Badge variant="outline" className="bg-muted/60 border-border/50 text-foreground font-mono text-xs px-2 py-0.5 font-medium tabular-nums">
                        {tag.totalEgresos} {tag.totalEgresos === 1 ? 'ítem' : 'ítems'}
                      </Badge>
                    </TableCell>

                    {/* 4. Gasto Acumulado */}
                    <TableCell className="px-4 py-3 align-middle text-right font-mono font-semibold text-foreground text-xs sm:text-sm whitespace-nowrap tabular-nums">
                      {formatCurrency(tag.gastoAcumulado)}
                    </TableCell>

                    {/* 5. Acciones */}
                    <TableCell className="px-3 py-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(tag)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md cursor-pointer"
                          title="Editar tag"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(tag.id, tag.nombre)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md cursor-pointer"
                          title="Eliminar tag"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/10 text-xs text-muted-foreground">
            <div>
              Mostrando <span className="text-foreground font-semibold">{paginatedTags.length}</span> de <span className="text-foreground font-semibold">{filteredTags.length}</span> tags (Página {currentPage} de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-border/60 bg-background text-foreground hover:bg-muted/50 disabled:opacity-40 cursor-pointer shadow-none"
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
                    className={`h-8 w-8 p-0 cursor-pointer shadow-none ${
                      currentPage === page 
                        ? "bg-primary text-primary-foreground font-semibold" 
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
                className="h-8 px-2.5 border-border/60 bg-background text-foreground hover:bg-muted/50 disabled:opacity-40 cursor-pointer shadow-none"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Crear / Editar Tag */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-card border-border/80 text-foreground w-[95vw] sm:max-w-lg max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-xl rounded-2xl z-50">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                    {editingTag ? 'Editar Tag de Insumo' : 'Crear Nuevo Tag de Insumo'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Asocia el tag a una categoría principal para filtrarlo al registrar compras.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 touch-pan-y">
              {/* Categoría Asociada */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 mb-1.5 block">
                  Categoría Principal *
                </Label>
                <div className={`grid gap-2 ${CATEGORIAS_TAG.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {CATEGORIAS_TAG.map(c => {
                    const isSelected = formCategoria === c.id
                    const Icon = c.icon
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormCategoria(c.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground shadow-none ring-1 ring-primary/40'
                            : 'bg-background border-border/80 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <div className="font-semibold text-[11px] leading-tight">{c.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 mb-1.5 block">
                  Nombre del Tag *
                </Label>
                <Input 
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Filamento PLA, Cajas 15x15, Tornillos M3..."
                  required
                  className="h-9 bg-background border-border/80 text-foreground placeholder:text-muted-foreground text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Selector de Color */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground/90 mb-1.5 block">
                  Color de Identificación
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map(c => {
                    const isSelected = formColor === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormColor(c.id)}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected 
                            ? `${c.bg} ${c.text} ${c.border} ring-1 ring-ring font-semibold`
                            : 'bg-background border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${c.bg} border ${c.border}`}></span>
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/90 mb-1.5 block">
                  Descripción / Notas (Opcional)
                </Label>
                <Input 
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Ej: Bobinas de filamento PLA para producción de pedidos..."
                  className="h-9 bg-background border-border/80 text-foreground placeholder:text-muted-foreground text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Vista previa del tag:</span>
                <Badge variant="outline" className={`text-xs font-medium py-0.5 px-2.5 gap-1.5 ${getTagColorClasses(formColor)}`}>
                  <Tag className="h-3 w-3" />
                  {formNombre.trim() || 'Nombre del Tag'}
                </Badge>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2.5 flex-shrink-0">
              {editingTag ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const tagToDelete = editingTag
                    setOpenModal(false)
                    handleDelete(tagToDelete.id, tagToDelete.nombre)
                  }}
                  className="text-destructive hover:bg-destructive/10 text-xs px-3 py-2 rounded-lg cursor-pointer font-medium active:scale-[0.98] flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setOpenModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg shadow-none cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingTag ? 'Guardar Cambios' : 'Crear Tag'
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
