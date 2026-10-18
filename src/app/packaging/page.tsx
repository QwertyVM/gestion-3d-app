import { getStockCajas } from '@/actions/cajas'
import { PackagingClient } from '@/components/packaging/PackagingClient'

export const dynamic = 'force-dynamic'

export default async function PackagingPage() {
  const stockCajas = await getStockCajas()

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PackagingClient initialStockCajas={stockCajas} />
    </div>
  )
}
