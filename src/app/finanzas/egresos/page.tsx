import { getInversiones } from '@/actions/inversiones'
import { EgresosClient } from '@/components/finanzas/EgresosClient'

export const dynamic = 'force-dynamic'

export default async function EgresosPage() {
  const egresos = await getInversiones()
  return <EgresosClient egresos={egresos as any} />
}
