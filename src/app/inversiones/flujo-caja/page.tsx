import { getInversiones } from '@/actions/inversiones'
import { getVentas } from '@/actions/ventas'
import { FlujoCajaClient } from '@/components/inversiones/FlujoCajaClient'

export const dynamic = 'force-dynamic'

export default async function FlujoCajaPage() {
  const [inversiones, ventas] = await Promise.all([
    getInversiones(),
    getVentas(),
  ])

  return <FlujoCajaClient inversiones={inversiones as any} ventas={ventas as any} />
}
