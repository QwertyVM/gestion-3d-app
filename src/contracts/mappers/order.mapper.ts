import { EstadoPedido, TipoPrecio } from '@prisma/client'
import {
  PedidoView,
  ItemPedidoView,
  PagoPedidoView,
  AsignacionCajaPedidoView,
  FilamentoOption
} from '../orders.dto'

export class OrderMapper {
  /**
   * Mapea una entidad Prisma de Pedido a un PedidoView DTO fuertemente tipado.
   */
  public static toDTO(p: any, filamentosMap?: Map<string, any>): PedidoView {
    const items: ItemPedidoView[] = Array.isArray(p.items) ? p.items.map((it: any) => {
      const rawColoresIds: string[] = Array.isArray(it.coloresIds) && it.coloresIds.length > 0
        ? it.coloresIds
        : (it.colorFilamentoId ? [it.colorFilamentoId] : [])

      const resolvedColores = rawColoresIds.map(id => {
        if (filamentosMap && filamentosMap.has(id)) {
          const f = filamentosMap.get(id)
          return {
            id: f.id,
            nombreColor: f.nombreColor,
            numeroBobina: f.numeroBobina || 1,
            codigoHex: f.codigoHex || '#1E1E1E',
            tipoMaterial: f.tipoMaterial,
            marca: f.marca || 'Genérica',
            stockGramos: f.stockGramos ? Number(f.stockGramos) : 0,
            stockBobinas: Number(f.stockBobinas || 1)
          }
        }
        if (it.colorFilamento && it.colorFilamento.id === id) {
          return {
            id: it.colorFilamento.id,
            nombreColor: it.colorFilamento.nombreColor,
            numeroBobina: it.colorFilamento.numeroBobina || 1,
            codigoHex: it.colorFilamento.codigoHex || '#1E1E1E',
            tipoMaterial: it.colorFilamento.tipoMaterial,
            marca: it.colorFilamento.marca || 'Genérica',
            stockGramos: it.colorFilamento.stockGramos ? Number(it.colorFilamento.stockGramos) : 0,
            stockBobinas: Number(it.colorFilamento.stockBobinas || 1)
          }
        }
        return null
      }).filter(Boolean) as FilamentoOption[]

      const primaryColorFilamento = resolvedColores[0] || (it.colorFilamento ? {
        id: it.colorFilamento.id,
        nombreColor: it.colorFilamento.nombreColor,
        numeroBobina: it.colorFilamento.numeroBobina || 1,
        codigoHex: it.colorFilamento.codigoHex || '#1E1E1E',
        tipoMaterial: it.colorFilamento.tipoMaterial,
        marca: it.colorFilamento.marca || 'Genérica',
        stockGramos: it.colorFilamento.stockGramos ? Number(it.colorFilamento.stockGramos) : 0,
        stockBobinas: Number(it.colorFilamento.stockBobinas || 1)
      } : null)

      return {
        id: it.id,
        pedidoId: it.pedidoId,
        productoId: it.productoId,
        nombreProductoSnapshot: it.nombreProductoSnapshot || it.producto?.nombreModelo || '',
        costoBaseSnapshot: it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
          ? Number(it.costoBaseSnapshot)
          : (it.producto ? Number(it.producto.costoBase) : 0),
        colorFilamentoId: it.colorFilamentoId || rawColoresIds[0] || null,
        coloresIds: rawColoresIds,
        colores: resolvedColores.length > 0 ? resolvedColores : (primaryColorFilamento ? [primaryColorFilamento] : []),
        personalizacion: it.personalizacion || null,
        cantidad: Number(it.cantidad),
        tipoPrecio: (it.tipoPrecio || 'MENOR') as TipoPrecio,
        precioUnitario: Number(it.precioUnitario),
        costoPackaging: it.costoPackaging != null ? Number(it.costoPackaging) : 0,
        porcentajeAdicional: it.porcentajeAdicional != null ? Number(it.porcentajeAdicional) : 0,
        gramosConsumidos: it.gramosConsumidos != null ? Number(it.gramosConsumidos) : 0,
        subtotal: Number(it.subtotal),
        producto: it.producto ? {
          id: it.producto.id,
          lineaCategoria: it.producto.lineaCategoria,
          nombreModelo: it.producto.nombreModelo,
          costoBase: Number(it.producto.costoBase),
          precioMayor: Number(it.producto.precioMayor),
          precioMenor: Number(it.producto.precioMenor),
          activo: it.producto.activo
        } : null,
        colorFilamento: primaryColorFilamento
      }
    }) : []

    const pagos: PagoPedidoView[] = Array.isArray(p.pagos) ? p.pagos.map((pg: any) => ({
      id: pg.id,
      pedidoId: pg.pedidoId,
      fecha: pg.fecha instanceof Date ? pg.fecha.toISOString() : String(pg.fecha),
      monto: Number(pg.monto),
      metodoPago: pg.metodoPago || 'YAPE',
      tipo: pg.tipo || 'ANTICIPO',
      notas: pg.notas || null
    })) : []

    const cajas: AsignacionCajaPedidoView[] = Array.isArray(p.cajas) ? p.cajas.map((c: any) => ({
      id: c.id,
      pedidoId: c.pedidoId,
      inversionId: c.inversionId || null,
      nombreCaja: c.nombreCaja || 'Caja de Envío',
      cantidad: Number(c.cantidad || 1),
      costoUnitario: Number(c.costoUnitario || 0),
      costoTotal: Number(c.costoTotal || 0),
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt)
    })) : []

