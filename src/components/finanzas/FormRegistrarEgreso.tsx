'use client'

import React, { useState, useMemo } from 'react'
import { 
  ShoppingBag, 
  Tag, 
  Palette, 
  Package, 
  Calculator, 
  Sparkles, 
  Plus, 
  Minus, 
  CreditCard, 
  Check, 
  X,
  Loader2 
} from 'lucide-react'

// Categorías principales
export const CATEGORIAS_EGRESO = [
  { id: 'INSUMO', label: 'Insumo / Materiales' },
  { id: 'ACTIVO_FIJO', label: 'Activo Fijo / Herramientas' },
  { id: 'EMPAQUE', label: 'Empaque / Despacho' },
  { id: 'SERVICIO', label: 'Servicios / Publicidad' },
] as const

// Presentaciones frecuentes
export const PRESENTACIONES_RAPIDAS = [
  'Bobina 1Kg',
  'Refill 1Kg',
  'Unidad',
  'Pack x10',
  'Pack x50',
]

// Medios de pago
export const MEDIOS_PAGO = [
  'YAPE / PLIN',
  'BCP Transferencia',
  'Tarjeta Débito/Crédito',
  'Efectivo en Taller',
]

export interface EgresoFormData {
  categoria: string
  subcategoria: string
  itemConcepto: string
  especificacionColor: string | null
  presentacion: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio: number
  metodoPago: string
}

interface FormRegistrarEgresoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EgresoFormData) => Promise<void>
  initialData?: Partial<EgresoFormData>
  existingTags?: string[]
  isEditing?: boolean
}

