import { getInversiones } from '@/actions/inversiones'
import { InversionesClient } from '@/components/inversiones/InversionesClient'

export const dynamic = 'force-dynamic'

export default async function InversionesPage() {
  const inversiones = await getInversiones()

  return <InversionesClient inversiones={inversiones} />
}
