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
        className="max-w-md w-[calc(100%-2rem)] bg-background border border-border rounded-2xl p-6 shadow-2xl space-y-4 gap-0"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {categoryToEdit ? (
                  <Pencil className="w-5 h-5" />
                ) : (
                  <FolderPlus className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {categoryToEdit
                    ? 'Modifica los datos y nombre de la familia de productos'
                    : 'Crea una nueva familia para organizar modelos 3D del taller'}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label
                htmlFor="category-nombre"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block"
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
                className="w-full h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label
                htmlFor="category-descripcion"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block"
              >
                Descripción
              </label>
              <textarea
                id="category-descripcion"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve detalle sobre los modelos comprendidos en esta categoría..."
                className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !nombre.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs px-4 py-2 transition-all active:scale-[0.98] shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
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