    const totalCajas = cajas.reduce((sum: number, c) => sum + c.cantidad, 0)
    const costoTotalCajas = Number(cajas.reduce((sum: number, c) => sum + c.costoTotal, 0).toFixed(2))

    const costoFabricacion = Number(items.reduce((sum: number, it) => {
      const cBase = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
        ? Number(it.costoBaseSnapshot)
        : (it.producto ? Number(it.producto.costoBase) : 0)
      return sum + (cBase * it.cantidad)
    }, 0).toFixed(2))

    const totalEnvio = Number(p.costoEnvio || 0)
    const totalPedido = Number(p.total || 0)
    const utilidadNetaReal = Number((totalPedido - (costoFabricacion + costoTotalCajas + totalEnvio)).toFixed(2))
    const margenNetoPct = totalPedido > 0
      ? Number(((utilidadNetaReal / totalPedido) * 100).toFixed(1))
      : 0

    return {
      id: p.id,
      codigo: p.codigo,
      fecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha),
      cliente: p.cliente,
      dni: p.dni || null,
      telefono: p.telefono || null,
      canalVenta: p.canalVenta || null,
      handleSocial: p.handleSocial || null,
      destinoEnvio: p.destinoEnvio || null,
      diaEntregaPrometida: p.diaEntregaPrometida || null,
      notas: p.notas || null,
      metodoPago: (() => {
        if (p.metodoPago) return p.metodoPago
        if (p.notas) {
          const match = p.notas.match(/M[eé]todo de pago:\s*([A-Za-z0-9_\-]+)/i)
          if (match) return match[1]
        }
        if (pagos.length > 0 && pagos[0].metodoPago) return pagos[0].metodoPago
        return 'YAPE'
      })(),
      estado: p.estado as EstadoPedido,
      costoEnvio: totalEnvio,
      subtotal: Number(p.subtotal || 0),
      total: totalPedido,
      montoPagado: Number(p.montoPagado || 0),
      saldoPendiente: Number(p.saldoPendiente || 0),
      seguimientoPostventa: Boolean(p.seguimientoPostventa),
      fechaPostventa: p.fechaPostventa instanceof Date ? p.fechaPostventa.toISOString() : (p.fechaPostventa ? String(p.fechaPostventa) : null),
      notasPostventa: p.notasPostventa || null,
      items,
      pagos,
      cajas,
      totalCajas,
      costoTotalCajas,
      costoFabricacion,
      costoBaseTotal: costoFabricacion,
      utilidadNetaReal,
      margenNetoPct,
      totalItemsCount: items.reduce((sum: number, it) => sum + it.cantidad, 0),
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt)
    }
  }
}
