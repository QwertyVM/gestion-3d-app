import { getInversiones } from '@/actions/inversiones'
import { InyeccionClient } from '@/components/inversiones/InyeccionClient'

export const dynamic = 'force-dynamic'

export default async function InyeccionPage() {
  const inversiones = await getInversiones()
  return <InyeccionClient inversiones={inversiones as any} />
}
