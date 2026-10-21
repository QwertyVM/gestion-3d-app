'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Palette, 
  ShoppingCart, 
  AlertTriangle,
  Trash2,
  Package,
  Pencil,
  ChevronDown,
  Share2,
  Sparkles,
  Weight,
  Layers3,
  MoreVertical,
  Info,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Archive,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  ColorFilamentoItem, 
  moverEstadoColor, 
  actualizarGramosColor,
  agregarNuevoColor, 
  eliminarColor, 
  resetColoresTaller,
  editarColorFilamento,
  archivarColor,
  descatalogarColor,
  reactivarColor
} from '@/actions/inventario'
import { EditFilamentModal } from './EditFilamentModal'
import { FilamentFlyerModal } from './FilamentFlyerModal'

export interface InventarioFilamentosClientProps {
  disponibles: ColorFilamentoItem[]
  restock: ColorFilamentoItem[]
  descatalogados?: ColorFilamentoItem[]
}

// Swatches agrupados por tonalidades
const SWATCH_GROUPS = {
  neutros: [
    { name: 'Negro carbón', hex: '#18181B' },
    { name: 'Blanco hueso', hex: '#F5F5F0' },
    { name: 'Blanco marfil', hex: '#FFFBEB' },
    { name: 'Gris ceniza', hex: '#94A3B8' },
    { name: 'Arena', hex: '#D4B996' },
  ],
  calidos: [
    { name: 'Terracota', hex: '#A36F4C' },
    { name: 'Marrón latte', hex: '#854D0E' },
    { name: 'Marrón oscuro', hex: '#3E2723' },
    { name: 'Chocolate oscuro', hex: '#451A03' },
    { name: 'Rojo escarlata', hex: '#DC2626' },
    { name: 'Rojo oscuro', hex: '#7F1D1D' },
    { name: 'Naranja mandarina', hex: '#F97316' },
    { name: 'Rosa Sakura', hex: '#F472B6' },
  ],
  frios: [
    { name: 'Azul oscuro', hex: '#1E3A8A' },
    { name: 'Verde grass', hex: '#22C55E' },
    { name: 'Verde manzana', hex: '#65A30D' },
    { name: 'Verde oscuro', hex: '#14532D' },
    { name: 'Lila púrpura', hex: '#C084FC' },
    { name: 'Ciruela', hex: '#581C87' },
  ]
}

const ALL_SWATCHES = [
  ...SWATCH_GROUPS.neutros,
  ...SWATCH_GROUPS.calidos,
  ...SWATCH_GROUPS.frios,
]

const STANDARD_3D_COLORS = [
  { name: 'Negro carbón', hex: '#18181B' },
  { name: 'Blanco hueso', hex: '#F5F5F0' },
  { name: 'Gris ceniza', hex: '#94A3B8' },
  { name: 'Arena', hex: '#D4B996' },
  { name: 'Rojo escarlata', hex: '#DC2626' },
  { name: 'Naranja mandarina', hex: '#F97316' },
  { name: 'Amarillo', hex: '#EAB308' },
  { name: 'Verde grass', hex: '#22C55E' },
  { name: 'Verde oscuro', hex: '#14532D' },
  { name: 'Azul oscuro', hex: '#1E3A8A' },
  { name: 'Celeste', hex: '#0EA5E9' },
  { name: 'Lila púrpura', hex: '#C084FC' },
  { name: 'Ciruela', hex: '#581C87' },
  { name: 'Rosa Sakura', hex: '#F472B6' },
  { name: 'Marrón latte', hex: '#854D0E' },
  { name: 'Chocolate oscuro', hex: '#451A03' },
]

const NEUTRAL_KEYWORDS = ['negro', 'blanco', 'gris', 'ceniza', 'hueso', 'marfil', 'arena', 'beige', 'plata', 'silver', 'carbón']

const normalizeSearchText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const esColorCritico = (c: ColorFilamentoItem) => {
  if (c.estado !== 'DISPONIBLE') return false
  const gramos = c.stockGramos ?? 1000
  return gramos < 300 || Boolean(c.alertaCritica)
}

type FilterTab = 'disponibles' | 'criticos' | 'restock' | 'descatalogados' | 'todos'

