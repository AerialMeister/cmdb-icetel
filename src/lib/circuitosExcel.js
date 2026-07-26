// ============================================================
// Circuitos <-> Excel
//
// El detalle de circuitos es un árbol (barra -> protección -> barra -> ...)
// y una hoja de cálculo es plana. La jerarquía se codifica en una sola
// columna "Ruta": el camino de ancestros separado por " > ".
//
//   Ruta vacía ................ es la protección general del tablero
//   "BARRA PRINCIPAL" ......... cuelga de esa barra
//   "BARRA PRINCIPAL > C3 > BARRA TDA-2"
//                               cuelga de la sub-barra TDA-2, que a su vez
//                               cuelga del circuito C3 de la barra principal
//
// Los segmentos alternan: índice par = nombre de barra, índice impar =
// número del circuito que alimenta la siguiente barra.
//
// Solo se exporta una fila por PROTECCIÓN. Las barras no llevan fila
// propia: quedan descritas por la ruta de sus hijos, y al importar se
// crean solas si no existen.
// ============================================================

export const SEP = ' > '

export const norm = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// La capacidad va SIN unidad: es un número en amperes.
export const COLUMNAS_CIRCUITOS = [
  { label: 'Tablero', key: 'tablero', width: 26 },
  { label: 'Ruta', key: 'ruta', width: 38 },
  { label: 'Tipo', key: 'tipo', width: 11 },
  { label: 'N° circuito', key: 'numero', width: 14 },
  { label: 'Tag', key: 'tag', width: 26 },
  { label: 'Fases', key: 'fases', width: 13 },
  { label: 'Número Fase', key: 'numero_fase', width: 13 },
  { label: 'Estado', key: 'estado', width: 10 },
  { label: 'Capacidad (A)', key: 'capacidad_a', width: 14, num: true },
  { label: 'Consumo (A)', key: 'consumo_a', width: 13, num: true },
  { label: 'Consumo kW', key: 'consumo_kw', width: 13, num: true },
  { label: 'Marca', key: 'marca', width: 16 },
  { label: 'Fila', key: 'fila', width: 10 },
  { label: 'Rack', key: 'rack', width: 12 },
  { label: 'PDU', key: 'pdu', width: 12 },
  { label: 'Cliente', key: 'cliente', width: 20 },
]

export const fasesATexto = (f) =>
  f === 'trifasica' ? 'Trifásica' : f === 'monofasica' ? 'Monofásica' : ''

export function parseFases(v) {
  const n = norm(v).replace(/[^a-z0-9]/g, '')
  if (!n) return null
  if (n.startsWith('tri') || n === '3f' || n === '3') return 'trifasica'
  if (n.startsWith('mono') || n === '1f' || n === '1') return 'monofasica'
  return null
}

export const FASES_VALIDAS = ['RST', 'R', 'S', 'T']

export function parseNumeroFase(v) {
  const n = norm(v).replace(/[^a-z]/g, '').toUpperCase()
  return FASES_VALIDAS.includes(n) ? n : null
}

export function parseEstado(v) {
  const n = norm(v).replace(/[^a-z0-9]/g, '')
  if (!n) return null
  if (['on', 'encendido', 'cerrado', '1', 'true', 'si'].includes(n)) return 'on'
  if (['off', 'apagado', 'abierto', '0', 'false', 'no'].includes(n)) return 'off'
  return null
}

// Acepta "63", "63 A", "63,5". Devuelve número o null (nunca 0 por error).
export function parseNumero(v) {
  if (v === null || v === undefined || v === '') return null
  const limpio = String(v).replace(',', '.').replace(/[^0-9.]/g, '')
  if (!limpio) return null
  const n = Number(limpio)
  return Number.isFinite(n) ? n : null
}

// Nivel de anidamiento: 0 = protección general.
export const nivelDeRuta = (ruta) => (!ruta ? 0 : ruta.split('>').length)

// Camino de ancestros de un nodo, sin incluirlo a él ni a la general.
export function rutaDe(nodo, byId) {
  const partes = []
  let p = nodo.parent_id ? byId.get(nodo.parent_id) : null
  while (p) {
    if (p.clase === 'barra') partes.unshift(p.nombre || 'BARRA')
    else if (p.tipo !== 'general') partes.unshift(p.numero_circuito || p.tag_circuito || '?')
    p = p.parent_id ? byId.get(p.parent_id) : null
  }
  return partes.join(SEP)
}

// Filas de exportación, ordenadas por tablero y luego por profundidad
// (la general primero) para que al reimportar los padres existan antes
// que los hijos.
export function filasCircuitos(circuitos, nombrePorAssetId) {
  const byId = new Map(circuitos.map((c) => [c.id, c]))
  return circuitos
    .filter((c) => c.clase === 'proteccion')
    .map((c) => {
      const ruta = rutaDe(c, byId)
      return {
        tablero: nombrePorAssetId.get(c.asset_id) || '',
        ruta,
        tipo: c.tipo === 'general' ? 'General' : 'Circuito',
        numero: c.numero_circuito || '',
        tag: c.tag_circuito || '',
        fases: fasesATexto(c.fases),
        numero_fase: c.numero_fase || '',
        estado: c.estado ? c.estado.toUpperCase() : '',
        capacidad_a: c.capacidad_a ?? '',
        consumo_a: c.consumo_a ?? '',
        consumo_kw: c.consumo_kw ?? '',
        marca: c.marca || '',
        fila: c.fila || '',
        rack: c.rack || '',
        pdu: c.pdu || '',
        cliente: c.cliente || '',
        _nivel: nivelDeRuta(ruta),
      }
    })
    .sort(
      (a, b) =>
        a.tablero.localeCompare(b.tablero) ||
        a._nivel - b._nivel ||
        a.ruta.localeCompare(b.ruta) ||
        String(a.numero).localeCompare(String(b.numero))
    )
}

