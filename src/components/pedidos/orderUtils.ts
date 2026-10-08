import { ItemPedidoView, FilamentoOption, PedidoView } from './types'

export function getItemColors(it: ItemPedidoView, allFilamentos?: FilamentoOption[]): FilamentoOption[] {
  if (Array.isArray(it.colores) && it.colores.length > 0) {
    return it.colores
  }
  if (it.colorFilamento) {
    return [it.colorFilamento]
  }
  const rawIds = Array.isArray(it.coloresIds) && it.coloresIds.length > 0
    ? it.coloresIds
    : (it.colorFilamentoId ? [it.colorFilamentoId] : [])

  if (rawIds.length > 0 && Array.isArray(allFilamentos)) {
    const resolved = rawIds
      .map(id => allFilamentos.find(f => f.id === id))
      .filter(Boolean) as FilamentoOption[]
    if (resolved.length > 0) return resolved
  }
  return []
}

export interface ConsolidatedOrderItem {
  key: string
  nombre: string
  cantidadTotal: number
  colores: FilamentoOption[]
  personalizacion?: string
}

/**
 * Agrupa productos idénticos (mismo nombre o productoId) bajo [Nombre del Modelo] ×[N]
 * combinando de forma única los filamentos asignados.
 */
export function consolidateOrderItems(
  items: ItemPedidoView[],
  allFilamentos?: FilamentoOption[]
): ConsolidatedOrderItem[] {
  const map = new Map<string, ConsolidatedOrderItem>()

  for (const it of items) {
    const key = (it.productoId || it.nombreProductoSnapshot || '').trim().toLowerCase()
    const itColors = getItemColors(it, allFilamentos)

    if (map.has(key)) {
      const existing = map.get(key)!
      existing.cantidadTotal += Number(it.cantidad) || 1
      for (const col of itColors) {
        if (!existing.colores.some(c => c.id === col.id || c.nombreColor.toLowerCase() === col.nombreColor.toLowerCase())) {
          existing.colores.push(col)
        }
      }
      if (it.personalizacion && !existing.personalizacion) {
        existing.personalizacion = it.personalizacion
      } else if (it.personalizacion && existing.personalizacion && !existing.personalizacion.includes(it.personalizacion)) {
        existing.personalizacion += `, ${it.personalizacion}`
      }
    } else {
      map.set(key, {
        key,
        nombre: it.nombreProductoSnapshot,
        cantidadTotal: Number(it.cantidad) || 1,
        colores: [...itColors],
        personalizacion: it.personalizacion || undefined
      })
    }
  }

  return Array.from(map.values())
}

export function formatCurrency(val: number): string {
  return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getInstagramDirectUrl(handle: string): string {
  const clean = handle.replace(/^@/, '').trim()
  return `https://ig.me/m/${clean}`
}

export function getWhatsAppPostventaUrl(phone: string, clientName: string, codigo: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone
  const msg = encodeURIComponent(`¡Hola ${clientName}! 👋 Te escribimos de NOVA para saber cómo te fue con tu pedido ${codigo}. ¡Esperamos que todo haya quedado genial! Cuéntanos si todo llegó bien o si tienes alguna consulta.`)
  return `https://wa.me/${fullPhone}?text=${msg}`
}

export function generateWhatsAppOrderTicket(p: PedidoView, filamentos?: FilamentoOption[]): string {
  const itemsText = p.items.map((it, idx) => {
    const itemColores = getItemColors(it, filamentos)
    const colorText = itemColores.length > 1
      ? ` (Colores: ${itemColores.map(c => c.nombreColor).join(' + ')})`
      : itemColores.length === 1
      ? ` (Color: ${itemColores[0].nombreColor})`
      : ''
    const customText = it.personalizacion ? ` [Nota: ${it.personalizacion}]` : ''
    return `  ${idx + 1}. *${it.nombreProductoSnapshot}* x${it.cantidad}${colorText}${customText} — S/ ${it.subtotal.toFixed(2)}`
  }).join('\n')

  const envioText = p.costoEnvio > 0 ? `\n🚚 *Envío / Destino:* S/ ${p.costoEnvio.toFixed(2)} (${p.destinoEnvio || 'Agencia'})` : ''
  const saldoText = p.saldoPendiente > 0 ? `\n⏳ *Saldo Pendiente:* S/ ${p.saldoPendiente.toFixed(2)}` : '\n✅ *Estado Pago:* 100% Cancelado'

  const formattedDate = p.fecha ? (p.fecha.includes('T') ? p.fecha.split('T')[0] : p.fecha) : ''

  return `*RESUMEN DE PEDIDO 3D — ${p.codigo}*\n` +
    `👤 *Cliente:* ${p.cliente}\n` +
    `📅 *Fecha:* ${formattedDate}\n` +
    (p.diaEntregaPrometida ? `📦 *Entrega Pactada:* ${p.diaEntregaPrometida}\n` : '') +
    `\n*PRODUCTOS:* \n${itemsText}${envioText}\n\n` +
    `💳 *Medio de Pago:* ${p.metodoPago || (p.pagos?.[0]?.metodoPago) || 'YAPE'}\n` +
    `💰 *Total Pedido:* S/ ${p.total.toFixed(2)}\n` +
    `💳 *Abonado:* S/ ${p.montoPagado.toFixed(2)}${saldoText}\n\n` +
    `_¡Gracias por tu pedido en NOVA 3D!_`
}

