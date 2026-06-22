// Ilustraciones SVG esquemáticas por tipo de activo.
// Para 'clima' la figura depende del campo data.tipo:
//   CRAC / CRAH -> equipo de clima de precisión
//   HVAC        -> aire acondicionado tipo split

const C = { panel: '#e2e8f0', steel: '#cbd5e1', dark: '#475569', brand: '#0f3d6b', accent: '#1d4ed8', on: '#16a34a', warn: '#f59e0b' }

function UpsModular() {
  // UPS modular: gabinete con módulos de potencia apilados + display
  return (
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="10" width="120" height="220" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="52" y="22" width="96" height="26" rx="3" fill={C.brand}/>
      <rect x="60" y="29" width="40" height="12" rx="2" fill="#bfdbfe"/>
      <circle cx="138" cy="35" r="5" fill={C.on}/>
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="52" y={60 + i*38} width="96" height="30" rx="3" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
          <rect x="58" y={67 + i*38} width="50" height="6" rx="3" fill={C.steel}/>
          <rect x="58" y={77 + i*38} width="34" height="6" rx="3" fill={C.steel}/>
          <circle cx="138" cy={75 + i*38} r="4" fill={C.on}/>
        </g>
      ))}
      <text x="100" y="225" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">UPS MODULAR</text>
    </svg>
  )
}

function Genset() {
  // Grupo electrógeno: motor + alternador sobre skid + escape
  return (
    <svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="120" width="220" height="22" rx="4" fill={C.dark}/>
      <rect x="30" y="142" width="26" height="14" rx="2" fill="#334155"/>
      <rect x="204" y="142" width="26" height="14" rx="2" fill="#334155"/>
      {/* motor */}
      <rect x="40" y="64" width="110" height="58" rx="6" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      <rect x="52" y="74" width="86" height="10" rx="3" fill={C.dark}/>
      {[0,1,2,3].map(i => <rect key={i} x={58+i*22} y="90" width="12" height="26" rx="2" fill="#94a3b8"/>)}
      {/* alternador */}
      <rect x="150" y="74" width="74" height="48" rx="24" fill={C.panel} stroke={C.dark} strokeWidth="3"/>
      <circle cx="187" cy="98" r="13" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
      {/* escape */}
      <rect x="60" y="26" width="14" height="42" rx="4" fill="#64748b"/>
      <ellipse cx="67" cy="24" rx="10" ry="6" fill="#94a3b8"/>
      <circle cx="214" cy="60" r="4" fill={C.on}/>
      <text x="130" y="170" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">GRUPO ELECTRÓGENO</text>
    </svg>
  )
}

function PlantaCC() {
  // Planta de corriente continua: rectificadores + banco de baterías
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="16" width="84" height="168" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x="34" y={28+i*40} width="64" height="30" rx="3" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
          <rect x="40" y={35+i*40} width="30" height="6" rx="3" fill={C.accent}/>
          <circle cx="88" cy={43+i*40} r="3.5" fill={C.on}/>
        </g>
      ))}
      <text x="66" y="178" textAnchor="middle" fontSize="9" fill={C.dark} fontFamily="sans-serif">RECTIFICADORES</text>
      {/* banco baterías */}
      <rect x="120" y="16" width="96" height="168" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {[0,1,2,3].map(r => [0,1].map(c => (
        <g key={r+'-'+c}>
          <rect x={130+c*44} y={28+r*36} width="36" height="26" rx="2" fill={C.steel} stroke={C.dark} strokeWidth="1.5"/>
          <rect x={135+c*44} y={24+r*36} width="6" height="5" fill={C.off}/>
          <rect x={155+c*44} y={24+r*36} width="6" height="5" fill="#0f172a"/>
        </g>
      )))}
      <text x="168" y="178" textAnchor="middle" fontSize="9" fill={C.dark} fontFamily="sans-serif">BATERÍAS</text>
    </svg>
  )
}

