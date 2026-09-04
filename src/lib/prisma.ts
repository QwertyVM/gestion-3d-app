import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export function getPrisma(): PrismaClient {
  if (!globalThis.prismaGlobal || !('pagoVenta' in globalThis.prismaGlobal)) {
    if (globalThis.prismaGlobal) {
      try {
        (globalThis.prismaGlobal as any).$disconnect()
      } catch (e) {}
    }
    globalThis.prismaGlobal = prismaClientSingleton()
  }
  return globalThis.prismaGlobal
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

export default prisma

