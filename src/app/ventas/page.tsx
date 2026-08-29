import { getVentas, getPromedioPackaging } from '@/actions/ventas'
import { getProductos } from '@/actions/productos'
import { VentasClient } from '@/components/ventas/VentasClient'

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const [ventas, productos, promedioPackaging] = await Promise.all([
    getVentas(),
    getProductos(),
    getPromedioPackaging(),
  ])

  return (
    <VentasClient 
      ventas={ventas} 
      productos={productos} 
      promedioPackaging={promedioPackaging} 
    />
  )
}
