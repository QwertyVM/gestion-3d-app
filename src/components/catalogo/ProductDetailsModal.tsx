'use client'

import React, { useState } from 'react'
import {
  Boxes,
  Calendar,
  Layers,
  Pencil,
  X,
  Share2,
  Check,
  PlusCircle,
  Wrench,
  DollarSign,
  ExternalLink,
  ShoppingBag
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ProductGroupRow } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'

export interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  group?: ProductGroupRow | null
  singleProduct?: ProductoItem | null
  onEdit: () => void
  onCreateOrder?: (producto?: ProductoItem) => void
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
  formatFechaRegistro: (rawDate: string | Date | null | undefined) => string
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  group,
  singleProduct,
  onEdit,
  onCreateOrder,
  formatCurrency,
  calcMargen,
  formatFechaRegistro
}: ProductDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  if (!group && !singleProduct) return null

  const isGroup = Boolean(group && group.isGroup)
  const baseName = group ? group.baseName : singleProduct?.nombreModelo || ''
  const categoria = group ? group.lineaCategoria : singleProduct?.lineaCategoria || 'General'
  const totalVersiones = group ? group.totalVariants : 1
  const fecha = group ? group.latestCreatedAt : singleProduct?.createdAt
  const isActive = group ? group.hasActive : (singleProduct?.activo ?? true)
  const pedidosCount = group ? (group.pedidosCount ?? 0) : (singleProduct?.pedidosCount ?? 0)

  // Precios y costos consolidados
  const minCosto = group ? group.minCosto : (singleProduct?.costoBase || 0)
  const maxCosto = group ? group.maxCosto : (singleProduct?.costoBase || 0)
  const minMenor = group ? group.minPrecioMenor : (singleProduct?.precioMenor || 0)
  const maxMenor = group ? group.maxPrecioMenor : (singleProduct?.precioMenor || 0)
  const minMayor = group ? group.minPrecioMayor : (singleProduct?.precioMayor || 0)
  const maxMayor = group ? group.maxPrecioMayor : (singleProduct?.precioMayor || 0)

  // Imagen del modelo
  const imageUrl = isGroup && group
    ? group.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || null
    : singleProduct?.imagenUrl || null

  // Link de MakerWorld
  const makerworldUrl = isGroup && group
    ? group.variants.find((v) => v.producto.enlaceMakerworld)?.producto.enlaceMakerworld || null
    : singleProduct?.enlaceMakerworld || null

  // Notas de laminado / taller
  const notasTaller = isGroup && group
    ? group.variants.find((v) => v.producto.descripcionWeb)?.producto.descripcionWeb
    : singleProduct?.descripcionWeb

  // Copiar resumen de ficha para WhatsApp
  const handleCopyFicha = () => {
    let text = `📦 ${baseName} (${categoria})\n`
    if (isGroup && group) {
      text += `Total versiones: ${group.totalVariants}\n\n`
      group.variants.forEach((v) => {
        text += `• ${v.variantName}:\n`
        text += `  - Costo Base: ${formatCurrency(v.producto.costoBase || 0)}\n`
        text += `  - Precio Menor: ${formatCurrency(v.producto.precioMenor || 0)} (${calcMargen(v.producto.precioMenor || 0, v.producto.costoBase || 0)})\n`
        text += `  - Precio Mayor: ${formatCurrency(v.producto.precioMayor || 0)} (${calcMargen(v.producto.precioMayor || 0, v.producto.costoBase || 0)})\n`
      })
    } else if (singleProduct) {
      text += `- Costo Base: ${formatCurrency(singleProduct.costoBase || 0)}\n`
      text += `- Precio Menor: ${formatCurrency(singleProduct.precioMenor || 0)} (${calcMargen(singleProduct.precioMenor || 0, singleProduct.costoBase || 0)})\n`
      text += `- Precio Mayor: ${formatCurrency(singleProduct.precioMayor || 0)} (${calcMargen(singleProduct.precioMayor || 0, singleProduct.costoBase || 0)})\n`
    }

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(`Ficha técnica de "${baseName}" copiada al portapapeles`)
  }

  const handleCrearPedido = () => {
    if (onCreateOrder) {
      const prodToOrder = isGroup && group ? group.variants[0]?.producto : singleProduct || undefined
      onCreateOrder(prodToOrder)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal="trap-focus">
      <DialogContent
        showCloseButton={false}
        finalFocus={false}
        overlayClassName="bg-black/40 backdrop-blur-xs fixed inset-0 z-50"
        className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] z-50 gap-0 p-0 sm:max-w-2xl"
      >
        {/* ========================================================================= */}
        {/* ENCABEZADO DEL MODAL (FIJO)                                               */}
        {/* ========================================================================= */}
        <div className="px-6 py-5 border-b border-border/70 bg-card/40 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-bold text-foreground leading-snug truncate" title={baseName}>
              {baseName}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Chip de categoría */}
              <span className="bg-secondary border border-border/70 text-foreground text-xs font-semibold px-2.5 py-0.5 rounded-md">
                {categoria}
              </span>

              {/* Badge de versión */}
              {isGroup && totalVersiones > 1 ? (
                <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/70 shrink-0">
                  {totalVersiones} versiones
                </span>
              ) : (
                <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/70 shrink-0">
                  Versión única
                </span>
              )}

              {/* Fecha de alta y pedidos asociados */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground font-mono m-0">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>{formatFechaRegistro(fecha)}</span>
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <ShoppingBag className="h-3 w-3 text-primary" />
                  <span>{pedidosCount} {pedidosCount === 1 ? 'pedido asociado' : 'pedidos asociados'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
              className="border-border text-foreground hover:bg-secondary rounded-xl h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-primary" />
              <span>Editar</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 flex items-center justify-center transition-colors cursor-pointer p-0"
              title="Cerrar modal"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUERPO DEL MODAL (SCROLL VERTICAL)                                        */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-foreground">
          {/* Bloque 1: Visor / Preview del Modelo */}
          <div className="w-full h-44 rounded-xl bg-secondary/50 border border-border/80 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs group">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={baseName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Boxes className="w-10 h-10 text-primary/70 mb-2 stroke-[1.8]" />
                <span className="text-xs font-medium text-muted-foreground">
                  Modelo 3D sin fotografía asignada
                </span>
              </div>
            )}

            {/* Botón flotante "MakerWorld" */}
            {makerworldUrl && (
              <a
                href={makerworldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card/90 backdrop-blur-xs border border-border/80 text-foreground hover:bg-card text-xs font-semibold h-7 px-2.5 rounded-lg flex items-center gap-1.5 shadow-xs absolute bottom-3 left-3 cursor-pointer transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ver en MakerWorld</span>
              </a>
            )}

            {/* Botón flotante "Copiar Ficha" */}
            <button
              type="button"
              onClick={handleCopyFicha}
              className="bg-card/90 backdrop-blur-xs border border-border/80 text-foreground hover:bg-card text-xs font-semibold h-7 px-2.5 rounded-lg flex items-center gap-1.5 shadow-xs absolute bottom-3 right-3 cursor-pointer transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{copied ? '¡Copiado!' : 'Copiar Ficha'}</span>
            </button>
          </div>

          {/* Bloque 2: Estructura de Precios & Rentabilidad */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span>ESTRUCTURA DE PRECIOS & RENTABILIDAD</span>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-card border border-border rounded-xl p-4 shadow-2xs text-center font-mono">
              {/* Costo Base */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-sans">
                  Costo Base
                </span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block truncate">
                  {minCosto === maxCosto
                    ? formatCurrency(minCosto)
                    : `${formatCurrency(minCosto)} – ${formatCurrency(maxCosto)}`}
                </span>
              </div>

              {/* PVP Menor */}
              <div className="space-y-1 border-x border-border/70 px-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-sans">
                  PVP Menor
                </span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block truncate">
                  {minMenor === maxMenor
                    ? formatCurrency(minMenor)
                    : `${formatCurrency(minMenor)} – ${formatCurrency(maxMenor)}`}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mt-0.5 font-mono">
                  {calcMargen(minMenor, minCosto)}
                </span>
              </div>

              {/* PVP Mayor */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-sans">
                  PVP Mayor
                </span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block truncate">
                  {minMayor === maxMayor
                    ? formatCurrency(minMayor)
                    : `${formatCurrency(minMayor)} – ${formatCurrency(maxMayor)}`}
                </span>
                <span className="text-[10px] font-bold text-primary block mt-0.5 font-mono">
                  {calcMargen(minMayor, minCosto)}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 3: Tabla Comparativa de Versiones (Renderizado Condicional) */}
          {isGroup && group && group.variants.length > 1 && (
            <div className="bg-card border border-border rounded-xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Comparativa de Versiones ({group.variants.length})
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Solo Lectura
                </span>
              </div>

              <div className="space-y-2 divide-y divide-border/40">
                {group.variants.map((v) => {
                  const p = v.producto
                  const costo = p.costoBase || 0
                  const menor = p.precioMenor || 0
                  const mayor = p.precioMayor || 0
                  const margenMenor = calcMargen(menor, costo)
                  const margenMayor = calcMargen(mayor, costo)

                  return (
                    <div
                      key={p.id}
                      className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-primary/70 font-mono text-xs select-none">└─</span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {v.variantName}
                        </span>
                        {p.activo ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[9px] font-bold shrink-0">
                            • Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground text-[9px] font-medium shrink-0">
                            Archivado
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary border border-border/60 text-[9px] text-muted-foreground font-mono shrink-0"
                          title={`Versión asociada a ${p.pedidosCount ?? 0} pedidos`}
                        >
                          <ShoppingBag className="w-2.5 h-2.5 text-primary" />
                          <span>{p.pedidosCount ?? 0} ped.</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs font-mono shrink-0">
                        <span className="text-[11px] text-muted-foreground">
                          Base: <strong className="text-foreground">{formatCurrency(costo)}</strong>
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-[11px] text-foreground font-semibold">
                          Menor: {formatCurrency(menor)}{' '}
                          <span className="text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            ({margenMenor})
                          </span>
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-[11px] text-foreground font-semibold">
                          Mayor: {formatCurrency(mayor)}{' '}
                          <span className="text-primary font-bold text-[10px]">
                            ({margenMayor})
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bloque 4: Parámetros de Fabricación & Taller */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-primary" />
              <span>PARÁMETROS DE FABRICACIÓN & TALLER</span>
            </div>

            <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="space-y-1">
                <p className="text-xs text-foreground/90 leading-relaxed italic bg-card/60 p-3 rounded-lg border border-border/50">
                  {notasTaller ? (
                    notasTaller
                  ) : (
                    'Parámetros estándar: Boquilla 0.4mm, relleno 15-20% Gyroid, perfil de capa 0.20mm optimizado para taller.'
                  )}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Alta en catálogo: <strong className="text-foreground">{formatFechaRegistro(fecha)}</strong>
                  </span>
                </div>

                <div>
                  {isActive ? (
                    <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                      • Activo
                    </span>
                  ) : (
                    <span className="bg-secondary border border-border text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      Archivado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER DEL MODAL (FIJO)                                                   */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-t border-border/70 bg-card/40 flex items-center justify-between mt-auto shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary h-10 px-4 cursor-pointer"
          >
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={handleCrearPedido}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-5 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Crear Pedido con este Modelo</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Aliases para máxima compatibilidad
export const ProductDetailDialog = ProductDetailsModal
export const ProductDetailModal = ProductDetailsModal
