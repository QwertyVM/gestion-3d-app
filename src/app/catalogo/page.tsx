import { getProductos } from '@/actions/productos'
import { CatalogoClient } from '@/components/catalogo/CatalogoClient'

export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  const productos = await getProductos()

  return <CatalogoClient productos={productos} />
}
