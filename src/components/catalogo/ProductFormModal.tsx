'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  X, 
  Boxes, 
  Pencil, 
  Trash2, 
  Plus, 
  Calendar, 
  Calculator, 
  Archive, 
  Layers,
  Sparkles,
  Link,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  createProducto, 
  updateProducto, 
  saveProductoConVariantes, 
  obtenerMetadataMakerworld 
} from '@/actions/productos'
import type { ProductoItem } from './CatalogoClient'
import { extractBaseAndVariant, ProductGroupRow } from './ProductsTableView'

export interface VariantFormItem {
  id?: string
  nombreVersion: string
  costoBase: string
  precioMenor: string
  precioMayor: string
}

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (savedProducts: ProductoItem[], deletedIds: string[], baseName: string) => void
  onDeleteProduct?: (p: ProductoItem) => void
  editingProduct?: ProductoItem | null
  editingGroup?: ProductGroupRow | null
  initialBaseName?: string
  initialCategoria?: string
  initialVariantName?: string
  categoryNamesList: string[]
  allCatalogProductos?: ProductoItem[]
  is3D: boolean
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  onDeleteProduct,
  editingProduct,
  editingGroup,
  initialBaseName,
  initialCategoria,
  initialVariantName,
  categoryNamesList,
  allCatalogProductos = [],
  is3D
}: ProductFormModalProps) {
  // Helpers de fecha
  const getTodayDateString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDateInputString = (val?: string | Date | null) => {
    if (!val) return getTodayDateString()
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.split('T')[0]
    }
    const d = new Date(val)
    if (isNaN(d.getTime())) return getTodayDateString()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Margen reactivo helper
  const calcMargen = (precio: number, costo: number) => {
    if (costo <= 0) return precio > 0 ? '+100%' : '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  const calcGanancia = (precio: number, costo: number) => {
    const diff = precio - costo
    return diff >= 0 ? `+S/ ${diff.toFixed(2)}` : `-S/ ${Math.abs(diff).toFixed(2)}`
  }

  // Estados del Formulario
  const [nombreModelo, setNombreModelo] = useState('')
  const [lineaCategoria, setLineaCategoria] = useState('')
  const [fechaRegistro, setFechaRegistro] = useState(getTodayDateString())
  const [activo, setActivo] = useState(true)

  // MakerWorld & Portada
  const [imagenUrl, setImagenUrl] = useState('')
  const [enlaceMakerworld, setEnlaceMakerworld] = useState('')
  const [isFetchingMakerworld, setIsFetchingMakerworld] = useState(false)

  // Switch de versiones
  const [hasVariants, setHasVariants] = useState(false)

  // Campos para producto simple
  const [simpleCostoBase, setSimpleCostoBase] = useState('0.00')
  const [simplePrecioMenor, setSimplePrecioMenor] = useState('0.00')
  const [simplePrecioMayor, setSimplePrecioMayor] = useState('0.00')

  // Lista dinámica de variantes
  const [variants, setVariants] = useState<VariantFormItem[]>([])
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detección y extracción automática de portada MakerWorld
  const triggerMakerworldFetch = useCallback(async (urlToTest: string) => {
    const trimmed = urlToTest.trim()
    if (!trimmed) return

    // 1. Si el usuario pegó directamente una URL de imagen
    if (
      trimmed.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) || 
      trimmed.includes('bblmw.com') ||
      trimmed.includes('bblamb.com')
    ) {
      setImagenUrl(trimmed)
      toast.info('Se detectó y asignó la URL de imagen directamente')
      return
    }

    // 2. Si es un enlace de MakerWorld
    if (trimmed.includes('makerworld.com') || trimmed.match(/models\/[0-9]+/i)) {
      setIsFetchingMakerworld(true)
      try {
        const res = await obtenerMetadataMakerworld(trimmed)
        if (res.success && res.imagenUrl) {
          setImagenUrl(res.imagenUrl)
          toast.success('¡Portada de MakerWorld obtenida automáticamente!')
        } else {
          toast.info(res.error || 'Copia la dirección de imagen desde MakerWorld y pégala abajo')
        }
      } catch {
        toast.error('Error al consultar MakerWorld')
      } finally {
        setIsFetchingMakerworld(false)
      }
    }
  }, [])

  // Al pegar en el campo de enlace de MakerWorld
  const handlePasteEnlaceMakerworld = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText && pastedText.trim()) {
      setEnlaceMakerworld(pastedText)
      triggerMakerworldFetch(pastedText)
    }
  }

  // Al tipear en el campo
  const handleEnlaceMakerworldChange = (val: string) => {
    setEnlaceMakerworld(val)
    const trimmed = val.trim()
    if (
      trimmed.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) || 
      trimmed.includes('bblmw.com') ||
      trimmed.includes('bblamb.com')
    ) {
      setImagenUrl(trimmed)
      return
    }
    // Si contiene la estructura del modelo MakerWorld
    if (
      (trimmed.includes('makerworld.com') && trimmed.includes('/models/'))
    ) {
      triggerMakerworldFetch(trimmed)
    }
  }

  // Extraer portada manual si el usuario pulsa el botón
  const handleAutoObtenerPortada = async () => {
    if (!enlaceMakerworld.trim()) return
    await triggerMakerworldFetch(enlaceMakerworld)
  }

  // Inicialización cuando cambia el modal o el producto/grupo a editar
  useEffect(() => {
    if (!isOpen) return

    setDeletedVariantIds([])

    // Caso A: Edición de grupo completo
    if (editingGroup) {
      setNombreModelo(editingGroup.baseName)
      setLineaCategoria(editingGroup.lineaCategoria || categoryNamesList[0] || 'General')
      setFechaRegistro(getDateInputString(editingGroup.latestCreatedAt))
      setActivo(editingGroup.hasActive)
      setHasVariants(true)
      setImagenUrl(editingGroup.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || '')
      setEnlaceMakerworld(editingGroup.variants.find((v) => v.producto.enlaceMakerworld)?.producto.enlaceMakerworld || '')

      setVariants(
        editingGroup.variants.map((v) => ({
          id: v.producto.id,
          nombreVersion: v.variantName,
          costoBase: Number(v.producto.costoBase || 0).toFixed(2),
          precioMenor: Number(v.producto.precioMenor || 0).toFixed(2),
          precioMayor: Number(v.producto.precioMayor || 0).toFixed(2),
        }))
      )
      return
    }

    // Caso B: Edición de producto individual
    if (editingProduct) {
      const { baseName, variantName } = extractBaseAndVariant(editingProduct.nombreModelo)
      
      // Buscar si tiene variantes hermanas en el catálogo
      const siblingProducts = allCatalogProductos.filter((p) => {
        const info = extractBaseAndVariant(p.nombreModelo)
        return (
          info.baseName.toLowerCase().trim() === baseName.toLowerCase().trim() &&
          (p.lineaCategoria || '').toLowerCase().trim() === (editingProduct.lineaCategoria || '').toLowerCase().trim()
        )
      })

      if (siblingProducts.length > 1) {
        // Pertenece a un grupo con variantes
        setNombreModelo(baseName)
        setLineaCategoria(editingProduct.lineaCategoria || 'General')
        setFechaRegistro(getDateInputString(editingProduct.createdAt))
        setActivo(editingProduct.activo)
        setHasVariants(true)
        setImagenUrl(editingProduct.imagenUrl || siblingProducts.find((p) => p.imagenUrl)?.imagenUrl || '')
        setEnlaceMakerworld(editingProduct.enlaceMakerworld || siblingProducts.find((p) => p.enlaceMakerworld)?.enlaceMakerworld || '')

        // Ordenamos las variantes por costo base ascendente
        const sortedSiblings = [...siblingProducts].sort((a, b) => (a.costoBase || 0) - (b.costoBase || 0))
        setVariants(
          sortedSiblings.map((p) => {
            const vInfo = extractBaseAndVariant(p.nombreModelo)
            return {
              id: p.id,
              nombreVersion: vInfo.variantName,
              costoBase: Number(p.costoBase || 0).toFixed(2),
              precioMenor: Number(p.precioMenor || 0).toFixed(2),
              precioMayor: Number(p.precioMayor || 0).toFixed(2),
            }
          })
        )
      } else {
        // Producto simple individual
        setNombreModelo(editingProduct.nombreModelo)
        setLineaCategoria(editingProduct.lineaCategoria || 'General')
        setFechaRegistro(getDateInputString(editingProduct.createdAt))
        setActivo(editingProduct.activo)
        setHasVariants(false)
        setImagenUrl(editingProduct.imagenUrl || '')
        setEnlaceMakerworld(editingProduct.enlaceMakerworld || '')

        setSimpleCostoBase(Number(editingProduct.costoBase || 0).toFixed(2))
        setSimplePrecioMenor(Number(editingProduct.precioMenor || 0).toFixed(2))
        setSimplePrecioMayor(Number(editingProduct.precioMayor || 0).toFixed(2))

        // Preparamos variante 1 por si activa el switch
        setVariants([
          {
            id: editingProduct.id,
            nombreVersion: '1 Color',
            costoBase: Number(editingProduct.costoBase || 0).toFixed(2),
            precioMenor: Number(editingProduct.precioMenor || 0).toFixed(2),
            precioMayor: Number(editingProduct.precioMayor || 0).toFixed(2),
          },
        ])
      }
      return
    }

    // Caso C: Creación rápida con baseName preset (ej: desde "+ Agregar Versión")
    if (initialBaseName) {
      setNombreModelo(initialBaseName)
      setLineaCategoria(initialCategoria || categoryNamesList[0] || 'General')
      setFechaRegistro(getTodayDateString())
      setActivo(true)
      setHasVariants(true)
      setImagenUrl(allCatalogProductos.find((p) => extractBaseAndVariant(p.nombreModelo).baseName.toLowerCase().trim() === initialBaseName.toLowerCase().trim() && p.imagenUrl)?.imagenUrl || '')
      setEnlaceMakerworld(allCatalogProductos.find((p) => extractBaseAndVariant(p.nombreModelo).baseName.toLowerCase().trim() === initialBaseName.toLowerCase().trim() && p.enlaceMakerworld)?.enlaceMakerworld || '')

      // Buscar si ya existen variantes de ese modelo base
      const existingSiblings = allCatalogProductos.filter((p) => {
        const info = extractBaseAndVariant(p.nombreModelo)
        return (
          info.baseName.toLowerCase().trim() === initialBaseName.toLowerCase().trim() &&
          (p.lineaCategoria || '').toLowerCase().trim() === (initialCategoria || '').toLowerCase().trim()
        )
      })

      if (existingSiblings.length > 0) {
        const existingVars: VariantFormItem[] = existingSiblings.map((p) => {
          const vInfo = extractBaseAndVariant(p.nombreModelo)
          return {
            id: p.id,
            nombreVersion: vInfo.variantName,
            costoBase: Number(p.costoBase || 0).toFixed(2),
            precioMenor: Number(p.precioMenor || 0).toFixed(2),
            precioMayor: Number(p.precioMayor || 0).toFixed(2),
          }
        })
        // Añadimos la nueva variante al final
        existingVars.push({
          nombreVersion: initialVariantName || '',
          costoBase: is3D ? '10.00' : '0.00',
          precioMenor: is3D ? '30.00' : '0.00',
          precioMayor: is3D ? '20.00' : '0.00',
        })
        setVariants(existingVars)
      } else {
        setVariants([
          {
            nombreVersion: initialVariantName || '1 Color',
            costoBase: is3D ? '10.00' : '0.00',
            precioMenor: is3D ? '30.00' : '0.00',
            precioMayor: is3D ? '20.00' : '0.00',
          },
        ])
      }
      return
    }

    // Caso D: Nuevo Producto desde cero
    setNombreModelo('')
    setLineaCategoria(categoryNamesList[0] || 'General')
    setFechaRegistro(getTodayDateString())
    setActivo(true)
    setHasVariants(false)
    setImagenUrl('')
    setEnlaceMakerworld('')

    setSimpleCostoBase(is3D ? '10.00' : '0.00')
    setSimplePrecioMenor(is3D ? '30.00' : '0.00')
    setSimplePrecioMayor(is3D ? '20.00' : '0.00')

    setVariants([
      {
        nombreVersion: '1 Color',
        costoBase: is3D ? '10.00' : '0.00',
        precioMenor: is3D ? '30.00' : '0.00',
        precioMayor: is3D ? '20.00' : '0.00',
      },
      {
        nombreVersion: 'Multicolor',
        costoBase: is3D ? '15.00' : '0.00',
        precioMenor: is3D ? '45.00' : '0.00',
        precioMayor: is3D ? '30.00' : '0.00',
      },
    ])
  }, [
    isOpen,
    editingProduct,
    editingGroup,
    initialBaseName,
    initialCategoria,
    initialVariantName,
    categoryNamesList,
    allCatalogProductos,
    is3D,
  ])

  // Manejo de cambio en el Switch
  const handleToggleVariants = (checked: boolean) => {
    setHasVariants(checked)
    if (checked && variants.length === 0) {
      setVariants([
        {
          nombreVersion: '1 Color',
          costoBase: simpleCostoBase,
          precioMenor: simplePrecioMenor,
          precioMayor: simplePrecioMayor,
        },
        {
          nombreVersion: 'Multicolor',
          costoBase: (parseFloat(simpleCostoBase) * 1.5 || 15).toFixed(2),
          precioMenor: (parseFloat(simplePrecioMenor) * 1.5 || 45).toFixed(2),
          precioMayor: (parseFloat(simplePrecioMayor) * 1.5 || 30).toFixed(2),
        },
      ])
    }
  }

  // Modificar campo de una variante
  const updateVariantField = (index: number, field: keyof VariantFormItem, val: string) => {
    setVariants((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  // Agregar fila de variante
  const handleAddVariantRow = () => {
    const lastVariant = variants[variants.length - 1]
    const nextCosto = lastVariant ? lastVariant.costoBase : is3D ? '10.00' : '0.00'
    const nextMenor = lastVariant ? lastVariant.precioMenor : is3D ? '30.00' : '0.00'
    const nextMayor = lastVariant ? lastVariant.precioMayor : is3D ? '20.00' : '0.00'

    setVariants((prev) => [
      ...prev,
      {
        nombreVersion: '',
        costoBase: nextCosto,
        precioMenor: nextMenor,
        precioMayor: nextMayor,
      },
    ])
  }

  // Eliminar fila de variante
  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return
    const target = variants[index]
    if (target.id) {
      setDeletedVariantIds((prev) => [...prev, target.id!])
    }
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  // Guardar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedBase = nombreModelo.trim()
    if (!trimmedBase) {
      toast.error('El nombre del modelo es obligatorio')
      return
    }

    const trimmedCat = lineaCategoria.trim() || 'General'

    setIsSubmitting(true)

    try {
      let finalImagenUrl = imagenUrl.trim() || null
      // Si se ingresó link de MakerWorld pero la portada no se cargó aún, obtenerla antes de guardar
      if (!finalImagenUrl && enlaceMakerworld.trim()) {
        try {
          const meta = await obtenerMetadataMakerworld(enlaceMakerworld)
          if (meta.success && meta.imagenUrl) {
            finalImagenUrl = meta.imagenUrl
            setImagenUrl(meta.imagenUrl)
          }
        } catch {
          // Continuar sin bloquear si falla
        }
      }

      if (!hasVariants) {
        // =========================================================================
        // PRODUCTO SIMPLE (hasVariants === false)
        // =========================================================================
        const costoNum = parseFloat(simpleCostoBase) || 0
        const precioMenorNum = parseFloat(simplePrecioMenor) || 0
        const precioMayorNum = parseFloat(simplePrecioMayor) || 0

        if (editingProduct && !editingGroup) {
          const updated = await updateProducto(editingProduct.id, {
            nombreModelo: trimmedBase,
            lineaCategoria: trimmedCat,
            costoBase: costoNum,
            precioMenor: precioMenorNum,
            precioMayor: precioMayorNum,
            activo: activo,
            fechaRegistro: fechaRegistro,
            imagenUrl: finalImagenUrl,
            enlaceMakerworld: enlaceMakerworld.trim() || null,
          })
          toast.success(`Modelo "${trimmedBase}" actualizado correctamente`)
          onSaved([updated], [], trimmedBase)
        } else {
          const created = await createProducto({
            nombreModelo: trimmedBase,
            lineaCategoria: trimmedCat,
            costoBase: costoNum,
            precioMenor: precioMenorNum,
            precioMayor: precioMayorNum,
            activo: activo,
            fechaRegistro: fechaRegistro,
            imagenUrl: finalImagenUrl,
            enlaceMakerworld: enlaceMakerworld.trim() || null,
          })
          toast.success(`Modelo "${trimmedBase}" registrado en catálogo`)
          onSaved([created], [], trimmedBase)
        }
      } else {
        // =========================================================================
        // PRODUCTO CON MÚLTIPLES VERSIONES (hasVariants === true)
        // =========================================================================
        if (variants.length === 0) {
          toast.error('Debe registrar al menos una versión o set')
          setIsSubmitting(false)
          return
        }

        // Validar que las versiones tengan nombre
        for (let i = 0; i < variants.length; i++) {
          if (!variants[i].nombreVersion.trim()) {
            toast.error(`Por favor ingresa el nombre de la versión #${i + 1}`)
            setIsSubmitting(false)
            return
          }
        }

        const payloadVariantes = variants.map((v) => ({
          id: v.id,
          nombreVersion: v.nombreVersion.trim(),
          costoBase: parseFloat(v.costoBase) || 0,
          precioMenor: parseFloat(v.precioMenor) || 0,
          precioMayor: parseFloat(v.precioMayor) || 0,
        }))

        const result = await saveProductoConVariantes({
          baseName: trimmedBase,
          lineaCategoria: trimmedCat,
          fechaRegistro: fechaRegistro,
          activo: activo,
          imagenUrl: finalImagenUrl,
          enlaceMakerworld: enlaceMakerworld.trim() || null,
          variantes: payloadVariantes,
          deletedVariantIds: deletedVariantIds,
        })

        toast.success(
          `Modelo "${trimmedBase}" guardado con ${result.saved.length} versiones`
        )
        onSaved(result.saved, result.deletedIds, trimmedBase)
      }

      onClose()
    } catch (err: any) {
      toast.error('Error al guardar producto: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = Boolean(editingProduct || editingGroup)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="bg-card border border-border text-foreground w-[96vw] sm:max-w-[700px] max-h-[94dvh] overflow-y-auto p-0 rounded-2xl shadow-2xl z-50"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-border/80 flex items-center justify-center shrink-0 shadow-2xs">
                {isEditing ? <Pencil className="h-5 w-5" /> : <Boxes className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                  {isEditing
                    ? is3D ? 'Editar Modelo 3D' : 'Editar Juego de Mesa'
                    : is3D ? 'Registrar Nuevo Producto 3D' : 'Registrar Juego de Mesa'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Gestiona precios, configuraciones y versiones del catálogo
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Fila 1: Nombre, Categoría & Fecha de Registro */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {hasVariants ? 'Nombre Base del Modelo *' : (is3D ? 'Nombre del Modelo *' : 'Nombre del Juego *')}
                </Label>
                <Input
                  value={nombreModelo}
                  onChange={(e) => setNombreModelo(e.target.value)}
                  placeholder={hasVariants ? "Ej: Mansiones de la Locura, SETI Organizador" : (is3D ? "Ej: Maceta Hexagonal XL" : "Ej: Catan")}
                  required
                  autoFocus
                  className="bg-background border-input rounded-xl text-sm font-bold text-foreground h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3 w-3 text-primary" />
                    Categoría / Familia *
                  </Label>
                  <Input
                    value={lineaCategoria}
                    onChange={(e) => setLineaCategoria(e.target.value)}
                    placeholder="Ej: Organizadores, Decoración, Figuras"
                    required
                    list="categorias-modal-list"
                    className="bg-background border-input rounded-xl text-sm font-bold text-foreground h-10"
                  />
                  <datalist id="categorias-modal-list">
                    {categoryNamesList.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    Fecha de Registro
                  </Label>
                  <Input
                    type="date"
                    value={fechaRegistro}
                    onChange={(e) => setFechaRegistro(e.target.value)}
                    className="bg-background border-input rounded-xl text-sm font-bold text-foreground h-10 cursor-pointer"
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECCIÓN MAKERWORLD & PORTADA / MINIATURA                                  */}
              {/* ========================================================================= */}
              <div className="p-3.5 bg-secondary/35 border border-border/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    MakerWorld & Imagen de Portada
                  </span>
                  {enlaceMakerworld && (
                    <a
                      href={enlaceMakerworld}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Abrir enlace <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                  {/* Vista previa miniatura */}
                  <div className="sm:col-span-1 flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-border bg-background/60 text-center min-h-[96px]">
                    {isFetchingMakerworld ? (
                      <div className="flex flex-col items-center justify-center text-primary py-2 px-1 text-center animate-pulse">
                        <Loader2 className="h-6 w-6 mb-1.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-bold text-foreground">Obteniendo portada...</span>
                      </div>
                    ) : imagenUrl ? (
                      <div className="relative group w-18 h-18 rounded-lg overflow-hidden border border-border shadow-xs">
                        <img
                          src={imagenUrl}
                          alt="Portada del modelo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImagenUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer"
                          title="Quitar miniatura"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-1">
                        <ImageIcon className="h-6 w-6 mb-1 text-muted-foreground/60 stroke-[1.8]" />
                        <span className="text-[10px] font-medium">Sin miniatura</span>
                      </div>
                    )}
                  </div>

                  {/* Inputs */}
                  <div className="sm:col-span-3 space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Link de MakerWorld
                        </Label>
                        {isFetchingMakerworld && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" /> Auto-cargando portada...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={enlaceMakerworld}
                          onChange={(e) => handleEnlaceMakerworldChange(e.target.value)}
                          onPaste={handlePasteEnlaceMakerworld}
                          onBlur={() => {
                            if (enlaceMakerworld.trim() && !imagenUrl.trim() && !isFetchingMakerworld) {
                              triggerMakerworldFetch(enlaceMakerworld)
                            }
                          }}
                          placeholder="https://makerworld.com/es/models/..."
                          className="bg-background text-xs font-medium h-9 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAutoObtenerPortada}
                          disabled={!enlaceMakerworld.trim() || isFetchingMakerworld}
                          className="h-9 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          {isFetchingMakerworld ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Obtener Portada'
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                        URL Directa de la Imagen
                      </Label>
                      <Input
                        value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)}
                        placeholder="https://makerworld.bblmw.com/... o pega URL directa"
                        className="bg-background text-xs font-mono h-9"
                      />
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Tip: Haz clic derecho en la foto del modelo en MakerWorld → <em>Copiar dirección de la imagen</em> y pégala aquí.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TOGGLE TIPO DE PRODUCTO: SWITCH NOVA                                     */}
            {/* ========================================================================= */}
            <div className="p-3.5 bg-secondary/50 border border-border/90 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <label 
                    htmlFor="switch-multi-variants" 
                    className="text-sm font-semibold text-foreground cursor-pointer select-none"
                  >
                    ¿Este modelo tiene múltiples versiones o sets?
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Activa esta opción si el producto se vende en distintas configuraciones (ej: 1 Color / Multicolor, o Set de 3 / 4 / 5 jugadores).
                </p>
              </div>
              <Switch
                id="switch-multi-variants"
                checked={hasVariants}
                onCheckedChange={handleToggleVariants}
                className="shrink-0"
              />
            </div>

            {/* ========================================================================= */}
            {/* CASO A: SWITCH DESACTIVADO -> CAMPOS ESTÁNDAR DE PRODUCTO SIMPLE          */}
            {/* ========================================================================= */}
            {!hasVariants && (
              <div className="p-4 bg-secondary/30 border border-border rounded-xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    Estructura Financiera & Precios
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-card px-2 py-0.5 rounded-full border border-border">
                    Márgenes en tiempo real
                  </span>
                </div>

                {/* Costo Base */}
                <div className="space-y-1.5 p-3 bg-card rounded-xl border border-emerald-500/30 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Costo Base (S/) *
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      {is3D ? 'Costo unitario directo' : 'Costo de compra o importación'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      S/
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={simpleCostoBase}
                      onChange={(e) => setSimpleCostoBase(e.target.value)}
                      placeholder="0.00"
                      required={!hasVariants}
                      className="pl-8 bg-background border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-mono font-black h-10"
                    />
                  </div>
                </div>

                {/* Precios: Menor & Mayor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Menor */}
                  <div className="space-y-2 p-3 bg-card rounded-xl border border-primary/40 ring-1 ring-primary/10 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Precio por Menor (S/)</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-accent text-accent-foreground border-border">
                        Detal / PVP
                      </Badge>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">S/</span>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={simplePrecioMenor}
                        onChange={(e) => setSimplePrecioMenor(e.target.value)}
                        placeholder="0.00"
                        required={!hasVariants}
                        className="pl-8 bg-background border-primary/50 rounded-xl text-sm font-mono font-black h-10 text-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border/60">
                      <span className="text-muted-foreground">Margen:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          {calcMargen(parseFloat(simplePrecioMenor) || 0, parseFloat(simpleCostoBase) || 0)}
                        </span>
                        <span className="text-muted-foreground">
                          ({calcGanancia(parseFloat(simplePrecioMenor) || 0, parseFloat(simpleCostoBase) || 0)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mayor */}
                  <div className="space-y-2 p-3 bg-card rounded-xl border border-border ring-1 ring-border/50 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">Precio por Mayor (S/)</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-secondary text-muted-foreground border-border">
                        Volumen / B2B
                      </Badge>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground">S/</span>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={simplePrecioMayor}
                        onChange={(e) => setSimplePrecioMayor(e.target.value)}
                        placeholder="0.00"
                        required={!hasVariants}
                        className="pl-8 bg-background border-input rounded-xl text-sm font-mono font-black h-10 text-foreground"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border/60">
                      <span className="text-muted-foreground">Margen:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          {calcMargen(parseFloat(simplePrecioMayor) || 0, parseFloat(simpleCostoBase) || 0)}
                        </span>
                        <span className="text-muted-foreground">
                          ({calcGanancia(parseFloat(simplePrecioMayor) || 0, parseFloat(simpleCostoBase) || 0)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* CASO B: SWITCH ACTIVADO -> CONSTRUCTOR DINÁMICO DE VARIANTES             */}
            {/* ========================================================================= */}
            {hasVariants && (
              <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 space-y-3">
                {/* Cabecera del constructor */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Versiones del Modelo
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-card border border-border text-foreground">
                    {variants.length} {variants.length === 1 ? 'versión registrada' : 'versiones registradas'}
                  </Badge>
                </div>

                {/* Lista dinámica de filas de versión */}
                <div className="space-y-2.5">
                  {variants.map((v, index) => {
                    const costoNum = parseFloat(v.costoBase) || 0
                    const precioMenorNum = parseFloat(v.precioMenor) || 0
                    const precioMayorNum = parseFloat(v.precioMayor) || 0

                    return (
                      <div
                        key={v.id || `variant_${index}`}
                        className="bg-card border border-border/70 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center shadow-2xs"
                      >
                        {/* Nombre de Versión (sm:col-span-4) */}
                        <div className="sm:col-span-4 space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block sm:hidden">
                            Versión #{index + 1}
                          </span>
                          <Input
                            value={v.nombreVersion}
                            onChange={(e) => updateVariantField(index, 'nombreVersion', e.target.value)}
                            placeholder="Ej: 1 Color, Set 3 Jugadores"
                            required={hasVariants}
                            className="h-9 text-xs rounded-lg border-input bg-background font-medium"
                          />
                        </div>

                        {/* Costo Base (sm:col-span-2) */}
                        <div className="sm:col-span-2 space-y-1">
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
                            Costo (S/)
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={v.costoBase}
                            onChange={(e) => updateVariantField(index, 'costoBase', e.target.value)}
                            placeholder="0.00"
                            required={hasVariants}
                            className="h-9 text-xs rounded-lg border-input bg-background font-mono font-bold"
                          />
                        </div>

                        {/* Precio Menor (sm:col-span-2) con badge reactivo */}
                        <div className="sm:col-span-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                              Menor (S/)
                            </span>
                            <span className="text-[9px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                              {calcMargen(precioMenorNum, costoNum)}
                            </span>
                          </div>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={v.precioMenor}
                            onChange={(e) => updateVariantField(index, 'precioMenor', e.target.value)}
                            placeholder="0.00"
                            required={hasVariants}
                            className="h-9 text-xs rounded-lg border-input bg-background font-mono font-bold text-primary"
                          />
                        </div>

                        {/* Precio Mayor (sm:col-span-2) con badge reactivo */}
                        <div className="sm:col-span-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                              Mayor (S/)
                            </span>
                            <span className="text-[9px] font-mono font-bold text-primary">
                              {calcMargen(precioMayorNum, costoNum)}
                            </span>
                          </div>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={v.precioMayor}
                            onChange={(e) => updateVariantField(index, 'precioMayor', e.target.value)}
                            placeholder="0.00"
                            required={hasVariants}
                            className="h-9 text-xs rounded-lg border-input bg-background font-mono font-bold text-foreground"
                          />
                        </div>

                        {/* Acción Eliminar (sm:col-span-2 flex justify-end) */}
                        <div className="sm:col-span-2 flex items-center justify-end sm:pt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={variants.length <= 1}
                            onClick={() => handleRemoveVariant(index)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-25 cursor-pointer"
                            title={variants.length <= 1 ? "Debe conservar al menos una versión" : "Eliminar versión"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Botón inferior: + Agregar Otra Versión */}
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="variant-dashed-add border border-dashed border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold h-9 px-4 rounded-xl flex items-center justify-center gap-1.5 w-full transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>+ Agregar Otra Versión</span>
                </button>
              </div>
            )}

            {/* Fila: Estado del Producto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Estado de Disponibilidad
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActivo(true)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activo
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 shadow-2xs ring-1 ring-emerald-500/20'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-700" />
                  <span>Activo en Catálogo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivo(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !activo
                      ? 'bg-secondary text-muted-foreground border-border shadow-2xs ring-1 ring-border'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Archivado / Descontinuado</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-border">
            {editingProduct && onDeleteProduct && !editingGroup && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onDeleteProduct(editingProduct)}
                className="bg-card border-destructive text-destructive hover:bg-destructive/10 text-xs rounded-xl cursor-pointer mr-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Eliminar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs rounded-xl cursor-pointer text-muted-foreground border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 rounded-xl cursor-pointer shadow-xs"
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Guardar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
