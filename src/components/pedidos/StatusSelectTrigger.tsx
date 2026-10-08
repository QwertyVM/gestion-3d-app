'use client'

import {
  OrderStatusBadge,
  OrderStatusBadgeProps,
  ESTADO_PEDIDO_CONFIG,
  ESTADOS_ORDENADOS
} from './OrderStatusBadge'

export { OrderStatusBadge, ESTADO_PEDIDO_CONFIG, ESTADOS_ORDENADOS }
export type { OrderStatusBadgeProps }

// Mantener compatibilidad con cualquier import existente de StatusSelectTrigger
export const StatusSelectTrigger = OrderStatusBadge
export type StatusSelectTriggerProps = OrderStatusBadgeProps
