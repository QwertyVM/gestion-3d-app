import { getDatosCajaChica } from '@/actions/proyecciones'
import { ProyeccionesClient } from '@/components/finanzas/ProyeccionesClient'

export const dynamic = 'force-dynamic'

export default async function ProyeccionesPage() {
  const datos = await getDatosCajaChica()
  return <ProyeccionesClient datos={datos} />
}
