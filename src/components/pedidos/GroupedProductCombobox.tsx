'use client'

import React, { useState, useMemo } from 'react'
import {
  Boxes,
  Check,
  ChevronsUpDown
} from 'lucide-react'
import { TipoPrecio } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { ProductoOption } from './types'
import {
  groupCatalogProducts,
  ProductGroupItem,
  ProductVariantItem,
  findVariantInGroups
} from './productHierarchy'

export interface SelectedProductPayload {
  productoId: string
  varianteId: string
  nombreDisplay: string
  costoBase: number
  precioUnitario: number
}

interface GroupedProductComboboxProps {
  productos: ProductoOption[]
  selectedProductoId?: string
  selectedVarianteId?: string
  tipoPrecio: TipoPrecio
  onSelect: (payload: SelectedProductPayload) => void
  onAfterSelect?: () => void
  disabled?: boolean
  className?: string
}

export function GroupedProductCombobox({
  productos,
  selectedProductoId,
  selectedVarianteId,
  tipoPrecio,
  onSelect,
  onAfterSelect,
  disabled = false,
  className
}: GroupedProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 1. Agrupación jerárquica del catálogo
  const groups = useMemo(() => {
    return groupCatalogProducts(productos)
  }, [productos])

  // 2. Variante actualmente seleccionada
  const currentSelection = useMemo(() => {
    const targetId = selectedVarianteId || selectedProductoId || ''
    return findVariantInGroups(groups, targetId)
  }, [groups, selectedVarianteId, selectedProductoId])

  // 3. Etiqueta para el botón gatillo
  const triggerLabel = useMemo(() => {
    if (!currentSelection) return null
    const { group, variant } = currentSelection
    if (group.hasVariants) {
      return `${group.baseName} ➔ ${variant.nombreVariante}`
    }
    return group.baseName
  }, [currentSelection])

  // 4. Manejador de selección de una variante
  const handleSelectOption = (group: ProductGroupItem, variant: ProductVariantItem) => {
    const isMayor = tipoPrecio === 'MAYOR' || (tipoPrecio as string) === 'AMIGOS'
    const unitPrice = isMayor ? variant.precioMayor : variant.precioMenor

    const displayName = group.hasVariants
      ? `${group.baseName} - ${variant.nombreVariante}`
      : group.baseName

    onSelect({
      productoId: group.productoId,
      varianteId: variant.id,
      nombreDisplay: displayName,
      costoBase: variant.costoBase,
      precioUnitario: unitPrice
    })

    setIsOpen(false)

    // Agilizar flujo: Enfocar automáticamente el campo Cantidad si se proporciona el callback
    if (onAfterSelect) {
      setTimeout(() => {
        onAfterSelect()
      }, 50)
    }
  }

  // 5. Filtro de búsqueda optimizado para taller (acento-insensible, token-by-token)
  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const filterItem = (value: string, search: string) => {
    const normSearch = normalize(search).trim()
    if (!normSearch) return 1
    const normValue = normalize(value)
    const tokens = normSearch.split(/\s+/)
    const matchesAll = tokens.every(token => normValue.includes(token))
    return matchesAll ? 1 : 0
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between rounded-xl border-input bg-card text-sm font-medium hover:bg-secondary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all px-3 cursor-pointer shadow-2xs',
            className
          )}
        >
          {triggerLabel ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
              <Boxes className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-xs truncate">
                {triggerLabel}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
              <Boxes className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <span className="text-muted-foreground font-normal text-xs truncate">
                Seleccionar modelo 3D...
              </span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-[420px] max-w-[calc(100vw-2rem)] p-0 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <Command filter={filterItem} className="bg-popover overflow-hidden rounded-xl">
          <CommandInput
            placeholder="Buscar por modelo, familia o versión..."
            autoFocus
            className="text-xs"
          />

          <CommandList className="max-h-[320px] overflow-y-auto overflow-x-hidden p-1 divide-y divide-border/20">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No se encontró ningún modelo 3D
            </CommandEmpty>

            {groups.map((group) => {
              const isMayor = tipoPrecio === 'MAYOR' || (tipoPrecio as string) === 'AMIGOS'

              // CASO 1: PRODUCTO CON VARIANTES (ej. SETI Organizador, Mansiones de la Locura)
              if (group.hasVariants) {
                return (
                  <CommandGroup
                    key={group.id}
                    heading={
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/40 bg-secondary/35 rounded-t-lg mb-1 mt-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {group.baseName}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0 font-medium">
                          {group.categoria}
                        </span>
                      </div>
                    }
                    className="p-1 [&_[cmdk-group-heading]]:p-0"
                  >
                    {group.variants.map((variant) => {
                      const isSelected =
                        selectedVarianteId === variant.id ||
                        (!selectedVarianteId && selectedProductoId === variant.id)
                      const displayPrice = isMayor ? variant.precioMayor : variant.precioMenor

                      // Valor de búsqueda para cmdk (permite filtrar por modelo, familia o versión)
                      const searchValue = `${group.baseName} ${group.categoria} ${variant.nombreVariante} ${variant.nombreCompleto}`

                      return (
                        <CommandItem
                          key={variant.id}
                          value={searchValue}
                          onSelect={() => handleSelectOption(group, variant)}
                          className={cn(
                            'pl-6 py-2 hover:bg-secondary/60 cursor-pointer rounded-lg mx-1 flex items-center justify-between gap-2 transition-colors',
                            isSelected && 'bg-secondary/90 font-medium'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                            ) : (
                              <span className="text-primary/70 font-mono text-xs select-none shrink-0">
                                └─
                              </span>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {variant.nombreVariante}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                Base: S/ {variant.costoBase.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span className="bg-secondary border border-border/80 text-foreground text-xs font-bold px-2 py-0.5 rounded-md font-mono">
                              S/ {displayPrice.toFixed(2)}
                            </span>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              }

              // CASO 2: PRODUCTO SIMPLE (ej. Bandejas de LEGO)
              const simpleVariant = group.singleVariant || group.variants[0]
              const isSelected =
                selectedVarianteId === simpleVariant?.id ||
                selectedProductoId === group.productoId ||
                selectedProductoId === simpleVariant?.id
              const displayPrice = isMayor
                ? simpleVariant?.precioMayor || 0
                : simpleVariant?.precioMenor || 0

              const searchValue = `${group.baseName} ${group.categoria}`

              return (
                <CommandItem
                  key={group.id}
                  value={searchValue}
                  onSelect={() => simpleVariant && handleSelectOption(group, simpleVariant)}
                  className={cn(
                    'px-3 py-2 hover:bg-secondary/60 cursor-pointer rounded-lg mx-1 my-0.5 flex items-center justify-between gap-2 transition-colors',
                    isSelected && 'bg-secondary/90 font-medium'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <Boxes className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {group.baseName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {group.categoria} • Base: S/ {simpleVariant?.costoBase.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="bg-secondary border border-border/80 text-foreground text-xs font-bold px-2 py-0.5 rounded-md font-mono">
                      S/ {displayPrice.toFixed(2)}
                    </span>
                  </div>
                </CommandItem>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
