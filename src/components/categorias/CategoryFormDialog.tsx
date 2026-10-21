'use client'

import { useEffect, useState } from 'react'
import { FolderPlus, Pencil, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CategoriaItem } from '@/actions/categorias'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryToEdit: CategoriaItem | null
  onSubmit: (data: { nombre: string; descripcion: string }) => Promise<void>
  isSubmitting: boolean
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  categoryToEdit,
  onSubmit,
  isSubmitting
}: CategoryFormDialogProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    if (categoryToEdit) {
      setNombre(categoryToEdit.nombre || '')
      setDescripcion(categoryToEdit.descripcion || '')
    } else {
      setNombre('')
      setDescripcion('')
    }
  }, [categoryToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    await onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md w-[calc(100%-2rem)] bg-card text-foreground border border-border/80 rounded-2xl p-0 shadow-xl overflow-hidden gap-0 flex flex-col"
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Sticky Header */}
          <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                {categoryToEdit ? (
                  <Pencil className="w-4.5 h-4.5" />
                ) : (
                  <FolderPlus className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
                  {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {categoryToEdit
                    ? 'Modifica los datos y nombre de la familia de productos'
                    : 'Crea una nueva familia para organizar modelos 3D'}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label
                htmlFor="category-nombre"
                className="text-xs font-medium text-foreground/90 uppercase tracking-wider block"
              >
                Nombre de Categoría *
              </label>
              <input
                id="category-nombre"
                type="text"
                required
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Macetas & Jardín, Figuras de Colección..."
                className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring outline-none transition-colors"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label
                htmlFor="category-descripcion"
                className="text-xs font-medium text-foreground/90 uppercase tracking-wider block"
              >
                Descripción (Opcional)
              </label>
              <textarea
                id="category-descripcion"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve detalle sobre los modelos comprendidos en esta categoría..."
                className="w-full rounded-lg border border-border/80 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring outline-none transition-colors min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-3 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !nombre.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-xs px-4 h-8 transition-all shadow-none flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{categoryToEdit ? 'Guardar Cambios' : 'Guardar Categoría'}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
