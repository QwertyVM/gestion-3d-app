import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Palette, X, ExternalLink, Copy, Download, Loader2 } from 'lucide-react'

interface FilamentFlyerModalProps {
  open: boolean
  onClose: () => void
  imageTheme: 'dark' | 'light'
  setImageTheme: (theme: 'dark' | 'light') => void
  imageTimestamp: number
  setImageTimestamp: (ts: number) => void
  disponiblesCount: number
  isCopyingImage: boolean
  isDownloadingImage: boolean
  onCopyImage: () => void
  onDownloadFlyer: () => void
}

export function FilamentFlyerModal({
  open,
  onClose,
  imageTheme,
  setImageTheme,
  imageTimestamp,
  setImageTimestamp,
  disponiblesCount,
  isCopyingImage,
  isDownloadingImage,
  onCopyImage,
  onDownloadFlyer
}: FilamentFlyerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="bg-card text-foreground border border-border/80 w-[95vw] sm:max-w-[700px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-xl rounded-2xl z-50">
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Palette className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
                Catálogo Visual de Colores Disponibles
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Imagen publicitaria de alta definición con muestras y códigos HEX para clientes
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-2.5 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Estilo:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-muted/60 border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setImageTheme('dark')
                  setImageTimestamp(Date.now())
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  imageTheme === 'dark'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🌙 Obsidian Dark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageTheme('light')
                  setImageTimestamp(Date.now())
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  imageTheme === 'light'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>☀️ Studio Warm</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground tabular-nums">
            <span className="px-2 py-0.5 rounded-md bg-muted/60 border border-border/50">
              1080 × 1350 px (4:5)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
              {disponiblesCount} colores
            </span>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10 flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-full max-w-[380px] rounded-xl overflow-hidden shadow-md border border-border/60 bg-card relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/inventario/filamentos/imagen?theme=${imageTheme}&t=${imageTimestamp}`}
              alt="Catálogo de Colores Disponibles NOVA 3D"
              className="w-full h-auto block object-cover"
              loading="eager"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <a
            href={`/api/inventario/filamentos/imagen?theme=${imageTheme}&t=${imageTimestamp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver en tamaño completo</span>
          </a>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopyImage}
              disabled={isCopyingImage}
              className="h-8 px-3 text-xs font-medium rounded-lg border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer flex items-center gap-1.5 shadow-none"
            >
              {isCopyingImage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Copiando...</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copiar Imagen</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onDownloadFlyer}
              disabled={isDownloadingImage}
              className="h-8 px-3.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer flex items-center gap-1.5 shadow-none"
            >
              {isDownloadingImage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar Imagen</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
