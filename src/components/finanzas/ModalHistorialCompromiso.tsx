'use client'

import React from 'react'
import {
  PaymentHistoryModal,
  HistorialModalItem,
  PaymentHistoryModalProps,
} from './PaymentHistoryModal'

export type { HistorialModalItem }
export type ModalHistorialCompromisoProps = PaymentHistoryModalProps

export function ModalHistorialCompromiso(props: ModalHistorialCompromisoProps) {
  return <PaymentHistoryModal {...props} />
}
