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
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  DollarSign, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Layers
} from 'lucide-react'
import { createIngreso, deleteIngreso } from '@/actions/ingresos'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VentaItem, IngresoDirectoItem } from './FlujoCajaClient'

interface IngresosClientProps {
  ventas: VentaItem[]
  ingresosDirectos: IngresoDirectoItem[]
}

const ITEMS_PER_PAGE = 7

export function IngresosClient({ ventas, ingresosDirectos }: IngresosClientProps) {
  const router = useRouter()
  const [directos, setDirectos] = useState<IngresoDirectoItem[]>(ingresosDirectos)

  useEffect(() => {
    setDirectos(ingresosDirectos)
  }, [ingresosDirectos])

  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'VENTAS' | 'DIRECTOS'>('TODOS')
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Form states
  const [formCliente, setFormCliente] = useState('')
  const [formConcepto, setFormConcepto] = useState('')
  const [formCategoria, setFormCategoria] = useState('Servicio de Impresión 3D')
  const [formMonto, setFormMonto] = useState('')
  const [formMetodoPago, setFormMetodoPago] = useState('YAPE')
  const [formNotas, setFormNotas] = useState('')

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  // Financial KPIs
  const totalIngresosCobradosVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventas])

  const totalIngresosDirectos = useMemo(() => {
    return directos.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [directos])

  const totalIngresosCobrados = totalIngresosCobradosVentas + totalIngresosDirectos

  const totalFacturadoVentas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.total || 0), 0)
  }, [ventas])

  const totalSaldosPorCobrar = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventas])

  // Consolidated Incomes List
  const unifiedIngresos = useMemo(() => {
    const list: Array<{
      id: string
      rawId: string
      fecha: string
      origen: 'VENTA_CATALOGO' | 'INGRESO_DIRECTO'
      cliente: string
      concepto: string
      categoria: string
      montoCobrado: number
      totalOriginal?: number
      saldoPendiente?: number
      metodoPago?: string
      canDelete: boolean
    }> = []

    // From Sales
    ventas.forEach(v => {
      list.push({
        id: `v-${v.id}`,
        rawId: v.id,
        fecha: v.fecha,
        origen: 'VENTA_CATALOGO',
        cliente: v.cliente,
        concepto: `${v.producto.nombreModelo} (x${v.cantidad})`,
        categoria: v.producto.lineaCategoria,
        montoCobrado: v.montoPagado,
        totalOriginal: v.total,
        saldoPendiente: v.saldoPendiente,
        metodoPago: 'Venta',
        canDelete: false,
      })
    })

    // From Direct Incomes
    directos.forEach(i => {
      list.push({
        id: `dir-${i.id}`,
        rawId: i.id,
        fecha: i.fecha,
        origen: 'INGRESO_DIRECTO',
        cliente: i.cliente,
        concepto: i.concepto,
        categoria: i.categoria,
        montoCobrado: i.monto,
        metodoPago: i.metodoPago,
        canDelete: true,
      })
    })

    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, directos])

  // Filtered List
  const filteredIngresos = useMemo(() => {
    return unifiedIngresos.filter(item => {
      const matchSearch = 
        item.cliente.toLowerCase().includes(search.toLowerCase()) ||
        item.concepto.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria.toLowerCase().includes(search.toLowerCase())

      let matchTipo = true
      if (tipoFilter === 'VENTAS') matchTipo = item.origen === 'VENTA_CATALOGO'
      if (tipoFilter === 'DIRECTOS') matchTipo = item.origen === 'INGRESO_DIRECTO'

      return matchSearch && matchTipo
    })
  }, [unifiedIngresos, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredIngresos.length / ITEMS_PER_PAGE))
  const paginatedIngresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredIngresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredIngresos, currentPage])

  const handleOpenCreate = () => {
    setFormCliente('')
    setFormConcepto('')
    setFormCategoria('Servicio de Impresión 3D')
    setFormMonto('')
    setFormMetodoPago('YAPE')
    setFormNotas('')
    setOpenModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.trim() || !formConcepto.trim() || !formMonto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createIngreso({
        cliente: formCliente.trim(),
        concepto: formConcepto.trim(),
        categoria: formCategoria,
        monto: parseFloat(formMonto) || 0,
        metodoPago: formMetodoPago,
        notas: formNotas.trim() || undefined,
      })
      setDirectos(prev => [created as any, ...prev])
      toast.success('Ingreso registrado exitosamente')
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar ingreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDirect = async (id: string, concepto: string) => {
    if (confirm(`¿Seguro que deseas eliminar el ingreso "${concepto}"?`)) {
      try {
        await deleteIngreso(id)
        setDirectos(prev => prev.filter(item => item.id !== id))
        toast.success('Ingreso eliminado')
        router.refresh()
      } catch (err) {
        toast.error('Error al eliminar ingreso')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ArrowUpRight className="h-8 w-8 text-emerald-500" />
            Registro de Ingresos
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Control de cobros por ventas de productos 3D y servicios de impresión / diseño personalizado.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Ingreso Directo
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Total Ingresos Cobrados
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {formatCurrency(totalIngresosCobrados)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Dinero real ingresado a caja
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Facturación Total en Ventas
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalFacturadoVentas)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Monto total de ventas generadas
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cuentas por Cobrar (Saldos)
          </span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {formatCurrency(totalSaldosPorCobrar)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Saldos pendientes de entrega
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Buscar por cliente, modelo o servicio..."
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

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tipoFilter === 'TODOS'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({unifiedIngresos.length})
              </button>
              <button
                onClick={() => { setTipoFilter('VENTAS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tipoFilter === 'VENTAS'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Package className="h-3 w-3" />
                Ventas Catálogo
              </button>
              <button
                onClick={() => { setTipoFilter('DIRECTOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tipoFilter === 'DIRECTOS'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <DollarSign className="h-3 w-3" />
                Servicios Directos
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Origen / Tipo</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Cliente</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Concepto / Detalle</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center hidden sm:table-cell">Método</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right">Monto Cobrado</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIngresos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                  No se encontraron ingresos registrados en este periodo.
                </TableCell>
              </TableRow>
            ) : (
              paginatedIngresos.map((ing) => (
                <TableRow key={ing.id} className="border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <TableCell className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {formatDate(ing.fecha)}
                  </TableCell>

                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {ing.origen === 'VENTA_CATALOGO' ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        Venta Catálogo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                        Servicio Directo
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3 font-semibold text-zinc-100 whitespace-nowrap">
                    {ing.cliente}
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">
                        {ing.concepto}
                      </span>
                      {ing.saldoPendiente && ing.saldoPendiente > 0 ? (
                        <span className="text-[11px] text-amber-400">
                          Saldo pendiente: {formatCurrency(ing.saldoPendiente)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center hidden sm:table-cell whitespace-nowrap">
                    <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs">
                      {ing.metodoPago || 'Yape'}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                    +{formatCurrency(ing.montoCobrado)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center whitespace-nowrap">
                    {ing.canDelete ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteDirect(ing.rawId, ing.concepto)}
                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                        title="Eliminar ingreso directo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-[11px] text-zinc-600">Desde Ventas</span>
                    )}
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
              Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredIngresos.length} ingresos)
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
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
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

      {/* Modal: Registrar Ingreso Directo */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              Registrar Nuevo Ingreso Directo
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Cliente / Empresa *</Label>
              <Input 
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                placeholder="Ej: Juan Pérez / Empresa ABC"
                required
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Concepto / Servicio Realizado *</Label>
              <Input 
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Impresión pieza técnica en PETG, Modelado 3D..."
                required
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Categoría *</Label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Préstamo Bancario / Financiamiento">Préstamo Bancario / Financiamiento</option>
                  <option value="Servicio de Impresión 3D">Servicio de Impresión 3D</option>
                  <option value="Diseño & Modelado CAD">Diseño & Modelado CAD</option>
                  <option value="Venta Directa">Venta Directa / Feria</option>
                  <option value="Servicio Técnico">Servicio Técnico / Calibración</option>
                  <option value="Aporte de Capital">Aporte de Capital</option>
                  <option value="Otros Ingresos">Otros Ingresos</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Método de Pago *</Label>
                <select
                  value={formMetodoPago}
                  onChange={(e) => setFormMetodoPago(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="YAPE">Yape</option>
                  <option value="PLIN">Plin</option>
                  <option value="TRANSFERENCIA_BCP">Transferencia BCP</option>
                  <option value="TRANSFERENCIA_BBVA">Transferencia BBVA</option>
                  <option value="TRANSFERENCIA_INTERBANK">Transferencia Interbank</option>
                  <option value="EFECTIVO">Efectivo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Monto Cobrado (S/) *</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                value={formMonto}
                onChange={(e) => setFormMonto(e.target.value)}
                placeholder="0.00"
                required
                className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono font-bold text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Notas / Observaciones (Opcional)</Label>
              <Input 
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
                placeholder="Ej: Pago adelantado del 100%"
                className="bg-zinc-900 border-zinc-700 text-white text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Ingreso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
