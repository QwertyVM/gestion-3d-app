'use client'

import Link from 'next/link'
import { 
  Folder, 
  Package, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  Boxes, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react'
import { CategoriaItem } from '@/actions/categorias'

interface CategoryRowItemProps {
  categoria: CategoriaItem
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}

export function CategoryRowItem({
  categoria,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete
}: CategoryRowItemProps) {
  const hasProducts = categoria.totalProductos > 0

  return (
    <div
      className={`bg-card border rounded-xl transition-all duration-200 min-h-[72px] overflow-hidden ${
        isExpanded
          ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-md hover:bg-secondary/15'
      }`}
    >
      {/* Contenedor Principal de la Fila */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Izquierdo: Identidad de la Categoría */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Ícono de carpeta temático */}
          <div className="w-11 h-11 rounded-xl bg-accent/50 border border-border/70 text-accent-foreground flex items-center justify-center shrink-0 shadow-2xs">
            <Folder className="w-5 h-5 stroke-[2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={() => {
                  if (hasProducts) {
                    onToggleExpand()
                  }
                }}
                className="text-base font-bold text-foreground leading-snug hover:text-primary transition-colors cursor-pointer truncate"
                title={categoria.nombre}
              >
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
                className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
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

        {/* Lado Derecho: Métricas y Acciones */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          {/* Selector / Trigger de Modelos */}
          {hasProducts ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className={`bg-secondary border border-border/80 text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-accent/60 hover:border-accent-foreground/30 transition-colors cursor-pointer ${
                isExpanded ? 'bg-accent/80 border-accent-foreground/40 text-accent-foreground' : ''
              }`}
              title={isExpanded ? 'Ocultar modelos de esta categoría' : 'Ver modelos asociados a esta categoría'}
            >
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono">
                {categoria.totalProductos} {categoria.totalProductos === 1 ? 'modelo' : 'modelos'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <div className="bg-secondary/60 border border-border/70 text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 select-none">
              <Package className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="font-mono">0 modelos</span>
            </div>
          )}

          {/* Botón Editar */}
          <button
            type="button"
            onClick={onEdit}
            className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all flex items-center gap-1.5 cursor-pointer"
            title={`Editar categoría "${categoria.nombre}"`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          {/* Botón Eliminar */}
          <button
            type="button"
            disabled={hasProducts}
            onClick={onDelete}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              hasProducts
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer'
            }`}
            title={
              hasProducts
                ? `No puedes eliminar esta categoría porque tiene ${categoria.totalProductos} producto(s) asignado(s)`
                : `Eliminar categoría vacía "${categoria.nombre}"`
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Despliegue de Modelos Asociados (Acordeón Inline) */}
      {isExpanded && hasProducts && (
        <div className="bg-secondary/40 border-t border-border/60 px-5 py-3.5 rounded-b-xl -mx-4 -mb-4 mt-3 animate-in fade-in-50 slide-in-from-top-1 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-primary" />
              <span>Modelos 3D en esta categoría ({categoria.productos.length})</span>
            </span>

            <Link
              href={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 hover:underline transition-colors"
            >
              <span>Abrir en catálogo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {categoria.productos.map((prod) => (
              <div
                key={prod.id}
                className="bg-card border border-border/80 text-foreground text-xs p-2.5 rounded-lg shadow-2xs hover:border-primary/50 transition-colors flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-semibold text-xs text-foreground truncate flex-1"
                    title={prod.nombreModelo}
                  >
                    {prod.nombreModelo}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-accent-foreground shrink-0">
                    S/ {prod.precioMenor.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50 font-mono">
                  <span>Costo: S/ {prod.costoBase.toFixed(2)}</span>
                  <span>Mayor: S/ {(prod.precioMayor || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
