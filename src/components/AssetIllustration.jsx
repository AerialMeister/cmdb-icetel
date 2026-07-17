const C = { panel: '#e2e8f0', steel: '#cbd5e1', dark: '#475569', brand: '#0f3d6b', accent: '#1d4ed8', on: '#16a34a', warn: '#f59e0b', off: '#dc2626' }

function UpsModular() {
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
  return (
    <svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="120" width="220" height="22" rx="4" fill={C.dark}/>
      <rect x="30" y="142" width="26" height="14" rx="2" fill="#334155"/>
      <rect x="204" y="142" width="26" height="14" rx="2" fill="#334155"/>
      <rect x="40" y="64" width="110" height="58" rx="6" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      <rect x="52" y="74" width="86" height="10" rx="3" fill={C.dark}/>
      {[0,1,2,3].map(i => <rect key={i} x={58+i*22} y="90" width="12" height="26" rx="2" fill="#94a3b8"/>)}
      <rect x="150" y="74" width="74" height="48" rx="24" fill={C.panel} stroke={C.dark} strokeWidth="3"/>
      <circle cx="187" cy="98" r="13" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
      <rect x="60" y="26" width="14" height="42" rx="4" fill="#64748b"/>
      <ellipse cx="67" cy="24" rx="10" ry="6" fill="#94a3b8"/>
      <circle cx="214" cy="60" r="4" fill={C.on}/>
      <text x="130" y="170" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">GRUPO ELECTRÓGENO</text>
    </svg>
  )
}

function PlantaCC() {
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
      <rect x="120" y="16" width="96" height="168" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {[0,1,2,3].map(r => [0,1].map(c => (
        <g key={r+'-'+c}>
          <rect x={130+c*44} y={28+r*36} width="36" height="26" rx="2" fill={C.steel} stroke={C.dark} strokeWidth="1.5"/>
          <rect x={135+c*44} y={24+r*36} width="6" height="5" fill="#64748b"/>
          <rect x={155+c*44} y={24+r*36} width="6" height="5" fill="#0f172a"/>
        </g>
      )))}
      <text x="168" y="178" textAnchor="middle" fontSize="9" fill={C.dark} fontFamily="sans-serif">BATERÍAS</text>
    </svg>
  )
}

function Tablero() {
  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="12" width="132" height="206" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="46" y="24" width="108" height="2" fill={C.dark}/>
      <rect x="46" y="34" width="108" height="10" rx="2" fill={C.warn}/>
      <rect x="84" y="50" width="32" height="26" rx="3" fill={C.dark}/>
      <rect x="95" y="55" width="10" height="16" rx="2" fill={C.on}/>
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
  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
      <rect x="44" y="14" width="112" height="200" rx="6" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="56" y="26" width="88" height="30" rx="3" fill={C.brand}/>
      <rect x="64" y="34" width="34" height="14" rx="2" fill="#bfdbfe"/>
      <circle cx="132" cy="41" r="5" fill={C.on}/>
      <g stroke={C.accent} strokeWidth="3" fill="none">
        {[0,1,2,3].map(i => <path key={i} d={`M58 ${78+i*16} H142`}/>)}
        <path d="M58 78 V126 M70 78 V126 M82 78 V126 M94 78 V126 M106 78 V126 M118 78 V126 M130 78 V126 M142 78 V126" strokeWidth="1.4" stroke={C.steel}/>
      </g>
      <circle cx="100" cy="160" r="26" fill={C.panel} stroke={C.dark} strokeWidth="2.5"/>
      <g fill={C.steel}>
        <path d="M100 160 L100 136 a24 24 0 0 1 18 10 Z"/>
        <path d="M100 160 L121 173 a24 24 0 0 1 -19 11 Z"/>
        <path d="M100 160 L79 173 a24 24 0 0 1 -3 -22 Z"/>
      </g>
      <circle cx="100" cy="160" r="5" fill={C.dark}/>
      <g stroke={C.accent} strokeWidth="2.5" fill="none">
        <path d="M62 200 v8 M62 208 l-3 -3 M62 208 l3 -3"/>
        <path d="M100 200 v8 M100 208 l-3 -3 M100 208 l3 -3"/>
        <path d="M138 200 v8 M138 208 l-3 -3 M138 208 l3 -3"/>
      </g>
      <text x="100" y="226" textAnchor="middle" fontSize="9" fill={C.dark} fontFamily="sans-serif">CLIMA DE PRECISIÓN</text>
    </svg>
  )
}

