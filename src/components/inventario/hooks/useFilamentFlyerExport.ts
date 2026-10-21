import { useState } from 'react'
import { toast } from 'sonner'

export function useFilamentFlyerExport() {
  const [openImageModal, setOpenImageModal] = useState(false)
  const [imageTheme, setImageTheme] = useState<'dark' | 'light'>('dark')
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isCopyingImage, setIsCopyingImage] = useState(false)
  const [imageTimestamp, setImageTimestamp] = useState(Date.now())

  const handleDownloadFlyer = () => {
    try {
      setIsDownloadingImage(true)
      const downloadUrl = `/api/inventario/filamentos/imagen?theme=${imageTheme}&download=true&t=${Date.now()}`
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `catalogo-colores-disponibles-nova3d-${imageTheme}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Descargando imagen del catálogo en alta resolución')
    } catch (err: any) {
      toast.error('Error al descargar: ' + (err?.message || 'Error'))
    } finally {
      setTimeout(() => setIsDownloadingImage(false), 800)
    }
  }

  const handleCopyFlyerImage = async () => {
    try {
      setIsCopyingImage(true)
      const res = await fetch(`/api/inventario/filamentos/imagen?theme=${imageTheme}&t=${Date.now()}`)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      toast.success('¡Imagen copiada al portapapeles! Ya puedes pegarla en WhatsApp o Instagram')
    } catch {
      toast.error('No se pudo copiar directo. Usa el botón "Descargar Imagen"')
    } finally {
      setIsCopyingImage(false)
    }
  }

  const refreshPreview = () => {
    setImageTimestamp(Date.now())
  }

  return {
    openImageModal,
    setOpenImageModal,
    imageTheme,
    setImageTheme,
    isDownloadingImage,
    isCopyingImage,
    imageTimestamp,
    refreshPreview,
    handleDownloadFlyer,
    handleCopyFlyerImage
  }
}