function Tablero() {
  // Tablero eléctrico con protecciones (interruptores) y barra
  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="12" width="132" height="206" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="46" y="24" width="108" height="2" fill={C.dark}/>
      {/* barra principal */}
      <rect x="46" y="34" width="108" height="10" rx="2" fill={C.warn}/>
      {/* interruptor principal */}
      <rect x="84" y="50" width="32" height="26" rx="3" fill={C.dark}/>
      <rect x="95" y="55" width="10" height="16" rx="2" fill={C.on}/>
      {/* protecciones (riel DIN) */}
      {[0,1,2].map(row => (
        <g key={row}>
          <rect x="46" y={92+row*40} width="108" height="4" fill={C.steel}/>
          {[0,1,2,3,4,5].map(i => (
            <g key={i}>
              <rect x={48+i*17.5} y={98+row*40} width="13" height="26" rx="2" fill={C.panel} stroke={C.steel} strokeWidth="1.5"/>
              <rect x={52+i*17.5} y={102+row*40} width="5" height="9" rx="1" fill={i%2? C.off : C.on}/>
            </g>
          ))}
        </g>
      ))}
      <text x="100" y="212" textAnchor="middle" fontSize="10" fill={C.dark} fontFamily="sans-serif">TABLERO ELÉCTRICO</text>
    </svg>
  )
}

function CracPrecision() {
  // Equipo de clima de precisión (CRAC/CRAH): unidad vertical con flujo de aire
  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
      <rect x="44" y="14" width="112" height="200" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="56" y="26" width="88" height="30" rx="3" fill={C.brand}/>
      <rect x="64" y="34" width="34" height="14" rx="2" fill="#bfdbfe"/>
      <circle cx="132" cy="41" r="5" fill={C.on}/>
      {/* serpentín */}
      <g stroke={C.accent} strokeWidth="3" fill="none">
        {[0,1,2,3].map(i => <path key={i} d={`M58 ${78+i*16} H142`}/>)}
        <path d="M58 78 V126 M70 78 V126 M82 78 V126 M94 78 V126 M106 78 V126 M118 78 V126 M130 78 V126 M142 78 V126" strokeWidth="1.4" stroke={C.steel}/>
      </g>
      {/* ventilador */}
      <circle cx="100" cy="160" r="26" fill={C.panel} stroke={C.dark} strokeWidth="2.5"/>
      <g fill={C.steel}>
        <path d="M100 160 L100 136 a24 24 0 0 1 18 10 Z"/>
        <path d="M100 160 L121 173 a24 24 0 0 1 -19 11 Z"/>
        <path d="M100 160 L79 173 a24 24 0 0 1 -3 -22 Z"/>
      </g>
      <circle cx="100" cy="160" r="5" fill={C.dark}/>
      {/* flechas de aire frío */}
      <g stroke={C.accent} strokeWidth="2.5" fill="none">
        <path d="M62 200 v8 M62 208 l-3 -3 M62 208 l3 -3"/>
        <path d="M100 200 v8 M100 208 l-3 -3 M100 208 l3 -3"/>
        <path d="M138 200 v8 M138 208 l-3 -3 M138 208 l3 -3"/>
      </g>
      <text x="100" y="226" textAnchor="middle" fontSize="9" fill={C.dark} fontFamily="sans-serif">CLIMA DE PRECISIÓN (CRAC/CRAH)</text>
    </svg>
  )
}

function SplitHvac() {
  // Aire acondicionado tipo split: unidad mural + flujo de aire
  return (
    <svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="200" height="56" rx="14" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="20" y="58" width="200" height="14" rx="4" fill={C.steel}/>
      <line x1="34" y1="65" x2="206" y2="65" stroke={C.dark} strokeWidth="1.5"/>
      <circle cx="200" cy="32" r="4" fill={C.on}/>
      <rect x="150" y="28" width="40" height="9" rx="2" fill="#bfdbfe"/>
      {/* flujo de aire */}
      <g stroke={C.accent} strokeWidth="2.5" fill="none">
        <path d="M60 84 q6 12 0 24"/>
        <path d="M110 84 q6 12 0 24"/>
        <path d="M160 84 q6 12 0 24"/>
      </g>
      <text x="120" y="138" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">AIRE ACONDICIONADO SPLIT (HVAC)</text>
    </svg>
  )
}

