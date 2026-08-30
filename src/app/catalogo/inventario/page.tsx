import { getColoresInventario } from '@/actions/inventario'
import { InventarioClient } from '@/components/inventario/InventarioClient'

export const dynamic = 'force-dynamic'

export default async function CatalogoInventarioPage() {
  const { disponibles, restock } = await getColoresInventario()

  return (
    <InventarioClient 
      disponibles={disponibles} 
      restock={restock}
    />
  )
}
