'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  ChevronDown, 
  Pencil, 
  Tag, 
  Check, 
  Loader2, 
  ExternalLink, 
  Receipt,
  Landmark,
  Dice5,
  Store,
  Calendar
} from 'lucide-react'
import { createInversion, updateInversion, deleteInversion } from '@/actions/inversiones'
import { TagInsumoItem } from '@/actions/tagsInsumos'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MultiTagInput } from '@/components/ui/MultiTagInput'
import { 
  DatePreset, 
  DateRange, 
  getDefaultDateRange, 
  isDateInRange, 
  getPresetDateRange, 
  getMonthYearDateRange, 
  MESES_ES, 
  formatFechaEvolucion 
} from '@/lib/date-utils'
import { EgresoItem } from './FlujoCajaClient'
import { useBusiness } from '@/context/BusinessContext'

export type CategoriaEgreso = 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL' | 'MERCADERIA' | 'FINANCIERO'

export interface ProductoCatalogItem {
  id: string
  nombreModelo: string
  lineaCategoria: string
  costoBase: number
  stock: number
}

interface EgresosClientProps {
  egresos: EgresoItem[]
  tags?: TagInsumoItem[]
  productos?: ProductoCatalogItem[]
}

const ITEMS_PER_PAGE = 10

// Categorías para taller 3D
const CATEGORIAS_CONFIG_3D = [
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
  },
  {
    id: 'FINANCIERO',
    label: 'Financiero & Préstamos',
    desc: 'Cuotas de crédito, ITF, bancos',
    icon: Landmark,
  }
] as const

// Categorías especializadas para tienda de Juegos de Mesa (BG)
const CATEGORIAS_CONFIG_BG = [
  {
    id: 'MERCADERIA',
    label: 'Compra de Juegos / Stock',
    desc: 'Juegos de mesa, pedidos, expansiones',
    icon: Dice5,
  },
  {
    id: 'FINANCIERO',
    label: 'Gastos Bancarios & ITF',
    desc: 'ITF banco, comisiones, transferencias',
    icon: Landmark,
  },
  {
    id: 'SERVICIO',
    label: 'Servicios & Operativos',
    desc: 'Courier, publicidad, sleeves, empaques',
    icon: Truck,
  },
  {
    id: 'ACTIVO_FIJO',
    label: 'Activo Fijo / Equipamiento',
    desc: 'Mesas de juego, estanterías, demos',
    icon: Store,
  }
] as const

// Entidades y Bancos rápidos en Perú
const BANCOS_PERU = [
  { id: 'BCP', name: 'BCP' },
  { id: 'Interbank', name: 'Interbank' },
  { id: 'BBVA', name: 'BBVA' },
  { id: 'Scotiabank', name: 'Scotiabank' },
  { id: 'Yape', name: 'Yape' },
  { id: 'Plin', name: 'Plin' },
]

// Montos comunes de ITF / transferencias
const MONTOS_ITF_COMUNES = ['0.05', '0.10', '0.15', '0.20', '0.50', '1.00']

// Distribuidoras y Editoriales de Juegos de Mesa
const DISTRIBUIDORAS_JUEGOS = [
  'Devir',
  'Asmodee',
  'Maldito Games',
  'Zacatrus',
  'TCG Factory',
  'Buro',
  'MasQueOca'
]

function parseDateToYearMonth(d: string | Date | null | undefined): { year: number; month: number } | null {
  if (!d) return null
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null
    return { year: d.getFullYear(), month: d.getMonth() }
  }
  const str = String(d).trim()
  if (!str) return null
  const ymd = str.split('T')[0].split('-').map(Number)
  if (ymd.length >= 2 && !isNaN(ymd[0]) && !isNaN(ymd[1])) {
    return { year: ymd[0], month: ymd[1] - 1 }
  }
  const dateObj = new Date(str)
  if (!isNaN(dateObj.getTime())) {
    return { year: dateObj.getFullYear(), month: dateObj.getMonth() }
  }
  return null
}

// =========================================================================
// Paginador de Meses Segmentado Único
// =========================================================================
interface MonthSegmentedControlProps {
  value: DateRange
  onChange: (range: DateRange) => void
  minDate?: string | Date | null
  maxDate?: string | Date | null
}