function Bomba() {
  // Bomba de agua centrífuga sobre base + tuberías
  return (
    <svg viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="128" width="180" height="18" rx="3" fill={C.dark}/>
      {/* motor */}
      <rect x="44" y="74" width="86" height="50" rx="10" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      {[0,1,2,3,4].map(i => <line key={i} x1={56+i*16} y1="78" x2={56+i*16} y2="120" stroke="#94a3b8" strokeWidth="3"/>)}
      {/* voluta */}
      <circle cx="160" cy="100" r="34" fill={C.panel} stroke={C.dark} strokeWidth="3"/>
      <circle cx="160" cy="100" r="13" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
      {/* tubería succión y descarga */}
      <rect x="150" y="36" width="20" height="34" rx="3" fill={C.accent}/>
      <rect x="188" y="92" width="34" height="18" rx="3" fill={C.accent}/>
      <text x="120" y="162" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">BOMBA DE AGUA</text>
    </svg>
  )
}

function BancoBateria() {
  return (
    <svg viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="14" width="188" height="160" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {[0,1,2].map(r => [0,1,2,3].map(c => (
        <g key={r+'-'+c}>
          <rect x={38+c*44} y={26+r*48} width="36" height="34" rx="3" fill={C.steel} stroke={C.dark} strokeWidth="1.6"/>
          <rect x={43+c*44} y={22+r*48} width="6" height="5" fill={C.off}/>
          <rect x={63+c*44} y={22+r*48} width="6" height="5" fill="#0f172a"/>
          <line x1={38+c*44} y1={43+r*48} x2={74+c*44} y2={43+r*48} stroke="#94a3b8" strokeWidth="1.4"/>
        </g>
      )))}
      <text x="120" y="186" textAnchor="middle" fontSize="10" fill={C.dark} fontFamily="sans-serif">BANCO DE BATERÍAS</text>
    </svg>
  )
}

function CeldaMT() {
  return (
    <svg viewBox="0 0 170 230" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="12" width="110" height="206" rx="5" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="42" y="24" width="86" height="40" rx="3" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
      <circle cx="85" cy="44" r="12" fill="#fff" stroke={C.dark} strokeWidth="2"/>
      <text x="85" y="49" textAnchor="middle" fontSize="13" fill={C.dark} fontFamily="sans-serif">I&gt;</text>
      {/* interruptor extraíble */}
      <rect x="50" y="78" width="70" height="56" rx="4" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
      <circle cx="85" cy="98" r="7" fill={C.dark}/>
      <path d="M85 105 v18" stroke={C.dark} strokeWidth="3"/>
      <path d="M70 126 h30" stroke={C.dark} strokeWidth="3"/>
      {/* barra y bushings */}
      <rect x="42" y="150" width="86" height="10" rx="2" fill={C.warn}/>
      {[0,1,2].map(i => <circle key={i} cx={58+i*27} cy="176" r="8" fill="#fde68a" stroke={C.dark} strokeWidth="2"/>)}
      <text x="85" y="208" textAnchor="middle" fontSize="10" fill={C.dark} fontFamily="sans-serif">CELDA MT</text>
    </svg>
  )
}

function TransformadorMT() {
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="56" width="120" height="96" rx="8" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      {/* radiadores */}
      {[0,1,2,3].map(i => <rect key={'l'+i} x={46} y={64+i*20} width="14" height="14" rx="2" fill={C.panel} stroke={C.dark} strokeWidth="1.5"/>)}
      {[0,1,2,3].map(i => <rect key={'r'+i} x={180} y={64+i*20} width="14" height="14" rx="2" fill={C.panel} stroke={C.dark} strokeWidth="1.5"/>)}
      {/* bushings AT (rojos) y BT (negros) */}
      {[0,1,2].map(i => (<g key={'at'+i}><rect x={78+i*22} y="40" width="6" height="18" fill="#64748b"/><circle cx={81+i*22} cy="36" r="7" fill="#fca5a5" stroke={C.dark} strokeWidth="1.6"/></g>))}
      {[0,1,2,3].map(i => (<g key={'bt'+i}><rect x={150+i*8} y="44" width="4" height="14" fill="#64748b"/><circle cx={152+i*8} cy="42" r="4.5" fill="#0f172a"/></g>))}
      <text x="120" y="178" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">TRANSFORMADOR MT</text>
    </svg>
  )
}

