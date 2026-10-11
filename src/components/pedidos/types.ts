import { EstadoPedido, TipoPrecio } from '@prisma/client'

export interface ItemPedidoView {
  id: string
  pedidoId: string
  productoId: string
  nombreProductoSnapshot: string
  costoBaseSnapshot: number
  colorFilamentoId: string | null
  coloresIds?: string[]
  colores?: FilamentoOption[]
  personalizacion: string | null
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  costoPackaging: number
  porcentajeAdicional: number
  gramosConsumidos: number
  subtotal: number
  producto?: {
    id: string
    lineaCategoria: string
    nombreModelo: string
    costoBase: number
    precioMayor: number
    precioMenor: number
    activo: boolean
  } | null
  colorFilamento?: {
    id: string
    nombreColor: string
    numeroBobina?: number | null
    codigoHex?: string | null
    tipoMaterial: string
    marca?: string | null
    stockGramos?: number | null
    stockBobinas: number
  } | null
}

export interface PagoPedidoView {
  id: string
  pedidoId: string
  fecha: string
  monto: number
  metodoPago: string
  tipo: string
  notas: string | null
}

export interface PedidoView {
  id: string
  codigo: string
  fecha: string
  cliente: string
  dni?: string | null
  telefono: string | null
  canalVenta: string | null
  handleSocial?: string | null
  destinoEnvio: string | null
  diaEntregaPrometida: string | null
  notas: string | null
  metodoPago?: string | null
  estado: EstadoPedido
  costoEnvio: number
  subtotal: number
  total: number
  montoPagado: number
  saldoPendiente: number
  seguimientoPostventa: boolean
  fechaPostventa?: string | null
  notasPostventa?: string | null
  items: ItemPedidoView[]
  pagos: PagoPedidoView[]
  totalItemsCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductoVarianteOption {
  id: string
  productoId?: string
  nombreVariante: string
  costoBase: number
  precioMenor: number
  precioMayor: number
  activo?: boolean
  imagenUrl?: string | null
  imageUrl?: string | null
  pedidosCount?: number
  pedidosIds?: string[]
}

export interface ProductoOption {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioMayor: number
  precioMenor: number
  activo: boolean
  tieneVariantes?: boolean
  variantes?: ProductoVarianteOption[]
  imagenUrl?: string | null
  imageUrl?: string | null
  enlaceMakerworld?: string | null
  pedidosCount?: number
  pedidosIds?: string[]
}

export interface FilamentoOption {
  id: string
  nombreColor: string
  codigoHex?: string | null
  tipoMaterial: string
  marca?: string | null
  stockGramos?: number | null
  stockBobinas: number
  numeroBobina?: number | null
  estado?: string
}

export interface ClienteOption {
  id: string
  nombre: string
  telefono?: string | null
  canalOrigen?: string | null
  canalPreferido?: string | null
  handleSocial?: string | null
  direccion?: string | null
  distrito?: string | null
  dni?: string | null
}

export interface FormItemState {
  id: string
  productoId: string
  varianteId?: string
  nombreDisplay?: string
  costoBase?: number
  costoBaseSnapshot?: number
  colorFilamentoId: string
  coloresIds: string[]
  personalizacion: string
  cantidad: number | string
  tipoPrecio: TipoPrecio
  precioUnitario: number | string
  costoPackaging: number | string
  porcentajeAdicional: number
  gramosConsumidos: number
  imageUrl?: string | null
}
