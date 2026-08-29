import { getVentas } from '@/actions/ventas'
import { getIngresos } from '@/actions/ingresos'
import { IngresosClient } from '@/components/finanzas/IngresosClient'

export const dynamic = 'force-dynamic'

export default async function IngresosPage() {
  const [ventas, ingresosDirectos] = await Promise.all([
    getVentas(),
    getIngresos(),
  ])

  return (
    <IngresosClient 
      ventas={ventas as any} 
      ingresosDirectos={ingresosDirectos as any} 
    />
  )
}
