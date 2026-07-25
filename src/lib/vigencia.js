// ============================================================
// Vigencia de extintores
// Evalúa el vencimiento de carga y de prueba hidrostática respecto de hoy.
//
// Reglas (definidas con el usuario):
//   * fecha < hoy                        -> "Vencida el dd/mm/aa"          (rojo)
//   * hoy <= fecha <= hoy + DIAS_AVISO    -> "Próximo vencimiento el dd/mm/aa" (naranjo)
//   * fecha > hoy + DIAS_AVISO            -> "Extintor vigente"            (verde)
// ============================================================

// Ventana de aviso anticipado, en días.
export const DIAS_AVISO = 365

// Claves que se buscan dentro de asset.data. Deben coincidir con las
// definidas en supabase/migracion_v5b_extintores.sql.
const KEYS_CARGA = ['fecha_vencimiento_carga', 'vencimiento_carga', 'venc_carga']
const KEYS_PH = [
  'fecha_vencimiento_prueba_hidrostatica',
  'vencimiento_prueba_hidrostatica',
  'venc_prueba_hidrostatica',
]

const MS_DIA = 86400000

// Construye una fecha a medianoche LOCAL. Importante: new Date('2026-11-04')
// se interpreta como UTC y en Chile retrocede un día.
function fechaLocal(y, mes, d) {
  const dt = new Date(y, mes - 1, d)
  return isNaN(dt.getTime()) ? null : dt
}

// Acepta ISO (yyyy-mm-dd, lo que guarda <input type="date">) y dd/mm/aaaa.
export function parseFecha(v) {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const s = String(v).trim()
  if (!s) return null

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return fechaLocal(+m[1], +m[2], +m[3])

  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    let y = +m[3]
    if (y < 100) y += y < 70 ? 2000 : 1900
    return fechaLocal(y, +m[2], +m[1])
  }
  return null
}

const p2 = (n) => String(n).padStart(2, '0')

// dd/mm/aa
export function fmtCorta(d) {
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(-2)
}

// dd/mm/aaaa
export function fmtLarga(d) {
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear()
}

// Formatea un valor de campo tipo 'date' para mostrarlo en tablas y detalle.
// Si no se puede interpretar, devuelve el valor tal cual (no se pierde info).
export function fmtValorFecha(v) {
  const d = parseFecha(v)
  return d ? fmtLarga(d) : (v ?? '')
}

export function hoyLocal() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

export function evaluarVencimiento(valor, hoy = hoyLocal()) {
  const d = parseFecha(valor)
  if (!d) return { estado: 'sin_dato', fecha: null, dias: null, texto: 'Sin fecha registrada' }

  const dias = Math.round((d.getTime() - hoy.getTime()) / MS_DIA)
  if (dias < 0) return { estado: 'vencida', fecha: d, dias, texto: 'Vencida el ' + fmtCorta(d) }
  if (dias <= DIAS_AVISO) {
    return { estado: 'proximo', fecha: d, dias, texto: 'Próximo vencimiento el ' + fmtCorta(d) }
  }
  return { estado: 'vigente', fecha: d, dias, texto: 'Vigente hasta ' + fmtCorta(d) }
}

// Busca una clave en data ignorando mayúsculas y espacios.
function buscar(data, keys) {
  if (!data) return null
  for (const k of Object.keys(data)) {
    if (keys.includes(k.toLowerCase().trim())) return data[k]
  }
  return null
}

// Devuelve { global, items[] }.
//   global: 'vencida' | 'proximo' | 'vigente' | 'sin_dato'
//   items : una entrada por cada control CON fecha registrada.
export function vigenciaExtintor(data, hoy = hoyLocal()) {
  const items = [
    { etiqueta: 'Carga', ...evaluarVencimiento(buscar(data, KEYS_CARGA), hoy) },
    { etiqueta: 'P. hidrostática', ...evaluarVencimiento(buscar(data, KEYS_PH), hoy) },
  ].filter((i) => i.estado !== 'sin_dato')

  if (items.length === 0) return { global: 'sin_dato', items: [] }

  const global = items.some((i) => i.estado === 'vencida')
    ? 'vencida'
    : items.some((i) => i.estado === 'proximo')
      ? 'proximo'
      : 'vigente'

  return { global, items }
}

// Un tipo de activo es "extintor" por ilustración, slug o nombre.
export function esExtintor(type) {
  if (!type) return false
  const t = [type.illustration, type.slug, type.name].filter(Boolean).join(' ').toLowerCase()
  return t.includes('extintor')
}
