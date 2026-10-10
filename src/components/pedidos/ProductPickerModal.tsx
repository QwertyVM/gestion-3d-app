'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  X,
  Boxes,
  Sparkles,
  PackageOpen
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { ProductoOption } from './types'
import { groupCatalogProducts, ProductGroupItem } from './productHierarchy'
import { ProductPickerCard, ProductSelectPayload } from './ProductPickerCard'

interface ProductPickerModalProps {
  isOpen: boolean
  onClose: () => void
  productos: ProductoOption[]
  formatCurrency: (val: number) => string
  onSelect: (payload: ProductSelectPayload) => void
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function ProductPickerModal({
  isOpen,
  onClose,
  productos,
  formatCurrency,
  onSelect
}: ProductPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Agrupamiento estructurado de catálogo
  const catalogGroups = useMemo(() => {
    return groupCatalogProducts(productos || [])
  }, [productos])

  // Categorías únicas con recuento
  const categoriesWithCount = useMemo(() => {
    const counts: Record<string, number> = {}
    catalogGroups.forEach(g => {
      const cat = g.categoria || 'General'
      counts[cat] = (counts[cat] || 0) + 1
    })

    const sortedCats = Object.keys(counts).sort((a, b) => a.localeCompare(b))
    return [
      { name: 'Todas', count: catalogGroups.length },
      ...sortedCats.map(name => ({ name, count: counts[name] }))
    ]
  }, [catalogGroups])

  // Filtrado reactivo en tiempo real con normalización de acentos
  const filteredGroups = useMemo(() => {
    let result = catalogGroups

    // Filtro por categoría
    if (selectedCategory !== 'Todas') {
      result = result.filter(g => (g.categoria || 'General') === selectedCategory)
    }

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const q = normalizeText(searchTerm)
      result = result.filter(g => {
        const matchBase = normalizeText(g.baseName).includes(q)
        const matchCat = normalizeText(g.categoria || '').includes(q)
        const matchVariants = g.variants.some(v =>
          normalizeText(v.nombreVariante).includes(q) ||
          normalizeText(v.nombreCompleto).includes(q)
        )
        return matchBase || matchCat || matchVariants
      })
    }

    return result
  }, [catalogGroups, selectedCategory, searchTerm])

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setSelectedCategory('Todas')
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal="trap-focus">
      <DialogContent
        showCloseButton={false}
        finalFocus={false}
        overlayClassName="bg-black/60 backdrop-blur-xs fixed inset-0 z-[60]"
        className="w-full max-w-3xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[60] gap-0 p-0 sm:max-w-3xl"
      >
        {/* ========================================================================= */}
        {/* HEADER DEL PICKER (p-5 pb-3 border-b border-border/70 bg-card/40 space-y-3) */}
        {/* ========================================================================= */}
        <div className="p-5 pb-3 border-b border-border/70 bg-card/40 space-y-3 shrink-0">
          {/* Fila 1: Título, subtítulo y botón de cierre */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Catálogo Visual de Modelos 3D
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Elige el modelo y el precio a facturar en este pedido
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Cerrar catálogo visual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fila 2: Búsqueda y Filtro */}
          <div className="space-y-2.5">
            {/* Buscador integrado */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de modelo, variante o categoría..."
                className="h-10 rounded-xl border border-input bg-background pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary w-full outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary cursor-pointer transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tabs horizontales de categorías con scroll elástico */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
              {categoriesWithCount.map((cat) => {
                const isActive = selectedCategory === cat.name
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/80'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUERPO CON CUADRÍCULA DE CARDS (p-5 overflow-y-auto flex-1 max-h-[58vh])   */}
        {/* ========================================================================= */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[58vh] min-h-[300px]">
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredGroups.map((group) => (
                <ProductPickerCard
                  key={group.id}
                  group={group}
                  formatCurrency={formatCurrency}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground/70">
                <PackageOpen className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-foreground">
                  No se encontraron modelos 3D
                </h5>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchTerm
                    ? `No hay resultados para "${searchTerm}" en la categoría "${selectedCategory}".`
                    : 'No hay modelos en esta categoría.'}
                </p>
              </div>
              {(searchTerm || selectedCategory !== 'Todas') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('Todas')
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold cursor-pointer transition-colors"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
