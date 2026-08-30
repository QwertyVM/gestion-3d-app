'use client'

import { useState, useMemo, useTransition } from 'react'
import { 
  Plus, 
  Search, 
  X, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Palette, 
  CheckCircle2, 
  ShoppingCart, 
  AlertTriangle,
  Sparkles,
  Trash2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  ColorFilamentoItem, 
  moverEstadoColor, 
  agregarNuevoColor, 
  eliminarColor, 
  resetColoresTaller 
} from '@/actions/inventario'

interface InventarioClientProps {
  disponibles: ColorFilamentoItem[]
  restock: ColorFilamentoItem[]
}

const PRESET_SWATCHES = [
  { name: 'Negro carbón', hex: '#18181B' },
  { name: 'Blanco hueso', hex: '#F5F5F0' },
  { name: 'Blanco marfil', hex: '#FFFBEB' },
  { name: 'Gris ceniza', hex: '#94A3B8' },
  { name: 'Lila púrpura', hex: '#C084FC' },
  { name: 'Rojo escarlata', hex: '#DC2626' },
  { name: 'Rojo oscuro', hex: '#7F1D1D' },
  { name: 'Azul oscuro', hex: '#1E3A8A' },
  { name: 'Verde grass', hex: '#22C55E' },
  { name: 'Verde manzana', hex: '#65A30D' },
  { name: 'Verde oscuro', hex: '#14532D' },
  { name: 'Naranja mandarina', hex: '#F97316' },
  { name: 'Marrón latte', hex: '#854D0E' },
  { name: 'Marrón oscuro', hex: '#3E2723' },
  { name: 'Chocolate oscuro', hex: '#451A03' },
  { name: 'Terracota', hex: '#A36F4C' },
  { name: 'Arena', hex: '#D4B996' },
  { name: 'Rosa Sakura', hex: '#F472B6' },
  { name: 'Ciruela', hex: '#581C87' },
]

