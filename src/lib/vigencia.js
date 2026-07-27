// ============================================================
// Estado y vigencia de extintores
//
// Para el tipo de activo Extintores, los campos "Estado" (el mismo
// ON/OFF que usan todos los tipos de la CMDB) y "Vigencia" (columna
// propia de Extintores) NO se cargan a mano: se calculan solos, todos
// los días, a partir de las fechas de vencimiento de carga y de prueba
// hidrostática, comparadas contra la fecha de HOY.
//
// Reglas (definidas con el usuario):
//   ESTADO
//     OFF (rojo) si la fecha de vencimiento de carga y/o la de prueba
//                hidrostática ya pasó respecto de hoy.
//     ON  (verde) si las fechas conocidas están todas vigentes.
//     sin dato si no hay ninguna fecha cargada.
//
//   VIGENCIA
//     Si ESTADO = OFF -> "Vencido" (rojo).
//     Si ESTADO = ON  -> "Operativo (VXX)" (verde), donde XX son los
//                        dos últimos dígitos del año en que vence la
//                        prueba hidrostática. Ej: vence en 2027 ->
//                        "Operativo (V27)".
//     Sin dato -> "Sin fechas registradas".
//
// Nota de diseño: como depende de "hoy", esto se recalcula en cada
// carga de pantalla (tabla, detalle, Excel, formulario), no se guarda
// como un valor fijo. El valor que sí queda escrito en la columna
// `status` de la base es el que se calculó la última vez que se guardó
// o importó el activo — sirve de respaldo para integraciones externas,
// pero la app SIEMPRE muestra el cálculo del día de hoy, no ese respaldo.
// ============================================================

// Claves que se buscan dentro de asset.data. Deben coincidir con las
// definidas en supabase/migracion_v5b_extintores.sql.
const KEYS_CARGA = ['fecha_vencimiento_carga', 'vencimiento_carga', 'venc_carga']
const KEYS_PH = [
  'fecha_vencimiento_prueba_hidrostatica',
  'vencimiento_prueba_hidrostatica',
  'venc_prueba_hidrostatica',
]

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

// Busca una clave en data ignorando mayúsculas y espacios.
function buscar(data, keys) {
  if (!data) return null
  for (const k of Object.keys(data)) {
    if (keys.includes(k.toLowerCase().trim())) return data[k]
  }
  return null
}

// Parte de los extintores se cargó históricamente con precisión de solo
// mes/año (ej. "10/2026"), sin día. parseFecha() no lo reconoce a propósito
// — así la tabla nunca inventa un día que no se cargó. Pero para PODER
// calcular Estado/Vigencia igual, este parser adicional sí acepta esa
// forma y asume el día 1 del mes.
//
// Se asume el día 1 (no el último) porque para una fecha de VENCIMIENTO
// es la lectura más conservadora: el extintor pasa a OFF apenas empieza
// el mes de vencimiento, en vez de seguir en ON hasta el último día. Si
// prefieres el criterio contrario (vigente hasta fin de mes), es un
// cambio de una línea acá.
function parseFechaParaCalculo(v) {
  const directa = parseFecha(v)
  if (directa) return directa
  if (!v) return null
  const s = String(v).trim()

  let m = s.match(/^(\d{1,2})[/-](\d{4})$/)          // mm/aaaa o mm-aaaa
  if (m) return fechaLocal(+m[2], +m[1], 1)

  m = s.match(/^(\d{4})[/-](\d{1,2})$/)               // aaaa-mm
  if (m) return fechaLocal(+m[1], +m[2], 1)

  return null
}

// 'on' | 'off' | null (null = no hay ninguna fecha cargada todavía).
//
// Nota: si SOLO una de las dos fechas está cargada, se evalúa con la que
// hay (no se exige que ambas estén presentes para dar ON). Si quieres que
// sea estrictamente "las dos deben estar cargadas y vigentes", avisa y se
// ajusta este criterio.
export function estadoExtintor(data, hoy = hoyLocal()) {
  const carga = parseFechaParaCalculo(buscar(data, KEYS_CARGA))
  const ph = parseFechaParaCalculo(buscar(data, KEYS_PH))
  if (!carga && !ph) return null

  const vencida = (d) => d !== null && d.getTime() < hoy.getTime()
  return vencida(carga) || vencida(ph) ? 'off' : 'on'
}

// { estado: 'on'|'off'|null, texto: string } listo para pintar.
export function resumenVigenciaExtintor(data, hoy = hoyLocal()) {
  const estado = estadoExtintor(data, hoy)
  if (estado === 'off') return { estado, texto: 'Vencido' }
  if (estado === 'on') {
    const ph = parseFechaParaCalculo(buscar(data, KEYS_PH))
    return { estado, texto: ph ? `Operativo (V${String(ph.getFullYear()).slice(-2)})` : 'Operativo' }
  }
  return { estado: null, texto: 'Sin fechas registradas' }
}

// Un tipo de activo es "extintor" por ilustración, slug o nombre.
export function esExtintor(type) {
  if (!type) return false
  const t = [type.illustration, type.slug, type.name].filter(Boolean).join(' ').toLowerCase()
  return t.includes('extintor')
}
