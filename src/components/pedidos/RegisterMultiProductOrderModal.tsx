'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Boxes,
  X,
  Plus,
  ShoppingBag,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ComboboxItem } from '@/components/ui/SearchableCombobox'
import { TipoPrecio } from '@prisma/client'
import { createPedido } from '@/actions/pedidos'
import {
  ProductoOption,
  FilamentoOption,
  ClienteOption
} from '@/contracts/orders.dto'
import { useOrderForm } from './hooks/useOrderForm'
import { OrderCustomerSection } from './OrderCustomerSection'
import { OrderItemCard } from './OrderItemCard'
import { OrderSummarySection } from './OrderSummarySection'
import { StockCajasResumen } from '@/actions/cajas'

interface RegisterMultiProductOrderModalProps {
  isOpen: boolean
  onClose: () => void
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  clientesList: ClienteOption[]
  stockCajas?: StockCajasResumen | null
  initialProductoId?: string
  onOrderCreated: (pedido: any, newClient?: ClienteOption) => void
  onClientAdded?: (cliente: ClienteOption) => void
}

export function RegisterMultiProductOrderModal({
  isOpen,
  onClose,
  productos,
  filamentos,
  clientesList,
  stockCajas,
  initialProductoId,
  onOrderCreated,
  onClientAdded
}: RegisterMultiProductOrderModalProps) {
  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const {
    formFecha, setFormFecha,
    formCliente, setFormCliente,
    formTelefono, setFormTelefono,
    formCanal, setFormCanal,
    formHandleSocial, setFormHandleSocial,
    formDestino, setFormDestino,
    formDiaEntrega, setFormDiaEntrega,
    formNotas, setFormNotas,
    formCostoEnvio, setFormCostoEnvio,
    formHasCaja, setFormHasCaja,
    formCajasLotId, setFormCajasLotId,
    formCajasCantidad, setFormCajasCantidad,
    formMontoPagado, setFormMontoPagado,
    formMetodoPago, setFormMetodoPago,
    formNotasPago, setFormNotasPago,
    clientSelectMode, setClientSelectMode,
    selectedClientOption,
    clientSearchTerm, setClientSearchTerm,
    isClientDropdownOpen, setIsClientDropdownOpen,
    isRegisteringClientInline,
    filteredClientOptions,
    similarExistingClient,
    formItems,
    addItem,
    removeItem,
    updateItem,
    handleSelectClient,
    handleClearSelectedClient,
    handleSwitchToNewClient,
    handleRegisterClientInline,
    resetForm,
    totalItemsCount,
    subtotalCalculado: formSubtotalCalculado,
    totalCalculado: formTotalCalculado,
    saldoPendienteNum: formSaldoPendienteCalculado
  } = useOrderForm({
    isOpen,
    productos,
    filamentos,
    clientesList,
    stockCajas,
    initialProductoId,
    onClientAdded
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Opciones de productos 3D para el SearchableCombobox
  const productosComboboxItems: ComboboxItem[] = useMemo(() => {
    return (productos || []).map(p => {
      const displayName = p.nombreModelo.includes(' - ')
        ? p.nombreModelo.replace(' - ', ' ➔ ')
        : p.nombreModelo

      return {
        id: p.id,
        label: displayName,
        sublabel: `${p.lineaCategoria || 'General'} • Base: S/ ${Number(p.costoBase || 0).toFixed(2)}`,
        badge: `S/ ${Number(p.precioMenor || 0).toFixed(2)}`,
        icon: Boxes
      }
    })
  }, [productos])

  // Submit Handler
  const handleSubmitNuevoPedido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientSelectMode === 'EXISTING' && !selectedClientOption) {
      toast.error('Por favor busca y selecciona un cliente registrado, o haz clic en "Nuevo Cliente".')
      return
    }

    if (!formCliente.trim()) {
      toast.error('Por favor ingresa el nombre del cliente.')
      return
    }

    if (formItems.some(i => !i.productoId)) {
      toast.error('Todos los productos deben tener un modelo 3D seleccionado.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPedido({
        fecha: formFecha,
        cliente: formCliente.trim(),
        telefono: formTelefono.trim() || undefined,
        canalVenta: formCanal,
        handleSocial: formHandleSocial.trim() || undefined,
        destinoEnvio: formDestino.trim() || undefined,
        diaEntregaPrometida: formDiaEntrega.trim() || undefined,
        notas: formNotas.trim() || undefined,
        costoEnvio: Number(formCostoEnvio) || 0,
        montoPagado: Number(formMontoPagado) || 0,
        metodoPago: formMetodoPago,
        notasPago: formNotasPago.trim() || undefined,
        descontarStock: true,
        items: formItems.map(it => ({
          productoId: it.productoId,
          varianteId: it.varianteId || it.productoId,
          colorFilamentoId: it.coloresIds?.[0] || it.colorFilamentoId || undefined,
          coloresIds: it.coloresIds || [],
          personalizacion: it.personalizacion.trim() || undefined,
          cantidad: Number(it.cantidad) || 1,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: Number(it.precioUnitario) || 0,
          costoBaseSnapshot: it.costoBase != null && Number(it.costoBase) > 0 ? Number(it.costoBase) : undefined,
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
        const cleanName = formCliente.trim()
        let newClientOption: ClienteOption | undefined
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
        onOrderCreated(res.pedido, newClientOption)
        resetForm()
        onClose()
        toast.success(`Pedido ${res.pedido.codigo} registrado exitosamente`)
      } else {
        toast.error(res.error || 'No se pudo crear el pedido')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al crear el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="max-w-4xl w-full bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-150 relative text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Registrar Pedido Multiproducto
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Agrega modelos a este pedido, asigna filamentos y calcula el balance automáticamente.
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

        {/* Modal Form Container con Flex Col y Scroll Confinado */}
        <form onSubmit={handleSubmitNuevoPedido} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Contenedor con Scroll y Padding Inferior Calibrado (pb-28) */}
          <div className="flex-1 overflow-y-auto pr-1 p-4 sm:p-6 pb-28 space-y-6">
            {/* SECCIÓN 1: DATOS DEL CLIENTE Y DESPACHO */}
            <OrderCustomerSection
              clientSelectMode={clientSelectMode}
              setClientSelectMode={setClientSelectMode}
              clientesList={clientesList}
              selectedClientOption={selectedClientOption}
              onSelectClient={handleSelectClient}
              onClearSelectedClient={handleClearSelectedClient}
              onSwitchToNewClient={handleSwitchToNewClient}
              clientSearchTerm={clientSearchTerm}
              setClientSearchTerm={setClientSearchTerm}
              isClientDropdownOpen={isClientDropdownOpen}
              setIsClientDropdownOpen={setIsClientDropdownOpen}
              filteredClientOptions={filteredClientOptions}
              similarExistingClient={similarExistingClient}
              formFecha={formFecha}
              setFormFecha={setFormFecha}
              formCliente={formCliente}
              setFormCliente={setFormCliente}
              formTelefono={formTelefono}
              setFormTelefono={setFormTelefono}
              formCanal={formCanal}
              setFormCanal={setFormCanal}
              formHandleSocial={formHandleSocial}
              setFormHandleSocial={setFormHandleSocial}
              formDestino={formDestino}
              setFormDestino={setFormDestino}
              formDiaEntrega={formDiaEntrega}
              setFormDiaEntrega={setFormDiaEntrega}
              isRegisteringClientInline={isRegisteringClientInline}
              onRegisterClientInline={handleRegisterClientInline}
            />

            {/* SECCIÓN 2: PRODUCTOS DEL PEDIDO */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground">02.</span>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Productos del Pedido ({formItems.length})
                  </span>
                </div>

                {/* Botón Minimalista Agregar Producto */}
                <button
                  type="button"
                  onClick={addItem}
                  className="h-7 px-2.5 rounded-md border border-border/60 bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Agregar Producto</span>
                </button>
              </div>

              {/* Lista de Ítems */}
              <div className="space-y-3">
                {formItems.map((item, index) => (
                  <OrderItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={formItems.length}
                    productos={productos}
                    filamentos={filamentos}
                    productosComboboxItems={productosComboboxItems}
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            </div>

            {/* SECCIÓN 2.5: CAJA DE PACKAGING & DESCUENTO DE STOCK */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={formHasCaja}
                    onChange={(e) => setFormHasCaja(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-primary focus:ring-ring border-border/80 cursor-pointer"
                  />
                  <span>Incluir Caja de Packaging (descuenta stock)</span>
                </label>

                {formHasCaja && (
                  <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                    Costo: S/ {(formCajasCantidad * (stockCajas?.lotes.find(l => l.id === formCajasLotId)?.costoUnitario || 2.40)).toFixed(2)}
                  </span>
                )}
              </div>

              {formHasCaja && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground block">
                      Lote de Cajas Registrado
                    </label>
                    <select
                      value={formCajasLotId}
                      onChange={(e) => setFormCajasLotId(e.target.value)}
                      className="w-full h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-foreground focus:outline-hidden"
                    >
                      {(stockCajas?.lotes || []).map((lote) => {
                        const code = lote.codigo || `LOT-${lote.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
                        return (
                          <option key={lote.id} value={lote.id}>
                            [{code}] {lote.concepto} ({lote.fecha.slice(0, 10)}) — S/ {lote.costoUnitario.toFixed(2)} c/u ({lote.stockDisponible} disp.)
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground block">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formCajasCantidad}
                      onChange={(e) => setFormCajasCantidad(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-8 rounded-md border border-border/70 bg-background text-center text-xs font-mono font-medium text-foreground focus:outline-hidden tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: TOTALES Y LIQUIDACIÓN DINÁMICA */}
            <OrderSummarySection
              formCostoEnvio={formCostoEnvio}
              setFormCostoEnvio={setFormCostoEnvio}
              formMontoPagado={formMontoPagado}
              setFormMontoPagado={setFormMontoPagado}
              formMetodoPago={formMetodoPago}
              setFormMetodoPago={setFormMetodoPago}
              subtotal={formSubtotalCalculado}
              total={formTotalCalculado}
              saldoPendiente={formSaldoPendienteCalculado}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* Sticky Bottom Footer Flotante con Backdrop Blur */}
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-muted/20 backdrop-blur-md border-t border-border/60 px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {/* Izquierda: Balance Estructurado */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Indicador Secundario de Total */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <span>Total:</span>
                <span className="font-mono font-semibold text-foreground text-sm tabular-nums tracking-tight">
                  {formatCurrency(formTotalCalculado)}
                </span>
              </div>

              {/* Separador Visual */}
              <div className="h-4 w-px bg-border/60 hidden sm:block" />

              {/* Badge Destacado de Saldo por Cobrar */}
              {formSaldoPendienteCalculado > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <span className="text-xs font-medium">Saldo por Cobrar:</span>
                  <span className="font-mono font-semibold text-sm tabular-nums tracking-tight">
                    {formatCurrency(formSaldoPendienteCalculado)}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Pagado</span>
                </div>
              )}
            </div>

            {/* Derecha: Botón Cancelar y Botón Principal Guardar Pedido */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full mr-1.5" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Guardar Pedido</span>
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
