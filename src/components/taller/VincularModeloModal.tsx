'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Link2,
  ExternalLink,
  Search,
  Loader2,
  Trash2,
  ClipboardPaste,
  X,
  Boxes,
  Sparkles
} from 'lucide-react'
import { PiezaTaller } from '@/actions/taller'
import { FilamentDotsGroup } from './FilamentDotsGroup'

export interface VincularModeloModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pieza: PiezaTaller | null
  isLoading: boolean
  onConfirm: (productoId: string, enlace: string | null) => Promise<void> | void
}

function extractBaseName(nombre: string): string {
  if (!nombre) return ''
  const trimmed = nombre.trim()
  if (trimmed.includes(' - ')) {
    return trimmed.split(' - ')[0].trim()
  }
  return trimmed
}

export function VincularModeloModal({
  open,
  onOpenChange,
  pieza,
  isLoading,
  onConfirm
}: VincularModeloModalProps) {
  const [enlace, setEnlace] = useState('')

  useEffect(() => {
    if (pieza) {
      setEnlace(pieza.enlaceMakerworld || '')
    } else {
      setEnlace('')
    }
  }, [pieza, open])

  if (!pieza) return null

  const baseName = extractBaseName(pieza.nombreModelo)
  const makerworldSearchUrl = `https://makerworld.com/es/search/models?keyword=${encodeURIComponent(baseName)}`
  const cults3dSearchUrl = `https://cults3d.com/en/search?q=${encodeURIComponent(baseName)}`
  const catalogoSearchUrl = `/catalogo?search=${encodeURIComponent(baseName)}`

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
          setEnlace(text.trim())
        }
      }
    } catch {
      // Ignorar bloqueo de permisos del portapapeles
    }
  }

  const handleSave = async () => {
    await onConfirm(pieza.productoId, enlace.trim() || null)
  }

  const handleClear = async () => {
    setEnlace('')
    await onConfirm(pieza.productoId, null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border border-border/80 rounded-2xl p-6 sm:max-w-md w-full shadow-xl gap-4">
        <DialogHeader className="gap-1 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20 text-primary">
              <Link2 className="w-3.5 h-3.5" />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {pieza.enlaceMakerworld ? 'Editar Enlace del Modelo 3D' : 'Vincular Enlace al Modelo 3D'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Asocia la URL directa (MakerWorld, Printables, Drive, etc.) para abrir los archivos de impresión con un solo clic desde el taller.
          </DialogDescription>
        </DialogHeader>

        {/* Ficha Resumen del Modelo */}
        <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                {pieza.lineaCategoria || 'Modelo 3D'}
              </span>
              <p className="text-sm font-semibold text-foreground truncate mt-0.5" title={pieza.nombreModelo}>
                {pieza.nombreModelo}
              </p>
            </div>
            <span className="bg-muted/60 text-muted-foreground font-mono tabular-nums text-[11px] font-medium px-2 py-0.5 rounded-md border border-border/50 shrink-0">
              #{pieza.codigoRef.replace(/^#/, '')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono tabular-nums text-xs font-semibold text-muted-foreground">
              x{pieza.cantidad}
            </span>
            <FilamentDotsGroup
              colores={pieza.colores}
              nombreColorFallback={pieza.nombreColor}
              codigoHexFallback={pieza.codigoHex}
              tipoMaterial={pieza.tipoMaterial}
            />
            {pieza.personalizacion && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium italic truncate max-w-[150px]">
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                {pieza.personalizacion}
              </span>
            )}
          </div>

          {/* Enlace actual activo */}
          {pieza.enlaceMakerworld && (
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">Enlace actual:</span>
              <a
                href={pieza.enlaceMakerworld}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline max-w-[200px] truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{pieza.enlaceMakerworld}</span>
              </a>
            </div>
          )}
        </div>

        {/* Input de URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-foreground">
              URL del Repositorio o Archivo 3D
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePasteClipboard}
              className="h-6 px-2 text-[11px] text-primary hover:text-primary font-medium hover:bg-primary/10 rounded-md cursor-pointer flex items-center gap-1"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Pegar</span>
            </Button>
          </div>

          <div className="relative">
            <Input
              type="url"
              placeholder="https://makerworld.com/..., https://cults3d.com/..."
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              className="h-9 text-xs bg-background border-border/80 rounded-lg pr-8"
            />
            {enlace && (
              <button
                type="button"
                onClick={() => setEnlace('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                title="Limpiar campo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botones de Ayuda de Búsqueda Rápida */}
          <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-muted-foreground">Buscar rápido:</span>
            <a
              href={makerworldSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20 transition-colors"
              title={`Buscar "${baseName}" directamente en MakerWorld`}
            >
              <Search className="w-3 h-3" />
              <span>En MakerWorld</span>
            </a>
            <a
              href={cults3dSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/20 transition-colors"
              title={`Buscar "${baseName}" directamente en Cults3D`}
            >
              <Search className="w-3 h-3" />
              <span>En Cults3D</span>
            </a>
            <a
              href={catalogoSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2 py-0.5 rounded-md border border-border/50 transition-colors"
              title="Buscar en Catálogo de productos"
            >
              <Boxes className="w-3 h-3" />
              <span>En Catálogo</span>
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground pt-1">
            Al vincular la URL, el enlace quedará guardado para este modelo y todas sus variantes en el taller y catálogo.
          </p>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-2 pt-3 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {pieza.enlaceMakerworld && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                onClick={handleClear}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8 px-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desvincular</span>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-muted-foreground hover:text-foreground text-xs h-8 px-3 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isLoading || (!enlace.trim() && !pieza.enlaceMakerworld)}
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-8 px-4 rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Guardar Enlace</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
