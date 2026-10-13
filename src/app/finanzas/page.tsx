import { Suspense } from 'react'
import { getInversiones } from '@/actions/inversiones'
import { getVentas } from '@/actions/ventas'
import { getIngresos } from '@/actions/ingresos'
import { getDatosPresupuestoTranquilidad } from '@/actions/presupuesto'
import { CashFlowHubView } from '@/components/finanzas/CashFlowHubView'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const [egresos, ventas, ingresosDirectos, datosPresupuesto] = await Promise.all([
    getInversiones(),
    getVentas(),
    getIngresos(),
    getDatosPresupuestoTranquilidad(),
  ])

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-xs font-mono">Cargando Flujo de Caja y Salud Financiera...</div>}>
      <CashFlowHubView 
        egresos={egresos as any} 
        ventas={ventas as any} 
        ingresosDirectos={ingresosDirectos as any} 
        datosPresupuesto={datosPresupuesto}
      />
    </Suspense>
  )
}
