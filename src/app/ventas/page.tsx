import { getVentas, getPromedioPackaging } from '@/actions/ventas'
import { getProductos } from '@/actions/productos'
import { getFilamentosActivos } from '@/actions/inventario'
import { VentasClient } from '@/components/ventas/VentasClient'

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const [ventas, productos, promedioPackaging, filamentos] = await Promise.all([
    getVentas(),
    getProductos(),
    getPromedioPackaging(),
    getFilamentosActivos(),
  ])

  return (
    <VentasClient 
      ventas={ventas} 
      productos={productos} 
      promedioPackaging={promedioPackaging} 
      filamentos={filamentos}
    />
  )
}