function SplitHvac() {
  return (
    <svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="200" height="56" rx="14" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <rect x="20" y="58" width="200" height="14" rx="4" fill={C.steel}/>
      <line x1="34" y1="65" x2="206" y2="65" stroke={C.dark} strokeWidth="1.5"/>
      <circle cx="200" cy="32" r="4" fill={C.on}/>
      <rect x="150" y="28" width="40" height="9" rx="2" fill="#bfdbfe"/>
      <g stroke={C.accent} strokeWidth="2.5" fill="none">
        <path d="M60 84 q6 12 0 24"/><path d="M110 84 q6 12 0 24"/><path d="M160 84 q6 12 0 24"/>
      </g>
      <text x="120" y="138" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">AIRE ACONDICIONADO SPLIT</text>
    </svg>
  )
}

function Bomba() {
  return (
    <svg viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="128" width="180" height="18" rx="3" fill={C.dark}/>
      <rect x="44" y="74" width="86" height="50" rx="10" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      {[0,1,2,3,4].map(i => <line key={i} x1={56+i*16} y1="78" x2={56+i*16} y2="120" stroke="#94a3b8" strokeWidth="3"/>)}
      <circle cx="160" cy="100" r="34" fill={C.panel} stroke={C.dark} strokeWidth="3"/>
      <circle cx="160" cy="100" r="13" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
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
          <rect x={43+c*44} y={22+r*48} width="6" height="5" fill="#64748b"/>
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
      <rect x="50" y="78" width="70" height="56" rx="4" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
      <circle cx="85" cy="98" r="7" fill={C.dark}/>
      <path d="M85 105 v18" stroke={C.dark} strokeWidth="3"/>
      <path d="M70 126 h30" stroke={C.dark} strokeWidth="3"/>
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
      {[0,1,2,3].map(i => <rect key={'l'+i} x={46} y={64+i*20} width="14" height="14" rx="2" fill={C.panel} stroke={C.dark} strokeWidth="1.5"/>)}
      {[0,1,2,3].map(i => <rect key={'r'+i} x={180} y={64+i*20} width="14" height="14" rx="2" fill={C.panel} stroke={C.dark} strokeWidth="1.5"/>)}
      {[0,1,2].map(i => (<g key={'at'+i}><rect x={78+i*22} y="40" width="6" height="18" fill="#64748b"/><circle cx={81+i*22} cy="36" r="7" fill="#fca5a5" stroke={C.dark} strokeWidth="1.6"/></g>))}
      {[0,1,2,3].map(i => (<g key={'bt'+i}><rect x={150+i*8} y="44" width="4" height="14" fill="#64748b"/><circle cx={152+i*8} cy="42" r="4.5" fill="#0f172a"/></g>))}
      <text x="120" y="178" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">TRANSFORMADOR MT</text>
    </svg>
  )
}

function TorreEnfriamiento() {
  return (
    <svg viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg">
      <path d="M46 70 L174 70 L156 180 L64 180 Z" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {[0,1,2,3].map(i => <line key={i} x1="68" y1={150-i*16} x2="152" y2={150-i*16} stroke={C.steel} strokeWidth="3"/>)}
      <ellipse cx="110" cy="66" rx="64" ry="12" fill={C.panel} stroke={C.dark} strokeWidth="3"/>
      <g stroke={C.dark} strokeWidth="2"><line x1="70" y1="66" x2="150" y2="66"/><line x1="110" y1="56" x2="110" y2="76"/><line x1="84" y1="60" x2="136" y2="72"/><line x1="84" y1="72" x2="136" y2="60"/></g>
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
      <rect x="34" y="52" width="96" height="72" rx="4" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
      {[...Array(9)].map((_,i)=><line key={i} x1={40+i*10} y1="56" x2={40+i*10} y2="120" stroke="#94a3b8" strokeWidth="2"/>)}
      <circle cx="160" cy="78" r="18" fill={C.steel} stroke={C.dark} strokeWidth="2.5"/>
      <circle cx="200" cy="78" r="18" fill={C.steel} stroke={C.dark} strokeWidth="2.5"/>
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
      <rect x="34" y="44" width="36" height="76" fill="none" stroke={C.steel} strokeWidth="2"/>
      <path d="M34 44 L70 120 M46 44 L70 104 M58 44 L70 88 M34 56 L58 120 M34 72 L46 120" stroke="#cbd5e1" strokeWidth="1.4"/>
      <g stroke={C.accent} strokeWidth="2.4" fill="none">{[0,1,2,3].map(i=><path key={i} d={`M80 ${52+i*18} h44`}/>)}</g>
      <circle cx="178" cy="82" r="30" fill={C.panel} stroke={C.dark} strokeWidth="2.5"/>
      <g fill={C.steel}><path d="M178 82 L178 54 a28 28 0 0 1 20 12 Z"/><path d="M178 82 L202 98 a28 28 0 0 1 -22 12 Z"/><path d="M178 82 L154 98 a28 28 0 0 1 -2 -26 Z"/></g>
      <circle cx="178" cy="82" r="5" fill={C.dark}/>
      <g stroke={C.accent} strokeWidth="2.5" fill="none"><path d="M226 70 h12 M238 70 l-4 -3 M238 70 l-4 3"/><path d="M226 96 h12 M238 96 l-4 -3 M238 96 l-4 3"/></g>
      <text x="125" y="158" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">AHC · MANEJADORA DE AIRE</text>
    </svg>
  )
}