export function InventarioFilamentosClient({ 
  disponibles: initialDisponibles, 
  restock: initialRestock,
  descatalogados: initialDescatalogados = []
}: InventarioFilamentosClientProps) {
  // Alias de compatibilidad hacia atrás
  const [disponibles, setDisponibles] = useState<ColorFilamentoItem[]>(initialDisponibles)
  const [restock, setRestock] = useState<ColorFilamentoItem[]>(initialRestock)
  const [descatalogados, setDescatalogados] = useState<ColorFilamentoItem[]>(initialDescatalogados)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('disponibles')
  const [isPending, startTransition] = useTransition()

  // Paginación (8 filamentos por página)
  const ITEMS_PER_PAGE = 8
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab])

  // Copy Feedback State
  const [isCopied, setIsCopied] = useState(false)
  const [showCopyDropdown, setShowCopyDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Quick Add State
  const [openAddModal, setOpenAddModal] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHex, setNuevoHex] = useState('#18181B')
  const [nuevoEstado, setNuevoEstado] = useState<'DISPONIBLE' | 'RESTOCK'>('DISPONIBLE')
  const [nuevoGramos, setNuevoGramos] = useState('1000')
  const [nuevaNota, setNuevaNota] = useState('')

  // Edit Spool State
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editColorId, setEditColorId] = useState('')
  const [editNombre, setEditNombre] = useState('')
  const [editHex, setEditHex] = useState('#18181B')
  const [editNota, setEditNota] = useState('')

  // Details Modal State for full filament management
  const [selectedColorForDetails, setSelectedColorForDetails] = useState<ColorFilamentoItem | null>(null)
  const [openColorDetailsModal, setOpenColorDetailsModal] = useState(false)
  const [modalGramosInput, setModalGramosInput] = useState('1000')
  const [copiedHex, setCopiedHex] = useState(false)
  const [isSavingGramos, setIsSavingGramos] = useState(false)
  const [savedGramosSuccess, setSavedGramosSuccess] = useState(false)
  const [returnToDetailsAfterEdit, setReturnToDetailsAfterEdit] = useState(false)

  // Delete confirmation state
  const [colorToDelete, setColorToDelete] = useState<ColorFilamentoItem | null>(null)
  const [isDeletingColor, setIsDeletingColor] = useState(false)

  // Archive / Descatalogar confirmation state
  const [colorToArchiveOrDescatalog, setColorToArchiveOrDescatalog] = useState<ColorFilamentoItem | null>(null)
  const [isProcessingArchive, setIsProcessingArchive] = useState(false)

  // Image Flyer Modal & Download State
  const [openImageModal, setOpenImageModal] = useState(false)
  const [imageTheme, setImageTheme] = useState<'dark' | 'light'>('dark')
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isCopyingImage, setIsCopyingImage] = useState(false)
  const [imageTimestamp, setImageTimestamp] = useState(Date.now())

  const handleDownloadFlyer = () => {
    try {
      setIsDownloadingImage(true)
      const downloadUrl = `/api/inventario/filamentos/imagen?theme=${imageTheme}&download=true&t=${Date.now()}`
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `catalogo-colores-disponibles-nova3d-${imageTheme}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Descargando imagen del catálogo en alta resolución')
    } catch (err: any) {
      toast.error('Error al descargar: ' + (err?.message || 'Error'))
    } finally {
      setTimeout(() => setIsDownloadingImage(false), 800)
    }
  }

  const handleCopyFlyerImage = async () => {
    try {
      setIsCopyingImage(true)
      const res = await fetch(`/api/inventario/filamentos/imagen?theme=${imageTheme}&t=${Date.now()}`)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      toast.success('¡Imagen copiada al portapapeles! Ya puedes pegarla en WhatsApp o Instagram')
    } catch (err: any) {
      toast.error('No se pudo copiar directo. Usa el botón "Descargar Imagen"')
    } finally {
      setIsCopyingImage(false)
    }
  }

  // Close copy dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCopyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenEditColor = (item: ColorFilamentoItem) => {
    setEditColorId(item.id)
    setEditNombre(item.nombreColor)
    setEditHex(item.codigoHex || '#18181B')
    setEditNota(item.nota || '')
    setOpenEditModal(true)
  }

  const handleEditColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editNombre.trim() || !editColorId) return

    try {
      await editarColorFilamento(editColorId, {
        nombreColor: editNombre.trim(),
        codigoHex: editHex,
        nota: editNota.trim() || null
      })

      const updater = (prev: ColorFilamentoItem[]) =>
        prev.map(c => c.id === editColorId ? { ...c, nombreColor: editNombre.trim(), codigoHex: editHex, nota: editNota.trim() || null } : c)

      setDisponibles(updater)
      setRestock(updater)
      setDescatalogados(updater)

      if (selectedColorForDetails?.id === editColorId) {
        setSelectedColorForDetails(prev => prev ? {
          ...prev,
          nombreColor: editNombre.trim(),
          codigoHex: editHex,
          nota: editNota.trim() || null
        } : null)
      }

      setOpenEditModal(false)
      if (returnToDetailsAfterEdit) {
        setOpenColorDetailsModal(true)
        setReturnToDetailsAfterEdit(false)
      }
      toast.success(`Color "${editNombre.trim()}" actualizado`)
    } catch (err: any) {
      toast.error('Error al editar: ' + (err?.message || 'Error desconocido'))
    }
  }

  // Open the unified specific filament view
  const handleOpenColorDetails = (item: ColorFilamentoItem) => {
    setSelectedColorForDetails(item)
    const g = item.stockGramos ?? (item.estado === 'DISPONIBLE' ? 1000 : 0)
    setModalGramosInput(g.toString())
    setEditColorId(item.id)
    setEditNombre(item.nombreColor)
    setEditHex(item.codigoHex || '#18181B')
    setEditNota(item.nota || '')
    setCopiedHex(false)
    setSavedGramosSuccess(false)
    setOpenColorDetailsModal(true)
  }

  // Stock KPI Calculations
  const totalGramosActivos = useMemo(() => {
    return disponibles.reduce((acc, c) => acc + (c.stockGramos || 0), 0)
  }, [disponibles])

  const totalCriticos = useMemo(() => {
    return disponibles.filter(esColorCritico)
  }, [disponibles])

  // Move from Disponible -> Restock
  const handleMoverARestock = async (item: ColorFilamentoItem) => {
    const updated: ColorFilamentoItem = { ...item, estado: 'RESTOCK', stockGramos: 0, alertaCritica: true, nota: 'Por terminar / En reposición' }
    setDisponibles(prev => prev.filter(c => c.id !== item.id))
    setRestock(prev => [updated, ...prev.filter(c => c.id !== item.id)])
    if (selectedColorForDetails?.id === item.id) {
      setSelectedColorForDetails(updated)
      setModalGramosInput('0')
    }

    try {
      await moverEstadoColor(item.id, 'RESTOCK', 'Por terminar / En reposición')
      toast.info(`"${item.nombreColor}" movido a Restock`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDisponibles(prev => [item, ...prev])
      if (selectedColorForDetails?.id === item.id) {
        setSelectedColorForDetails(item)
      }
    }
  }

  // Move from Restock -> Disponible
  const handleMoverADisponible = async (item: ColorFilamentoItem) => {
    const rollos = item.rollos || 1
    const capacidadGramos = rollos * 1000
    const g = parseInt(modalGramosInput, 10) > 0 ? parseInt(modalGramosInput, 10) : capacidadGramos
    const updated: ColorFilamentoItem = { 
      ...item, 
      estado: 'DISPONIBLE', 
      stockGramos: g, 
      pesoInicialGramos: Math.max(1000, Math.ceil(g / 1000) * 1000), 
      rollos: Math.max(1, Math.ceil(g / 1000)), 
      alertaCritica: g < 300, 
      nota: null 
    }
    setRestock(prev => prev.filter(c => c.id !== item.id))
    setDisponibles(prev => [updated, ...prev.filter(c => c.id !== item.id)])
    if (selectedColorForDetails?.id === item.id) {
      setSelectedColorForDetails(updated)
      setModalGramosInput(g.toString())
    }

    try {
      await moverEstadoColor(item.id, 'DISPONIBLE')
      if (g !== 1000) {
        await actualizarGramosColor(item.id, g)
      }
      toast.success(`"${item.nombreColor}" marcado como Disponible (${g.toLocaleString()}g)`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => [item, ...prev])
      if (selectedColorForDetails?.id === item.id) {
        setSelectedColorForDetails(item)
      }
    }
  }

  // Archivar color (ocultar de taller temporalmente)
  const handleArchivarColor = async (item: ColorFilamentoItem) => {
    const updated: ColorFilamentoItem = { ...item, estado: 'ARCHIVADO', activo: false, nota: 'Archivado' }
    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    }
    setDescatalogados(prev => [updated, ...prev.filter(c => c.id !== item.id)])
    if (selectedColorForDetails?.id === item.id) {
      setSelectedColorForDetails(updated)
    }

    try {
      await archivarColor(item.id)
      toast.info(`"${item.nombreColor}" ha sido archivado`)
    } catch (e: any) {
      toast.error('Error al archivar: ' + e.message)
      setDescatalogados(prev => prev.filter(c => c.id !== item.id))
      if (item.estado === 'DISPONIBLE') {
        setDisponibles(prev => [item, ...prev])
      } else {
        setRestock(prev => [item, ...prev])
      }
      if (selectedColorForDetails?.id === item.id) {
        setSelectedColorForDetails(item)
      }
    }
  }

  // Descatalogar color (ya no habrá este color comercialmente)
  const handleDescatalogarColor = async (item: ColorFilamentoItem) => {
    const updated: ColorFilamentoItem = { ...item, estado: 'DESCATALOGADO', activo: false, nota: 'Descatalogado' }
    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    }
    setDescatalogados(prev => [updated, ...prev.filter(c => c.id !== item.id)])
    if (selectedColorForDetails?.id === item.id) {
      setSelectedColorForDetails(updated)
    }

    try {
      await descatalogarColor(item.id)
      toast.info(`"${item.nombreColor}" ha sido descatalogado`)
    } catch (e: any) {
      toast.error('Error al descatalogar: ' + e.message)
      setDescatalogados(prev => prev.filter(c => c.id !== item.id))
      if (item.estado === 'DISPONIBLE') {
        setDisponibles(prev => [item, ...prev])
      } else {
        setRestock(prev => [item, ...prev])
      }
      if (selectedColorForDetails?.id === item.id) {
        setSelectedColorForDetails(item)
      }
    }
  }

  // Reactivar color descatalogado
  const handleReactivarColor = async (item: ColorFilamentoItem) => {
    const isDisp = (item.stockGramos || 0) > 0
    const updated: ColorFilamentoItem = isDisp
      ? { ...item, estado: 'DISPONIBLE', activo: true, nota: null }
      : { ...item, estado: 'RESTOCK', activo: true, nota: 'Por terminar / En reposición' }

    setDescatalogados(prev => prev.filter(c => c.id !== item.id))
    if (isDisp) {
      setDisponibles(prev => [updated, ...prev.filter(c => c.id !== item.id)])
    } else {
      setRestock(prev => [updated, ...prev.filter(c => c.id !== item.id)])
    }
    if (selectedColorForDetails?.id === item.id) {
      setSelectedColorForDetails(updated)
    }

    try {
      await reactivarColor(item.id)
      toast.success(`"${item.nombreColor}" reincorporado al inventario`)
    } catch (e: any) {
      toast.error('Error al reactivar: ' + e.message)
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => [item, ...prev])
      setDescatalogados(prev => [item, ...prev])
      if (selectedColorForDetails?.id === item.id) {
        setSelectedColorForDetails(item)
      }
    }
  }

  // Guardar gramos directamente desde la vista específica del filamento
  const handleGuardarGramosModal = async () => {
    if (!selectedColorForDetails || isSavingGramos) return
    const num = Math.max(0, parseInt(modalGramosInput || '0', 10))
    if (isNaN(num)) {
      toast.error('Ingresa una cantidad válida de gramos')
      return
    }

    setIsSavingGramos(true)

    const capacidad = Math.max(1000, Math.ceil(num / 1000) * 1000)
    const rollos = Math.max(1, Math.ceil(num / 1000))
    const alertaCritica = num < 300
    const nuevoEstado = num === 0 ? 'RESTOCK' : selectedColorForDetails.estado === 'DESCATALOGADO' ? 'DESCATALOGADO' : 'DISPONIBLE'

    const updatedItem: ColorFilamentoItem = {
      ...selectedColorForDetails,
      stockGramos: num,
      pesoInicialGramos: capacidad,
      rollos,
      alertaCritica,
      estado: nuevoEstado,
      nota: alertaCritica ? `⚠️ Solo ${num}g restantes` : selectedColorForDetails.nota
    }

    setSelectedColorForDetails(updatedItem)

    const updater = (prev: ColorFilamentoItem[]) =>
      prev.map(c => c.id === selectedColorForDetails.id ? updatedItem : c)

    if (nuevoEstado === 'RESTOCK' && selectedColorForDetails.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== selectedColorForDetails.id))
      setRestock(prev => [updatedItem, ...prev.filter(c => c.id !== selectedColorForDetails.id)])
    } else if (nuevoEstado === 'DISPONIBLE' && selectedColorForDetails.estado === 'RESTOCK') {
      setRestock(prev => prev.filter(c => c.id !== selectedColorForDetails.id))
      setDisponibles(prev => [updatedItem, ...prev.filter(c => c.id !== selectedColorForDetails.id)])
    } else {
      setDisponibles(updater)
      setRestock(updater)
      setDescatalogados(updater)
    }

    try {
      await actualizarGramosColor(selectedColorForDetails.id, num)
      toast.success(`Stock de "${selectedColorForDetails.nombreColor}" actualizado a ${num.toLocaleString()}g`)
      setSavedGramosSuccess(true)
      setTimeout(() => setSavedGramosSuccess(false), 2000)
    } catch (e: any) {
      toast.error('Error al actualizar gramos: ' + e.message)
    } finally {
      setIsSavingGramos(false)
    }
  }

  // =========================================================================
  // FUNCIONALIDAD COMERCIAL: COPIAR COLORES PARA CLIENTES
  // =========================================================================
  const handleCopiarColoresClientes = (tipo: 'todos_disponibles' | 'solo_neutros' = 'todos_disponibles') => {
    setShowCopyDropdown(false)

    const coloresDisponibles = disponibles.filter(c => (c.stockGramos ?? 1000) > 0)

    if (coloresDisponibles.length === 0) {
      toast.info('No hay colores disponibles con stock activo en este momento')
      return
    }

    let seleccionados = coloresDisponibles

    if (tipo === 'solo_neutros') {
      seleccionados = coloresDisponibles.filter(c => {
        const nombreLower = c.nombreColor.toLowerCase()
        return NEUTRAL_KEYWORDS.some(k => nombreLower.includes(k))
      })

      if (seleccionados.length === 0) {
        toast.info('No se encontraron tonos neutros con stock disponible')
        return
      }
    }

    const itemsText = seleccionados
      .sort((a, b) => a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' }))
      .map(c => `• ${c.nombreColor}`)
      .join('\n')

    const header = tipo === 'solo_neutros'
      ? '🎨 *Catálogo de Tonos Neutros Disponibles - NOVA 3D*'
      : '🎨 *Catálogo de Colores Disponibles - NOVA 3D*'

    const message = `${header}\n${itemsText}\n\n_Consulta por combinaciones multicolor o disponibilidad para piezas de gran volumen._`

    navigator.clipboard.writeText(message)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success(tipo === 'solo_neutros' ? 'Tonos neutros copiados al portapapeles' : 'Catálogo de colores disponible copiado')
  }

  // Delete color
  const handleEliminarColor = async (item: ColorFilamentoItem) => {
    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else if (item.estado === 'RESTOCK') {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    } else {
      setDescatalogados(prev => prev.filter(c => c.id !== item.id))
    }

    if (selectedColorForDetails?.id === item.id) {
      setOpenColorDetailsModal(false)
      setSelectedColorForDetails(null)
    }

    try {
      const res = await eliminarColor(item.id)
      if (res.softDeleted) {
        toast.success(`"${item.nombreColor}" archivado`)
      } else {
        toast.success(`"${item.nombreColor}" eliminado`)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
      if (item.estado === 'DISPONIBLE') {
        setDisponibles(prev => [item, ...prev])
      } else if (item.estado === 'RESTOCK') {
        setRestock(prev => [item, ...prev])
      } else {
        setDescatalogados(prev => [item, ...prev])
      }
    }
  }

  // Reset workshop list
  const handleReset = async () => {
    if (!confirm('¿Restablecer el inventario a la lista oficial del taller NOVA 3D?')) return
    try {
      const data = await resetColoresTaller()
      setDisponibles(data.disponibles)
      setRestock(data.restock)
      setDescatalogados(data.descatalogados || [])
      toast.success('Lista de colores restablecida con éxito')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  // Quick Add submit
  const handleAddColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return

    const gNum = nuevoEstado === 'DISPONIBLE' 
      ? Math.max(0, parseInt(nuevoGramos || '1000', 10)) 
      : 0
    const rollosNum = Math.max(1, Math.ceil((gNum || 1000) / 1000))

    try {
      const created = await agregarNuevoColor({
        nombreColor: nuevoNombre.trim(),
        codigoHex: nuevoHex,
        estado: nuevoEstado,
        rollos: rollosNum,
        stockGramos: gNum,
        nota: nuevaNota.trim() || undefined
      })

      if (nuevoEstado === 'DISPONIBLE') {
        setDisponibles(prev => [created, ...prev])
      } else {
        setRestock(prev => [created, ...prev])
      }

      toast.success(`"${created.nombreColor}" registrado en el taller`)
      setNuevoNombre('')
      setNuevaNota('')
      setNuevoGramos('1000')
      setNuevoHex('#18181B')
      setNuevoEstado('DISPONIBLE')
      setOpenAddModal(false)
    } catch (e: any) {
      toast.error('Error al registrar: ' + e.message)
    }
  }

  // Combined and Filtered Color List for the Grid Matrix
  const filteredGridItems = useMemo(() => {
    let combined: ColorFilamentoItem[] = []

    if (activeTab === 'todos') {
      combined = [...disponibles, ...restock]
    } else if (activeTab === 'disponibles') {
      combined = [...disponibles]
    } else if (activeTab === 'criticos') {
      combined = disponibles.filter(esColorCritico)
    } else if (activeTab === 'restock') {
      combined = [...restock]
    } else if (activeTab === 'descatalogados') {
      combined = [...descatalogados]
    }

    if (search.trim()) {
      const q = normalizeSearchText(search.trim())
      combined = combined.filter(c => {
        const nombre = normalizeSearchText(c.nombreColor || '')
        const nota = normalizeSearchText(c.nota || '')
        const hex = (c.codigoHex || '').toLowerCase()
        const gramos = (c.stockGramos ?? '').toString()
        const estado = (c.estado || '').toLowerCase()

        return (
          nombre.includes(q) ||
          nota.includes(q) ||
          hex.includes(q) ||
          gramos.includes(q) ||
          estado.includes(q)
        )
      })
    }

    // Orden alfabético estricto A-Z por nombre de color (fijo y estable al modificar gramos)
    return combined.sort((a, b) =>
      a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' })
    )
  }, [disponibles, restock, descatalogados, activeTab, search])

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(filteredGridItems.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE
    return filteredGridItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredGridItems, safeCurrentPage])

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200 px-1 sm:px-2 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y RESUMEN EJECUTIVO (KPIS INTERACTIVOS EN LIGHT MODE)         */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Fila Título + Sync Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 pb-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <Palette className="h-6 w-6 text-primary flex-shrink-0" />
                <span>Inventario de Filamentos</span>
              </h1>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Sincronizado en vivo</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control de bobinas, gramajes activos y alertas de reposición en tiempo real.
            </p>
          </div>
        </div>

        {/* Fila de 4 KPIs Interactivos (Click para filtrar) Minimalistas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* KPI 1: Kilos en Taller -> Activa 'todos' */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('disponibles')
              setCurrentPage(1)
            }}
            className={`p-3.5 rounded-xl border flex flex-col justify-between shadow-2xs transition-all text-left cursor-pointer min-h-[96px] ${
              activeTab === 'disponibles'
                ? 'bg-card border-emerald-600 ring-1 ring-emerald-600/40'
                : 'bg-card border-border hover:border-emerald-600/40'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total en Taller</span>
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Weight className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5 text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums whitespace-nowrap">
                <span>{(totalGramosActivos / 1000).toFixed(2)}</span>
                <span className="text-xs font-normal font-sans text-muted-foreground">kg</span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block truncate">
                {totalGramosActivos.toLocaleString()} g activos
              </span>
            </div>
          </button>

          {/* KPI 2: Colores Disponibles -> Activa 'disponibles' */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('disponibles')
              setCurrentPage(1)
            }}
            className={`p-3.5 rounded-xl border flex flex-col justify-between shadow-2xs transition-all text-left cursor-pointer min-h-[96px] ${
              activeTab === 'disponibles'
                ? 'bg-card border-primary ring-1 ring-primary/40'
                : 'bg-card border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Colores Disponibles</span>
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <Palette className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5 text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums whitespace-nowrap">
                <span>{disponibles.length}</span>
                <span className="text-xs font-normal font-sans text-muted-foreground">colores</span>
              </div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 block truncate">
                Stock activo para producción
              </span>
            </div>
          </button>

          {/* KPI 3: Stock Crítico (<300g) -> Activa 'criticos' */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('criticos')
              setCurrentPage(1)
            }}
            className={`p-3.5 rounded-xl border flex flex-col justify-between shadow-2xs transition-all text-left cursor-pointer min-h-[96px] ${
              activeTab === 'criticos'
                ? 'bg-card border-amber-600 ring-1 ring-amber-600/40'
                : 'bg-card border-border hover:border-amber-600/40'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Crítico (&lt;300g)</span>
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5 text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums whitespace-nowrap">
                <span>{totalCriticos.length}</span>
                <span className="text-xs font-normal font-sans text-muted-foreground">
                  {totalCriticos.length === 1 ? 'color' : 'colores'}
                </span>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5 block truncate">
                {totalCriticos.length > 0 ? 'Reponer pronto' : 'Nivel óptimo'}
              </span>
            </div>
          </button>

          {/* KPI 4: Para Restock -> Activa 'restock' */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('restock')
              setCurrentPage(1)
            }}
            className={`p-3.5 rounded-xl border flex flex-col justify-between shadow-2xs transition-all text-left cursor-pointer min-h-[96px] ${
              activeTab === 'restock'
                ? 'bg-card border-primary ring-1 ring-primary/40'
                : 'bg-card border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Para Restock</span>
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5 text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums whitespace-nowrap">
                <span>{restock.length}</span>
                <span className="text-xs font-normal font-sans text-muted-foreground">
                  {restock.length === 1 ? 'color' : 'colores'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium mt-0.5 block truncate">
                Marcados para compra
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE HERRAMIENTAS Y FILTROS DISTRIBUIDA                            */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/60 rounded-xl p-4 sm:p-5 shadow-none space-y-3.5">
        
        {/* Fila 1: Buscador + Grupo de Acciones Principales */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Buscador de Filamentos */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar color, acabado, código HEX o nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-background border-border/80 text-foreground placeholder:text-muted-foreground text-xs sm:text-sm rounded-lg h-9 focus-visible:ring-1 focus-visible:ring-ring transition-colors w-full"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer transition-colors"
                title="Borrar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grupo de Acciones (Copiar Catálogo + Nuevo Color) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">

            {/* Botón Copiar Catálogo para Clientes */}
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <div className="flex rounded-lg border border-border/80 overflow-hidden bg-background hover:bg-muted/40 transition-colors">
                <button
                  type="button"
                  onClick={() => handleCopiarColoresClientes('todos_disponibles')}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer active:scale-[0.98] transition-all flex-1"
                  title="Copiar lista de colores disponibles para WhatsApp o Instagram"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5] animate-in zoom-in-50 duration-150" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">Copiar Catálogo</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCopyDropdown(prev => !prev)}
                  className="px-2 py-1.5 border-l border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer flex items-center justify-center transition-colors"
                  title="Opciones de catálogo"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showCopyDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown de opciones */}
              {showCopyDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-card border border-border/80 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                    Opciones de Copiado
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopiarColoresClientes('todos_disponibles')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-muted/60 text-xs font-medium text-foreground transition-colors cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <div>Todos los disponibles ({disponibles.length})</div>
                      <div className="text-[10px] font-normal text-muted-foreground">Catálogo completo activo</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopiarColoresClientes('solo_neutros')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-muted/60 text-xs font-medium text-foreground transition-colors cursor-pointer"
                  >
                    <span className="h-3 w-3 rounded-full bg-gradient-to-tr from-zinc-800 via-zinc-400 to-zinc-100 ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                    <div>
                      <div>Solo tonos neutros</div>
                      <div className="text-[10px] font-normal text-muted-foreground">Blanco, Negro, Gris, Arena...</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCopyDropdown(false)
                      setImageTimestamp(Date.now())
                      setOpenImageModal(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-muted/60 text-xs font-medium text-primary transition-colors cursor-pointer border-t border-border/50 mt-1 pt-2"
                  >
                    <Download className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <div>Descargar Catálogo en Imagen (HD)</div>
                      <div className="text-[10px] font-normal text-muted-foreground">Con muestras visuales y códigos HEX</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Botón Descargar Catálogo en Imagen Publicitaria */}
            <Button
              type="button"
              onClick={() => {
                setImageTimestamp(Date.now())
                setOpenImageModal(true)
              }}
              variant="outline"
              className="border-border/80 bg-background hover:bg-muted/60 text-foreground font-medium text-xs h-9 px-3 rounded-lg shadow-none cursor-pointer transition-all flex items-center gap-1.5"
              title="Descargar imagen publicitaria con todos los colores disponibles y sus códigos HEX"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Descargar Imagen</span>
              <span className="sm:hidden">Imagen</span>
            </Button>

            {/* Botón Primario: Nuevo Color */}
            <Button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 px-3.5 rounded-lg shadow-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Nuevo Color</span>
            </Button>
          </div>
        </div>

        {/* Fila 2: Pestañas de Filtro por Estado (Pills con Conteo) + Resumen */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-border/60">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('disponibles')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'disponibles'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-none'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeTab === 'disponibles' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              <span>Disponibles</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                activeTab === 'disponibles' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
              }`}>
                {disponibles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('criticos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'criticos'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-none'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Críticos &lt;300g</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded font-medium ${
                activeTab === 'criticos' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'
              }`}>
                {totalCriticos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('restock')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'restock'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-none'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <ShoppingCart className="h-3 w-3" />
              <span>Para Restock</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                activeTab === 'restock' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-muted text-muted-foreground'
              }`}>
                {restock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('descatalogados')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'descatalogados'
                  ? 'bg-muted text-foreground border-border/80 shadow-none'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Archive className="h-3 w-3" />
              <span>Descatalogados</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                activeTab === 'descatalogados' ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {descatalogados.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'todos'
                  ? 'bg-foreground text-background border-foreground shadow-none'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                activeTab === 'todos' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
              }`}>
                {disponibles.length + restock.length}
              </span>
            </button>
          </div>

          {/* Botón Restablecer Filtros (Solo visible cuando hay búsqueda o filtro distinto a Disponibles) */}
          {(search || activeTab !== 'disponibles') && (
            <div className="flex items-center justify-end flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setActiveTab('disponibles')
                  setCurrentPage(1)
                }}
                title="Restablecer filtros a Disponibles"
                className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
                <span>Restablecer</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUALIZACIÓN DE INVENTARIO (TABLA O TARJETAS)                         */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredGridItems.length === 0 ? (
          <div className="p-10 text-center rounded-xl border border-dashed border-border/60 bg-card shadow-none space-y-3">
            <div className="h-10 w-10 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Search className="h-5 w-5 opacity-70" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {search 
                  ? `No se encontraron filamentos que coincidan con "${search}"` 
                  : 'No hay colores registrados en esta categoría.'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab !== 'todos' ? `Filtro activo: ${activeTab.toUpperCase()}` : 'Prueba ingresando otro término de búsqueda'}
              </p>
            </div>
            {(search || activeTab !== 'todos') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setActiveTab('todos')
                }}
                className="text-xs font-medium rounded-lg border-border/80 text-foreground hover:bg-muted cursor-pointer shadow-none"
              >
                <RefreshCw className="h-3 w-3 mr-1.5 text-muted-foreground" />
                Mostrar todos los filamentos
              </Button>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* TABLA DE INVENTARIO                                                      */
          /* ========================================================================= */
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-none">
            {/* Mobile / Tablet View (< lg): Filament Cards */}
            <div className="block lg:hidden divide-y divide-border/60">
              {paginatedItems.map((item, idx) => {
                const isDescatalogado = item.estado === 'DESCATALOGADO' || item.estado === 'ARCHIVADO' || item.activo === false
                const isDisp = item.estado === 'DISPONIBLE'
                const rollos = item.rollos || 1
                const pesoInicial = item.pesoInicialGramos || (rollos * 1000)
                const gramos = isDisp ? (item.stockGramos ?? pesoInicial) : (item.stockGramos || 0)
                const pct = isDisp ? Math.min(100, Math.round((gramos / pesoInicial) * 100)) : 0
                const esCritico = isDisp && (item.quiebreInminente || gramos < 300 || Boolean(item.alertaCritica))

                return (
                  <div 
                    key={item.id}
                    onClick={() => handleOpenColorDetails(item)}
                    className={`p-3.5 space-y-3 transition-colors cursor-pointer group ${
                      isDescatalogado 
                        ? 'bg-muted/20 opacity-80' 
                        : item.quiebreInminente
                        ? 'bg-rose-500/5 hover:bg-rose-500/10'
                        : esCritico
                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Top: Swatch, Name, Notes & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="relative h-7 w-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-none"
                          style={{ backgroundColor: item.codigoHex }}
                        />

                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                            {item.nombreColor}
                          </span>
                          {item.nota && item.estado !== 'RESTOCK' && item.nota !== 'Por terminar / En reposición' && (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 inline-block truncate max-w-[220px] mt-0.5">
                              {item.nota}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isDescatalogado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-muted/60 text-muted-foreground border-border/50 uppercase tracking-wider">
                            <Archive className="h-2.5 w-2.5 text-muted-foreground" />
                            {item.estado === 'ARCHIVADO' ? 'Archivado' : 'Descatalogado'}
                          </span>
                        ) : item.quiebreInminente ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 uppercase tracking-wider">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Quiebre
                          </span>
                        ) : esCritico ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase tracking-wider">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Crítico
                          </span>
                        ) : isDisp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 uppercase tracking-wider">
                            <ShoppingCart className="h-2.5 w-2.5" />
                            Restock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Grams & Progress */}
                    {isDisp ? (
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground font-mono tabular-nums tracking-tight">
                            {gramos.toLocaleString()}g <span className="text-[11px] font-normal text-muted-foreground font-sans">({pct}% de {pesoInicial}g)</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            {rollos > 1 ? `${rollos} bobinas` : '1 bobina'}
                          </span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.quiebreInminente ? 'bg-rose-500' : esCritico ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(gramos > 0 ? 5 : 0, pct))}%` }}
                          />
                        </div>

                        {/* Semáforo Predictivo de Quiebre Comprometido */}
                        {(item.gramosComprometidos || 0) > 0 && (
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            {item.quiebreInminente ? (
                              <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                <AlertTriangle className="h-3 w-3" />
                                Quiebre inminente: faltan {Math.abs(item.gramosLibres || 0)}g en cola
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px] font-mono tabular-nums">
                                Comprometido: <strong className="text-foreground">{item.gramosComprometidos}g</strong> • Libres: <strong className="text-emerald-600 dark:text-emerald-400">{item.gramosLibres}g</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground font-medium flex items-center justify-between">
                        <span>{isDescatalogado ? 'Color fuera de taller o catálogo' : '0 g en taller (En reposición)'}</span>
                        <span className="text-[10px] text-muted-foreground">Toca para ajustar stock</span>
                      </div>
                    )}

                    {/* Production info + Tap Hint */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground font-mono tabular-nums">
                          {item.totalProductosImpresos || 0} piezas
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                          ({(item.totalGramosConsumidos || 0).toLocaleString()}g)
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isDescatalogado ? (
                          <button
                            type="button"
                            onClick={() => handleReactivarColor(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded-md cursor-pointer transition-colors"
                            title="Reactivar filamento"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reactivar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setColorToArchiveOrDescatalog(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border/60 px-2 py-1 rounded-md cursor-pointer transition-colors"
                            title="Archivar o descatalogar filamento"
                          >
                            <Archive className="h-3 w-3" />
                            <span>Archivar</span>
                          </button>
                        )}

                        <span 
                          onClick={() => handleOpenColorDetails(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          Ficha
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View (>= lg): Full Table table-fixed */}
            <div className="hidden lg:block w-full">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-muted/20 border-b border-border/60">
                  <TableRow className="hover:bg-transparent border-b border-border/60 text-[11px] font-medium text-muted-foreground tracking-wider uppercase select-none">
                    <TableHead className="w-10 px-2 py-3 text-center text-muted-foreground">#</TableHead>
                    <TableHead className="px-4 py-3 text-left text-muted-foreground">Color / Filamento</TableHead>
                    <TableHead className="w-28 px-3 py-3 text-center text-muted-foreground">Estado</TableHead>
                    <TableHead className="w-48 px-4 py-3 text-left text-muted-foreground">Stock en Taller</TableHead>
                    <TableHead className="w-32 px-4 py-3 text-left text-muted-foreground">Producción</TableHead>
                    <TableHead className="w-48 px-3 py-3 text-right pr-4 text-muted-foreground">Gestionar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item, idx) => {
                    const globalIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE + idx + 1
                    const isDescatalogado = item.estado === 'DESCATALOGADO' || item.estado === 'ARCHIVADO' || item.activo === false
                    const isDisp = item.estado === 'DISPONIBLE'
                    const rollos = item.rollos || 1
                    const pesoInicial = item.pesoInicialGramos || (rollos * 1000)
                    const gramos = isDisp ? (item.stockGramos ?? pesoInicial) : (item.stockGramos || 0)
                    const pct = isDisp ? Math.min(100, Math.round((gramos / pesoInicial) * 100)) : 0
                    const esCritico = isDisp && (gramos < 300 || Boolean(item.alertaCritica))

                    return (
                      <TableRow 
                        key={item.id}
                        onClick={() => handleOpenColorDetails(item)}
                        className={`border-b border-border/40 hover:bg-muted/30 transition-colors text-xs cursor-pointer group ${
                          isDescatalogado 
                            ? 'bg-muted/15 opacity-80' 
                            : esCritico
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : ''
                        }`}
                      >
                        {/* 1. Rank # */}
                        <TableCell className="px-2 py-3 text-center font-mono text-xs text-muted-foreground tabular-nums">
                          {globalIdx}
                        </TableCell>

                        {/* 2. Swatch & Color Name */}
                        <TableCell className="px-4 py-3 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="relative h-6 w-6 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 shadow-none"
                              style={{ backgroundColor: item.codigoHex }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-xs text-foreground truncate block group-hover:text-primary transition-colors">
                                {item.nombreColor}
                              </span>
                              {item.nota && item.estado !== 'RESTOCK' && item.nota !== 'Por terminar / En reposición' && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 inline-block truncate max-w-full mt-0.5">
                                  {item.nota}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 3. Estado */}
                        <TableCell className="px-3 py-3 text-center">
                          {isDescatalogado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-muted/60 text-muted-foreground border-border/50 uppercase tracking-wider">
                              <Archive className="h-2.5 w-2.5 text-muted-foreground" />
                              {item.estado === 'ARCHIVADO' ? 'Archivado' : 'Descatalogado'}
                            </span>
                          ) : item.quiebreInminente ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 uppercase tracking-wider">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Quiebre
                            </span>
                          ) : esCritico ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase tracking-wider">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Crítico
                            </span>
                          ) : isDisp ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-wider">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Disponible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 uppercase tracking-wider">
                              <ShoppingCart className="h-2.5 w-2.5" />
                              Restock
                            </span>
                          )}
                        </TableCell>

                        {/* 4. Stock en Taller */}
                        <TableCell className="px-4 py-3 min-w-0">
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className={`font-mono font-semibold text-xs tracking-tight tabular-nums ${
                                isDescatalogado ? 'text-muted-foreground' : !isDisp || gramos === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                              }`}>
                                {gramos.toLocaleString()} g
                              </span>
                              <span className="text-muted-foreground text-[10px] font-mono tabular-nums">
                                ({(gramos / 1000).toFixed(2)} kg)
                              </span>
                            </div>
                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isDescatalogado
                                    ? 'bg-muted-foreground/30'
                                    : !isDisp || gramos === 0
                                    ? 'bg-amber-500'
                                    : item.quiebreInminente
                                    ? 'bg-rose-500'
                                    : esCritico 
                                    ? 'bg-rose-500' 
                                    : gramos < 300 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(gramos > 0 ? 4 : 0, (gramos / 1000) * 100))}%` }}
                              />
                            </div>
                            {(item.gramosComprometidos || 0) > 0 && (
                              <div className="pt-0.5">
                                {item.quiebreInminente ? (
                                  <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                    Faltan {Math.abs(item.gramosLibres || 0)}g
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                                    {item.gramosComprometidos}g comp. • <strong className="text-emerald-600 dark:text-emerald-400">{item.gramosLibres}g disp.</strong>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* 5. Producción */}
                        <TableCell className="px-4 py-3 min-w-0">
                          <span className="font-semibold text-xs text-foreground font-mono tabular-nums block truncate">
                            {item.totalProductosImpresos || 0} pzas
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono tabular-nums block truncate">
                            {(item.totalGramosConsumidos || 0).toLocaleString()}g consumidos
                          </span>
                        </TableCell>

                        {/* 6. Gestionar */}
                        <TableCell className="px-3 py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenColorDetails(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 hover:underline transition-colors py-1 px-1.5 rounded-md cursor-pointer"
                              title="Ver ficha completa"
                            >
                              <span>Ver ficha</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>

                            {isDescatalogado ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivarColor(item)}
                                className="h-7 px-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 rounded-md cursor-pointer flex items-center gap-1 shadow-none"
                                title="Reactivar filamento en taller"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span className="hidden xl:inline">Reactivar</span>
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setColorToArchiveOrDescatalog(item)}
                                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border-border/60 rounded-md cursor-pointer flex items-center gap-1 shadow-none"
                                title="Archivar o descatalogar filamento"
                              >
                                <Archive className="h-3 w-3" />
                                <span className="hidden xl:inline">Archivar</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Paginación de Filamentos (8 por página) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-t border-border/60">
              <div className="text-xs text-muted-foreground font-medium text-center sm:text-left">
                Mostrando <span className="font-semibold text-foreground font-mono tabular-nums">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{' '}
                <span className="font-semibold text-foreground font-mono tabular-nums">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredGridItems.length)}</span> de{' '}
                <span className="font-semibold text-foreground font-mono tabular-nums">{filteredGridItems.length}</span> filamentos{' '}
                <span className="text-[11px] text-muted-foreground font-mono">(A-Z)</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-7 px-2.5 text-xs font-medium rounded-lg border-border/80 text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer shadow-none"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-7 min-w-[28px] px-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                          pageNum === safeCurrentPage
                            ? 'bg-foreground text-background shadow-none'
                            : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="h-7 px-2.5 text-xs font-medium rounded-lg border-border/80 text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer shadow-none"
                  >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: REGISTRAR NUEVO FILAMENTO                                       */}
      {/* ========================================================================= */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent showCloseButton={false} className="bg-card text-foreground border border-border/80 w-[95vw] sm:max-w-[540px] max-h-[90dvh] overflow-hidden p-0 rounded-2xl shadow-xl z-50 flex flex-col">
          <form onSubmit={handleAddColorSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  Registrar Nuevo Filamento
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Agrega un nuevo filamento al inventario del taller
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* 1 & 2. HEADER Y PREVIEW EN VIVO + INPUT DE NOMBRE */}
              <div className="flex items-center gap-3.5">
                <div 
                  className="w-10 h-10 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0 shadow-none transition-colors duration-200"
                  style={{ backgroundColor: nuevoHex }}
                  title={`Color seleccionado: ${nuevoHex}`}
                />
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-medium text-foreground/90 uppercase tracking-wider block">
                    Nombre del Filamento / Color *
                  </Label>
                  <Input 
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Negro Carbón, Terracota Seda..."
                    required
                    autoFocus
                    className="bg-background border-border/80 rounded-lg text-sm font-medium text-foreground h-9 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* 3. SELECTOR DE COLOR COMPACTO */}
              <div className="space-y-3 p-3.5 rounded-xl bg-muted/25 border border-border/50">
                {/* Fila superior: Input HEX editable + Input tipo color con icono de paleta */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Tono / Color (HEX)
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <input 
                        type="color"
                        id="nuevo-color-picker"
                        value={nuevoHex}
                        onChange={(e) => setNuevoHex(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <label 
                        htmlFor="nuevo-color-picker"
                        className="h-8 px-2.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors shadow-none"
                        title="Abrir selector de color libre"
                      >
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Paleta</span>
                      </label>
                    </div>
                    <Input 
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="w-24 h-8 text-xs font-mono font-medium bg-background border-border/60 p-1 text-center rounded-lg uppercase focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                      placeholder="#18181B"
                    />
                  </div>
                </div>

                {/* Fila inferior: Grilla limpia con los colores estándar en 3D */}
                <div className="grid grid-cols-8 gap-2 pt-0.5">
                  {STANDARD_3D_COLORS.map(sw => {
                    const isSelected = nuevoHex.toLowerCase() === sw.hex.toLowerCase()
                    return (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer mx-auto flex items-center justify-center ${
                          isSelected 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : ''
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white drop-shadow-sm stroke-[3]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. SECCIÓN DE STOCK Y ESTADO (Grid de 2 columnas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Columna Izquierda: Stock */}
                <div className="space-y-2 p-3.5 rounded-xl bg-muted/25 border border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground/90 uppercase tracking-wider">
                      Stock Inicial
                    </Label>
                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                      ~{(Math.max(0, parseInt(nuevoGramos || '0', 10)) / 1000).toFixed(1)} bobina{parseInt(nuevoGramos || '0', 10) === 1000 ? '' : 's'}
                    </span>
                  </div>

                  {/* Input numérico */}
                  <div className="relative">
                    <Input 
                      type="number"
                      min="0"
                      step="50"
                      value={nuevoGramos}
                      onChange={(e) => {
                        const val = e.target.value
                        setNuevoGramos(val)
                        const num = parseInt(val, 10)
                        if (num === 0) {
                          setNuevoEstado('RESTOCK')
                        } else if (num > 0 && nuevoEstado === 'RESTOCK' && nuevoGramos === '0') {
                          setNuevoEstado('DISPONIBLE')
                        }
                      }}
                      placeholder="1000"
                      required
                      className="bg-background border-border/80 rounded-lg text-sm font-mono font-medium h-9 pr-7 text-foreground tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                      g
                    </span>
                  </div>

                  {/* Pills de atajos rápidos debajo */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNuevoGramos('1000')
                        setNuevoEstado('DISPONIBLE')
                      }}
                      className={`py-1 px-2 text-[11px] font-mono tabular-nums font-medium rounded-md border transition-all cursor-pointer text-center ${
                        nuevoGramos === '1000'
                          ? 'bg-foreground text-background border-foreground shadow-none'
                          : 'bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      1 Bobina (1kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevoGramos('500')
                        setNuevoEstado('DISPONIBLE')
                      }}
                      className={`py-1 px-2 text-[11px] font-mono tabular-nums font-medium rounded-md border transition-all cursor-pointer text-center ${
                        nuevoGramos === '500'
                          ? 'bg-foreground text-background border-foreground shadow-none'
                          : 'bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      500g
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevoGramos('250')
                        setNuevoEstado('DISPONIBLE')
                      }}
                      className={`py-1 px-2 text-[11px] font-mono tabular-nums font-medium rounded-md border transition-all cursor-pointer text-center ${
                        nuevoGramos === '250'
                          ? 'bg-foreground text-background border-foreground shadow-none'
                          : 'bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      250g
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevoGramos('0')
                        setNuevoEstado('RESTOCK')
                      }}
                      className={`py-1 px-2 text-[11px] font-mono tabular-nums font-medium rounded-md border transition-all cursor-pointer text-center ${
                        nuevoGramos === '0'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-background text-muted-foreground border-border/60 hover:text-rose-600 hover:bg-rose-500/10'
                      }`}
                    >
                      0g (Sin stock)
                    </button>
                  </div>
                </div>

                {/* Columna Derecha: Estado */}
                <div className="space-y-2 p-3.5 rounded-xl bg-muted/25 border border-border/50 flex flex-col justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground/90 uppercase tracking-wider block mb-2">
                      Estado Inicial
                    </Label>
                    
                    {/* Toggle o selector tipo pill */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setNuevoEstado('DISPONIBLE')
                          if (nuevoGramos === '0') setNuevoGramos('1000')
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                          nuevoEstado === 'DISPONIBLE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-none'
                            : 'bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>En Taller (Disponible)</span>
                        </span>
                        {nuevoEstado === 'DISPONIBLE' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setNuevoEstado('RESTOCK')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                          nuevoEstado === 'RESTOCK'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-none'
                            : 'bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span>Para Compra (Restock)</span>
                        </span>
                        {nuevoEstado === 'RESTOCK' && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>

                  {/* Nota opcional si está en restock */}
                  {nuevoEstado === 'RESTOCK' && (
                    <div className="pt-1 space-y-1">
                      <Input 
                        value={nuevaNota}
                        onChange={(e) => setNuevaNota(e.target.value)}
                        placeholder="Nota de reposición (opcional)..."
                        className="bg-background border-border/80 rounded-lg text-xs h-8 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenAddModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-3 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!nuevoNombre.trim()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium text-xs px-4 h-8 rounded-lg cursor-pointer shadow-none transition-all"
              >
                Registrar Filamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. MODAL: EDITAR COLOR (Extraído como subcomponente)                       */}
      {/* ========================================================================= */}
      <EditFilamentModal
        open={openEditModal}
        onClose={() => {
          setOpenEditModal(false)
          if (returnToDetailsAfterEdit) {
            setOpenColorDetailsModal(true)
            setReturnToDetailsAfterEdit(false)
          }
        }}
        onSubmit={handleEditColorSubmit}
        nombre={editNombre}
        setNombre={setEditNombre}
        hex={editHex}
        setHex={setEditHex}
        nota={editNota}
        setNota={setEditNota}
        swatches={ALL_SWATCHES.slice(0, 18)}
      />

      {/* ========================================================================= */}
      {/* 5.1 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE FILAMENTO                     */}
      {/* ========================================================================= */}
      <Dialog open={!!colorToDelete} onOpenChange={(open) => !open && setColorToDelete(null)}>
        <DialogContent className="bg-card text-foreground border border-border/80 w-[92vw] sm:max-w-md p-6 rounded-2xl shadow-xl z-50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  ¿Eliminar filamento?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Esta acción no se puede deshacer.
                </DialogDescription>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el filamento{' '}
              <strong className="text-foreground font-semibold">{colorToDelete?.nombreColor}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeletingColor}
                onClick={() => setColorToDelete(null)}
                className="rounded-lg text-xs font-medium h-8 px-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeletingColor}
                onClick={async () => {
                  if (!colorToDelete) return
                  const item = colorToDelete
                  setIsDeletingColor(true)
                  try {
                    await handleEliminarColor(item)
                    setColorToDelete(null)
                  } finally {
                    setIsDeletingColor(false)
                  }
                }}
                className="rounded-lg text-xs font-medium h-8 px-3.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-none"
              >
                {isDeletingColor ? 'Eliminando...' : 'Eliminar Filamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5.2 MODAL DE CONFIRMACIÓN PARA ARCHIVAR O DESCATALOGAR                    */}
      {/* ========================================================================= */}
      <Dialog open={!!colorToArchiveOrDescatalog} onOpenChange={(open) => !open && setColorToArchiveOrDescatalog(null)}>
        <DialogContent className="bg-card text-foreground border border-border/80 w-[92vw] sm:max-w-md p-6 rounded-2xl shadow-xl z-50">
          {colorToArchiveOrDescatalog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0 shadow-none flex items-center justify-center"
                  style={{ backgroundColor: colorToArchiveOrDescatalog.codigoHex }}
                />
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
                    {colorToArchiveOrDescatalog.nombreColor}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Gestionar disponibilidad en taller y catálogo
                  </DialogDescription>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  El filamento dejará de verse en los disponibles
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed text-muted-foreground">
                  Todo el historial de pedidos y modelos fabricados se mantendrá seguro. Podrás reactivarlo en cualquier momento.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isProcessingArchive}
                  onClick={async () => {
                    const item = colorToArchiveOrDescatalog
                    setIsProcessingArchive(true)
                    try {
                      setColorToArchiveOrDescatalog(null)
                      await handleArchivarColor(item)
                    } finally {
                      setIsProcessingArchive(false)
                    }
                  }}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 text-left transition-all cursor-pointer group flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground shrink-0 transition-colors">
                    <Archive className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground">📦 Archivar filamento</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Oculta la bobina del taller activo. Ideal si se agotó temporalmente o no se está usando.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isProcessingArchive}
                  onClick={async () => {
                    const item = colorToArchiveOrDescatalog
                    setIsProcessingArchive(true)
                    try {
                      setColorToArchiveOrDescatalog(null)
                      await handleDescatalogarColor(item)
                    } finally {
                      setIsProcessingArchive(false)
                    }
                  }}
                  className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-all cursor-pointer group flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                    <Archive className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-rose-600 dark:text-rose-400">🚫 Descatalogar color</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Baja comercial del catálogo. Ya no se ofrecerá a clientes ni aparecerá para reposición.
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setColorToArchiveOrDescatalog(null)}
                  className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5.3 MODAL DE DESCARGA Y PREVIEW DE CATÁLOGO EN IMAGEN (Extraído)           */}
      {/* ========================================================================= */}
      <FilamentFlyerModal
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        imageTheme={imageTheme}
        setImageTheme={setImageTheme}
        imageTimestamp={imageTimestamp}
        setImageTimestamp={setImageTimestamp}
        disponiblesCount={disponibles.length}
        isCopyingImage={isCopyingImage}
        isDownloadingImage={isDownloadingImage}
        onCopyImage={handleCopyFlyerImage}
        onDownloadFlyer={handleDownloadFlyer}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: FICHA DE FILAMENTO                                              */}
      {/* ========================================================================= */}
      <Dialog open={openColorDetailsModal} onOpenChange={setOpenColorDetailsModal}>
        <DialogContent showCloseButton={false} className="bg-card text-foreground border border-border/80 w-[95vw] sm:max-w-[620px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-xl rounded-2xl z-50">
          {selectedColorForDetails && (() => {
            const isDescatalogado = selectedColorForDetails.estado === 'DESCATALOGADO'
            const isDisp = selectedColorForDetails.estado === 'DISPONIBLE'
            const rollos = selectedColorForDetails.rollos || 1
            const pesoInicial = selectedColorForDetails.pesoInicialGramos || (rollos * 1000)
            const inputNum = Math.max(0, parseInt(modalGramosInput || '0', 10))

            // Capacidad dinámica de la barra: ajusta dinámicamente si supera 1,000g
            const baseCapacidad = Math.max(1000, pesoInicial)
            const dynamicCapacidad = inputNum > baseCapacidad 
              ? Math.ceil(inputNum / 1000) * 1000 
              : baseCapacidad
            const pct = Math.min(100, Math.round((inputNum / dynamicCapacidad) * 100))
            const esCritico = inputNum > 0 && inputNum < 300

            // Métricas de pedidos para producción
            const allPedidos = selectedColorForDetails.productosInvertidos?.flatMap(p => p.ultimosPedidos || []) || []
            const pedidosActivos = allPedidos.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PRODUCCION').length

            return (
              <div className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
                {/* 1. HEADER UNIFICADO (Con Swatch y Acciones Rápidas) */}
                <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  {/* Lado izquierdo */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0 shadow-none"
                      style={{ backgroundColor: selectedColorForDetails.codigoHex }}
                    />
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-lg font-semibold tracking-tight text-foreground truncate leading-tight">
                        {selectedColorForDetails.nombreColor}
                      </DialogTitle>
                      
                      {/* Fila de badges: Estado, Stock y Código HEX con botón de copiar */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {/* Estado */}
                        <Badge 
                          variant="outline" 
                          className={
                            isDescatalogado
                              ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-muted/60 text-muted-foreground border-border/50'
                              : isDisp
                              ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          }
                        >
                          {isDescatalogado 
                            ? 'Descatalogado' 
                            : isDisp 
                            ? 'En Taller' 
                            : 'En Restock'}
                        </Badge>

                        {/* Stock */}
                        <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 text-foreground">
                          {rollos} {rollos === 1 ? 'bobina' : 'bobinas'}
                        </span>

                        {/* Código HEX con botón de copiar */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedColorForDetails.codigoHex)
                            setCopiedHex(true)
                            toast.success(`HEX ${selectedColorForDetails.codigoHex} copiado`)
                            setTimeout(() => setCopiedHex(false), 2000)
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 hover:bg-muted active:scale-95 text-foreground text-[11px] font-mono transition-all cursor-pointer"
                          title="Copiar código HEX"
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0" 
                            style={{ backgroundColor: selectedColorForDetails.codigoHex }} 
                          />
                          <span>{selectedColorForDetails.codigoHex}</span>
                          {copiedHex ? (
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lado derecho: Fila de acciones compactas */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Botón secundario [ ✏️ Editar ] */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReturnToDetailsAfterEdit(true)
                        setOpenColorDetailsModal(false)
                        handleOpenEditColor(selectedColorForDetails)
                      }}
                      className="h-8 px-2.5 text-xs font-medium rounded-lg border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer shadow-none gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Editar</span>
                    </Button>

                    {/* Botón [ 📦 Archivar / Descatalogar ] o [ 🔄 Reactivar ] */}
                    {isDescatalogado ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivarColor(selectedColorForDetails)}
                        className="h-8 px-2.5 text-xs font-medium rounded-lg border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer shadow-none gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reactivar</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setColorToArchiveOrDescatalog(selectedColorForDetails)}
                        className="h-8 px-2.5 text-xs font-medium rounded-lg border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shadow-none gap-1.5"
                        title="Archivar o descatalogar este filamento"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Archivar</span>
                      </Button>
                    )}

                    {/* Botón secundario [ 🛒 Restock ] / Estado */}
                    {!isDescatalogado && (
                      isDisp ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoverARestock(selectedColorForDetails)}
                          className="h-8 px-2.5 text-xs font-medium rounded-lg border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer shadow-none gap-1.5"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>Restock</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoverADisponible(selectedColorForDetails)}
                          className="h-8 px-2.5 text-xs font-medium rounded-lg border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer shadow-none gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Disponible</span>
                        </Button>
                      )
                    )}

                    {/* Botón icon/ghost [ 🗑️ ] con hover rojo para eliminar */}
                    <button
                      type="button"
                      onClick={() => setColorToDelete(selectedColorForDetails)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Eliminar filamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Botón icon [ ✕ ] para cerrar */}
                    <button
                      type="button"
                      onClick={() => setOpenColorDetailsModal(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Cerrar ficha"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body con scroll natural */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* 2. SECCIÓN DE AJUSTE DE STOCK */}
                  <div className="p-4 sm:p-5 rounded-xl bg-muted/25 border border-border/50 space-y-3.5">
                    {/* Visualización */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold text-foreground font-mono tabular-nums tracking-tight">
                          {inputNum.toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground font-mono">g</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground font-mono tabular-nums">
                          {pct}% ({dynamicCapacidad.toLocaleString()}g)
                        </span>
                        <Badge 
                          variant="outline"
                          className={
                            inputNum <= 0
                              ? 'bg-muted/60 text-muted-foreground border-border/50 text-[10px] font-medium px-2 py-0.5 rounded-md'
                              : esCritico
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-medium px-2 py-0.5 rounded-md'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-medium px-2 py-0.5 rounded-md'
                          }
                        >
                          {inputNum <= 0 ? 'Agotado' : esCritico ? 'Crítico' : 'Normal'}
                        </Badge>
                      </div>
                    </div>

                    {/* Barra de progreso ultrafina (h-1.5) */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          inputNum <= 0 
                            ? 'bg-muted-foreground/30'
                            : esCritico 
                            ? 'bg-rose-500' 
                            : pct < 50 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, Math.max(inputNum > 0 ? 3 : 0, pct))}%` 
                        }}
                      />
                    </div>

                    {/* Fila de ajuste rápido: Stepper + Pills + Botón Actualizar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Stepper central */}
                        <div className="inline-flex items-center rounded-lg overflow-hidden border border-border/80 bg-background">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(modalGramosInput || '0', 10)
                              setModalGramosInput(Math.max(0, curr - 100).toString())
                            }}
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer font-medium text-sm"
                            title="Restar 100g"
                          >
                            -
                          </button>
                          <div className="relative w-24 border-x border-border/60">
                            <Input 
                              type="number"
                              min="0"
                              step="50"
                              value={modalGramosInput}
                              onChange={(e) => setModalGramosInput(e.target.value)}
                              className="bg-transparent border-0 text-center font-mono font-medium text-xs h-8 pr-4 rounded-none focus-visible:ring-0 shadow-none text-foreground tabular-nums"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground pointer-events-none">
                              g
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(modalGramosInput || '0', 10)
                              setModalGramosInput((curr + 100).toString())
                            }}
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer font-medium text-sm"
                            title="Sumar 100g"
                          >
                            +
                          </button>
                        </div>

                        {/* Atajos más usados como pills sutiles */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(modalGramosInput || '0', 10)
                              setModalGramosInput((curr + 100).toString())
                            }}
                            className="h-8 px-2.5 text-xs font-mono font-medium rounded-lg bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-none tabular-nums"
                          >
                            +100g
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(modalGramosInput || '0', 10)
                              setModalGramosInput((curr + 1000).toString())
                            }}
                            className="h-8 px-2.5 text-xs font-mono font-medium rounded-lg bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-none tabular-nums"
                          >
                            +1 Bobina (1kg)
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalGramosInput('0')}
                            className="h-8 px-2.5 text-xs font-mono font-medium rounded-lg bg-background border border-border/60 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer shadow-none tabular-nums"
                          >
                            0g (Agotado)
                          </button>
                        </div>
                      </div>

                      {/* Botón de confirmación compacto */}
                      <Button
                        type="button"
                        onClick={handleGuardarGramosModal}
                        disabled={isSavingGramos}
                        className="h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg cursor-pointer shadow-none inline-flex items-center gap-1.5 transition-all shrink-0 self-end sm:self-auto"
                      >
                        {isSavingGramos ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : savedGramosSuccess ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>¡Actualizado!</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Actualizar Stock</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 3. MÉTRICAS DE PRODUCCIÓN Y MODELOS */}
                  <div className="space-y-4">
                    {/* Fila de 3 KPIs minimalistas */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-center">
                        <span className="text-xl sm:text-2xl font-semibold text-foreground font-mono tabular-nums block tracking-tight">
                          {selectedColorForDetails.totalProductosImpresos || 0}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                          Piezas Fabricadas
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-center">
                        <span className="text-xl sm:text-2xl font-semibold text-primary font-mono tabular-nums block tracking-tight">
                          {(selectedColorForDetails.totalGramosConsumidos || 0).toLocaleString()}g
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                          Filamento Consumido
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-center">
                        <span className="text-xl sm:text-2xl font-semibold text-foreground font-mono tabular-nums block tracking-tight">
                          {pedidosActivos}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                          Pedidos Activos
                        </span>
                      </div>
                    </div>

                    {/* Sección "Modelos con este color" */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Modelos con este color
                        </span>
                        {selectedColorForDetails.productosInvertidos && selectedColorForDetails.productosInvertidos.length > 0 && (
                          <span className="text-[11px] font-medium text-muted-foreground font-mono tabular-nums">
                            {selectedColorForDetails.productosInvertidos.length} {selectedColorForDetails.productosInvertidos.length === 1 ? 'modelo' : 'modelos'}
                          </span>
                        )}
                      </div>

                      {(!selectedColorForDetails.productosInvertidos || selectedColorForDetails.productosInvertidos.length === 0) ? (
                        <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-muted/20 border border-border/50 text-muted-foreground text-xs">
                          <Package className="h-3.5 w-3.5 shrink-0" />
                          <span>Aún no se han producido modelos con este color</span>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                          {selectedColorForDetails.productosInvertidos.map((prod) => {
                            const ultPedido = prod.ultimosPedidos?.[0]
                            const fechaFormateada = ultPedido?.fecha 
                              ? new Date(ultPedido.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                              : null

                            return (
                              <div 
                                key={prod.productoId}
                                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-muted/30 transition-colors text-xs"
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <span className="font-medium text-foreground truncate">
                                    {prod.nombreModelo}
                                  </span>
                                  {fechaFormateada && (
                                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                                      • {fechaFormateada}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums">
                                  <span className="text-muted-foreground text-[11px]">
                                    {prod.totalUnidades} {prod.totalUnidades === 1 ? 'ud' : 'uds'}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {prod.totalGramos.toLocaleString()}g
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Alias de retrocompatibilidad
export const InventarioClient = InventarioFilamentosClient
