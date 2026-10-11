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
      className={`bg-card border rounded-2xl overflow-hidden shadow-2xs mb-4 transition-all duration-200 hover:border-primary/40 ${
        isExpanded ? 'border-primary/50 ring-1 ring-primary/20 shadow-xs' : 'border-border'
      }`}
    >
      {/* ========================================================================= */}
      {/* CABECERA INTERACTIVA                                                      */}
      {/* ========================================================================= */}
      <div
        onClick={onToggleExpand}
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-secondary/15 transition-colors"
      >
        {/* Izquierda: Identidad */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Ícono en caja con bordes suaves */}
          <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground border border-border/70 flex items-center justify-center shrink-0 shadow-2xs">
            <Boxes className="w-5 h-5 stroke-[2]" />
          </div>

          {/* Bloque de texto */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">
                {categoria.nombre}
              </h3>

              {!hasProducts && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
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
              <p className="text-xs text-muted-foreground/60 italic mt-0.5">
                Sin descripción registrada
              </p>
            )}
          </div>
        </div>

        {/* Derecha: Métricas y Controles */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          {/* Botón desplegable de modelos */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="border border-border/80 bg-secondary h-9 px-3.5 rounded-xl text-xs font-semibold text-foreground flex items-center gap-2 hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5 text-primary" />
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
            className="h-9 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
              hasProducts
                ? 'text-muted-foreground/30 cursor-not-allowed opacity-40'
                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer'
            }`}
            title={
              hasProducts
                ? `No puedes eliminar esta categoría porque tiene ${categoria.totalProductos} modelo(s) vinculado(s)`
                : `Eliminar categoría vacía "${categoria.nombre}"`
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PANEL DE MODELOS DESPLEGADOS                                         */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="bg-secondary/20 border-t border-border/60 p-5 space-y-3.5 animate-in fade-in-50 duration-150">
          {/* Fila Superior de Cabecera del Panel */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-primary" />
              <span>MODELOS 3D EN ESTA CATEGORÍA ({categoria.productos.length})</span>
            </div>

            <Link
              href={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Abrir en catálogo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Cuadrícula de Mini-Cards con Fotografía (Zero Truncamiento) */}
          {categoria.productos.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border/70 rounded-xl bg-card/50">
              <p className="text-xs text-muted-foreground">
                No hay modelos 3D registrados en esta categoría aún.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoria.productos.map((prod) => (
                <div
                  key={prod.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectProduct?.(prod)
                  }}
                  className="bg-card border border-border/80 rounded-xl p-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer text-left"
                >
                  {/* Parte Superior (Foto + Título sin truncar) */}
                  <div className="flex items-center min-w-0">
                    {prod.imagenUrl ? (
                      <img
                        src={prod.imagenUrl}
                        alt={prod.nombreModelo}
                        className="w-12 h-12 rounded-lg object-cover border border-border/70 shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground text-xs shrink-0 border border-border/60">
                        <Boxes className="w-5 h-5 text-muted-foreground/70" />
                      </div>
                    )}
                    <h4
                      className="text-xs font-bold text-foreground leading-snug line-clamp-2 pl-2.5 flex-1 min-w-0"
                      title={prod.nombreModelo}
                    >
                      {prod.nombreModelo}
                    </h4>
                  </div>

                  {/* Parte Inferior (Precios y Costo) */}
                  <div className="border-t border-border/50 pt-2 mt-2 flex items-center justify-between gap-1 font-mono">
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      Base: S/ {prod.costoBase.toFixed(2)}
                    </span>
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="text-xs font-extrabold text-foreground">
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