export function InventarioClient({ 
  disponibles: initialDisponibles, 
  restock: initialRestock 
}: InventarioClientProps) {
  const [disponibles, setDisponibles] = useState<ColorFilamentoItem[]>(initialDisponibles)
  const [restock, setRestock] = useState<ColorFilamentoItem[]>(initialRestock)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // Quick Add State
  const [openAddModal, setOpenAddModal] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHex, setNuevoHex] = useState('#18181B')
  const [nuevoEstado, setNuevoEstado] = useState<'DISPONIBLE' | 'RESTOCK'>('DISPONIBLE')
  const [nuevaNota, setNuevaNota] = useState('')

  // Filtered lists
  const filteredDisponibles = useMemo(() => {
    if (!search.trim()) return disponibles
    return disponibles.filter(c => c.nombreColor.toLowerCase().includes(search.toLowerCase()))
  }, [disponibles, search])

  const filteredRestock = useMemo(() => {
    if (!search.trim()) return restock
    return restock.filter(c => 
      c.nombreColor.toLowerCase().includes(search.toLowerCase()) ||
      (c.nota && c.nota.toLowerCase().includes(search.toLowerCase()))
    )
  }, [restock, search])

  // Move from Disponible -> Restock
  const handleMoverARestock = async (item: ColorFilamentoItem) => {
    // Optimistic UI
    setDisponibles(prev => prev.filter(c => c.id !== item.id))
    setRestock(prev => [{ ...item, estado: 'RESTOCK' }, ...prev])

    try {
      await moverEstadoColor(item.id, 'RESTOCK')
      toast.info(`"${item.nombreColor}" movido a Restock`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      // Rollback
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDisponibles(prev => [item, ...prev])
    }
  }

  // Move from Restock -> Disponible
  const handleMoverADisponible = async (item: ColorFilamentoItem) => {
    // Optimistic UI
    setRestock(prev => prev.filter(c => c.id !== item.id))
    setDisponibles(prev => [{ ...item, estado: 'DISPONIBLE', nota: null }, ...prev])

    try {
      await moverEstadoColor(item.id, 'DISPONIBLE')
      toast.success(`"${item.nombreColor}" marcado como Disponible`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      // Rollback
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => [item, ...prev])
    }
  }

  // Copy Restock list for WhatsApp
  const handleCopiarRestock = () => {
    if (restock.length === 0) {
      toast.info('No hay colores en la lista de restock')
      return
    }

    const itemsText = restock
      .map(c => `- ${c.nombreColor}${c.nota ? ` (${c.nota})` : ''}`)
      .join('\n')

    const message = `*FILAMENTOS PARA RESTOCK - TALLER NOVA*\n\n${itemsText}\n\nTotal colores: ${restock.length}`
    navigator.clipboard.writeText(message)
    toast.success('Lista de restock copiada para WhatsApp')
  }

  // Quick Add submit
  const handleAddColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return

    try {
      const created = await agregarNuevoColor({
        nombreColor: nuevoNombre.trim(),
        codigoHex: nuevoHex,
        estado: nuevoEstado,
        nota: nuevaNota.trim() || undefined
      })

      if (nuevoEstado === 'DISPONIBLE') {
        setDisponibles(prev => [created, ...prev])
      } else {
        setRestock(prev => [created, ...prev])
      }

      toast.success(`"${created.nombreColor}" agregado con éxito`)
      setNuevoNombre('')
      setNuevaNota('')
      setOpenAddModal(false)
    } catch (e: any) {
      toast.error('Error al agregar: ' + e.message)
    }
  }

  // Reset to workshop standard list
  const handleReset = async () => {
    if (!confirm('¿Restablecer la lista exacta de colores del taller NOVA?')) return
    try {
      const data = await resetColoresTaller()
      setDisponibles(data.disponibles)
      setRestock(data.restock)
      toast.success('Lista de colores restablecida')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 3. BARRA SUPERIOR DE ACCIONES & BÚSQUEDA                                   */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight flex items-center gap-2.5">
              <Palette className="h-6 w-6 text-[#A36F4C]" />
              Control de Colores de Filamento
            </h1>
            <p className="text-xs sm:text-sm text-[#75695D] mt-0.5">
              Taller NOVA • Disponibilidad inmediata para impresión y lista de restock.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarRestock}
              className="border-[#D4BEA7] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#633E20] font-bold text-xs h-10 px-3.5 rounded-xl cursor-pointer shadow-xs active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Copy className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
              Copiar lista para Restock ({restock.length})
            </Button>

            <Button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-1 stroke-[2.5]" />
              + Agregar Color
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Restablecer lista de taller"
              className="p-2.5 text-[#75695D] hover:text-[#241C15] rounded-xl hover:bg-[#F4EFEA] cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Buscador Rápido */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar color disponible o por pedir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-9 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-1 rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESTRUCTURA DE 2 COLUMNAS CLARAS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 1: COLORES DISPONIBLES EN TALLER                                */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#1E5E3A]" />
              <h2 className="text-sm font-black text-[#241C15] uppercase tracking-wider">
                Colores Disponibles en Taller
              </h2>
            </div>
            <Badge 
              variant="outline" 
              className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold font-mono px-2.5 py-0.5"
            >
              {filteredDisponibles.length} colores
            </Badge>
          </div>

          {/* Lista Limpia de Tarjetas */}
          <div className="space-y-2">
            {filteredDisponibles.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#75695D] italic">
                {search ? 'No se encontraron colores disponibles' : 'No hay colores disponibles registrados'}
              </div>
            ) : (
              filteredDisponibles.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#1E5E3A]/50 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    {/* Círculo / Dot Visual */}
                    <div 
                      className="h-6 w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0"
                      style={{ backgroundColor: item.codigoHex }}
                      title={item.nombreColor}
                    />
                    <span className="text-sm font-medium text-[#241C15]">
                      {item.nombreColor}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoverARestock(item)}
                    className="h-7 text-xs font-semibold text-[#A36F4C] border-[#D4BEA7] bg-[#FFFFFF] hover:bg-[#FCE8E6] hover:text-[#A34335] hover:border-rose-300 px-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Mover a Restock
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 2: COLORES PARA RESTOCK / COMPRAR                                */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#A36F4C]" />
              <h2 className="text-sm font-black text-[#241C15] uppercase tracking-wider">
                Colores para Restock / Comprar
              </h2>
            </div>
            <Badge 
              variant="outline" 
              className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-xs font-bold font-mono px-2.5 py-0.5"
            >
              {filteredRestock.length} por pedir
            </Badge>
          </div>

          {/* Lista Limpia de Tarjetas */}
          <div className="space-y-2">
            {filteredRestock.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#75695D] italic">
                {search ? 'No se encontraron colores para restock' : '¡Todo el stock está disponible!'}
              </div>
            ) : (
              filteredRestock.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#A36F4C]/50 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    {/* Círculo / Dot Visual */}
                    <div 
                      className="h-6 w-6 rounded-full border border-black/15 shadow-xs flex-shrink-0 opacity-70"
                      style={{ backgroundColor: item.codigoHex }}
                      title={item.nombreColor}
                    />
                    <div>
                      <span className="text-sm font-medium text-[#241C15] block">
                        {item.nombreColor}
                      </span>
                      {item.nota && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded inline-block mt-0.5">
                          {item.nota}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleMoverADisponible(item)}
                    className="h-7 text-xs font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white px-3 rounded-lg shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    Marcar Disponible
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL RÁPIDO: AGREGAR COLOR                                               */}
      {/* ========================================================================= */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] max-w-[420px] p-0 rounded-2xl shadow-2xl z-50">
          <form onSubmit={handleAddColorSubmit} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div>
                <DialogTitle className="text-base font-bold text-[#241C15]">
                  Agregar Nuevo Color
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D]">
                  Ingresa el color para el control de stock del taller
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase">
                  Nombre del Color *
                </Label>
                <Input 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Turquesa Pastel, Cobre Seda..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm h-10"
                />
              </div>

              {/* Selector Visual de Color */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="h-6 w-8 rounded border border-[#E2D9CC] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-[#75695D]">{nuevoHex}</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {PRESET_SWATCHES.slice(0, 12).map(sw => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => {
                        setNuevoHex(sw.hex)
                        if (!nuevoNombre) setNuevoNombre(sw.name)
                      }}
                      className="h-6 rounded border border-black/10 hover:scale-105 transition-transform cursor-pointer"
                      style={{ backgroundColor: sw.hex }}
                      title={sw.name}
                    />
                  ))}
                </div>
              </div>

              {/* Estado Inicial */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase">
                  Estado Inicial
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('DISPONIBLE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nuevoEstado === 'DISPONIBLE'
                        ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟢 Disponible
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('RESTOCK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nuevoEstado === 'RESTOCK'
                        ? 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟡 Para Restock
                  </button>
                </div>
              </div>

              {/* Nota opcional */}
              {nuevoEstado === 'RESTOCK' && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#241C15] uppercase">
                    Nota (Opcional)
                  </Label>
                  <Input 
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Ej: Por terminar, Solicitado por cliente..."
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenAddModal(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Guardar Color
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
