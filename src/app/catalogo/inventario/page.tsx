import { getColoresInventario } from '@/actions/inventario'
import { InventarioFilamentosClient } from '@/components/inventario/InventarioFilamentosClient'

export const dynamic = 'force-dynamic'

export default async function CatalogoInventarioPage() {
  const { disponibles, restock, descatalogados } = await getColoresInventario()

  return (
    <InventarioFilamentosClient 
      disponibles={disponibles} 
      restock={restock}
      descatalogados={descatalogados}
    />
  )
}