function ACU() {
  return (
    <svg viewBox="0 0 210 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="36" y="30" width="138" height="110" rx="8" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      <circle cx="105" cy="85" r="44" fill={C.panel} stroke={C.dark} strokeWidth="2.5"/>
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
      <rect x="40" y="58" width="170" height="74" rx="37" fill={C.steel} stroke={C.dark} strokeWidth="3"/>
      <ellipse cx="40" cy="95" rx="14" ry="37" fill="#94a3b8" stroke={C.dark} strokeWidth="3"/>
      <rect x="150" y="40" width="10" height="20" fill="#64748b"/>
      <rect x="120" y="44" width="8" height="16" fill="#64748b"/>
      <circle cx="180" cy="95" r="14" fill="#fff" stroke={C.dark} strokeWidth="2"/>
      <path d="M180 95 L180 84 M180 95 L188 99" stroke="#64748b" strokeWidth="2"/>
      <path d="M95 86 c0 -8 8 -12 8 -12 c0 0 8 4 8 12 a8 8 0 0 1 -16 0 Z" fill={C.warn}/>
      <rect x="70" y="132" width="30" height="14" rx="2" fill="#334155"/>
      <rect x="150" y="132" width="30" height="14" rx="2" fill="#334155"/>
      <text x="125" y="162" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">ESTANQUE DE COMBUSTIBLE</text>
    </svg>
  )
}

// ── Nuevas ilustraciones ────────────────────────────────────────────────────

function Alcantarilla() {
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      {/* sección de terreno */}
      <rect x="20" y="80" width="200" height="16" rx="2" fill="#92400e"/>
      <rect x="20" y="88" width="200" height="8" rx="2" fill="#78350f"/>
      {/* tapa de registro */}
      <rect x="70" y="68" width="100" height="14" rx="3" fill="#475569" stroke={C.dark} strokeWidth="2"/>
      {[0,1,2,3,4].map(i => <line key={i} x1={78+i*18} y1="70" x2={78+i*18} y2="80" stroke="#64748b" strokeWidth="2"/>)}
      {/* cañería / colector */}
      <ellipse cx="120" cy="140" rx="46" ry="46" fill="none" stroke={C.dark} strokeWidth="3"/>
      <ellipse cx="120" cy="140" rx="38" ry="38" fill="#e2e8f0" stroke={C.steel} strokeWidth="2"/>
      {/* agua en la base */}
      <path d="M82 158 a38 38 0 0 0 76 0 Z" fill="#60a5fa" opacity="0.6"/>
      {/* línea de flujo */}
      <g stroke={C.accent} strokeWidth="2" fill="none" strokeDasharray="6 3">
        <path d="M20 140 h60"/><path d="M180 140 h40"/>
      </g>
      {/* flechas de flujo */}
      <path d="M56 140 l-8 -4 M56 140 l-8 4" stroke={C.accent} strokeWidth="2" fill="none"/>
      <path d="M194 140 l-8 -4 M194 140 l-8 4" stroke={C.accent} strokeWidth="2" fill="none"/>
      <text x="120" y="196" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">ALCANTARILLADO</text>
    </svg>
  )
}

function Ascensor() {
  return (
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      {/* caja del ascensor */}
      <rect x="40" y="20" width="120" height="180" rx="4" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {/* puertas */}
      <rect x="50" y="50" width="44" height="130" rx="2" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
      <rect x="106" y="50" width="44" height="130" rx="2" fill={C.panel} stroke={C.steel} strokeWidth="2"/>
      {/* separación central puertas */}
      <line x1="100" y1="50" x2="100" y2="180" stroke={C.dark} strokeWidth="2"/>
      {/* tiradores */}
      <rect x="88" y="108" width="6" height="24" rx="3" fill={C.steel}/>
      <rect x="106" y="108" width="6" height="24" rx="3" fill={C.steel}/>
      {/* panel de control */}
      <rect x="148" y="80" width="6" height="60" rx="2" fill={C.brand}/>
      {[0,1,2,3].map(i => <circle key={i} cx="151" cy={90+i*14} r="3" fill={i===1 ? C.on : C.steel}/>)}
      {/* cable y polea */}
      <line x1="100" y1="20" x2="100" y2="8" stroke="#64748b" strokeWidth="3"/>
      <circle cx="100" cy="6" r="6" fill={C.steel} stroke={C.dark} strokeWidth="2"/>
      {/* flechas subir/bajar */}
      <path d="M170 90 v-14 M170 76 l-4 4 M170 76 l4 4" stroke={C.accent} strokeWidth="2.5" fill="none"/>
      <path d="M170 140 v14 M170 154 l-4 -4 M170 154 l4 -4" stroke={C.accent} strokeWidth="2.5" fill="none"/>
      <text x="100" y="215" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">ASCENSOR</text>
    </svg>
  )
}

