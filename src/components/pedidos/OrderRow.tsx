'use client'

import { OrderTableRow, OrderTableRowProps } from './OrderTableRow'

export { OrderTableRow }
export type { OrderTableRowProps }

// Mantener compatibilidad con cualquier import existente de OrderRow
export const OrderRow = OrderTableRow
export type OrderRowProps = OrderTableRowProps
