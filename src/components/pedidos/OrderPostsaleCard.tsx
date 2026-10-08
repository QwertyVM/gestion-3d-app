'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle2,
  Loader2,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { getInstagramDirectUrl, getWhatsAppPostventaUrl } from './orderUtils'

function InstagramIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

interface OrderPostsaleCardProps {
  pedidoId: string
  codigo: string
  cliente: string
  telefono?: string | null
  handleSocial?: string | null
  seguimientoPostventa: boolean
  fechaPostventa?: string | null
  initialNotasPostventa?: string | null
  onTogglePostventa: (pedidoId: string, nuevoEstado: boolean, e?: React.MouseEvent) => Promise<void>
  onSaveNotasPostventa: (pedidoId: string, notas: string) => Promise<void>
}

export function OrderPostsaleCard({
  pedidoId,
  codigo,
  cliente,
  telefono,
  handleSocial,
  seguimientoPostventa,
  fechaPostventa,
  initialNotasPostventa,
  onTogglePostventa,
  onSaveNotasPostventa
}: OrderPostsaleCardProps) {
  const [notas, setNotas] = useState(initialNotasPostventa || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Sincronizar estado local si cambia el pedido
  useEffect(() => {
    setNotas(initialNotasPostventa || '')
  }, [pedidoId, initialNotasPostventa])

  const handleToggle = async (e: React.MouseEvent) => {
    setIsToggling(true)
    try {
      await onTogglePostventa(pedidoId, !seguimientoPostventa, e)
    } finally {
      setIsToggling(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveNotasPostventa(pedidoId, notas)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3.5 shadow-2xs">
      {/* Fila superior: Título, Badge de estado y Botón secundario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Seguimiento Postventa
          </span>

          {seguimientoPostventa ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-foreground border border-border text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Realizado {fechaPostventa ? `(${formatDate(fechaPostventa)})` : ''}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/60 text-accent-foreground text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" />
              <span>Pendiente de contacto</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            disabled={isToggling}
            onClick={handleToggle}
            className="h-8 px-3 rounded-xl text-xs border-border bg-card hover:bg-muted text-foreground font-semibold cursor-pointer transition-colors"
          >
            {isToggling ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            ) : null}
            {seguimientoPostventa ? 'Desmarcar' : '✔ Marcar Realizado'}
          </Button>
        </div>
      </div>

      {/* Enlaces directos de contacto SOLO si existen datos (cero cajas punteadas si no existen) */}
      {(handleSocial || telefono) && (
        <div className="flex items-center gap-2 flex-wrap">
          {handleSocial && (
            <a
              href={getInstagramDirectUrl(handleSocial)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg bg-secondary/60 hover:bg-muted border border-border/70"
              title="Abrir Instagram Direct"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              <span>Instagram (@{handleSocial.replace(/^@/, '')})</span>
            </a>
          )}
          {telefono && (
            <a
              href={getWhatsAppPostventaUrl(telefono, cliente, codigo)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg bg-secondary/60 hover:bg-muted border border-border/70"
              title="Abrir WhatsApp con plantilla postventa"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp ({telefono})</span>
            </a>
          )}
        </div>
      )}

      {/* Fila inferior: Input para feedback postventa con botón integrado Guardar Nota */}
      <div className="flex items-center gap-2 pt-0.5">
        <Input
          placeholder="Notas o feedback postventa (ej: le gustó el acabado, cliente contento)..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            }
          }}
          className="h-9 bg-background border-border text-xs rounded-xl focus-visible:ring-primary"
        />
        <Button
          size="sm"
          disabled={isSaving}
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 rounded-xl font-semibold cursor-pointer shrink-0 transition-opacity"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              <span>Guardando...</span>
            </>
          ) : (
            'Guardar Nota'
          )}
        </Button>
      </div>
    </div>
  )
}
