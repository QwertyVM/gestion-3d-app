export interface ItemDistribucion {
  id: string
  nombre: string
  tipo: 'OPERATIVO' | 'FINANCIERO'
  monto: number
  porcentaje: number
  count: number
  unidadLabel: string
  colorBar: string
  iconName: string
  detalleDesc: string
  extraBadge?: string
}

export interface CanalDistribucion {
  canal: string
  total: number
  count: number
  porcentaje: number
  colorBar: string
  iconName: string
}

export interface ResumenDistribucionFinanciera {
  ventasReales: {
    total: number
    items: ItemDistribucion[]
    totalUnidades: number
  }
  inyeccionCapital: {
    total: number
    prestamoBCP: number
    aportesDirectos: number
    items: ItemDistribucion[]
  }
  egresos: {
    todos: ItemDistribucion[]
    operativos: ItemDistribucion[]
    financieros: ItemDistribucion[]
    total: number
    totalOperativo: number
    totalFinanciero: number
    partidasCount: number
    partidasOperativasCount: number
    partidasFinancierasCount: number
  }
  ingresos: {
    todos: ItemDistribucion[]
    operativos: ItemDistribucion[]
    financieros: ItemDistribucion[]
    total: number
    totalOperativo: number
    totalFinanciero: number
    partidasCount: number
    partidasOperativasCount: number
    partidasFinancierasCount: number
  }
  canales: CanalDistribucion[]
  totales: {
    totalIngresos: number
    totalIngresosOperativos: number
    totalIngresosFinancieros: number
    totalEgresos: number
    totalEgresosOperativos: number
    totalEgresosFinancieros: number
    flujoNeto: number
    flujoOperativo: number
    ticketPromedio: number
    totalPedidos: number
  }
}

/**
 * Función central de cálculo de distribución financiera:
 * Clasifica y consolida ingresos y egresos, distinguiendo estrictamente
 * entre Facturación Comercial (Ventas Reales) y Fondos Externos (Inyección / Deuda).
 */
