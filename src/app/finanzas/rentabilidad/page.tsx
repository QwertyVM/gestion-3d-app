import { Suspense } from 'react'
import { getRentabilidadSueldos } from '@/actions/rentabilidad'
import { RentabilidadSueldosView } from '@/components/finanzas/RentabilidadSueldosView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Rentabilidad & Sueldos | NOVA Finanzas',
  description: 'Control de utilidad mensual, saldo acumulado y capacidad de asignación de sueldos.',
}

export default async function RentabilidadPage() {
  const data = await getRentabilidadSueldos()

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-mono text-muted-foreground">
          Cargando análisis de rentabilidad y sueldos...
        </div>
      }
    >
      <RentabilidadSueldosView initialData={data} />
    </Suspense>
  )
}
