'use client'

import Link from 'next/link'
import {
  Boxes,
  ChevronDown,
  Pencil,
  Trash2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { CategoriaItem, CategoriaProductoSummary } from '@/actions/categorias'

export interface CategoryRowItemProps {
  categoria: CategoriaItem
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onSelectProduct?: (producto: CategoriaProductoSummary) => void
}

export function CategoryRowItem({
  categoria,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onSelectProduct
}: CategoryRowItemProps) {
  const hasProducts = categoria.totalProductos > 0

  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden shadow-none mb-3 transition-colors ${
        isExpanded ? 'border-border/80 ring-1 ring-border/40' : 'border-border/60 hover:border-border'
      }`}
    >
      {/* ========================================================================= */}
      {/* CABECERA INTERACTIVA                                                      */}
      {/* ========================================================================= */}
      <div
        onClick={onToggleExpand}
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
      >
        {/* Izquierda: Identidad */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Ícono en caja con bordes suaves */}
          <div className="w-9 h-9 rounded-lg bg-muted text-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-none">
            <Boxes className="w-4.5 h-4.5 stroke-[1.8]" />
          </div>

          {/* Bloque de texto */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">
                {categoria.nombre}
              </h3>

              {!hasProducts && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Sin modelos</span>
                </span>
              )}
            </div>

            {categoria.descripcion ? (
              <p
                className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
                title={categoria.descripcion}
              >
                {categoria.descripcion}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic mt-0.5">
                Sin descripción registrada
              </p>
            )}
          </div>
        </div>

        {/* Derecha: Métricas y Controles */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          {/* Botón desplegable de modelos */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="border border-border/80 bg-background h-8 px-2.5 rounded-lg text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-muted transition-colors cursor-pointer tabular-nums"
          >
            <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {categoria.totalProductos} {categoria.totalProductos === 1 ? 'modelo' : 'modelos'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Botón Editar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 transition-colors cursor-pointer"
            title={`Editar categoría "${categoria.nombre}"`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          {/* Botón Eliminar */}
          <button
            type="button"
            disabled={hasProducts}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              hasProducts
                ? 'text-muted-foreground/30 cursor-not-allowed opacity-40'
                : 'text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer'
            }`}
            title={
              hasProducts
                ? `No puedes eliminar esta categoría porque tiene ${categoria.totalProductos} modelo(s) vinculado(s)`
                : `Eliminar categoría vacía "${categoria.nombre}"`
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PANEL DE MODELOS DESPLEGADOS                                         */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="bg-muted/20 border-t border-border/50 p-4 space-y-3 animate-in fade-in-50 duration-150">
          {/* Fila Superior de Cabecera del Panel */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Modelos 3D en esta categoría ({categoria.productos.length})</span>
            </div>

            <Link
              href={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Abrir en catálogo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Cuadrícula de Mini-Cards con Fotografía */}
          {categoria.productos.length === 0 ? (
            <div className="text-center py-5 border border-dashed border-border/60 rounded-lg bg-card/40">
              <p className="text-xs text-muted-foreground">
                No hay modelos 3D registrados en esta categoría aún.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {categoria.productos.map((prod) => (
                <div
                  key={prod.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectProduct?.(prod)
                  }}
                  className="bg-card border border-border/60 rounded-lg p-2.5 shadow-none hover:border-border transition-colors flex flex-col justify-between group cursor-pointer text-left"
                >
                  {/* Parte Superior (Foto + Título) */}
                  <div className="flex items-center min-w-0 gap-2">
                    {prod.imagenUrl ? (
                      <img
                        src={prod.imagenUrl}
                        alt={prod.nombreModelo}
                        className="w-10 h-10 rounded-md object-cover border border-border/60 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0 border border-border/60">
                        <Boxes className="w-4 h-4 text-muted-foreground/60" />
                      </div>
                    )}
                    <h4
                      className="text-xs font-medium text-foreground leading-snug line-clamp-2 flex-1 min-w-0 group-hover:text-primary transition-colors"
                      title={prod.nombreModelo}
                    >
                      {prod.nombreModelo}
                    </h4>
                  </div>

                  {/* Parte Inferior (Precios y Costo) */}
                  <div className="border-t border-border/40 pt-1.5 mt-2 flex items-center justify-between gap-1 font-mono tabular-nums">
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      Costo: S/ {prod.costoBase.toFixed(2)}
                    </span>
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-foreground">
                        S/ {prod.precioMenor.toFixed(2)}
                      </span>
                      {typeof prod.precioMayor === 'number' && prod.precioMayor > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          Mayor: S/ {prod.precioMayor.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Alias para consistencia
export const CategoryCard = CategoryRowItem