function TorreEnfriamiento() {
  return (
    <svg viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg">
      {/* cuerpo trapezoidal */}
      <path d="M46 70 L174 70 L156 180 L64 180 Z" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {/* rejillas de entrada de aire */}
      {[0,1,2,3].map(i => <line key={i} x1="68" y1={150-i*16} x2="152" y2={150-i*16} stroke={C.steel} strokeWidth="3"/>)}
      {/* ventilador superior */}
      <ellipse cx="110" cy="66" rx="64" ry="12" fill={C.panel} stroke={C.dark} strokeWidth="3"/>
      <g stroke={C.dark} strokeWidth="2"><line x1="70" y1="66" x2="150" y2="66"/><line x1="110" y1="56" x2="110" y2="76"/><line x1="84" y1="60" x2="136" y2="72"/><line x1="84" y1="72" x2="136" y2="60"/></g>
      {/* flechas aire/calor */}
      <g stroke={C.accent} strokeWidth="2.5" fill="none"><path d="M96 44 v-12 M96 32 l-3 3 M96 32 l3 3"/><path d="M124 44 v-12 M124 32 l-3 3 M124 32 l3 3"/></g>
      <text x="110" y="200" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">TORRE DE ENFRIAMIENTO</text>
    </svg>
  )
}

function Chiller() {
  return (
    <svg viewBox="0 0 250 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="40" width="202" height="96" rx="8" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="20" y="136" width="26" height="14" rx="2" fill="#334155"/>
      <rect x="204" y="136" width="26" height="14" rx="2" fill="#334155"/>
      {/* condensador (aletas) */}
      <rect x="34" y="52" width="96" height="72" rx="4" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
      {[...Array(9)].map((_,i)=><line key={i} x1={40+i*10} y1="56" x2={40+i*10} y2="120" stroke="#94a3b8" strokeWidth="2"/>)}
      {/* compresores */}
      <circle cx="160" cy="78" r="18" fill={C.steel} stroke={C.dark} strokeWidth="2.5"/>
      <circle cx="200" cy="78" r="18" fill={C.steel} stroke={C.dark} strokeWidth="2.5"/>
      {/* tubería agua */}
      <rect x="150" y="110" width="68" height="9" rx="3" fill={C.accent}/>
      <rect x="150" y="122" width="68" height="9" rx="3" fill="#60a5fa"/>
      <text x="125" y="168" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">CHILLER</text>
    </svg>
  )
}

function AHC() {
  return (
    <svg viewBox="0 0 250 170" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="34" width="202" height="96" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {/* sección filtro */}
      <rect x="34" y="44" width="36" height="76" fill="none" stroke={C.steel} strokeWidth="2"/>
      <path d="M34 44 L70 120 M46 44 L70 104 M58 44 L70 88 M34 56 L58 120 M34 72 L46 120" stroke="#cbd5e1" strokeWidth="1.4"/>
      {/* serpentín */}
      <g stroke={C.accent} strokeWidth="2.4" fill="none">{[0,1,2,3].map(i=><path key={i} d={`M80 ${52+i*18} h44`}/>)}</g>
      {/* ventilador */}
      <circle cx="178" cy="82" r="30" fill={C.panel} stroke={C.dark} strokeWidth="2.5"/>
      <g fill={C.steel}><path d="M178 82 L178 54 a28 28 0 0 1 20 12 Z"/><path d="M178 82 L202 98 a28 28 0 0 1 -22 12 Z"/><path d="M178 82 L154 98 a28 28 0 0 1 -2 -26 Z"/></g>
      <circle cx="178" cy="82" r="5" fill={C.dark}/>
      {/* flechas aire */}
      <g stroke={C.accent} strokeWidth="2.5" fill="none"><path d="M226 70 h12 M238 70 l-4 -3 M238 70 l-4 3"/><path d="M226 96 h12 M238 96 l-4 -3 M238 96 l-4 3"/></g>
      <text x="125" y="158" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">AHC · MANEJADORA DE AIRE</text>
    </svg>
  )
}

