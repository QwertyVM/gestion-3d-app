import { revalidatePath } from 'next/cache'

export type DomainTopic = 
  | 'orders'
  | 'workshop'
  | 'inventory'
  | 'finance'
  | 'catalog'
  | 'packaging'
  | 'clients'

const TOPIC_ROUTES: Record<DomainTopic, string[]> = {
  orders: [
    '/pedidos',
    '/taller',
    '/finanzas',
    '/finanzas/flujo-caja',
    '/finanzas/cierres',
    '/historico-mensual',
    '/flujo-mensual',
    '/inventario',
    '/catalogo/inventario',
    '/'
  ],
  workshop: [
    '/taller',
    '/pedidos',
    '/catalogo',
    '/'
  ],
  inventory: [
    '/inventario',
    '/catalogo/inventario',
    '/taller',
    '/pedidos',
    '/'
  ],
  finance: [
    '/finanzas',
    '/finanzas/flujo-caja',
    '/finanzas/cierres',
    '/finanzas/ingresos',
    '/finanzas/egresos',
    '/historico-mensual',
    '/flujo-mensual',
    '/'
  ],
  catalog: [
    '/catalogo',
    '/catalogo/productos',
    '/catalogo/categorias',
    '/catalogo/inventario',
    '/inventario',
    '/pedidos',
    '/'
  ],
  packaging: [
    '/packaging',
    '/catalogo/packaging',
    '/pedidos',
    '/'
  ],
  clients: [
    '/clientes',
    '/pedidos',
    '/'
  ]
}

/**
 * Revalida de forma segura las rutas asociadas a uno o más tópicos de dominio.
 * Si se ejecuta fuera del request store (ej. scripts o tareas de fondo), no arroja error.
 */
export function revalidateDomain(...topics: DomainTopic[]) {
  const routesToRevalidate = new Set<string>()
  for (const topic of topics) {
    const routes = TOPIC_ROUTES[topic]
    if (routes) {
      routes.forEach(r => routesToRevalidate.add(r))
    }
  }

  routesToRevalidate.forEach(route => {
    try {
      revalidatePath(route)
    } catch {
      // Ignorar de forma segura fuera del request store de Next.js
    }
  })
}