function InstalacionFisica() {
  return (
    <svg viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg">
      {/* edificio */}
      <rect x="30" y="60" width="180" height="130" rx="4" fill="#f8fafc" stroke={C.dark} strokeWidth="3"/>
      {/* techo */}
      <path d="M20 62 L120 14 L220 62 Z" fill={C.steel} stroke={C.dark} strokeWidth="2.5"/>
      {/* ventanas */}
      {[0,1,2].map(c => [0,1].map(r => (
        <rect key={c+'-'+r} x={50+c*56} y={80+r*46} width="30" height="26" rx="2"
          fill="#bfdbfe" stroke={C.steel} strokeWidth="1.5"/>
      )))}
      {/* puerta */}
      <rect x="98" y="152" width="44" height="38" rx="2" fill={C.brand} stroke={C.dark} strokeWidth="2"/>
      <circle cx="136" cy="172" r="3" fill="#fde68a"/>
      {/* suelo */}
      <rect x="20" y="188" width="200" height="8" rx="2" fill={C.dark}/>
      <text x="120" y="204" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">INSTALACIÓN FÍSICA</text>
    </svg>
  )
}

function SistemaMonitoreo() {
  return (
    <svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg">
      {/* monitor principal */}
      <rect x="30" y="20" width="160" height="110" rx="6" fill="#0f172a" stroke={C.dark} strokeWidth="3"/>
      <rect x="38" y="28" width="144" height="94" rx="3" fill="#1e293b"/>
      {/* líneas de monitoreo */}
      <polyline points="42,100 62,80 80,90 100,60 120,75 140,50 162,65" fill="none" stroke={C.on} strokeWidth="2.5"/>
      <polyline points="42,110 62,105 80,108 100,95 120,100 140,88 162,92" fill="none" stroke={C.warn} strokeWidth="1.8"/>
      {/* indicadores */}
      <circle cx="162" cy="65" r="4" fill={C.on}/>
      <circle cx="162" cy="92" r="4" fill={C.warn}/>
      {/* pie del monitor */}
      <rect x="95" y="130" width="30" height="12" rx="2" fill={C.steel}/>
      <rect x="75" y="140" width="70" height="6" rx="2" fill={C.steel}/>
      {/* panel lateral / NMS */}
      <rect x="202" y="40" width="48" height="80" rx="4" fill="#f8fafc" stroke={C.dark} strokeWidth="2"/>
      {[0,1,2,3].map(i => (
        <g key={i}>
          <circle cx="218" cy={56+i*18} r="5" fill={i===2 ? C.off : C.on}/>
          <rect x="228" y={52+i*18} width="16" height="4" rx="2" fill={C.steel}/>
          <rect x="228" y={58+i*18} width="10" height="3" rx="1" fill={C.panel}/>
        </g>
      ))}
      {/* cable de red */}
      <path d="M196 80 h6" stroke={C.accent} strokeWidth="2" strokeDasharray="3 2"/>
      <text x="120" y="165" textAnchor="middle" fontSize="11" fill={C.dark} fontFamily="sans-serif">SISTEMA DE MONITOREO</text>
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
    case 'ups':                 return <UpsModular />
    case 'genset':              return <Genset />
    case 'planta_cc':           return <PlantaCC />
    case 'tablero':             return <Tablero />
    case 'bomba':               return <Bomba />
    case 'banco_bateria':       return <BancoBateria />
    case 'celda_mt':            return <CeldaMT />
    case 'transformador_mt':    return <TransformadorMT />
    case 'torre_enfriamiento':  return <TorreEnfriamiento />
    case 'chiller':             return <Chiller />
    case 'ahc':                 return <AHC />
    case 'acu':                 return <ACU />
    case 'estanque_combustible':return <EstanqueCombustible />
    case 'alcantarilla':        return <Alcantarilla />
    case 'ascensor':            return <Ascensor />
    case 'instalacion_fisica':  return <InstalacionFisica />
    case 'monitoreo':           return <SistemaMonitoreo />
    default:                    return <Generic />
  }
}
