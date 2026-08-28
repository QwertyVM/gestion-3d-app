import { getVentas } from '@/actions/ventas'
import { VentasClient } from '@/components/ventas/VentasClient'

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const ventas = await getVentas()

  return <VentasClient ventas={ventas} />
}
