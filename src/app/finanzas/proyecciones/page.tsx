import { getDatosPresupuestoTranquilidad } from '@/actions/presupuesto'
import { ProyeccionesClient } from '@/components/finanzas/ProyeccionesClient'

export const dynamic = 'force-dynamic'

export default async function ProyeccionesPage() {
  const datos = await getDatosPresupuestoTranquilidad()
  return <ProyeccionesClient datos={datos} />
}