// ------------------------------------------------------------------
// Importación
// ------------------------------------------------------------------

// Reconstruye el árbol de un tablero a partir de las filas de la planilla.
// `existentes` son los circuitos que ya tiene el tablero.
// `guardar` es una función async que persiste un nodo y devuelve el guardado.
// Devuelve { creados, actualizados }.
export async function aplicarFilasEnTablero({ assetId, filas, existentes, guardar }) {
  const nodos = [...existentes]
  const avisos = []
  let creados = 0
  let actualizados = 0

  const hijosDe = (parentId) => nodos.filter((n) => n.parent_id === parentId)

  const buscarBarra = (parentId, nombre) =>
    hijosDe(parentId).find((n) => n.clase === 'barra' && norm(n.nombre) === norm(nombre))

  // Clave de identidad de una protección dentro de su barra: el número de
  // circuito, o el tag si no hay número.
  const claveDe = (x) => norm(x.numero_circuito ?? x.numero ?? '') || norm(x.tag_circuito ?? x.tag ?? '')

  const buscarProteccion = (parentId, clave) =>
    hijosDe(parentId).find((n) => n.clase === 'proteccion' && claveDe(n) === norm(clave))

  // Protección general (raíz del árbol)
  const raiz = () => nodos.find((n) => !n.parent_id)

  const ordenadas = [...filas].sort((a, b) => a._nivel - b._nivel)

  for (const f of ordenadas) {
    const esGeneral = f._nivel === 0 || norm(f.tipo) === 'general'

    if (esGeneral) {
      const ex = raiz()
      const guardado = await guardar({
        id: ex?.id,
        asset_id: assetId,
        clase: 'proteccion',
        tipo: 'general',
        parent_id: null,
        sort_order: ex?.sort_order ?? 0,
        fases: f.fases ?? ex?.fases ?? null,
        numero_fase: f.numero_fase ?? ex?.numero_fase ?? null,
        estado: f.estado ?? ex?.estado ?? null,
        marca: f.marca || ex?.marca || null,
        capacidad_a: f.capacidad_a ?? ex?.capacidad_a ?? null,
        consumo_a: f.consumo_a ?? ex?.consumo_a ?? null,
        consumo_kw: f.consumo_kw ?? ex?.consumo_kw ?? null,
        numero_circuito: f.numero || ex?.numero_circuito || null,
        tag_circuito: f.tag || ex?.tag_circuito || null,
        fila: f.fila || ex?.fila || null,
        rack: f.rack || ex?.rack || null,
        pdu: f.pdu || ex?.pdu || null,
        cliente: f.cliente || ex?.cliente || null,
      })
      if (ex) { actualizados++; Object.assign(ex, guardado) }
      else { creados++; nodos.push(guardado) }
      continue
    }

    // Recorre la ruta creando las barras que falten.
    const segmentos = f.ruta.split('>').map((s) => s.trim()).filter(Boolean)
    let padre = raiz()

    // Si el tablero no tiene general todavía, la creamos vacía para colgar la barra.
    if (!padre) {
      padre = await guardar({
        asset_id: assetId, clase: 'proteccion', tipo: 'general',
        parent_id: null, sort_order: 0,
      })
      creados++
      nodos.push(padre)
    }

    const clave = f.numero || f.tag
    if (!clave) {
      avisos.push(
        `Fila sin N° circuito ni Tag en la ruta "${f.ruta}": no hay cómo identificarla, se omitió.`
      )
      continue
    }

    let ok = true
    for (let i = 0; i < segmentos.length; i++) {
      const seg = segmentos[i]
      if (i % 2 === 0) {
        // barra
        let barra = buscarBarra(padre.id, seg)
        if (!barra) {
          barra = await guardar({
            asset_id: assetId, clase: 'barra', tipo: 'carga',
            parent_id: padre.id, nombre: seg,
            sort_order: hijosDe(padre.id).length,
          })
          creados++
          nodos.push(barra)
        }
        padre = barra
      } else {
        // protección intermedia: debe existir (viene de una fila menos profunda)
        const prot = buscarProteccion(padre.id, seg)
        if (!prot) {
          avisos.push(
            `Circuito "${clave}": la ruta "${f.ruta}" menciona la protección "${seg}", ` +
            `que no existe en la barra anterior. Agrega esa protección como fila propia ` +
            `(con la ruta hasta esa barra) y vuelve a importar.`
          )
          ok = false
          break
        }
        padre = prot
      }
    }
    if (!ok) continue

    const ex = buscarProteccion(padre.id, clave)
    const guardado = await guardar({
      id: ex?.id,
      asset_id: assetId,
      clase: 'proteccion',
      tipo: 'carga',
      parent_id: padre.id,
      sort_order: ex?.sort_order ?? hijosDe(padre.id).length,
      fases: f.fases ?? ex?.fases ?? null,
      marca: f.marca || ex?.marca || null,
      capacidad: f.capacidad || ex?.capacidad || null,
      numero_circuito: f.numero || ex?.numero_circuito || null,
      tag_circuito: f.tag || ex?.tag_circuito || null,
    })
    if (ex) { actualizados++; Object.assign(ex, guardado) }
    else { creados++; nodos.push(guardado) }
  }

  return { creados, actualizados, avisos }
}
