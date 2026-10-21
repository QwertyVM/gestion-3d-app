import { getPedidos } from '@/actions/pedidos'
import { getIngresos } from '@/actions/ingresos'
import { IngresosClient } from '@/components/finanzas/IngresosClient'

export const dynamic = 'force-dynamic'

export default async function IngresosPage() {
  const [pedidos, ingresosDirectos] = await Promise.all([
    getPedidos(),
    getIngresos(),
  ])

  return (
    <IngresosClient 
      ventas={[]} 
      pedidos={pedidos}
      ingresosDirectos={ingresosDirectos as any} 
    />
  )
}
