export type DatePreset = 'ESTE_MES' | 'MES_ANTERIOR' | 'ULTIMOS_30_DIAS' | 'ULTIMOS_3_MESES' | 'ESTE_ANIO' | 'ESTA_SEMANA' | 'SEMANA_ANTERIOR' | 'TODO' | 'PERSONALIZADO'

export interface DateRange {
  from: string | null // Formato YYYY-MM-DD
  to: string | null   // Formato YYYY-MM-DD
  preset: DatePreset
}

/**
 * Obtener la fecha local en formato YYYY-MM-DD
 */
export function formatToYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtener el rango de fechas para un preset dado
 */
export function getPresetDateRange(preset: DatePreset, referenceDate: Date = new Date()): DateRange {
  const now = new Date(referenceDate)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11

  switch (preset) {
    case 'ESTA_SEMANA': {
      // Semana de Lunes a Domingo en curso
      const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diffToMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        from: formatToYMD(monday),
        to: formatToYMD(sunday),
        preset: 'ESTA_SEMANA'
      }
    }
    case 'SEMANA_ANTERIOR': {
      // Semana de Lunes a Domingo previa cerrada
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diffToMonday - 7)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        from: formatToYMD(monday),
        to: formatToYMD(sunday),
        preset: 'SEMANA_ANTERIOR'
      }
    }
    case 'ESTE_MES': {
      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      return {
        from: formatToYMD(firstDay),
        to: formatToYMD(lastDay),
        preset: 'ESTE_MES'
      }
    }
    case 'MES_ANTERIOR': {
      const firstDayPrev = new Date(currentYear, currentMonth - 1, 1)
      const lastDayPrev = new Date(currentYear, currentMonth, 0)
      return {
        from: formatToYMD(firstDayPrev),
        to: formatToYMD(lastDayPrev),
        preset: 'MES_ANTERIOR'
      }
    }
    case 'ULTIMOS_30_DIAS': {
      const past30 = new Date(now)
      past30.setDate(past30.getDate() - 30)
      return {
        from: formatToYMD(past30),
        to: formatToYMD(now),
        preset: 'ULTIMOS_30_DIAS'
      }
    }
    case 'ULTIMOS_3_MESES': {
      const past3Months = new Date(now)
      past3Months.setMonth(past3Months.getMonth() - 3)
      return {
        from: formatToYMD(past3Months),
        to: formatToYMD(now),
        preset: 'ULTIMOS_3_MESES'
      }
    }
    case 'ESTE_ANIO': {
      const firstDayYear = new Date(currentYear, 0, 1)
      const lastDayYear = new Date(currentYear, 11, 31)
      return {
        from: formatToYMD(firstDayYear),
        to: formatToYMD(lastDayYear),
        preset: 'ESTE_ANIO'
      }
    }
    case 'TODO':
    default:
      return {
        from: null,
        to: null,
        preset: 'TODO'
      }
  }
}

/**
 * Obtener el rango de fechas por defecto (por defecto: Histórico / TODO)
 */
export function getDefaultDateRange(preset: DatePreset = 'TODO'): DateRange {
  return getPresetDateRange(preset)
}

/**
 * Obtener el rango de fechas para un mes y año específicos
 */
export function getMonthYearDateRange(year: number, month: number): DateRange {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  return {
    from: formatToYMD(firstDay),
    to: formatToYMD(lastDay),
    preset: 'PERSONALIZADO'
  }
}

/**
 * Comprobar si una fecha (string ISO o YYYY-MM-DD o Date) cae dentro de un rango
 */
export function isDateInRange(
  rawDate: string | Date | null | undefined, 
  from: string | null | undefined, 
  to: string | null | undefined
): boolean {
  if (!rawDate) return false
  if (!from && !to) return true

  let dateStr: string
  if (rawDate instanceof Date) {
    dateStr = formatToYMD(rawDate)
  } else {
    // Si viene como ISO string "2026-09-18T04:00:00.000Z", extraer "2026-09-18"
    dateStr = String(rawDate).split('T')[0]
  }

  if (from && dateStr < from) return false
  if (to && dateStr > to) return false
  return true
}

/**
 * Nombre en español del mes actual o referenciado
 */
