'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Pencil,
  X,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { EstadoPedido } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ComboboxItem } from '@/components/ui/SearchableCombobox'
import { updatePedido } from '@/actions/pedidos'
import {
  ClienteOption,
  FilamentoOption,
  FormItemState,
  PedidoView,
  ProductoOption
} from './types'
import { groupCatalogProducts, findVariantInGroups } from './productHierarchy'
import { OrderClientHeader } from './OrderClientHeader'
import { OrderLogisticsSection } from './OrderLogisticsSection'
import { OrderItemsTable } from './OrderItemsTable'
import { OrderFinancialSummary } from './OrderFinancialSummary'
import { StockCajasResumen } from '@/actions/cajas'

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  editingPedido: PedidoView | null
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  clientesList: ClienteOption[]
  stockCajas?: StockCajasResumen | null
  onOrderUpdated: (pedido: any, newClient?: ClienteOption) => void
}

export function EditOrderModal({
  isOpen,
  onClose,
  editingPedido,
  productos,
  filamentos,
  clientesList,
  stockCajas,
  onOrderUpdated
}: EditOrderModalProps) {
  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Estado del formulario
  const [formFecha, setFormFecha] = useState('')
  const [formCliente, setFormCliente] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCanal, setFormCanal] = useState('WhatsApp')
  const [formHandleSocial, setFormHandleSocial] = useState('')
  const [formDestino, setFormDestino] = useState('')
  const [formDiaEntrega, setFormDiaEntrega] = useState('')
  const [formNotas, setFormNotas] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState<string>('')
  const [formMontoPagado, setFormMontoPagado] = useState<string>('')
  const [editEstado, setEditEstado] = useState<EstadoPedido>('PENDIENTE')
  const [editSeguimientoPostventa, setEditSeguimientoPostventa] = useState(false)
  const [editFechaPostventa, setEditFechaPostventa] = useState<string | null>(null)
  const [editNotasPostventa, setEditNotasPostventa] = useState('')

  // Asignación de caja de packaging
  const [formHasCaja, setFormHasCaja] = useState<boolean>(false)
  const [formCajasLotId, setFormCajasLotId] = useState<string>('')
  const [formCajasCantidad, setFormCajasCantidad] = useState<number>(1)

  // Cliente vinculado o nuevo
  const [clientSelectMode, setClientSelectMode] = useState<'EXISTING' | 'NEW'>('EXISTING')
  const [selectedClientOption, setSelectedClientOption] = useState<ClienteOption | null>(null)

  // Lista dinámica de productos
  const [formItems, setFormItems] = useState<FormItemState[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Opciones de productos 3D para el combobox
  const productosComboboxItems: ComboboxItem[] = useMemo(() => {
    return (productos || []).map(p => {
      const displayName = p.nombreModelo.includes(' - ')
        ? p.nombreModelo.replace(' - ', ' ➔ ')
        : p.nombreModelo

      return {
        id: p.id,
        label: displayName,
        sublabel: `${p.lineaCategoria || 'General'} • Base: S/ ${Number(p.costoBase || 0).toFixed(2)}`,
        badge: `S/ ${Number(p.precioMenor || 0).toFixed(2)}`
      }
    })
  }, [productos])

  // Inicialización cada vez que se abre el modal con un pedido
  useEffect(() => {
    if (!editingPedido || !isOpen) return

    setFormFecha(editingPedido.fecha ? editingPedido.fecha.split('T')[0] : new Date().toISOString().split('T')[0])
    setFormCliente(editingPedido.cliente || '')
    setFormTelefono(editingPedido.telefono || '')
    setFormCanal(editingPedido.canalVenta || 'WhatsApp')
    setFormHandleSocial(editingPedido.handleSocial || '')
    setFormDestino(editingPedido.destinoEnvio || '')
    setFormDiaEntrega(editingPedido.diaEntregaPrometida || '')
    setFormNotas(editingPedido.notas || '')
    setFormCostoEnvio(editingPedido.costoEnvio ? editingPedido.costoEnvio.toString() : '')
    setFormMontoPagado(editingPedido.montoPagado != null ? editingPedido.montoPagado.toString() : '')
    setEditEstado(editingPedido.estado)
    setEditSeguimientoPostventa(editingPedido.seguimientoPostventa || false)
    setEditFechaPostventa(editingPedido.fechaPostventa || null)
    setEditNotasPostventa(editingPedido.notasPostventa || '')

    // Vincular cliente existente si coincide por nombre
    const cleanPName = (editingPedido.cliente || '').trim().toLowerCase()
    const matchingClient = (clientesList || []).find(
      c => c.nombre.trim().toLowerCase() === cleanPName
    )
    if (matchingClient) {
      setSelectedClientOption(matchingClient)
      setClientSelectMode('EXISTING')
    } else {
      setSelectedClientOption(null)
      setClientSelectMode('NEW')
    }

    // Inicializar asignación de cajas
    if (editingPedido.cajas && editingPedido.cajas.length > 0) {
      setFormHasCaja(true)
      setFormCajasLotId(editingPedido.cajas[0].inversionId || stockCajas?.loteReciente50?.id || stockCajas?.lotes?.[0]?.id || '')
      setFormCajasCantidad(editingPedido.cajas[0].cantidad || 1)
    } else {
      setFormHasCaja(false)
      setFormCajasLotId(stockCajas?.loteReciente50?.id || stockCajas?.lotes?.[0]?.id || '')
      setFormCajasCantidad(1)
    }

    // Inicializar ítems
    setFormItems(
      editingPedido.items.map((it, idx) => {
        const rawCols = it.coloresIds && it.coloresIds.length > 0
          ? it.coloresIds
          : (it.colorFilamentoId ? [it.colorFilamentoId] : [])
        return {
          id: it.id || `edit-item-${idx}`,
          productoId: it.productoId,
          colorFilamentoId: it.colorFilamentoId || rawCols[0] || '',
          coloresIds: rawCols,
          personalizacion: it.personalizacion || '',
          cantidad: it.cantidad,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: it.precioUnitario !== undefined && it.precioUnitario !== null ? it.precioUnitario : '',
          costoBase: it.costoBaseSnapshot != null ? Number(it.costoBaseSnapshot) : undefined,
          costoBaseSnapshot: it.costoBaseSnapshot != null ? Number(it.costoBaseSnapshot) : undefined,
          costoPackaging: it.costoPackaging ? it.costoPackaging : '',
          porcentajeAdicional: it.porcentajeAdicional || 0,
          gramosConsumidos: it.gramosConsumidos || 0
        }
      })
    )
  }, [editingPedido, isOpen, clientesList])

  // Manejo de clientes
  const handleSelectClient = (c: ClienteOption) => {
    setSelectedClientOption(c)
    setClientSelectMode('EXISTING')
    setFormCliente(c.nombre)
    if (c.telefono) setFormTelefono(c.telefono)
    if (c.handleSocial) setFormHandleSocial(c.handleSocial)
    if (c.canalOrigen || c.canalPreferido) setFormCanal(c.canalOrigen || c.canalPreferido || 'WhatsApp')
    const dir = c.destinoEnvio || c.direccion || c.distrito || ''
    if (dir) setFormDestino(dir)
  }

  const handleSwitchToNewClient = (presetName = '') => {
    setSelectedClientOption(null)
    setClientSelectMode('NEW')
    setFormCliente(presetName || formCliente || '')
  }

  // Manejadores de ítems
  const handleAddItem = () => {
    const defaultProd = productos[0]
    const defaultFilId = filamentos[0]?.id || ''
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productoId: defaultProd ? defaultProd.id : '',
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MENOR',
        precioUnitario: defaultProd ? defaultProd.precioMenor : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ])
  }

  const handleRemoveItem = (id: string) => {
    if (formItems.length <= 1) return
    setFormItems(prev => prev.filter(i => i.id !== id))
  }

  const handleUpdateItem = (id: string, updates: Partial<FormItemState>) => {
    setFormItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const merged = { ...item, ...updates }
        const catalogGroups = groupCatalogProducts(productos)
        const targetId = updates.varianteId || updates.productoId || merged.varianteId || merged.productoId

        if (updates.productoId || updates.varianteId) {
          const match = findVariantInGroups(catalogGroups, targetId)
          if (match) {
            merged.varianteId = match.variant.id
            merged.productoId = match.group.productoId
            merged.nombreDisplay = match.group.hasVariants
              ? `${match.group.baseName} - ${match.variant.nombreVariante}`
              : match.group.baseName
            merged.costoBase = match.variant.costoBase
            let pUnit = match.variant.precioMenor
            if (merged.tipoPrecio === 'MAYOR' || (merged.tipoPrecio as string) === 'AMIGOS') {
              pUnit = match.variant.precioMayor
            } else if (merged.tipoPrecio === 'MENOR' || (merged.tipoPrecio as string) === 'MERCADO') {
              pUnit = match.variant.precioMenor
            }
            if (updates.precioUnitario === undefined) {
              merged.precioUnitario = pUnit
            }
          }
        }

        if (updates.tipoPrecio && updates.tipoPrecio !== item.tipoPrecio) {
          const match = findVariantInGroups(catalogGroups, targetId)
          if (match) {
            if (updates.tipoPrecio === 'MAYOR' || (updates.tipoPrecio as string) === 'AMIGOS') {
              merged.precioUnitario = match.variant.precioMayor
            } else if (updates.tipoPrecio === 'MENOR' || (updates.tipoPrecio as string) === 'MERCADO') {
              merged.precioUnitario = match.variant.precioMenor
            }
          }
        }

        return merged
      })
    )
  }

  // Cálculos dinámicos
  const subtotalItemsCalculado = useMemo(() => {
    return formItems.reduce((sum, it) => {
      const u = Number(it.precioUnitario) || 0
      const pack = Number(it.costoPackaging) || 0
      const q = Math.max(1, Number(it.cantidad) || 1)
      return sum + ((u + pack) * q)
    }, 0)
  }, [formItems])

  const totalCalculado = useMemo(() => {
    const env = Number(formCostoEnvio) || 0
    return Number((subtotalItemsCalculado + env).toFixed(2))
  }, [subtotalItemsCalculado, formCostoEnvio])

  const saldoPendienteCalculado = useMemo(() => {
    const pag = formMontoPagado !== '' ? Math.max(0, Number(formMontoPagado) || 0) : (editingPedido?.montoPagado || 0)
    return Math.max(0, Number((totalCalculado - pag).toFixed(2)))
  }, [totalCalculado, formMontoPagado, editingPedido])

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPedido) return

    if (clientSelectMode === 'EXISTING' && !selectedClientOption) {
      toast.error('Por favor busca y selecciona un cliente registrado, o haz clic en "Nuevo Cliente".')
      return
    }

    if (!formCliente.trim()) {
      toast.error('Por favor ingresa el nombre del cliente.')
      return
    }

    if (formItems.some(i => !i.productoId)) {
      toast.error('Todos los productos deben tener un modelo 3D asignado.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updatePedido(editingPedido.id, {
        fecha: formFecha,
        cliente: formCliente.trim(),
        telefono: formTelefono.trim() || undefined,
        canalVenta: formCanal,
        handleSocial: formHandleSocial.trim() || undefined,
        destinoEnvio: formDestino.trim() || undefined,
        diaEntregaPrometida: formDiaEntrega.trim() || undefined,
        notas: formNotas.trim() || undefined,
        estado: editEstado,
        seguimientoPostventa: editSeguimientoPostventa,
        fechaPostventa: editFechaPostventa,
        notasPostventa: editNotasPostventa.trim() || undefined,
        costoEnvio: Number(formCostoEnvio) || 0,
        montoPagado: formMontoPagado !== '' ? Number(formMontoPagado) : undefined,
        items: formItems.map(it => ({
          id: it.id && !it.id.startsWith('item-') && !it.id.startsWith('edit-item-') ? it.id : undefined,
          productoId: it.productoId,
          varianteId: it.varianteId || it.productoId,
          colorFilamentoId: it.coloresIds?.[0] || it.colorFilamentoId || undefined,
          coloresIds: it.coloresIds || [],
          personalizacion: it.personalizacion.trim() || undefined,
          cantidad: Number(it.cantidad) || 1,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: Number(it.precioUnitario) || 0,
          costoBaseSnapshot: it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
            ? Number(it.costoBaseSnapshot)
            : (it.costoBase != null && Number(it.costoBase) > 0 ? Number(it.costoBase) : undefined),
          costoPackaging: Number(it.costoPackaging) || 0,
          porcentajeAdicional: Number(it.porcentajeAdicional) || 0,
          gramosConsumidos: Number(it.gramosConsumidos) || 0
        })),
        cajas: formHasCaja ? [{
          inversionId: formCajasLotId || null,
          nombreCaja: stockCajas?.lotes.find(l => l.id === formCajasLotId)?.concepto || 'Caja de Envío',
          cantidad: formCajasCantidad,
          costoUnitario: stockCajas?.lotes.find(l => l.id === formCajasLotId)?.costoUnitario || 2.40
        }] : []
      })

      if (res.success && res.pedido) {
        let newClientOption: ClienteOption | undefined
        const cleanName = formCliente.trim()
        if (!clientesList.some(c => c.nombre.toLowerCase() === cleanName.toLowerCase())) {
          newClientOption = {
            id: `auto-${cleanName.toLowerCase()}`,
            nombre: cleanName,
            telefono: formTelefono.trim() || null,
            handleSocial: formHandleSocial.trim() || null,
            canalPreferido: formCanal,
            canalOrigen: formCanal,
            direccion: formDestino.trim() || null
          }
        }
        toast.success(`Pedido ${res.pedido.codigo} actualizado exitosamente`)
        onOrderUpdated(res.pedido, newClientOption)
        onClose()
      } else {
        toast.error(res.error || 'No se pudo actualizar el pedido')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !editingPedido) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-card border border-border/80 rounded-2xl shadow-xl max-w-4xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO MINIMALISTA */}
        <div className="bg-card/95 backdrop-blur-xs border-b border-border/60 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
              #{editingPedido.codigo}
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Editar Pedido
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Modifica cliente, logística, estado y los productos asignados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/60 flex items-center justify-center"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO CON SCROLL CONFINADO Y PADDING INFERIOR ESTRICTO pb-28 */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-28 space-y-4">
            {/* BLOQUE 1: IDENTIDAD DEL CLIENTE VINCULADO / CAMBIO */}
            <OrderClientHeader
              clientSelectMode={clientSelectMode}
              setClientSelectMode={setClientSelectMode}
              selectedClientOption={selectedClientOption}
              onSelectClient={handleSelectClient}
              onSwitchToNewClient={handleSwitchToNewClient}
              clientesList={clientesList}
              formCliente={formCliente}
              setFormCliente={setFormCliente}
              formTelefono={formTelefono}
              setFormTelefono={setFormTelefono}
              formHandleSocial={formHandleSocial}
              setFormHandleSocial={setFormHandleSocial}
              formCanal={formCanal}
              setFormCanal={setFormCanal}
              formDestino={formDestino}
              setFormDestino={setFormDestino}
            />

            {/* BLOQUE 2: METADATOS, LOGÍSTICA, POSTVENTA Y NOTAS */}
            <OrderLogisticsSection
              formFecha={formFecha}
              setFormFecha={setFormFecha}
              formCanal={formCanal}
              setFormCanal={setFormCanal}
              editEstado={editEstado}
              setEditEstado={setEditEstado}
              formDiaEntrega={formDiaEntrega}
              setFormDiaEntrega={setFormDiaEntrega}
              formDestino={formDestino}
              setFormDestino={setFormDestino}
              editSeguimientoPostventa={editSeguimientoPostventa}
              setEditSeguimientoPostventa={setEditSeguimientoPostventa}
              editFechaPostventa={editFechaPostventa}
              setEditFechaPostventa={setEditFechaPostventa}
              editNotasPostventa={editNotasPostventa}
              setEditNotasPostventa={setEditNotasPostventa}
              formNotas={formNotas}
              setFormNotas={setFormNotas}
            />

            {/* BLOQUE 3: TABLA DE PRODUCTOS ASIGNADOS */}
            <OrderItemsTable
              items={formItems}
              filamentos={filamentos}
              productos={productos}
              productosComboboxItems={productosComboboxItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              formatCurrency={formatCurrency}
            />

            {/* BLOQUE 3.5: CAJA DE PACKAGING & DESCUENTO DE STOCK */}
            <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={formHasCaja}
                    onChange={(e) => setFormHasCaja(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
                  />
                  <span>📦 Asignar Caja de Packaging para este Pedido</span>
                </label>

                {formHasCaja && (
                  <Badge variant="outline" className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                    Costo: S/ {(formCajasCantidad * (stockCajas?.lotes.find(l => l.id === formCajasLotId)?.costoUnitario || 2.40)).toFixed(2)}
                  </Badge>
                )}
              </div>

              {formHasCaja && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Lote de Cajas Registrado
                    </label>
                    <select
                      value={formCajasLotId}
                      onChange={(e) => setFormCajasLotId(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-hidden"
                    >
                      {(stockCajas?.lotes || []).map((lote) => (
                        <option key={lote.id} value={lote.id}>
                          {lote.concepto} ({lote.fecha.slice(0, 10)}) — S/ {lote.costoUnitario.toFixed(2)} c/u ({lote.stockDisponible} disp.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Cantidad Cajas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formCajasCantidad}
                      onChange={(e) => setFormCajasCantidad(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-9 rounded-lg border border-border bg-background text-center text-xs font-mono font-bold text-foreground focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BLOQUE 4: BARRA DE BALANCE FINANCIERO COMPACTA (UNA SOLA LÍNEA SOBRIA) */}
            <OrderFinancialSummary
              costoEnvio={formCostoEnvio}
              setCostoEnvio={setFormCostoEnvio}
              formMontoPagado={formMontoPagado}
              setFormMontoPagado={setFormMontoPagado}
              subtotalItems={subtotalItemsCalculado}
              nuevoTotal={totalCalculado}
              saldoPendiente={saldoPendienteCalculado}
              montoPagado={editingPedido.montoPagado}
              totalPagosCount={editingPedido.pagos.length}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* FOOTER FLOTANTE Y FIJO CON FIX DE SCROLL */}
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-muted/20 backdrop-blur-md border-t border-border/60 px-6 py-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {/* Izquierda: Saldo por cobrar en text-sm font-semibold text-foreground */}
            <div className="flex items-center gap-1.5 text-xs text-foreground font-mono self-start sm:self-auto tabular-nums">
              <span className="text-muted-foreground font-normal">Saldo por cobrar:</span>
              <span className="font-semibold text-sm tabular-nums tracking-tight">{formatCurrency(saldoPendienteCalculado)}</span>
            </div>

            {/* Derecha: Acciones Cancelar y Guardar Cambios */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-8 px-3 text-muted-foreground hover:text-foreground font-medium text-xs cursor-pointer flex-1 sm:flex-none"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
