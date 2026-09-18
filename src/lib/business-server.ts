import { cookies } from 'next/headers'
import { TipoNegocio, BUSINESS_COOKIE_NAME, DEFAULT_NEGOCIO } from '@/lib/business'

export async function getActiveNegocioServer(): Promise<TipoNegocio> {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(BUSINESS_COOKIE_NAME)
    if (cookie?.value === 'BG') {
      return 'BG'
    }
    return '3D'
  } catch {
    return DEFAULT_NEGOCIO
  }
}