function ACU() {
  return (
    <svg viewBox="0 0 210 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="36" y="30" width="138" height="110" rx="8" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {/* rejilla / ventilador circular */}
      <circle cx="105" cy="85" r="44" fill={C.panel} stroke={C.dark} strokeWidth="2.5"/>
      <circle cx="105" cy="85" r="44" fill="none" stroke={C.steel} strokeWidth="1"/>
      {[0,1,2,3,4,5].map(i => {
        const a = i*Math.PI/3
        return <line key={i} x1="105" y1="85" x2={105+40*Math.cos(a)} y2={85+40*Math.sin(a)} stroke="#cbd5e1" strokeWidth="2"/>
      })}
      <circle cx="105" cy="85" r="9" fill={C.dark}/>
      <rect x="44" y="146" width="22" height="12" rx="2" fill="#334155"/>
      <rect x="144" y="146" width="22" height="12" rx="2" fill="#334155"/>
      <text x="105" y="172" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">ACU · UNIDAD A/A</text>
    </svg>
  )
}

function EstanqueCombustible() {
  return (
    <svg viewBox="0 0 250 170" xmlns="http://www.w3.org/2000/svg">
      {/* estanque horizontal */}
      <rect x="40" y="58" width="170" height="74" rx="37" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      <ellipse cx="40" cy="95" rx="14" ry="37" fill="#94a3b8" stroke={C.dark} strokeWidth="3"/>
      {/* boca/respiradero */}
      <rect x="150" y="40" width="10" height="20" fill="#64748b"/>
      <rect x="120" y="44" width="8" height="16" fill="#64748b"/>
      {/* indicador de nivel */}
      <circle cx="180" cy="95" r="14" fill="#fff" stroke={C.dark} strokeWidth="2"/>
      <path d="M180 95 L180 84 M180 95 L188 99" stroke={C.off} strokeWidth="2"/>
      {/* gota de combustible */}
      <path d="M95 86 c0 -8 8 -12 8 -12 c0 0 8 4 8 12 a8 8 0 0 1 -16 0 Z" fill={C.warn}/>
      {/* silletas */}
      <rect x="70" y="132" width="30" height="14" rx="2" fill="#334155"/>
      <rect x="150" y="132" width="30" height="14" rx="2" fill="#334155"/>
      <text x="125" y="162" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">ESTANQUE DE COMBUSTIBLE</text>
    </svg>
  )
}

function Generic() {
  return (
    <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="24" width="120" height="132" rx="8" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="56" y="40" width="88" height="20" rx="3" fill={C.brand}/>
      <rect x="56" y="74" width="88" height="10" rx="3" fill={C.panel}/>
      <rect x="56" y="92" width="60" height="10" rx="3" fill={C.panel}/>
      <rect x="56" y="110" width="74" height="10" rx="3" fill={C.panel}/>
      <circle cx="132" cy="50" r="4" fill={C.on}/>
      <text x="100" y="148" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">ACTIVO</text>
    </svg>
  )
}

export default function AssetIllustration({ illustration, data, imageUrl }) {
  if (imageUrl) return <img src={imageUrl} alt="Activo" />

  if (illustration === 'clima') {
    const tipo = String(data?.tipo || '').toUpperCase()
    return (tipo === 'CRAC' || tipo === 'CRAH') ? <CracPrecision /> : <SplitHvac />
  }
  switch (illustration) {
    case 'ups': return <UpsModular />
    case 'genset': return <Genset />
    case 'planta_cc': return <PlantaCC />
    case 'tablero': return <Tablero />
    case 'bomba': return <Bomba />
    case 'banco_bateria': return <BancoBateria />
    case 'celda_mt': return <CeldaMT />
    case 'transformador_mt': return <TransformadorMT />
    case 'torre_enfriamiento': return <TorreEnfriamiento />
    case 'chiller': return <Chiller />
    case 'ahc': return <AHC />
    case 'acu': return <ACU />
    case 'estanque_combustible': return <EstanqueCombustible />
    default: return <Generic />
  }
}