export function calcularDistribucionFinanciera({
  ventas = [],
  inversiones = [],
  ingresosDirectos = []
}: {
  ventas: any[]
  inversiones: any[]
  ingresosDirectos: any[]
}): ResumenDistribucionFinanciera {
  // =========================================================================
  // 1. CLASIFICACIÓN DE EGRESOS (OPERATIVOS VS FINANCIEROS)
  // =========================================================================
  const egresosMap: Record<string, ItemDistribucion> = {
    // OPERATIVOS
    INSUMOS: {
      id: 'INSUMOS',
      nombre: 'Insumos & Materiales (Filamentos)',
      tipo: 'OPERATIVO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'partidas',
      colorBar: 'bg-[#A34335]', // Terracota
      iconName: 'disc',
      detalleDesc: 'compras de filamentos, resinas y consumibles'
    },
    PACKAGING: {
      id: 'PACKAGING',
      nombre: 'Packaging & Logística',
      tipo: 'OPERATIVO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'partidas',
      colorBar: 'bg-[#C4B8A9]', // Tono arena
      iconName: 'package',
      detalleDesc: 'cajas, embalajes, stickers y envíos locales'
    },
    PAUTA: {
      id: 'PAUTA',
      nombre: 'Pauta & Publicidad',
      tipo: 'OPERATIVO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'partidas',
      colorBar: 'bg-[#8B5CF6]', // Violeta
      iconName: 'megaphone',
      detalleDesc: 'campañas y pauta publicitaria en Meta/Instagram'
    },
    SERVICIOS_TALLER: {
      id: 'SERVICIOS_TALLER',
      nombre: 'Servicios & Taller (Luz/Internet)',
      tipo: 'OPERATIVO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'partidas',
      colorBar: 'bg-[#D97706]', // Ámbar
      iconName: 'zap',
      detalleDesc: 'luz eléctrica, internet y servicios del taller'
    },
    PERSONAL: {
      id: 'PERSONAL',
      nombre: 'Personal & Sueldos',
      tipo: 'OPERATIVO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'pagos',
      colorBar: 'bg-[#0284C7]', // Azul cielo
      iconName: 'users',
      detalleDesc: 'sueldos, colaboradores de taller y mano de obra'
    },
    MAQUINARIA: {
      id: 'MAQUINARIA',
      nombre: 'Maquinaria & Equipos',
      tipo: 'OPERATIVO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'partidas',
      colorBar: 'bg-[#A36F4C]', // Primario NOVA
      iconName: 'printer',
      detalleDesc: 'impresoras 3D, repuestos técnicos y herramientas'
    },
    // FINANCIEROS
    PRESTAMOS_CUOTAS: {
      id: 'PRESTAMOS_CUOTAS',
      nombre: 'Cuotas de Préstamo Bancario',
      tipo: 'FINANCIERO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'cuotas',
      colorBar: 'bg-[#4338CA]', // Indigo profundo
      iconName: 'landmark',
      detalleDesc: 'amortización de capital y pago de cuotas bancarias'
    },
    COMISIONES_ITF: {
      id: 'COMISIONES_ITF',
      nombre: 'Comisiones Bancarias & ITF',
      tipo: 'FINANCIERO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'operaciones',
      colorBar: 'bg-[#6366F1]', // Indigo
      iconName: 'wallet',
      detalleDesc: 'impuesto a las transacciones (ITF) y comisiones de cuenta'
    },
    OTROS_FINANCIEROS: {
      id: 'OTROS_FINANCIEROS',
      nombre: 'Otros Compromisos Financieros',
      tipo: 'FINANCIERO',
      monto: 0,
      porcentaje: 0,
      count: 0,
      unidadLabel: 'partidas',
      colorBar: 'bg-[#7C3AED]',
      iconName: 'landmark',
      detalleDesc: 'cargos financieros y retenciones bancarias'
    }
  }

  let totalEgresos = 0
  let totalEgresosOperativos = 0
  let totalEgresosFinancieros = 0

  inversiones.forEach((inv) => {
    const cat = String(inv.categoria || '').toUpperCase()
    const sub = String(inv.subcategoria || '').toLowerCase()
    const item = String(inv.itemConcepto || '').toLowerCase()
    const val = Number(inv.costoTotal || 0)

    let targetKey = 'INSUMOS'

    if (
      cat === 'FINANCIERO' ||
      item.includes('préstamo') ||
      item.includes('prestamo') ||
      item.includes('cuota') ||
      sub.includes('préstamo') ||
      sub.includes('prestamo')
    ) {
      if (item.includes('itf') || item.includes('comisión') || item.includes('comision') || item.includes('mantenimiento')) {
        targetKey = 'COMISIONES_ITF'
      } else if (item.includes('cuota') || item.includes('préstamo') || item.includes('prestamo') || item.includes('amortiz')) {
        targetKey = 'PRESTAMOS_CUOTAS'
      } else {
        targetKey = 'OTROS_FINANCIEROS'
      }
    } else if (item.includes('itf') || item.includes('comisión') || item.includes('comision')) {
      targetKey = 'COMISIONES_ITF'
    } else if (
      sub.includes('publicidad') ||
      sub.includes('marketing') ||
      sub.includes('pauta') ||
      item.includes('publicidad') ||
      item.includes('campaña') ||
      item.includes('ads')
    ) {
      targetKey = 'PAUTA'
    } else if (
      sub.includes('packaging') ||
      sub.includes('envío') ||
      sub.includes('envios') ||
      sub.includes('caja') ||
      sub.includes('burbuja') ||
      sub.includes('bolsa') ||
      sub.includes('film') ||
      sub.includes('sticker') ||
      sub.includes('logística') ||
      sub.includes('logistica') ||
      item.includes('taxi') ||
      item.includes('envío') ||
      item.includes('caja')
    ) {
      targetKey = 'PACKAGING'
    } else if (
      cat === 'ACTIVO_FIJO' ||
      sub.includes('maquinaria') ||
      sub.includes('repuesto') ||
      sub.includes('herramienta') ||
      item.includes('impresora') ||
      item.includes('secador')
    ) {
      targetKey = 'MAQUINARIA'
    } else if (
      cat === 'PERSONAL' ||
      item.includes('sueldo') ||
      item.includes('jamile') ||
      item.includes('planilla') ||
      sub.includes('sueldo') ||
      sub.includes('personal')
    ) {
      targetKey = 'PERSONAL'
    } else if (
      cat === 'SERVICIO' ||
      sub.includes('luz') ||
      sub.includes('servicio') ||
      sub.includes('taller') ||
      item.includes('luz') ||
      item.includes('internet')
    ) {
      targetKey = 'SERVICIOS_TALLER'
    } else {
      targetKey = 'INSUMOS'
    }

    if (egresosMap[targetKey]) {
      egresosMap[targetKey].monto += val
      egresosMap[targetKey].count += 1
      totalEgresos += val
      if (egresosMap[targetKey].tipo === 'FINANCIERO') {
        totalEgresosFinancieros += val
      } else {
        totalEgresosOperativos += val
      }
    }
  })

  const egresosList = Object.values(egresosMap)
    .filter((r) => r.monto > 0 || r.count > 0)
    .map((r) => ({
      ...r,
      porcentaje: totalEgresos > 0 ? (r.monto / totalEgresos) * 100 : 0
    }))
    .sort((a, b) => b.monto - a.monto)

  const egresosOperativosList = egresosList.filter((e) => e.tipo === 'OPERATIVO')
  const egresosFinancierosList = egresosList.filter((e) => e.tipo === 'FINANCIERO')

  // =========================================================================
  // 2. VENTAS REALES DEL TALLER (BLOQUE 1 - FACTURACIÓN DE PRODUCTOS)
  // =========================================================================
  const ventasFamiliasMap: Record<string, {
    nombre: string
    monto: number
    unidades: number
  }> = {}

  let totalVentasReales = 0
  let totalUnidadesVendidas = 0

  ventas.forEach((v) => {
    if (Array.isArray(v.items) && v.items.length > 0) {
      v.items.forEach((it: any) => {
        let cat = (it.lineaCategoria || it.producto?.lineaCategoria || 'General').trim()
        if (cat.toLowerCase().includes('hogar') || cat.toLowerCase().includes('oficina')) {
          cat = 'Hogar & Oficina'
        } else if (cat.toLowerCase().includes('inserto') || cat.toLowerCase().includes('organizador')) {
          cat = 'Insertos y Organizadores'
        } else if (cat.toLowerCase().includes('juego') || cat.toLowerCase().includes('rol')) {
          cat = 'Juegos de Rol & Accesorios'
        }

        const sub = Number(it.subtotal != null ? it.subtotal : (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)))
        const cant = Number(it.cantidad || 1)

        if (!ventasFamiliasMap[cat]) {
          ventasFamiliasMap[cat] = { nombre: cat, monto: 0, unidades: 0 }
        }
        ventasFamiliasMap[cat].monto += sub
        ventasFamiliasMap[cat].unidades += cant
        totalVentasReales += sub
        totalUnidadesVendidas += cant
      })
    } else {
      let cat = (v.producto?.lineaCategoria || 'General').trim()
      if (cat.toLowerCase().includes('hogar') || cat.toLowerCase().includes('oficina')) {
        cat = 'Hogar & Oficina'
      } else if (cat.toLowerCase().includes('inserto') || cat.toLowerCase().includes('organizador')) {
        cat = 'Insertos y Organizadores'
      } else if (cat.toLowerCase().includes('juego') || cat.toLowerCase().includes('rol')) {
        cat = 'Juegos de Rol & Accesorios'
      }

      const sub = Number(v.total || 0)
      const cant = Number(v.cantidad || 1)

      if (!ventasFamiliasMap[cat]) {
        ventasFamiliasMap[cat] = { nombre: cat, monto: 0, unidades: 0 }
      }
      ventasFamiliasMap[cat].monto += sub
      ventasFamiliasMap[cat].unidades += cant
      totalVentasReales += sub
      totalUnidadesVendidas += cant
    }
  })

  // También incluir servicios comerciales directos (ej: impresión 3D a medida) en Ventas Reales
  ingresosDirectos.forEach((ing) => {
    const cat = String(ing.categoria || '').trim()
    const concepto = String(ing.concepto || '').toLowerCase()
    const monto = Number(ing.monto || 0)

    const isCommercial =
      cat.toLowerCase().includes('impresión') ||
      cat.toLowerCase().includes('impresion') ||
      cat.toLowerCase().includes('diseño') ||
      cat.toLowerCase().includes('cad') ||
      cat.toLowerCase().includes('feria') ||
      cat.toLowerCase().includes('directa') ||
      cat.toLowerCase().includes('técnico')

    if (isCommercial) {
      let label = 'Servicios de Impresión 3D'
      if (cat.toLowerCase().includes('diseño') || cat.toLowerCase().includes('cad')) {
        label = 'Diseño & Modelado CAD'
      } else if (cat.toLowerCase().includes('feria') || cat.toLowerCase().includes('directa')) {
        label = 'Venta Directa & Ferias'
      }

      if (!ventasFamiliasMap[label]) {
        ventasFamiliasMap[label] = { nombre: label, monto: 0, unidades: 0 }
      }
      ventasFamiliasMap[label].monto += monto
      ventasFamiliasMap[label].unidades += 1
      totalVentasReales += monto
      totalUnidadesVendidas += 1
    }
  })

  // Asignar colores de la paleta oficial (Verdes Esmeralda para Ventas Reales)
  const getFamilyColor = (name: string, index: number) => {
    if (name.includes('Hogar') || name.includes('Oficina')) return 'bg-emerald-700'
    if (name.includes('Inserto') || name.includes('Organizador')) return 'bg-emerald-600'
    if (name.includes('Juego') || name.includes('Rol')) return 'bg-emerald-500/80'
    const fallbacks = ['bg-emerald-700', 'bg-emerald-600', 'bg-emerald-500', 'bg-teal-700', 'bg-teal-600']
    return fallbacks[index % fallbacks.length]
  }

  // REGLA ESTRICTA: Los porcentajes de las categorías de catálogo deben sumar 100% exclusivamente sobre el total de ventas reales
  const ventasRealesItems: ItemDistribucion[] = Object.values(ventasFamiliasMap)
    .map((item, idx) => ({
      id: `CAT_${item.nombre.toUpperCase().replace(/\s+/g, '_')}`,
      nombre: item.nombre,
      tipo: 'OPERATIVO' as const,
      monto: item.monto,
      porcentaje: totalVentasReales > 0 ? (item.monto / totalVentasReales) * 100 : 0,
      count: item.unidades,
      unidadLabel: 'uds',
      colorBar: getFamilyColor(item.nombre, idx),
      iconName: 'box',
      detalleDesc: `Facturación directa por pedidos de ${item.nombre}`
    }))
    .sort((a, b) => b.monto - a.monto)

  // =========================================================================
  // 3. INYECCIÓN EXTERNA DE CAPITAL & PRÉSTAMOS (BLOQUE 2 - DEUDA / LIQUIDEZ)
  // =========================================================================
  let totalPrestamoBCP = 0
  let totalAportesCapital = 0
  let countPrestamo = 0
  let countAportes = 0

  ingresosDirectos.forEach((ing) => {
    const cat = String(ing.categoria || '').trim()
    const concepto = String(ing.concepto || '').toLowerCase()
    const monto = Number(ing.monto || 0)

    if (
      cat.toLowerCase().includes('préstamo') ||
      cat.toLowerCase().includes('prestamo') ||
      cat.toLowerCase().includes('financiamiento') ||
      concepto.includes('préstamo') ||
      concepto.includes('prestamo') ||
      concepto.includes('desembolso') ||
      concepto.includes('interés') ||
      concepto.includes('interes')
    ) {
      totalPrestamoBCP += monto
      countPrestamo += 1
    } else if (
      cat.toLowerCase().includes('aporte') ||
      cat.toLowerCase().includes('capital') ||
      concepto.includes('aporte') ||
      concepto.includes('capital')
    ) {
      totalAportesCapital += monto
      countAportes += 1
    }
  })

  const totalInyeccionCapital = totalPrestamoBCP + totalAportesCapital

  const inyeccionItems: ItemDistribucion[] = []

  if (totalPrestamoBCP > 0 || countPrestamo > 0) {
    inyeccionItems.push({
      id: 'INYECCION_BCP',
      nombre: 'Préstamo de Capital BCP',
      tipo: 'FINANCIERO',
      monto: totalPrestamoBCP,
      porcentaje: totalInyeccionCapital > 0 ? (totalPrestamoBCP / totalInyeccionCapital) * 100 : 0,
      count: countPrestamo,
      unidadLabel: countPrestamo === 1 ? 'operación' : 'operaciones',
      colorBar: 'bg-sky-700',
      iconName: 'landmark',
      detalleDesc: 'desembolsos de financiamiento y créditos bancarios',
      extraBadge: totalPrestamoBCP >= 50 ? 'TEA 8.70% • 24 cuotas' : undefined
    })
  }

  if (totalAportesCapital > 0 || countAportes > 0) {
    inyeccionItems.push({
      id: 'APORTES_CAPITAL',
      nombre: 'Aportes de Capital Directos',
      tipo: 'FINANCIERO',
      monto: totalAportesCapital,
      porcentaje: totalInyeccionCapital > 0 ? (totalAportesCapital / totalInyeccionCapital) * 100 : 0,
      count: countAportes,
      unidadLabel: countAportes === 1 ? 'aporte' : 'aportes',
      colorBar: 'bg-sky-600',
      iconName: 'landmark',
      detalleDesc: 'inyecciones de fondos propios o de socios para compras'
    })
  }

  const totalEntradasCuenta = totalVentasReales + totalInyeccionCapital

  // Lista unificada para retrocompatibilidad
  const ingresosList = [...ventasRealesItems, ...inyeccionItems]

  // =========================================================================
  // 4. CANALES DE VENTA
  // =========================================================================
  const canalesMap: Record<string, { canal: string; total: number; count: number }> = {}
  let totalCanales = 0

  ventas.forEach((v) => {
    const rawCanal = (v.canalVenta || 'Directo / Taller').trim()
    let canalKey = rawCanal
    const lower = rawCanal.toLowerCase()
    if (lower.includes('instagram')) canalKey = 'Instagram'
    else if (lower.includes('whatsapp')) canalKey = 'WhatsApp'
    else if (lower.includes('feria')) canalKey = 'Feria'
    else if (lower.includes('tienda') || lower.includes('web')) canalKey = 'Tienda Web'
    else if (lower.includes('directo')) canalKey = 'Directo / Taller'

    const monto = Number(v.total || 0)
    if (!canalesMap[canalKey]) {
      canalesMap[canalKey] = { canal: canalKey, total: 0, count: 0 }
    }
    canalesMap[canalKey].total += monto
    canalesMap[canalKey].count += 1
    totalCanales += monto
  })

  const channelColors: Record<string, string> = {
    Instagram: 'bg-primary',
    WhatsApp: 'bg-emerald-600',
    'Directo / Taller': 'bg-amber-600',
    Feria: 'bg-[#7C5835]',
    'Tienda Web': 'bg-sky-600'
  }

  const canalesList: CanalDistribucion[] = Object.values(canalesMap)
    .map((item) => ({
      ...item,
      colorBar: channelColors[item.canal] || 'bg-primary',
      iconName: item.canal.toLowerCase().includes('instagram')
        ? 'instagram'
        : item.canal.toLowerCase().includes('whatsapp')
        ? 'whatsapp'
        : item.canal.toLowerCase().includes('web')
        ? 'globe'
        : item.canal.toLowerCase().includes('feria') || item.canal.toLowerCase().includes('directo')
        ? 'store'
        : 'shopping-bag',
      porcentaje: totalCanales > 0 ? (item.total / totalCanales) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)

  return {
    ventasReales: {
      total: totalVentasReales,
      items: ventasRealesItems,
      totalUnidades: totalUnidadesVendidas
    },
    inyeccionCapital: {
      total: totalInyeccionCapital,
      prestamoBCP: totalPrestamoBCP,
      aportesDirectos: totalAportesCapital,
      items: inyeccionItems
    },
    egresos: {
      todos: egresosList,
      operativos: egresosOperativosList,
      financieros: egresosFinancierosList,
      total: totalEgresos,
      totalOperativo: totalEgresosOperativos,
      totalFinanciero: totalEgresosFinancieros,
      partidasCount: egresosList.length,
      partidasOperativasCount: egresosOperativosList.length,
      partidasFinancierasCount: egresosFinancierosList.length
    },
    ingresos: {
      todos: ingresosList,
      operativos: ventasRealesItems,
      financieros: inyeccionItems,
      total: totalEntradasCuenta,
      totalOperativo: totalVentasReales,
      totalFinanciero: totalInyeccionCapital,
      partidasCount: ingresosList.length,
      partidasOperativasCount: ventasRealesItems.length,
      partidasFinancierasCount: inyeccionItems.length
    },
    canales: canalesList,
    totales: {
      totalIngresos: totalEntradasCuenta,
      totalIngresosOperativos: totalVentasReales,
      totalIngresosFinancieros: totalInyeccionCapital,
      totalEgresos,
      totalEgresosOperativos,
      totalEgresosFinancieros,
      flujoNeto: totalEntradasCuenta - totalEgresos,
      flujoOperativo: totalVentasReales - totalEgresosOperativos,
      ticketPromedio: ventas.length > 0 ? totalCanales / ventas.length : 0,
      totalPedidos: ventas.length
    }
  }
}
