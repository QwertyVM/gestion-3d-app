'use client'

import React, { useState } from 'react'
import {
  BannerTiendaItem,
  createBannerTienda,
  updateBannerTienda,
  deleteBannerTienda,
  toggleBannerTienda,
} from '@/actions/tienda'
import { TipoNegocio } from '@/lib/business'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  ArrowRight,
  Star,
  ExternalLink,
  X,
  Palette,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabBannersHeroProps {
  negocio: TipoNegocio
  banners: BannerTiendaItem[]
  onRefresh: () => void
}

const COLOR_OPTIONS = [
  { name: 'Azul Nova', hex: '#0066ff' },
  { name: 'Cyan Brillante', hex: '#00d2ff' },
  { name: 'Ámbar Cálido', hex: '#f59e0b' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Púrpura Neón', hex: '#8b5cf6' },
  { name: 'Rojo Carmesí', hex: '#ef4444' },
]

export function TabBannersHero({ negocio, banners, onRefresh }: TabBannersHeroProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerTiendaItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [tag, setTag] = useState('')
  const [titulo, setTitulo] = useState('')
  const [resaltado, setResaltado] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [ctaTexto, setCtaTexto] = useState('Explorar Catálogo')
  const [ctaLink, setCtaLink] = useState('/categoria/todos')
  const [imagenUrl, setImagenUrl] = useState('')
  const [previewBadge, setPreviewBadge] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewRating, setPreviewRating] = useState('5.0 Calidad Garantizada')
  const [colorAcento, setColorAcento] = useState(negocio === '3D' ? '#f59e0b' : '#0066ff')
  const [orden, setOrden] = useState(0)

  const handleOpenCreate = () => {
    setEditingBanner(null)
    setTag(negocio === '3D' ? 'NOVEDAD 3D 2026' : 'COLECCIÓN OFICIAL 2026')
    setTitulo(negocio === '3D' ? 'Impresiones 3D & Accesorios' : 'Tu Pasión por los Juegos de Mesa')
    setResaltado(negocio === '3D' ? 'Diseño y Precisión.' : 'Elevada al Máximo.')
    setSubtitulo(
      negocio === '3D'
        ? 'Fabricación aditiva de piezas a medida, miniaturas y componentes de alta resistencia.'
        : 'Descubre juegos de mesa, organizadores a medida y accesorios exclusivos.'
    )
    setCtaTexto('Explorar Catálogo')
    setCtaLink('/categoria/todos')
    setImagenUrl('')
    setPreviewBadge(negocio === '3D' ? 'CALIDAD PRO 3D' : 'EDICIÓN OFICIAL')
    setPreviewTitle(negocio === '3D' ? 'Piezas & Accesorios' : 'Sets Completos')
    setPreviewRating('5.0 Calidad Garantizada')
    setColorAcento(negocio === '3D' ? '#f59e0b' : '#0066ff')
    setOrden(banners.length + 1)
    setModalOpen(true)
  }

  const handleOpenEdit = (b: BannerTiendaItem) => {
    setEditingBanner(b)
    setTag(b.tag || '')
    setTitulo(b.titulo)
    setResaltado(b.resaltado || '')
    setSubtitulo(b.subtitulo || '')
    setCtaTexto(b.ctaTexto || 'Explorar Catálogo')
    setCtaLink(b.ctaLink || '/categoria/todos')
    setImagenUrl(b.imagenUrl || '')
    setPreviewBadge(b.previewBadge || '')
    setPreviewTitle(b.previewTitle || '')
    setPreviewRating(b.previewRating || '5.0 Calidad Garantizada')
    setColorAcento(b.colorAcento || (negocio === '3D' ? '#f59e0b' : '#0066ff'))
    setOrden(b.orden || 0)
    setModalOpen(true)
  }

  const handleToggleActive = async (id: string) => {
    try {
      await toggleBannerTienda(id)
      toast.success('Estado del banner actualizado')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner del carrusel?')) return
    try {
      await deleteBannerTienda(id)
      toast.success('Banner eliminado correctamente')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar banner')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) {
      toast.error('El título del banner es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingBanner) {
        await updateBannerTienda(editingBanner.id, {
          tag,
          titulo,
          resaltado,
          subtitulo,
          ctaTexto,
          ctaLink,
          imagenUrl,
          previewBadge,
          previewTitle,
          previewRating,
          colorAcento,
          orden,
        })
        toast.success('Banner actualizado correctamente')
      } else {
        await createBannerTienda({
          negocio,
          tag,
          titulo,
          resaltado,
          subtitulo,
          ctaTexto,
          ctaLink,
          imagenUrl,
          previewBadge,
          previewTitle,
          previewRating,
          colorAcento,
          orden,
          activo: true,
        })
        toast.success('Nuevo banner creado y publicado en la tienda')
      }
      setModalOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar banner')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 sm:p-5 rounded-2xl border border-border/60 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Banners del Hero Carousel ({negocio})
          </h3>
          <p className="text-xs text-muted-foreground">
            Gestiona los slides visuales interactivos que ven tus clientes al entrar a la tienda web.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Banner Hero</span>
        </button>
      </div>

      {/* Banners List / Grid */}
      {banners.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">No hay banners personalizados aún para {negocio}</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            La tienda web usará las imágenes y textos estándar hasta que crees tus propios banners promocionales.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
          >
            Crear Primer Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                b.activo
                  ? 'bg-card border-border/60 shadow-xs'
                  : 'bg-muted/10 border-dashed border-border/60 opacity-75'
              }`}
            >
              {/* Card Banner Preview Simulation */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white relative">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-xs"
                    style={{ backgroundColor: b.colorAcento, color: '#0f172a' }}
                  >
                    {b.tag || 'OFERTA'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <span className="font-mono text-[10px]">Slide #{idx + 1}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        b.activo ? 'bg-emerald-400' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <h4 className="text-base sm:text-lg font-bold leading-tight">
                  {b.titulo}{' '}
                  {b.resaltado && (
                    <span style={{ color: b.colorAcento }} className="font-extrabold">
                      {b.resaltado}
                    </span>
                  )}
                </h4>

                {b.subtitulo && (
                  <p className="text-xs text-white/80 line-clamp-2 mt-1.5 leading-relaxed">
                    {b.subtitulo}
                  </p>
                )}

                <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
                    <span>{b.ctaTexto}</span>
                    <ArrowRight className="w-3.5 h-3.5" style={{ color: b.colorAcento }} />
                  </div>
                  {b.previewRating && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-300">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>{b.previewRating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Details & Actions */}
              <div className="p-3.5 sm:p-4 bg-card flex items-center justify-between gap-2 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded border border-border/60 text-foreground">
                    Link: {b.ctaLink}
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-border/60 shrink-0 shadow-2xs"
                    style={{ backgroundColor: b.colorAcento }}
                    title={`Color: ${b.colorAcento}`}
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      b.activo
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'text-muted-foreground bg-muted/40 border-border/60 hover:bg-muted/70'
                    }`}
                    title={b.activo ? 'Desactivar Banner' : 'Activar Banner'}
                  >
                    {b.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 rounded-lg text-foreground bg-muted/30 hover:bg-muted border border-border/60 transition-colors cursor-pointer"
                    title="Editar Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Eliminar Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card rounded-2xl border border-border/80 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {editingBanner ? 'Editar Banner Hero' : 'Nuevo Banner Hero'} ({negocio})
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">Tag / Etiqueta Superior</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Ej: COLECCIÓN OFICIAL 2026"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">Orden de Aparición</label>
                  <input
                    type="number"
                    min="0"
                    value={orden}
                    onChange={(e) => setOrden(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Título Principal</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Tu Pasión por los Juegos de Mesa,"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Texto Resaltado (Color)</label>
                <input
                  type="text"
                  value={resaltado}
                  onChange={(e) => setResaltado(e.target.value)}
                  placeholder="Ej: Elevada al Máximo."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Subtítulo Descriptivo</label>
                <textarea
                  rows={2}
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  placeholder="Describe los productos o beneficios destacados..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">Texto del Botón (CTA)</label>
                  <input
                    type="text"
                    value={ctaTexto}
                    onChange={(e) => setCtaTexto(e.target.value)}
                    placeholder="Explorar Catálogo"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">Enlace del Botón (CTA Link)</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="/categoria/todos"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Color de Acento del Banner</label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorAcento(c.hex)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                        colorAcento === c.hex
                          ? 'border-primary bg-primary/10 ring-1 ring-primary text-foreground'
                          : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={colorAcento}
                    onChange={(e) => setColorAcento(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border/80 bg-background cursor-pointer p-0.5"
                    title="Color personalizado"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">URL de Imagen de Fondo / Lateral (Opcional)</label>
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
                />
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border/60 text-muted-foreground hover:bg-muted/40 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingBanner
                    ? 'Actualizar Banner'
                    : 'Publicar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
