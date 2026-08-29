import { getInversiones } from '@/actions/inversiones'
import { getTagsInsumos } from '@/actions/tagsInsumos'
import { EgresosClient } from '@/components/finanzas/EgresosClient'

export const dynamic = 'force-dynamic'

export default async function EgresosPage() {
  const [egresos, tags] = await Promise.all([
    getInversiones(),
    getTagsInsumos(),
  ])

  return <EgresosClient egresos={egresos as any} tags={tags} />
}
