import { getPedidos } from '@/actions/pedidos'
import { getProductos } from '@/actions/productos'
import { getFilamentosActivos } from '@/actions/inventario'
import { getClientes } from '@/actions/clientes'
import { getStockCajas } from '@/actions/cajas'
import { PedidosClient } from '@/components/pedidos/PedidosClient'
import { PedidoView, ProductoOption, FilamentoOption, ClienteOption } from '@/components/pedidos/types'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const [pedidos, productos, filamentos, clientes, stockCajas] = await Promise.all([
    getPedidos(),
    getProductos(),
    getFilamentosActivos(),
    getClientes(),
    getStockCajas()
  ])

  return (
    <PedidosClient
      pedidosIniciales={pedidos}
      productos={productos}
      filamentos={filamentos}
      clientesIniciales={clientes}
      stockCajasInicial={stockCajas}
    />
  )
}