function MonthSegmentedControl({
  value,
  onChange,
  minDate,
  maxDate,
}: MonthSegmentedControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const maxLimit = parseDateToYearMonth(maxDate) || { year: now.getFullYear(), month: now.getMonth() }
  const minLimit = parseDateToYearMonth(minDate)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getActiveMonthAndYear = () => {
    if (value.from) {
      const parts = value.from.split('-').map(Number)
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { year: parts[0], month: parts[1] - 1 }
      }
    }
    return { year: maxLimit.year, month: maxLimit.month }
  }

  const { year: currentYear, month: currentMonth } = getActiveMonthAndYear()

  const isNextDisabled =
    value.preset === 'TODO' ||
    currentYear > maxLimit.year ||
    (currentYear === maxLimit.year && currentMonth >= maxLimit.month)

  const isPrevDisabled = Boolean(
    minLimit &&
      (currentYear < minLimit.year ||
        (currentYear === minLimit.year && currentMonth <= minLimit.month))
  )

  const handleNavigateMonth = (direction: -1 | 1) => {
    if (direction === 1 && isNextDisabled) return
    if (direction === -1 && isPrevDisabled) return

    if (value.preset === 'TODO') {
      if (direction === -1) {
        const targetYear = maxLimit.year
        const targetMonth = maxLimit.month
        const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth()

        if (isCurrentMonth) {
          onChange(getPresetDateRange('ESTE_MES'))
          return
        }

        const newRange = getMonthYearDateRange(targetYear, targetMonth + 1)
        onChange(newRange)
        return
      }
      return
    }

    const targetDate = new Date(currentYear, currentMonth + direction, 1)
    const targetYear = targetDate.getFullYear()
    const targetMonth = targetDate.getMonth()

    const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth()

    if (isCurrentMonth) {
      onChange(getPresetDateRange('ESTE_MES'))
      return
    }

    const newRange = getMonthYearDateRange(targetYear, targetMonth + 1)
    onChange(newRange)
  }

  const getFullCalendarMonthInfo = () => {
    if (!value.from || !value.to) return null
    const [fromY, fromM, fromD] = value.from.split('-').map(Number)
    const [toY, toM, toD] = value.to.split('-').map(Number)
    if (fromY === toY && fromM === toM && fromD === 1) {
      const lastDayOfMonth = new Date(fromY, fromM, 0).getDate()
      if (toD === lastDayOfMonth) {
        return { year: fromY, monthIndex: fromM - 1 }
      }
    }
    return null
  }

  const fullMonthInfo = getFullCalendarMonthInfo()

  const getDisplayLabel = () => {
    if (value.preset === 'ESTE_MES') {
      return `${MESES_ES[now.getMonth()]} ${now.getFullYear()}`
    }
    if (value.preset === 'MES_ANTERIOR') {
      const prev = new Date()
      prev.setMonth(prev.getMonth() - 1)
      return `${MESES_ES[prev.getMonth()]} ${prev.getFullYear()}`
    }
    if (value.preset === 'ESTA_SEMANA') {
      return 'Esta Semana'
    }
    if (value.preset === 'SEMANA_ANTERIOR') {
      return 'Semana Pasada'
    }
    if (value.preset === 'ULTIMOS_3_MESES') {
      return 'Hace 3 meses'
    }
    if (value.preset === 'TODO') {
      return 'Histórico'
    }
    if (fullMonthInfo) {
      return `${MESES_ES[fullMonthInfo.monthIndex]} ${fullMonthInfo.year}`
    }
    if (value.from && value.to) {
      return `${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)}`
    }
    return 'Histórico'
  }

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <div className="bg-card border border-border rounded-xl h-10 inline-flex items-center shadow-xs overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleNavigateMonth(-1)}
          disabled={isPrevDisabled}
          className="h-10 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-none shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mes anterior"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-secondary/60 h-full border-x border-border/70 transition-colors cursor-pointer select-none"
          title="Ver opciones de periodo o mes"
        >
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[170px]">{getDisplayLabel()}</span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleNavigateMonth(1)}
          disabled={isNextDisabled}
          className="h-10 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-none shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mes siguiente"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-card border border-border shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60 mb-1 flex items-center justify-between">
            <span>Periodo de Selección</span>
            {value.preset !== 'ESTE_MES' && (
              <button
                type="button"
                onClick={() => {
                  onChange(getPresetDateRange('ESTE_MES'))
                  setIsOpen(false)
                }}
                className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
              >
                Mes Actual
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(getPresetDateRange('ESTE_MES'))
              setIsOpen(false)
            }}
            className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
              value.preset === 'ESTE_MES'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <span>📅 Mes Actual ({MESES_ES[now.getMonth()]})</span>
            {value.preset === 'ESTE_MES' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(getPresetDateRange('TODO'))
              setIsOpen(false)
            }}
            className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
              value.preset === 'TODO'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <span>🌐 Histórico Completo</span>
            {value.preset === 'TODO' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(getPresetDateRange('ESTA_SEMANA'))
              setIsOpen(false)
            }}
            className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
              value.preset === 'ESTA_SEMANA'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <span>📆 Esta Semana</span>
            {value.preset === 'ESTA_SEMANA' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(getPresetDateRange('SEMANA_ANTERIOR'))
              setIsOpen(false)
            }}
            className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
              value.preset === 'SEMANA_ANTERIOR'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <span>⏪ Semana Pasada</span>
            {value.preset === 'SEMANA_ANTERIOR' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(getPresetDateRange('ULTIMOS_3_MESES'))
              setIsOpen(false)
            }}
            className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
              value.preset === 'ULTIMOS_3_MESES'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <span>⏱️ Hace 3 meses</span>
            {value.preset === 'ULTIMOS_3_MESES' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        </div>
      )}
    </div>
  )
}

// =========================================================================
// Selector Independiente de Tags
// =========================================================================
interface TagSelectorDropdownProps {
  tags: string[]
  value: string
  onChange: (val: string) => void
  items: EgresoItem[]
  categoriaFilter: string
  isBG: boolean
}

