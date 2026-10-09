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

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  editingPedido: PedidoView | null
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  clientesList: ClienteOption[]
  onOrderUpdated: (pedido: any, newClient?: ClienteOption) => void
}

export function EditOrderModal({
  isOpen,
  onClose,
  editingPedido,
  productos,
  filamentos,
  clientesList,
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
  const [editEstado, setEditEstado] = useState<EstadoPedido>('PENDIENTE')
  const [editSeguimientoPostventa, setEditSeguimientoPostventa] = useState(false)
  const [editFechaPostventa, setEditFechaPostventa] = useState<string | null>(null)
  const [editNotasPostventa, setEditNotasPostventa] = useState('')

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
    if (c.direccion || c.distrito) setFormDestino(c.direccion || c.distrito || '')
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
    const pag = editingPedido?.montoPagado || 0
    return Math.max(0, Number((totalCalculado - pag).toFixed(2)))
  }, [totalCalculado, editingPedido])

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
        items: formItems.map(it => ({
          productoId: it.productoId,
          varianteId: it.varianteId || it.productoId,
          colorFilamentoId: it.coloresIds?.[0] || it.colorFilamentoId || undefined,
          coloresIds: it.coloresIds || [],
          personalizacion: it.personalizacion.trim() || undefined,
          cantidad: Number(it.cantidad) || 1,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: Number(it.precioUnitario) || 0,
          costoPackaging: Number(it.costoPackaging) || 0,
          porcentajeAdicional: Number(it.porcentajeAdicional) || 0,
          gramosConsumidos: Number(it.gramosConsumidos) || 0
        }))
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

  if (!isOpen || !editingPedido) return null

  return (
    <div className="fixed inset-0 isolate z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ENCABEZADO MINIMALISTA */}
        <div className="bg-card border-b border-border p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Badge className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-1 rounded-md border border-border">
              #{editingPedido.codigo}
            </Badge>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
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
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-5 w-5" />
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

            {/* BLOQUE 4: BARRA DE BALANCE FINANCIERO COMPACTA (UNA SOLA LÍNEA SOBRIA) */}
            <OrderFinancialSummary
              costoEnvio={formCostoEnvio}
              setCostoEnvio={setFormCostoEnvio}
              subtotalItems={subtotalItemsCalculado}
              nuevoTotal={totalCalculado}
              saldoPendiente={saldoPendienteCalculado}
              montoPagado={editingPedido.montoPagado}
              totalPagosCount={editingPedido.pagos.length}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* FOOTER FLOTANTE Y FIJO CON FIX DE SCROLL */}
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-md border-t border-border px-5 sm:px-6 py-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            {/* Izquierda: Saldo por cobrar en text-sm font-semibold text-foreground */}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground font-mono self-start sm:self-auto">
              <span className="text-muted-foreground font-normal">Saldo por cobrar:</span>
              <span>{formatCurrency(saldoPendienteCalculado)}</span>
            </div>

            {/* Derecha: Acciones Cancelar y Guardar Cambios */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-xl text-muted-foreground hover:bg-muted font-medium text-xs cursor-pointer flex-1 sm:flex-none"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