export function FormRegistrarEgreso({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingTags = [],
  isEditing = false,
}: FormRegistrarEgresoProps) {
  const [categoria, setCategoria] = useState(initialData?.categoria || 'INSUMO')
  const [subcategoria, setSubcategoria] = useState(initialData?.subcategoria || (existingTags.length > 0 ? existingTags[0] : ''))
  const [concepto, setConcepto] = useState(initialData?.itemConcepto || '')
  const [color, setColor] = useState(initialData?.especificacionColor || '')
  const [presentacion, setPresentacion] = useState(initialData?.presentacion || 'Bobina 1Kg')
  const [cantidad, setCantidad] = useState(initialData?.cantidad?.toString() || '1')
  const [costoUnitario, setCostoUnitario] = useState(initialData?.costoUnitario?.toString() || '')
  const [costoEnvio, setCostoEnvio] = useState(initialData?.costoEnvio?.toString() || '0')
  const [metodoPago, setMetodoPago] = useState(initialData?.metodoPago || 'YAPE / PLIN')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Steppers
  const handleIncrement = () => {
    const current = parseInt(cantidad) || 0
    setCantidad((current + 1).toString())
  }

  const handleDecrement = () => {
    const current = parseInt(cantidad) || 1
    if (current > 1) {
      setCantidad((current - 1).toString())
    }
  }

  // 4. Tarjeta de Cálculo Automático (Live)
  const calculos = useMemo(() => {
    const cant = Math.max(1, parseInt(cantidad) || 1)
    const unit = Math.max(0, parseFloat(costoUnitario) || 0)
    const envio = Math.max(0, parseFloat(costoEnvio) || 0)

    // Total Calculado = (Cantidad * Costo Unit.) + Flete
    const totalCalculado = (cant * unit) + envio

    // Costo Real Unitario = Total Calculado / Cantidad
    const costoRealUnitario = totalCalculado / cant

    // Verificación si es filamento
    const isFilamento = 
      subcategoria.toLowerCase().includes('filamento') || 
      subcategoria.toLowerCase().includes('bobina') ||
      subcategoria.toLowerCase().includes('refill') ||
      concepto.toLowerCase().includes('pla') ||
      concepto.toLowerCase().includes('petg') ||
      concepto.toLowerCase().includes('abs')

    // Gramos totales del lote (1,000 g por cada bobina/refill de 1Kg)
    let totalGramos = cant * 1000
    if (presentacion.toLowerCase().includes('500g')) {
      totalGramos = cant * 500
    }

    // Costo Real por Gramo (S/ por gramo)
    const costoPorGramo = totalGramos > 0 ? totalCalculado / totalGramos : null

    return {
      totalCalculado,
      costoRealUnitario,
      costoPorGramo,
      totalGramos,
      isFilamento,
    }
  }, [cantidad, costoUnitario, costoEnvio, subcategoria, concepto, presentacion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!concepto.trim() || !costoUnitario) return

    setIsSubmitting(true)
    try {
      let dbCategoria = categoria
      if (categoria === 'EMPAQUE') dbCategoria = 'INSUMO'

      await onSubmit({
        categoria: dbCategoria,
        subcategoria: subcategoria.trim(),
        itemConcepto: concepto.trim(),
        especificacionColor: color.trim() || null,
        presentacion: presentacion.trim() || null,
        cantidad: parseInt(cantidad) || 1,
        costoUnitario: parseFloat(costoUnitario) || 0,
        costoEnvio: parseFloat(costoEnvio) || 0,
        metodoPago,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[620px] bg-card text-foreground border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal Fija */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                {isEditing ? 'Editar Egreso / Insumo' : 'Registrar Egreso / Insumo'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control de compras de filamento, packaging y gastos operativos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario con Scroll Interno y Footer Fijo */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
            {/* 1. Categoría y Subcategoría */}
            <div className="space-y-3">
              {/* Selector de Categoría Principal */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90 flex items-center justify-between mb-1.5">
                  <span>Categoría Principal <span className="text-primary">*</span></span>
                  <span className="text-[11px] text-muted-foreground font-normal">Tipo de egreso</span>
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full h-9 bg-background border border-border/80 text-foreground rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium cursor-pointer"
                >
                  {CATEGORIAS_EGRESO.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags existentes únicamente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground/90 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    Tag / Subcategoría <span className="text-primary">*</span>
                  </label>
                  {existingTags.length > 0 && (
                    <span className="text-[11px] text-muted-foreground font-normal">Tags existentes ({existingTags.length})</span>
                  )}
                </div>

                {existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {existingTags.map((tag) => {
                      const isSelected = subcategoria.trim().toLowerCase() === tag.trim().toLowerCase()
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSubcategoria(tag)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                              : 'bg-muted/40 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/70'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary" />}
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                )}

                <input
                  type="text"
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  placeholder="Escribe o selecciona un tag..."
                  required
                  className="w-full h-9 bg-background border border-border/80 text-foreground placeholder:text-muted-foreground rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* 2. Detalles del Insumo */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90 block mb-1.5">
                  Concepto / Nombre del Insumo <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Filamento PLA Matte Negro, Cajas 15x15x15..."
                  required
                  className="w-full h-9 bg-background border border-border/80 text-foreground placeholder:text-muted-foreground rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90 flex items-center gap-1.5 mb-1.5">
                    <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                    Color / Especificación
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej: Negro / 0.4mm / Transparente"
                    className="w-full h-9 bg-background border border-border/80 text-foreground placeholder:text-muted-foreground rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90 flex items-center gap-1.5 mb-1.5">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    Presentación
                  </label>
                  <select
                    value={presentacion}
                    onChange={(e) => setPresentacion(e.target.value)}
                    className="w-full h-9 bg-background border border-border/80 text-foreground rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    {PRESENTACIONES_RAPIDAS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Costos y Cantidades */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cantidad con Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90 block mb-1.5">
                    Cantidad <span className="text-primary">*</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="h-9 px-2.5 bg-background border border-r-0 border-border/80 rounded-l-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      required
                      className="w-full bg-background border border-border/80 text-foreground text-center font-mono font-semibold text-sm h-9 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="h-9 px-2.5 bg-background border border-l-0 border-border/80 rounded-r-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Costo Unitario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90 block mb-1.5">
                    Costo Unit. (S/) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground font-semibold">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costoUnitario}
                      onChange={(e) => setCostoUnitario(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full pl-8 bg-background border border-border/80 text-foreground text-sm font-mono font-semibold h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Flete / Envío */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90 block mb-1.5">
                    Flete / Envío (S/)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground font-semibold">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costoEnvio}
                      onChange={(e) => setCostoEnvio(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 bg-background border border-border/80 text-foreground text-sm font-mono h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Medio de Pago */}
              <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <label className="text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  Medio de Pago:
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="bg-background border border-border/80 text-foreground rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {MEDIOS_PAGO.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Tarjeta de Cálculo Automático (Live Preview) */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Cálculo Automático
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {/* Total Calculado */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Calculado</span>
                  <div className="text-lg font-semibold text-foreground font-mono tabular-nums tracking-tight">
                    {formatCurrency(calculos.totalCalculado)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block">(Cant. × Unit.) + Flete</span>
                </div>

                {/* Costo Real Unitario */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Costo Real Unitario</span>
                  <div className="text-base font-semibold text-foreground font-mono tabular-nums tracking-tight">
                    {formatCurrency(calculos.costoRealUnitario)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block">Total / Cantidad</span>
                </div>

                {/* Costo Real por Gramo */}
                {calculos.costoPorGramo !== null && (
                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Costo por Gramo</span>
                    <div className="text-base font-semibold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                      S/ {calculos.costoPorGramo.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">/ g</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">({calculos.totalGramos}g lote total)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Footer Fijo con Botones Funcionales */}
          <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xs px-3.5 py-2 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 py-2 rounded-lg shadow-none cursor-pointer disabled:opacity-50 flex items-center justify-center transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Egreso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