function TagSelectorDropdown({
  tags,
  value,
  onChange,
  items,
  categoriaFilter,
  isBG,
}: TagSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTag, setSearchTag] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredTags = useMemo(() => {
    if (!searchTag.trim()) return tags
    return tags.filter(t => t.toLowerCase().includes(searchTag.toLowerCase().trim()))
  }, [tags, searchTag])

  const getTagCount = (tagName: string) => {
    return items.filter(e => {
      let catMatch = categoriaFilter === 'TODOS'
      if (!catMatch) {
        if (categoriaFilter === 'MERCADERIA') {
          catMatch = e.categoria === 'MERCADERIA' || (isBG && e.categoria === 'INSUMO')
        } else {
          catMatch = e.categoria === categoriaFilter
        }
      }
      if (!catMatch || !e.subcategoria) return false
      const itemTags = e.subcategoria.split(',').map(s => s.trim().toLowerCase())
      return itemTags.includes(tagName.toLowerCase())
    }).length
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border-input bg-card text-foreground text-xs font-semibold h-10 px-3 rounded-xl flex items-center gap-2 shadow-xs hover:bg-secondary transition-colors cursor-pointer"
        title="Filtrar por Tag"
      >
        <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-[150px]">
          {value === 'TODOS' ? (categoriaFilter === 'TODOS' ? 'Todos los Tags' : `Tags (${tags.length})`) : value}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-card border border-border shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          {tags.length > 5 && (
            <div className="relative mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tag..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full bg-secondary/60 border border-input text-foreground text-xs rounded-lg pl-8 pr-2.5 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onChange('TODOS')
                setIsOpen(false)
                setSearchTag('')
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                value === 'TODOS'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <span>Todos los Tags</span>
              <span className="text-[10px] text-muted-foreground">({tags.length})</span>
            </button>

            {filteredTags.map(tag => {
              const count = getTagCount(tag)
              const isSelected = value.toLowerCase() === tag.toLowerCase()
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    onChange(tag)
                    setIsOpen(false)
                    setSearchTag('')
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="truncate">{tag}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}

            {filteredTags.length === 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No hay tags que coincidan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// =========================================================================
// Componente Principal EgresosClient
// =========================================================================
export function EgresosClient({ egresos, tags = [], productos = [] }: EgresosClientProps) {
  const router = useRouter()
  const { isBG } = useBusiness()
  const [items, setItems] = useState<EgresoItem[]>(egresos)

  useEffect(() => {
    setItems(egresos)
  }, [egresos])

  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODOS')
  const [tagFilter, setTagFilter] = useState<string>('TODOS')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('ESTE_MES'))

  // Rango global de fechas con datos
  const { minFechaData, maxFechaData } = useMemo(() => {
    if (!items || items.length === 0) return { minFechaData: undefined, maxFechaData: undefined }
    let min: string | undefined
    let max: string | undefined
    for (const eg of items) {
      const d = eg.createdAt
      if (d) {
        if (!min || d < min) min = d
        if (!max || d > max) max = d
      }
    }
    return { minFechaData: min, maxFechaData: max }
  }, [items])

  const [openModal, setOpenModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Item siendo editado
  const [editingItem, setEditingItem] = useState<EgresoItem | null>(null)

  // Estados del Formulario (Crear y Editar)
  const [formPersona, setFormPersona] = useState('Víctor')
  const [formCategoria, setFormCategoria] = useState<CategoriaEgreso>(isBG ? 'MERCADERIA' : 'INSUMO')
  const [formConcepto, setFormConcepto] = useState('')
  const [formSubcategoria, setFormSubcategoria] = useState('')
  const [formCantidad, setFormCantidad] = useState('1')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState('0')
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])

  // Configuración de categorías activas según el negocio
  const activeCategoriasConfig = isBG ? CATEGORIAS_CONFIG_BG : CATEGORIAS_CONFIG_3D

  // Tags para el formulario
  const activeCategoryTags = useMemo(() => {
    return tags.filter(t => t.categoria === formCategoria)
  }, [tags, formCategoria])

  // Lista única de tags disponibles
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

  // Tags disponibles para el dropdown filtrados por la categoría activa
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
      .filter(e => {
        if (categoriaFilter === 'MERCADERIA') {
          return (e.categoria === 'MERCADERIA' || (isBG && e.categoria === 'INSUMO')) && e.subcategoria
        }
        return e.categoria === categoriaFilter && e.subcategoria
      })
      .forEach(e => {
        if (e.subcategoria) {
          e.subcategoria.split(',').forEach(tag => {
            const clean = tag.trim()
            if (clean) set.add(clean)
          })
        }
      })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [categoriaFilter, tags, items, availableTags, isBG])

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Lista Filtrada y Ordenada Dinámica (reactiva instantáneamente a filtros de categoría, tag, fecha y texto)
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

        let matchCat = true
        if (categoriaFilter !== 'TODOS') {
          if (categoriaFilter === 'MERCADERIA') {
            matchCat = eg.categoria === 'MERCADERIA' || (isBG && eg.categoria === 'INSUMO')
          } else if (categoriaFilter === 'INSUMO') {
            matchCat = eg.categoria === 'INSUMO' && !isBG
          } else {
            matchCat = eg.categoria === categoriaFilter
          }
        }

        const matchTag = tagFilter === 'TODOS' || (
          eg.subcategoria 
            ? eg.subcategoria.split(',').map(s => s.trim().toLowerCase()).includes(tagFilter.trim().toLowerCase())
            : false
        )

        return matchSearch && matchCat && matchTag
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [items, dateRange, search, categoriaFilter, tagFilter, isBG])

  const isFiltered = search.trim() !== '' || categoriaFilter !== 'TODOS' || tagFilter !== 'TODOS' || dateRange.preset !== 'ESTE_MES'

  // KPIs Dinámicos actualizados en tiempo real según filtros
  const totalEgresosTotales = useMemo(() => {
    return filteredEgresos.reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  const totalInsumosOrJuegos = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'MERCADERIA' || (isBG ? e.categoria === 'INSUMO' : e.categoria === 'INSUMO'))
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos, isBG])

  const totalFinancieroITF = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'FINANCIERO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  const totalMaquinariaOrEquipamiento = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'ACTIVO_FIJO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  const totalServicios = useMemo(() => {
    return filteredEgresos
      .filter(e => e.categoria === 'SERVICIO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [filteredEgresos])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredEgresos.length / ITEMS_PER_PAGE))
  const paginatedEgresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEgresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEgresos, currentPage])

  // Tabs de categorías con contadores dinámicos
  const categoryTabs = useMemo(() => {
    // Calculamos conteos globales o sobre la fecha activa
    const itemsInPeriod = items.filter(eg => isDateInRange(eg.createdAt, dateRange.from, dateRange.to))

    if (isBG) {
      const countTodos = itemsInPeriod.length
      const countStock = itemsInPeriod.filter(e => e.categoria === 'MERCADERIA' || e.categoria === 'INSUMO').length
      const countEquip = itemsInPeriod.filter(e => e.categoria === 'ACTIVO_FIJO').length
      const countServ = itemsInPeriod.filter(e => e.categoria === 'SERVICIO').length
      const countFin = itemsInPeriod.filter(e => e.categoria === 'FINANCIERO').length

      return [
        { id: 'TODOS', label: `Todos (${countTodos})` },
        { id: 'MERCADERIA', label: countStock > 0 ? `Juegos / Stock (${countStock})` : 'Juegos / Stock' },
        { id: 'ACTIVO_FIJO', label: countEquip > 0 ? `Equipamiento (${countEquip})` : 'Equipamiento' },
        { id: 'SERVICIO', label: countServ > 0 ? `Servicios (${countServ})` : 'Servicios' },
        { id: 'FINANCIERO', label: countFin > 0 ? `Banco / ITF (${countFin})` : 'Banco / ITF' },
      ]
    }

    const countTodos = itemsInPeriod.length
    const countInsumos = itemsInPeriod.filter(e => e.categoria === 'INSUMO').length
    const countActivos = itemsInPeriod.filter(e => e.categoria === 'ACTIVO_FIJO').length
    const countServicios = itemsInPeriod.filter(e => e.categoria === 'SERVICIO').length
    const countFinanciero = itemsInPeriod.filter(e => e.categoria === 'FINANCIERO').length

    return [
      { id: 'TODOS', label: `Todos (${countTodos})` },
      { id: 'INSUMO', label: countInsumos > 0 ? `Insumos (${countInsumos})` : 'Insumos' },
      { id: 'ACTIVO_FIJO', label: countActivos > 0 ? `Activos Fijos (${countActivos})` : 'Activos Fijos' },
      { id: 'SERVICIO', label: countServicios > 0 ? `Servicios (${countServicios})` : 'Servicios' },
      { id: 'FINANCIERO', label: countFinanciero > 0 ? `Financiero (${countFinanciero})` : 'Financiero' },
    ]
  }, [items, dateRange, isBG])

  // Handler cambio de categoría en modal
  const handleSelectCategoria = (cat: CategoriaEgreso) => {
    setFormCategoria(cat)
    if (cat === 'FINANCIERO') {
      if (!formConcepto) setFormConcepto('ITF')
      if (!formSubcategoria) setFormSubcategoria('BCP')
      if (!formCostoUnitario) setFormCostoUnitario('0.10')
      setFormCantidad('1')
      setFormCostoEnvio('0')
    }
  }

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    setFormPersona('Víctor')
    const defaultCat: CategoriaEgreso = isBG ? 'MERCADERIA' : 'INSUMO'
    setFormCategoria(defaultCat)
    setFormConcepto('')
    const catTags = tags.filter(t => t.categoria === defaultCat)
    setFormSubcategoria(catTags.length > 0 ? catTags[0].nombre : '')
    setFormCantidad('1')
    setFormCostoUnitario('')
    setFormCostoEnvio('0')
    setFormFecha(new Date().toISOString().split('T')[0])
    setOpenModal(true)
  }

  // Abrir Modal de Creación Rápida de ITF
  const handleOpenCreateITF = () => {
    setFormPersona('Víctor')
    setFormCategoria('FINANCIERO')
    setFormConcepto('ITF')
    setFormSubcategoria('BCP')
    setFormCantidad('1')
    setFormCostoUnitario('0.10')
    setFormCostoEnvio('0')
    setFormFecha(new Date().toISOString().split('T')[0])
    setOpenModal(true)
  }

  // Abrir Modal de Edición
  const handleOpenEdit = (eg: EgresoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    let cat: CategoriaEgreso = eg.categoria as CategoriaEgreso
    if (isBG && cat === 'INSUMO') cat = 'MERCADERIA'

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

  // Handlers para stepper de cantidad
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

  // Submit Crear
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConcepto.trim() || !formCostoUnitario) {
      toast.error(isBG ? 'Por favor completa el concepto del gasto y su costo' : 'Por favor completa el nombre del insumo y su costo unitario')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createInversion({
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria as any,
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
      toast.success(formCategoria === 'FINANCIERO' ? 'Gasto bancario / ITF registrado' : 'Egreso registrado exitosamente')
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar egreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Editar
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!formConcepto.trim() || !formCostoUnitario) {
      toast.error(isBG ? 'Por favor completa el concepto del gasto y su costo' : 'Por favor completa el nombre del insumo y su costo unitario')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateInversion(editingItem.id, {
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria as any,
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

  // Eliminar
  const handleDelete = async (id: string, concepto: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (confirm(`¿Estás seguro de eliminar el egreso "${concepto}"?`)) {
      try {
        await deleteInversion(id)
        setItems(prev => prev.filter(item => item.id !== id))
        toast.success('Egreso eliminado')
        if (openEditModal) setOpenEditModal(false)
        router.refresh()
      } catch {
        toast.error('Error al eliminar egreso')
      }
    }
  }

  // Renderizador de Chips de Tags
  const renderTagChips = (tagText?: string | null) => {
    if (!tagText) return null
    const tagsList = tagText.split(',').map(t => t.trim()).filter(Boolean)
    if (tagsList.length === 0) return null

    return (
      <div className="inline-flex items-center flex-wrap gap-1">
        {tagsList.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="bg-secondary/70 border border-border/70 text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 mr-1.5"
          >
            <Tag className="h-2.5 w-2.5 shrink-0" />
            <span>{tag}</span>
          </span>
        ))}
      </div>
    )
  }

  // Badges Semánticos de Categoría según paleta oficial NOVA
  const renderCategoriaBadge = (cat: string) => {
    if (cat === 'MERCADERIA' || (isBG && cat === 'INSUMO')) {
      return (
        <span className="bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
          <Dice5 className="h-3 w-3 shrink-0" />
          Juegos / Stock
        </span>
      )
    }
    if (cat === 'FINANCIERO') {
      return (
        <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
          <Landmark className="h-3 w-3 shrink-0" />
          Bancario / ITF
        </span>
      )
    }
    if (cat === 'ACTIVO_FIJO') {
      return (
        <span className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
          {isBG ? <Store className="h-3 w-3 shrink-0" /> : <Wrench className="h-3 w-3 shrink-0" />}
          {isBG ? 'Equipamiento' : 'Activo Fijo'}
        </span>
      )
    }
    if (cat === 'INSUMO') {
      return (
        <span className="bg-accent text-accent-foreground border border-border text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
          <ShoppingBag className="h-3 w-3 shrink-0" />
          Insumo
        </span>
      )
    }
    return (
      <span className="bg-secondary text-foreground border border-border text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
        <Truck className="h-3 w-3 shrink-0" />
        Servicio
      </span>
    )
  }

  // Previsualización de métricas en formularios
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-background text-foreground min-h-screen">
      {/* ========================================================================= */}
      {/* 1. Header con Navegación Temporal y Acciones                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent border border-border text-accent-foreground shadow-xs">
              <ArrowDownRight className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span>{isBG ? 'Registro de Egresos & Compras' : 'Registro de Egresos & Insumos'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isBG 
              ? 'Control de compra de juegos de mesa, gastos bancarios (ITF), logística y servicios.' 
              : 'Control de compras de insumos, maquinaria, fletes y servicios del taller.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Paginador de meses en un control segmentado único */}
          <MonthSegmentedControl
            value={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange)
              setCurrentPage(1)
            }}
            minDate={minFechaData}
            maxDate={maxFechaData}
          />

          {/* Botón secundario Tags */}
          <Link href="/finanzas/tags">
            <Button 
              variant="outline" 
              className="border-border text-foreground hover:bg-secondary rounded-xl h-10 px-3.5 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5 text-primary" />
              Tags
            </Button>
          </Link>

          {/* Botón rápido ITF para juegos de mesa */}
          {isBG && (
            <Button 
              onClick={handleOpenCreateITF}
              className="border border-emerald-500/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs h-10 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Landmark className="h-3.5 w-3.5 stroke-[2.5] text-emerald-700" />
              + ITF
            </Button>
          )}

          {/* Botón primario + Registrar Egreso */}
          <Button 
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            {isBG ? 'Registrar Compra / Egreso' : '+ Registrar Egreso'}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Tarjetas KPI Superiores (4 tarjetas en grid h-[104px])                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Egresos */}
        <div className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Total Egresos</span>
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-primary">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
              {formatCurrency(totalEgresosTotales)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {isFiltered ? `${filteredEgresos.length} de ${items.length} registros` : `${items.length} registros`}
            </div>
          </div>
        </div>

        {/* KPI 2: Compra de Juegos (BG) o Insumos (3D) */}
        <div className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{isBG ? 'Compra de Juegos & Stock' : 'Insumos & Materiales'}</span>
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-primary">
              {isBG ? <Dice5 className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
              {formatCurrency(totalInsumosOrJuegos)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {isFiltered 
                ? `${filteredEgresos.filter(e => e.categoria === 'MERCADERIA' || (isBG && e.categoria === 'INSUMO')).length} registros` 
                : (isBG ? 'Stock, Pedidos Mayoristas' : 'Filamentos, Packaging')}
            </div>
          </div>
        </div>

        {/* KPI 3: Gastos Bancarios & ITF (BG) o Activos Fijos (3D) */}
        <div className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{isBG ? 'Gastos Bancarios & ITF' : 'Activos Fijos / Equipos'}</span>
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-primary">
              {isBG ? <Landmark className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
              {formatCurrency(isBG ? totalFinancieroITF : totalMaquinariaOrEquipamiento)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {isFiltered 
                ? `${filteredEgresos.filter(e => e.categoria === (isBG ? 'FINANCIERO' : 'ACTIVO_FIJO')).length} registros` 
                : (isBG ? 'ITF, Comisiones Bancarias' : 'Impresoras 3D, Herramientas')}
            </div>
          </div>
        </div>

        {/* KPI 4: Servicios & Operativos */}
        <div className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Servicios & Operativos</span>
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-primary">
              <Truck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
              {formatCurrency(totalServicios)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {isFiltered 
                ? `${filteredEgresos.filter(e => e.categoria === 'SERVICIO').length} registros` 
                : (isBG ? 'Envíos, Courier, Publicidad' : 'Fletes, Servicios')}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Filtros y Búsqueda (Layout horizontal limpio sin estilo cápsula)       */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
        {/* Izquierda: Buscador de egresos */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={isBG ? "Buscar juego, pedido o ITF..." : "Buscar egreso o insumo..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full h-10 rounded-xl border border-input bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {search && (
            <button 
              type="button"
              onClick={() => { setSearch(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Derecha: Pestañas de categorías + Dropdown de Tags */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
          {/* Pestañas de categorías */}
          <div className="bg-secondary/80 border border-border/80 p-1 rounded-xl flex items-center gap-1 overflow-x-auto max-w-full">
            {categoryTabs.map(tab => {
              const isActive = categoriaFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCategoriaFilter(tab.id)
                    setTagFilter('TODOS')
                    setCurrentPage(1)
                  }}
                  className={`whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-card text-foreground font-bold shadow-xs text-xs px-3 py-1.5 rounded-lg'
                      : 'text-muted-foreground hover:text-foreground text-xs px-3 py-1.5 rounded-lg transition-colors'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Dropdown de Tags: Selector independiente */}
          <TagSelectorDropdown
            tags={dropdownTags}
            value={tagFilter}
            onChange={(newTag) => {
              setTagFilter(newTag)
              setCurrentPage(1)
            }}
            items={items}
            categoriaFilter={categoriaFilter}
            isBG={isBG}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Tabla y Vista Móvil de Egresos (Sin scroll horizontal)                 */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Móvil: Tarjetas Compactas Verticales (block md:hidden) */}
        <div className="block md:hidden divide-y divide-border/70">
          {filteredEgresos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No se encontraron egresos con los filtros aplicados.
            </div>
          ) : (
            paginatedEgresos.map((eg) => (
              <div 
                key={eg.id} 
                onClick={() => handleOpenEdit(eg)}
                className="p-3.5 space-y-2 bg-card hover:bg-secondary/35 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-foreground block truncate">
                      {eg.itemConcepto}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {formatDate(eg.createdAt)} • <span className="text-muted-foreground/70">{eg.persona}</span>
                    </span>
                  </div>

                  <span className="text-sm font-extrabold text-destructive font-mono tabular-nums flex-shrink-0">
                    {formatCurrency(eg.costoTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {renderCategoriaBadge(eg.categoria)}
                    {renderTagChips(eg.subcategoria)}
                  </div>

                  <div className="text-right text-xs text-muted-foreground font-mono">
                    <span className="font-bold text-foreground mr-1">
                      {eg.categoria === 'FINANCIERO' ? '1 op' : `${eg.cantidad} ${eg.cantidad === 1 ? 'ud' : 'uds'}`}
                    </span>
                    <span>{formatCurrency(eg.costoUnitario)}</span>
                    {eg.costoEnvio && eg.costoEnvio > 0 ? (
                      <span className="text-[10px] text-muted-foreground block">
                        (+{formatCurrency(eg.costoEnvio)} flete)
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Acciones Móviles */}
                <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-border/50 text-xs" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleOpenEdit(eg, e)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDelete(eg.id, eg.itemConcepto, e)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Tabla Fija (hidden md:block / table-fixed w-full) */}
        <div className="hidden md:block">
          <Table className="table-fixed w-full">
            <TableHeader className="bg-secondary/40 border-y border-border/70">
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase text-left">
                  FECHA
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase text-left">
                  CATEGORÍA
                </TableHead>
                <TableHead className="w-[36%] px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase text-left">
                  CONCEPTO & TAGS
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase text-left">
                  CANTIDAD & P. UNITARIO
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase text-right">
                  TOTAL EGRESO
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase text-right">
                  ACCIONES
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEgresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                    No se encontraron egresos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEgresos.map((eg) => (
                  <TableRow 
                    key={eg.id} 
                    onClick={() => handleOpenEdit(eg)}
                    className="border-b border-border/60 hover:bg-secondary/35 transition-colors duration-150 cursor-pointer group"
                  >
                    {/* 1. FECHA (w-[12%]) */}
                    <TableCell className="w-[12%] px-4 py-3 align-middle whitespace-nowrap">
                      <span className="text-xs font-medium text-foreground">
                        {formatDate(eg.createdAt)}
                      </span>
                    </TableCell>

                    {/* 2. CATEGORÍA (w-[14%]) */}
                    <TableCell className="w-[14%] px-4 py-3 align-middle">
                      {renderCategoriaBadge(eg.categoria)}
                    </TableCell>

                    {/* 3. CONCEPTO & TAGS (w-[36%]) */}
                    <TableCell className="w-[36%] px-4 py-3 align-middle min-w-0">
                      <div className="min-w-0">
                        <span 
                          title={eg.itemConcepto}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate block"
                        >
                          {eg.itemConcepto}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {renderTagChips(eg.subcategoria)}
                          {eg.persona && (
                            <span className="text-[11px] text-muted-foreground/70 ml-1">
                              • {eg.persona}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* 4. CANTIDAD & P. UNITARIO (w-[16%]) */}
                    <TableCell className="w-[16%] px-4 py-3 align-middle text-left">
                      <div className="text-xs font-bold text-foreground">
                        {eg.categoria === 'FINANCIERO' ? (
                          '1 op'
                        ) : (
                          `${eg.cantidad} ${eg.cantidad === 1 ? 'ud' : 'uds'}`
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {eg.categoria === 'FINANCIERO' || (eg.categoria === 'SERVICIO' && eg.cantidad === 1) ? (
                          formatCurrency(eg.costoUnitario)
                        ) : (
                          `${formatCurrency(eg.costoUnitario)} c/u`
                        )}
                        {eg.costoEnvio && eg.costoEnvio > 0 ? (
                          <span className="text-[10px] text-muted-foreground/80 block">
                            (+{formatCurrency(eg.costoEnvio)} flete)
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* 5. TOTAL EGRESO (w-[12%], alineado a la derecha) */}
                    <TableCell className="w-[12%] px-4 py-3 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {Boolean(eg.especificacionColor || eg.presentacion || eg.costoEnvio) && (
                          <span
                            title={[
                              eg.especificacionColor ? `Color: ${eg.especificacionColor}` : null,
                              eg.presentacion ? `Presentación: ${eg.presentacion}` : null,
                              eg.costoEnvio ? `Flete: ${formatCurrency(eg.costoEnvio)}` : null,
                            ].filter(Boolean).join(' | ')}
                            className="text-muted-foreground hover:text-foreground cursor-help p-1 rounded-md hover:bg-secondary transition-colors"
                          >
                            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-destructive text-right font-mono tabular-nums">
                          {formatCurrency(eg.costoTotal)}
                        </span>
                      </div>
                    </TableCell>

                    {/* 6. ACCIONES (w-[10%], alineado al extremo derecho) */}
                    <TableCell className="w-[10%] px-4 py-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEdit(eg, e)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                          title="Editar egreso"
                          aria-label="Editar egreso"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(eg.id, eg.itemConcepto, e)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Eliminar egreso"
                          aria-label="Eliminar egreso"
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

        {/* Footer de Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/70 bg-secondary/30 text-xs text-muted-foreground">
            <div>
              Mostrando <span className="text-foreground font-bold">{paginatedEgresos.length}</span> de <span className="text-foreground font-bold">{filteredEgresos.length}</span> egresos (Página {currentPage} de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 cursor-pointer shadow-xs rounded-xl"
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
                    className={`h-8 w-8 p-0 cursor-pointer rounded-xl ${
                      currentPage === page 
                        ? "bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90" 
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                className="h-8 px-2.5 border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 cursor-pointer shadow-xs rounded-xl"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. Modal: Registrar Nuevo Egreso                                          */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-card border-border text-foreground w-[95vw] sm:max-w-xl max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          <form onSubmit={handleCreateSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border shadow-xs ${formCategoria === 'FINANCIERO' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-accent border-border text-primary'}`}>
                  {formCategoria === 'FINANCIERO' ? <Landmark className="h-5 w-5 stroke-[2.5]" /> : <Plus className="h-5 w-5 stroke-[2.5]" />}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                    {formCategoria === 'FINANCIERO' 
                      ? 'Registrar Gasto Bancario / ITF' 
                      : isBG 
                        ? 'Registrar Compra / Egreso' 
                        : 'Registrar Nuevo Egreso'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {formCategoria === 'FINANCIERO' 
                      ? 'Registro rápido del ITF o comisiones cobradas por la entidad bancaria.' 
                      : isBG 
                        ? 'Añade compras de juegos de mesa, pedidos a distribuidoras o gastos operativos.' 
                        : 'Añade compras de insumos, fletes o activos para el taller.'}
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              {/* Selector de Categoría Principal */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Categoría Principal *
                </Label>
                <div className={`grid gap-2 ${activeCategoriasConfig.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  {activeCategoriasConfig.map(cat => {
                    const isSelected = formCategoria === cat.id
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoria(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'bg-card border-primary ring-1 ring-primary/40 text-foreground shadow-xs'
                            : 'bg-secondary border-border text-muted-foreground hover:border-input hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground leading-tight">{cat.label}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cat.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fecha y Persona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-bold uppercase tracking-wider">Fecha del Egreso *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-secondary/40 border-input text-foreground text-sm rounded-xl focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-bold uppercase tracking-wider">Responsable / Persona *</Label>
                  <Input 
                    value={formPersona}
                    onChange={(e) => setFormPersona(e.target.value)}
                    placeholder="Víctor"
                    required
                    className="bg-secondary/40 border-input text-foreground text-sm rounded-xl focus:border-primary focus:bg-card"
                  />
                </div>
              </div>

              {/* Helper específico para Gasto Bancario / ITF */}
              {formCategoria === 'FINANCIERO' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5" />
                      Banco o Entidad Financiera
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Selección rápida</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {BANCOS_PERU.map(b => {
                      const isBankSelected = formSubcategoria.toLowerCase().includes(b.name.toLowerCase())
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setFormSubcategoria(b.name)
                            if (!formConcepto) setFormConcepto('ITF')
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all cursor-pointer ${
                            isBankSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-card text-muted-foreground border-emerald-500/30 hover:border-emerald-500 hover:text-emerald-800'
                          }`}
                        >
                          {b.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Helper específico para Compra de Juegos de Mesa */}
              {formCategoria === 'MERCADERIA' && productos && productos.length > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300">
                    <span className="flex items-center gap-1.5">
                      <Dice5 className="h-3.5 w-3.5" />
                      Vincular Juego del Catálogo (Opcional)
                    </span>
                    <span className="text-[10px] text-sky-700/80 dark:text-sky-400 font-normal">Autocompleta costo base</span>
                  </div>

                  <select
                    className="w-full text-xs bg-card border border-input rounded-xl p-2 text-foreground focus:ring-1 focus:ring-primary"
                    defaultValue=""
                    onChange={(e) => {
                      const sel = productos.find(p => p.id === e.target.value)
                      if (sel) {
                        setFormConcepto(sel.nombreModelo)
                        if (!formCostoUnitario || formCostoUnitario === '0') {
                          setFormCostoUnitario(sel.costoBase.toString())
                        }
                      }
                    }}
                  >
                    <option value="" disabled>-- Selecciona un juego del catálogo para autocompletar --</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombreModelo} (Costo base: S/ {p.costoBase})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Concepto del Gasto */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground font-bold uppercase tracking-wider">
                    {formCategoria === 'FINANCIERO' 
                      ? 'Concepto Financiero *' 
                      : formCategoria === 'MERCADERIA' 
                        ? 'Nombre del Juego o N° de Pedido *' 
                        : 'Concepto / Nombre del Insumo *'}
                  </Label>

                  {/* Pills de conceptos rápidos para banco */}
                  {formCategoria === 'FINANCIERO' && (
                    <div className="flex items-center gap-1 text-[10px] flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFormConcepto('Pago Cuota 1/24 - Préstamo BCP')
                          setFormCostoUnitario('388.68')
                          setFormSubcategoria('BCP')
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer font-bold transition-colors"
                      >
                        Cuota Préstamo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormConcepto('ITF')}
                        className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer font-medium"
                      >
                        ITF
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormConcepto('Comisión Transferencia')}
                        className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer font-medium"
                      >
                        Comisión
                      </button>
                    </div>
                  )}
                </div>

                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder={
                    formCategoria === 'FINANCIERO'
                      ? 'ITF Banco, Comisión Interbancaria...'
                      : formCategoria === 'MERCADERIA'
                        ? 'Ej: Pedido Devir F006-00014948 o Catan Básico...'
                        : 'Ej: Filamento PLA Hyper Creality Negro 1kg...'
                  }
                  required
                  className="bg-secondary/40 border-input text-foreground placeholder:text-muted-foreground text-sm rounded-xl focus:border-primary focus:bg-card"
                />
              </div>

              {/* Multi-Tags */}
              <div className="space-y-2 p-3.5 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    {formCategoria === 'FINANCIERO' ? 'Etiqueta del Banco (Tag)' : 'Tags / Etiquetas'}
                  </span>
                  <Link 
                    href="/finanzas/tags" 
                    className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Gestionar tags <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>

                {/* Distributor quick chips for board games */}
                {formCategoria === 'MERCADERIA' && (
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-bold mr-1">Distribuidor:</span>
                    {DISTRIBUIDORAS_JUEGOS.map(dist => (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => {
                          const current = formSubcategoria ? formSubcategoria.split(',').map(s => s.trim()) : []
                          if (!current.includes(dist)) {
                            setFormSubcategoria([...current, dist].join(', '))
                          }
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md font-semibold bg-card border border-input text-muted-foreground hover:text-foreground hover:border-primary cursor-pointer"
                      >
                        +{dist}
                      </button>
                    ))}
                  </div>
                )}

                <MultiTagInput
                  value={formSubcategoria}
                  onChange={(newTags) => setFormSubcategoria(newTags.join(', '))}
                  suggestions={activeCategoryTags.map(t => t.nombre)}
                  placeholder="Escribe un tag y presiona Enter..."
                />
              </div>

              {/* Costos y Cantidades */}
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-3">
                {/* Montos rápidos para ITF */}
                {formCategoria === 'FINANCIERO' && (
                  <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">Monto rápido ITF:</span>
                    {MONTOS_ITF_COMUNES.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormCostoUnitario(m)}
                        className={`px-2 py-0.5 text-xs rounded-md font-mono font-bold border transition-all cursor-pointer ${
                          formCostoUnitario === m
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-card text-emerald-800 border-emerald-500/30 hover:bg-emerald-50'
                        }`}
                      >
                        S/ {m}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-bold">Cantidad *</Label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        disabled={formCategoria === 'FINANCIERO'}
                        onClick={handleDecrementCantidad}
                        className="h-9 px-2.5 bg-card border border-r-0 border-input rounded-l-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <Input 
                        type="number"
                        min="1"
                        disabled={formCategoria === 'FINANCIERO'}
                        value={formCantidad}
                        onChange={(e) => setFormCantidad(e.target.value)}
                        required
                        className="bg-card border-input text-foreground text-center font-mono font-bold text-sm h-9 rounded-none focus:border-primary disabled:bg-muted"
                      />
                      <button
                        type="button"
                        disabled={formCategoria === 'FINANCIERO'}
                        onClick={handleIncrementCantidad}
                        className="h-9 px-2.5 bg-card border border-l-0 border-input rounded-r-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-bold">
                      {formCategoria === 'FINANCIERO' ? 'Monto Cobrado (S/) *' : 'Costo Unit. (S/) *'}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground">S/</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={formCostoUnitario}
                        onChange={(e) => setFormCostoUnitario(e.target.value)}
                        placeholder="0.00"
                        required
                        className="pl-8 bg-card border-input text-foreground text-sm font-mono font-bold h-9 rounded-xl focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-bold">Flete / Envío (S/)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground">S/</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={formCategoria === 'FINANCIERO'}
                        value={formCostoEnvio}
                        onChange={(e) => setFormCostoEnvio(e.target.value)}
                        placeholder="0.00"
                        className="pl-8 bg-card border-input text-foreground text-sm font-mono h-9 rounded-xl focus:border-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Previsualización en Vivo */}
              <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total a Registrar</span>
                  <span className="text-xl font-extrabold text-destructive font-mono">
                    {formatCurrency(liveCostMetrics.totalCalculado)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Costo Real / Unidad</span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {formatCurrency(liveCostMetrics.costoRealUnitario)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
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

      {/* ========================================================================= */}
      {/* 6. Modal: Editar Egreso                                                   */}
      {/* ========================================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent showCloseButton={false} className="bg-card border-border text-foreground w-[95vw] sm:max-w-xl max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          <form onSubmit={handleEditSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent border border-border text-primary">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                    {formCategoria === 'FINANCIERO' ? 'Editar Gasto Bancario / ITF' : 'Editar Egreso'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Modifica los detalles, categoría, tags, costos o cantidades adquiridas.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              {/* Selector de Categoría */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Categoría Principal *
                </Label>
                <div className={`grid gap-2 ${activeCategoriasConfig.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  {activeCategoriasConfig.map(cat => {
                    const isSelected = formCategoria === cat.id
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoria(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'bg-card border-primary ring-1 ring-primary/40 text-foreground shadow-xs'
                            : 'bg-secondary border-border text-muted-foreground hover:border-input hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground leading-tight">{cat.label}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cat.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fecha y Persona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-bold uppercase tracking-wider">Fecha del Egreso *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-secondary/40 border-input text-foreground text-sm rounded-xl focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-bold uppercase tracking-wider">Responsable / Persona *</Label>
                  <Input 
                    value={formPersona}
                    onChange={(e) => setFormPersona(e.target.value)}
                    placeholder="Víctor"
                    required
                    className="bg-secondary/40 border-input text-foreground text-sm rounded-xl focus:border-primary focus:bg-card"
                  />
                </div>
              </div>

              {/* Helper específico para Gasto Bancario / ITF */}
              {formCategoria === 'FINANCIERO' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5" />
                      Banco o Entidad Financiera
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Selección rápida</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {BANCOS_PERU.map(b => {
                      const isBankSelected = formSubcategoria.toLowerCase().includes(b.name.toLowerCase())
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setFormSubcategoria(b.name)
                            if (!formConcepto) setFormConcepto('ITF')
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all cursor-pointer ${
                            isBankSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-card text-muted-foreground border-emerald-500/30 hover:border-emerald-500 hover:text-emerald-800'
                          }`}
                        >
                          {b.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Concepto */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-bold uppercase tracking-wider">
                  {formCategoria === 'FINANCIERO' 
                    ? 'Concepto Financiero *' 
                    : formCategoria === 'MERCADERIA' 
                      ? 'Nombre del Juego o N° de Pedido *' 
                      : 'Concepto / Nombre del Insumo *'}
                </Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder={
                    formCategoria === 'FINANCIERO'
                      ? 'ITF Banco, Comisión Interbancaria...'
                      : formCategoria === 'MERCADERIA'
                        ? 'Ej: Pedido Devir F006-00014948 o Catan Básico...'
                        : 'Ej: Filamento PLA Hyper Creality Negro 1kg...'
                  }
                  required
                  className="bg-secondary/40 border-input text-foreground placeholder:text-muted-foreground text-sm rounded-xl focus:border-primary focus:bg-card"
                />
              </div>

              {/* Multi-Tags */}
              <div className="space-y-2 p-3.5 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    Tags / Etiquetas
                  </span>
                  <Link 
                    href="/finanzas/tags" 
                    className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
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
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-3">
                {formCategoria === 'FINANCIERO' && (
                  <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">Monto rápido ITF:</span>
                    {MONTOS_ITF_COMUNES.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormCostoUnitario(m)}
                        className={`px-2 py-0.5 text-xs rounded-md font-mono font-bold border transition-all cursor-pointer ${
                          formCostoUnitario === m
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-card text-emerald-800 border-emerald-500/30 hover:bg-emerald-50'
                        }`}
                      >
                        S/ {m}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-bold">Cantidad *</Label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        disabled={formCategoria === 'FINANCIERO'}
                        onClick={handleDecrementCantidad}
                        className="h-9 px-2.5 bg-card border border-r-0 border-input rounded-l-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <Input 
                        type="number"
                        min="1"
                        disabled={formCategoria === 'FINANCIERO'}
                        value={formCantidad}
                        onChange={(e) => setFormCantidad(e.target.value)}
                        required
                        className="bg-card border-input text-foreground text-center font-mono font-bold text-sm h-9 rounded-none focus:border-primary disabled:bg-muted"
                      />
                      <button
                        type="button"
                        disabled={formCategoria === 'FINANCIERO'}
                        onClick={handleIncrementCantidad}
                        className="h-9 px-2.5 bg-card border border-l-0 border-input rounded-r-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-bold">
                      {formCategoria === 'FINANCIERO' ? 'Monto Cobrado (S/) *' : 'Costo Unit. (S/) *'}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground">S/</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={formCostoUnitario}
                        onChange={(e) => setFormCostoUnitario(e.target.value)}
                        placeholder="0.00"
                        required
                        className="pl-8 bg-card border-input text-foreground text-sm font-mono font-bold h-9 rounded-xl focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-bold">Flete / Envío (S/)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground">S/</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={formCategoria === 'FINANCIERO'}
                        value={formCostoEnvio}
                        onChange={(e) => setFormCostoEnvio(e.target.value)}
                        placeholder="0.00"
                        className="pl-8 bg-card border-input text-foreground text-sm font-mono h-9 rounded-xl focus:border-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Previsualización en Vivo */}
              <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total a Registrar</span>
                  <span className="text-xl font-extrabold text-destructive font-mono">
                    {formatCurrency(liveCostMetrics.totalCalculado)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Costo Real / Unidad</span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {formatCurrency(liveCostMetrics.costoRealUnitario)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-border bg-card flex items-center justify-between flex-shrink-0">
              {editingItem && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => handleDelete(editingItem.id, editingItem.itemConcepto)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs rounded-xl cursor-pointer font-bold active:scale-[0.98]"
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
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
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