export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function getNombreMesAnio(date: Date = new Date()): string {
  return `${MESES_ES[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Formateador de fecha para tooltips de evolución y gráficos
 */
export function formatFechaEvolucion(rawDate: string, conAnio = false) {
  if (!rawDate) return ''
  const parts = String(rawDate).split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
    const day = d.getDate()
    const month = months[d.getMonth()]
    return conAnio ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`
  }
  return rawDate
}

/**
 * Intenta interpretar de manera inteligente la fecha prometida de entrega
 * admitiendo formatos ISO (YYYY-MM-DD), numéricos (DD/MM, DD/MM/YYYY) o lenguaje natural
 * en español (ej: "Martes 13 octubre", "13 de octubre", "15 de Octubre 2026").
 * Retorna un objeto Date con la fecha a medianoche local, o null si es texto libre no determinable.
 */
export function parseDiaPromesa(diaPromesa: string | null | undefined): Date | null {
  if (!diaPromesa) return null
  const trimmed = diaPromesa.trim()
  if (!trimmed) return null

  // 1. Rango explícito o texto con alternativas ("Entre ...", "... o ...") -> tratar como texto descriptivo
  if (/^entre\s+/i.test(trimmed) || /\s+o\s+/i.test(trimmed)) {
    return null
  }

  // 2. Formato ISO YYYY-MM-DD
  const matchIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matchIso) {
    const d = new Date(parseInt(matchIso[1], 10), parseInt(matchIso[2], 10) - 1, parseInt(matchIso[3], 10))
    return isNaN(d.getTime()) ? null : d
  }

  // 3. Formato DD/MM/YYYY o DD-MM-YYYY o DD/MM
  const matchDmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/)
  if (matchDmy) {
    const d = parseInt(matchDmy[1], 10)
    const m = parseInt(matchDmy[2], 10) - 1
    let y = matchDmy[3] ? parseInt(matchDmy[3], 10) : new Date().getFullYear()
    if (y < 100) y += 2000
    const parsed = new Date(y, m, d)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // 4. Formato en español: [Día semana opcional] [DD] [de]? [Mes] [de]? [YYYY opcional]
  const MESES: Record<string, number> = {
    enero: 0, ene: 0,
    febrero: 1, feb: 1,
    marzo: 2, mar: 2,
    abril: 3, abr: 3,
    mayo: 4, may: 4,
    junio: 5, jun: 5,
    julio: 6, jul: 6,
    agosto: 7, ago: 7,
    septiembre: 8, setiembre: 8, sep: 8, set: 8,
    octubre: 9, oct: 9,
    noviembre: 10, nov: 10,
    diciembre: 11, dic: 11
  }

  const regexMes = /(?:^|\b)(\d{1,2})\s*(?:de|\/|-)?\s*(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|setiembre|sep|set|octubre|oct|noviembre|nov|diciembre|dic)\b(?:\s*(?:de)?\s*(\d{4}))?/i
  const matchMes = trimmed.match(regexMes)
  if (matchMes) {
    const day = parseInt(matchMes[1], 10)
    const mesNombre = matchMes[2].toLowerCase()
    const month = MESES[mesNombre]
    const now = new Date()
    const currentYear = now.getFullYear()
    let year = matchMes[3] ? parseInt(matchMes[3], 10) : currentYear

    // Si no tiene año especificado y estamos en dic y la fecha es enero, pasar al año siguiente
    if (!matchMes[3] && now.getMonth() === 11 && month === 0) {
      year = currentYear + 1
    }

    const parsed = new Date(year, month, day)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

/**
 * Formatea una fecha prometida para visualización compacta y amigable.
 * Si es formato ISO (YYYY-MM-DD), lo convierte en "Mar 13 Oct".
 * Si es texto libre, conserva el texto original.
 */
export function formatDiaPromesaDisplay(dia: string | null | undefined): string {
  if (!dia) return ''
  const trimmed = dia.trim()
  if (!trimmed) return ''

  const matchIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (matchIso) {
    const d = new Date(parseInt(matchIso[1], 10), parseInt(matchIso[2], 10) - 1, parseInt(matchIso[3], 10))
    if (!isNaN(d.getTime())) {
      const weekday = d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')
      const day = d.getDate()
      const month = d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1)
      return `${capWeekday} ${day} ${capMonth}`
    }
  }

  return trimmed
}

