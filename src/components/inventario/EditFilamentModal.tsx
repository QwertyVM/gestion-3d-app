import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Check } from 'lucide-react'

interface EditFilamentModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  nombre: string
  setNombre: (val: string) => void
  hex: string
  setHex: (val: string) => void
  nota: string
  setNota: (val: string) => void
  swatches: Array<{ name: string; hex: string }>
}

export function EditFilamentModal({
  open,
  onClose,
  onSubmit,
  nombre,
  setNombre,
  hex,
  setHex,
  nota,
  setNota,
  swatches
}: EditFilamentModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="bg-card text-foreground border border-border/80 w-[95vw] sm:max-w-[440px] max-h-[90dvh] overflow-hidden p-0 rounded-2xl shadow-xl z-50 flex flex-col">
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-card/95 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="h-8 w-8 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 shrink-0 shadow-none"
              style={{ backgroundColor: hex }}
            />
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
                Editar Bobina / Color
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Modifica el nombre y acabado visual
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/90 uppercase tracking-wider block">
                Nombre del Filamento *
              </Label>
              <Input 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Negro Carbón..."
                required
                autoFocus
                className="bg-background border-border/80 rounded-lg text-sm font-medium text-foreground h-9 focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-muted/25 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Muestra Visual (HEX)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="color"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    className="h-6 w-8 rounded border border-border/60 cursor-pointer bg-background"
                  />
                  <Input 
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    className="w-20 h-6 text-xs font-mono font-medium bg-background border-border/60 p-1 rounded text-center text-foreground uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 pt-1">
                {swatches.map(sw => (
                  <button
                    key={sw.name}
                    type="button"
                    onClick={() => setHex(sw.hex)}
                    className={`h-7 w-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:scale-110 active:scale-95 transition-transform cursor-pointer mx-auto flex items-center justify-center ${
                      hex === sw.hex ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    }`}
                    style={{ backgroundColor: sw.hex }}
                    title={sw.name}
                  >
                    {hex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/90 uppercase tracking-wider block">
                Nota de Producción (Opcional)
              </Label>
              <Input 
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Lote #2, Bobina especial..."
                className="bg-background border-border/80 rounded-lg text-xs h-9 text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!nombre.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-4 h-8 text-xs cursor-pointer shadow-none"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
