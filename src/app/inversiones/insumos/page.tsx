import { getInversiones } from '@/actions/inversiones'
import { InsumosClient } from '@/components/inversiones/InsumosClient'

export const dynamic = 'force-dynamic'

export default async function InsumosPage() {
  const inversiones = await getInversiones()
  return <InsumosClient inversiones={inversiones as any} />
}
