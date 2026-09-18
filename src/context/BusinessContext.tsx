'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TipoNegocio, BusinessConfig, BUSINESSES, BUSINESS_COOKIE_NAME, DEFAULT_NEGOCIO } from '@/lib/business'

interface BusinessContextType {
  negocio: TipoNegocio
  config: BusinessConfig
  is3D: boolean
  isBG: boolean
  setNegocio: (nextNegocio: TipoNegocio) => void
  isPending: boolean
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

function getInitialNegocio(): TipoNegocio {
  if (typeof window === 'undefined') return DEFAULT_NEGOCIO

  // 1. Try reading from cookie
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + BUSINESS_COOKIE_NAME + '=([^;]*)'))
  if (match && (match[2] === '3D' || match[2] === 'BG')) {
    return match[2] as TipoNegocio
  }

  // 2. Try reading from localStorage
  const saved = localStorage.getItem('nova_business')
  if (saved === '3D' || saved === 'BG') {
    return saved as TipoNegocio
  }

  return DEFAULT_NEGOCIO
}

export function BusinessProvider({
  children,
  initialNegocio
}: {
  children: React.ReactNode
  initialNegocio?: TipoNegocio
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [negocio, setNegocioState] = useState<TipoNegocio>(initialNegocio || DEFAULT_NEGOCIO)

  useEffect(() => {
    const active = getInitialNegocio()
    if (active !== negocio) {
      setNegocioState(active)
    }
  }, [])

  const setNegocio = (nextNegocio: TipoNegocio) => {
    if (nextNegocio === negocio) return

    // Set cookie (valid for 1 year)
    document.cookie = `${BUSINESS_COOKIE_NAME}=${nextNegocio}; path=/; max-age=31536000; SameSite=Lax`
    try {
      localStorage.setItem('nova_business', nextNegocio)
    } catch {}

    setNegocioState(nextNegocio)

    startTransition(() => {
      // If switching to BG and on 3D-specific routes like /taller or /inventario, redirect to orders or dashboard
      if (nextNegocio === 'BG' && (pathname?.startsWith('/taller') || pathname?.startsWith('/inventario') || pathname?.startsWith('/catalogo/inventario'))) {
        router.push('/pedidos')
      } else {
        router.refresh()
      }
    })
  }

  const config = BUSINESSES[negocio] || BUSINESSES[DEFAULT_NEGOCIO]

  return (
    <BusinessContext.Provider
      value={{
        negocio,
        config,
        is3D: negocio === '3D',
        isBG: negocio === 'BG',
        setNegocio,
        isPending
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
