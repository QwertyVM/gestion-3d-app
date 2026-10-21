import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { createCliente } from '@/actions/clientes'
import {
  ProductoOption,
  FilamentoOption,
  ClienteOption,
  FormItemState
} from '@/contracts/orders.dto'
import { groupCatalogProducts, findVariantInGroups } from '../productHierarchy'
import { StockCajasResumen } from '@/actions/cajas'

interface UseOrderFormProps {
  isOpen: boolean
  productos: ProductoOption[]
  filamentos: FilamentoOption[]
  clientesList: ClienteOption[]
  stockCajas?: StockCajasResumen | null
  initialProductoId?: string
  onClientAdded?: (cliente: ClienteOption) => void
}

function getDefaultFilamentoId(fils: FilamentoOption[]): string {
  if (!fils || fils.length === 0) return ''
  const negro = fils.find(f => f.nombreColor.toLowerCase().includes('negro'))
  if (negro) return negro.id
  return fils[0]?.id || ''
}

export function useOrderForm({
  isOpen,
  productos,
  filamentos,
  clientesList,
  stockCajas,
  initialProductoId,
  onClientAdded
}: UseOrderFormProps) {
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [formCliente, setFormCliente] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCanal, setFormCanal] = useState('WhatsApp')
  const [formHandleSocial, setFormHandleSocial] = useState('')
  const [formDestino, setFormDestino] = useState('')
  const [formDiaEntrega, setFormDiaEntrega] = useState('')
  const [formNotas, setFormNotas] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState<string>('')
  const [formHasCaja, setFormHasCaja] = useState<boolean>(true)
  const [formCajasLotId, setFormCajasLotId] = useState<string>('')
  const [formCajasCantidad, setFormCajasCantidad] = useState<number>(1)
  const [formMontoPagado, setFormMontoPagado] = useState<string>('')
  const [formMetodoPago, setFormMetodoPago] = useState('YAPE')
  const [formNotasPago, setFormNotasPago] = useState('')

  const [clientSelectMode, setClientSelectMode] = useState<'EXISTING' | 'NEW'>(
    clientesList && clientesList.length > 0 ? 'EXISTING' : 'NEW'
  )
  const [selectedClientOption, setSelectedClientOption] = useState<ClienteOption | null>(null)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [isRegisteringClientInline, setIsRegisteringClientInline] = useState(false)

  const getDefaultItemState = (suffix: string = '1', presetProductId?: string): FormItemState => {
    const defaultFilId = getDefaultFilamentoId(filamentos)
    const targetPresetId = presetProductId || initialProductoId

    if (targetPresetId) {
      const catalogGroups = groupCatalogProducts(productos)
      const match = findVariantInGroups(catalogGroups, targetPresetId)
      if (match) {
        return {
          id: `item-${Date.now()}-${suffix}`,
          productoId: match.group.productoId,
          varianteId: match.variant.id,
          nombreDisplay: match.group.hasVariants
            ? `${match.group.baseName} - ${match.variant.nombreVariante}`
            : match.group.baseName,
          costoBase: match.variant.costoBase,
          colorFilamentoId: defaultFilId,
          coloresIds: defaultFilId ? [defaultFilId] : [],
          personalizacion: '',
          cantidad: 1,
          tipoPrecio: 'MENOR',
          precioUnitario: match.variant.precioMenor,
          costoPackaging: '',
          porcentajeAdicional: 0,
          gramosConsumidos: 0,
          imageUrl: match.variant.imagenUrl || match.group.imagenUrl || null
        }
      }
    }

    return {
      id: `item-${Date.now()}-${suffix}`,
      productoId: '',
      varianteId: '',
      nombreDisplay: '',
      costoBase: 0,
      colorFilamentoId: defaultFilId,
      coloresIds: defaultFilId ? [defaultFilId] : [],
      personalizacion: '',
      cantidad: 1,
      tipoPrecio: 'MENOR',
      precioUnitario: '',
      costoPackaging: '',
      porcentajeAdicional: 0,
      gramosConsumidos: 0,
      imageUrl: null
    }
  }

  const [formItems, setFormItems] = useState<FormItemState[]>(() => {
    return [getDefaultItemState('1')]
  })

  const resetForm = () => {
    const presetId = initialProductoId || (typeof window !== 'undefined' ? sessionStorage.getItem('nova_preselected_product_id') || undefined : undefined)
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormCliente('')
    setFormTelefono('')
    setFormCanal('WhatsApp')
    setFormHandleSocial('')
    setSelectedClientOption(null)
    setClientSelectMode((clientesList || []).length > 0 ? 'EXISTING' : 'NEW')
    setClientSearchTerm('')
    setIsClientDropdownOpen(false)
    setFormDestino('')
    setFormDiaEntrega('')
    setFormNotas('')
    setFormCostoEnvio('')
    setFormHasCaja(true)
    setFormCajasLotId(stockCajas?.loteReciente50?.id || stockCajas?.lotes?.[0]?.id || '')
    setFormCajasCantidad(1)
    setFormMontoPagado('')
    setFormMetodoPago('YAPE')
    setFormNotasPago('')
    setFormItems([getDefaultItemState('1', presetId)])
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, initialProductoId])

  const handleSelectClient = (c: ClienteOption) => {
    setSelectedClientOption(c)
    setClientSelectMode('EXISTING')
    setFormCliente(c.nombre)
    if (c.telefono) setFormTelefono(c.telefono)
    if (c.handleSocial) setFormHandleSocial(c.handleSocial)
    if (c.canalOrigen || c.canalPreferido) setFormCanal(c.canalOrigen || c.canalPreferido || 'WhatsApp')
    const dir = c.destinoEnvio || c.direccion || c.distrito || ''
    if (dir) setFormDestino(dir)
    setIsClientDropdownOpen(false)
    setClientSearchTerm('')
  }

  const handleClearSelectedClient = () => {
    setSelectedClientOption(null)
    setIsClientDropdownOpen(true)
  }

  const handleSwitchToNewClient = (presetName = '') => {
    setSelectedClientOption(null)
    setClientSelectMode('NEW')
    setFormCliente(presetName || clientSearchTerm.trim() || formCliente || '')
    setIsClientDropdownOpen(false)
  }

  const handleRegisterClientInline = async () => {
    if (!formCliente.trim()) {
      toast.error('Ingresa al menos el nombre del cliente')
      return
    }
    setIsRegisteringClientInline(true)
    try {
      const created = await createCliente({
        nombre: formCliente.trim(),
        telefono: formTelefono.trim() || undefined,
        handleSocial: formHandleSocial.trim() || undefined,
        canalOrigen: formCanal,
        direccion: formDestino.trim() || undefined
      })
      const newOption: ClienteOption = {
        id: created.id,
        nombre: created.nombre,
        telefono: created.telefono,
        handleSocial: created.handleSocial,
        canalOrigen: created.canalOrigen,
        canalPreferido: created.canalOrigen,
        direccion: created.direccion
      }
      if (onClientAdded) {
        onClientAdded(newOption)
      }
      setSelectedClientOption(newOption)
      setClientSelectMode('EXISTING')
      toast.success(`Cliente "${created.nombre}" guardado y vinculado`)
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar cliente')
    } finally {
      setIsRegisteringClientInline(false)
    }
  }

  const addItem = () => {
    setFormItems(prev => [
      ...prev,
      getDefaultItemState(Math.random().toString(36).substring(2, 6))
    ])
  }

  const removeItem = (id: string) => {
    if (formItems.length <= 1) return
    setFormItems(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<FormItemState>) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const merged = { ...item, ...updates }
      const catalogGroups = groupCatalogProducts(productos)
      const targetId = updates.varianteId || updates.productoId || merged.varianteId || merged.productoId

      if (updates.productoId || updates.varianteId) {
        const match = findVariantInGroups(catalogGroups, targetId)
        if (match) {
          merged.varianteId = match.variant.id
          merged.productoId = match.group.productoId
          if (!updates.nombreDisplay) {
            merged.nombreDisplay = match.group.hasVariants
              ? `${match.group.baseName} - ${match.variant.nombreVariante}`
              : match.group.baseName
          }
          if (updates.costoBase === undefined) {
            merged.costoBase = match.variant.costoBase
          }
          if (updates.imageUrl !== undefined) {
            merged.imageUrl = updates.imageUrl
          } else {
            merged.imageUrl = match.variant.imagenUrl || match.group.imagenUrl || null
          }
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
    }))
  }

  // Filtrado de clientes para el autocompletado
  const filteredClientOptions = useMemo(() => {
    if (!clientSearchTerm.trim()) {
      return (clientesList || []).slice(0, 30)
    }
    const q = clientSearchTerm.trim().toLowerCase()
    const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return (clientesList || []).filter(c => {
      const n = (c.nombre || '').toLowerCase()
      const nNorm = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const t = c.telefono || ''
      const h = (c.handleSocial || '').toLowerCase()
      return n.includes(q) || nNorm.includes(qNorm) || t.includes(q) || h.includes(q)
    }).slice(0, 20)
  }, [clientesList, clientSearchTerm])

  // Detección preventiva de duplicados en modo nuevo
  const similarExistingClient = useMemo(() => {
    if (clientSelectMode !== 'NEW' || !formCliente.trim()) return null
    const cleanInput = formCliente.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return (clientesList || []).find(c => {
      const cleanC = (c.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return cleanC === cleanInput || (cleanInput.length >= 4 && cleanC.includes(cleanInput))
    }) || null
  }, [clientSelectMode, formCliente, clientesList])

  // Cálculos reactivos de totales
  const totalItemsCount = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
  }, [formItems])

  const subtotalCalculado = useMemo(() => {
    return formItems.reduce((acc, it) => {
      const q = Math.max(1, Number(it.cantidad) || 1)
      const p = Math.max(0, Number(it.precioUnitario) || 0)
      const pack = Math.max(0, Number(it.costoPackaging) || 0)
      return acc + ((p + pack) * q)
    }, 0)
  }, [formItems])

  const costoEnvioNum = Math.max(0, Number(formCostoEnvio) || 0)
  const totalCalculado = Number((subtotalCalculado + costoEnvioNum).toFixed(2))
  const montoPagadoNum = Math.min(totalCalculado, Math.max(0, Number(formMontoPagado) || 0))
  const saldoPendienteNum = Math.max(0, Number((totalCalculado - montoPagadoNum).toFixed(2)))

  const setPayment50Percent = () => {
    setFormMontoPagado((totalCalculado * 0.5).toFixed(2))
  }

  const setPayment100Percent = () => {
    setFormMontoPagado(totalCalculado.toFixed(2))
  }

  const setPaymentZero = () => {
    setFormMontoPagado('0')
  }

  return {
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
    subtotalCalculado,
    totalCalculado,
    montoPagadoNum,
    saldoPendienteNum,
    setPayment50Percent,
    setPayment100Percent,
    setPaymentZero
  }
}
