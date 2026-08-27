// web/src/features/learning/diagrams.tsx
// Diagramas editoriales autocontenidos (HTML+SVG) por categoría.
// Siguen la skill `diagram-design` de cathrynlavery:
//   - 4px grid, 39 tipos, densidad 4/10, máx 9 nodos
//   - Colores por variables del app (claro/oscuro automático)
//   - Tipografía: Geist / Geist Mono (ya cargadas) — títulos en sans
//   - Sin sombras, sin Mermaid, SVG accesible (role=img, title/desc)
// Cada diagrama es un componente React standalone; el contenedor maneja el
// fondo/borde para que el SVG ande en ambos temas sin duplicar variantes.

import type { ReactNode } from "react"

// ── Primitivas de estilo (resuelven a tokens del app) ──
const S = {
  paper: "var(--surface)",
  paper2: "var(--surface-subtle)",
  ink: "var(--text)",
  muted: "var(--muted)",
  soft: "var(--muted)",
  rule: "var(--border)",
  accent: "var(--primary)",
  accentTint: "var(--primary-soft)",
  link: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--primary)",
} as const

function SvgFrame({ viewBox, children, title, desc, id }: { viewBox: string; children: ReactNode; title: string; desc: string; id: string }) {
  return (
    <svg viewBox={viewBox} role="img" aria-labelledby={`${id}-title ${id}-desc`} style={{ width: "100%", height: "auto", display: "block" }}>
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{desc}</desc>
      <rect width="100%" height="100%" rx={8} fill={S.paper} />
      <defs>
        <marker id={`${id}-arrow`} markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={S.muted} />
        </marker>
        <marker id={`${id}-arrow-accent`} markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={S.accent} />
        </marker>
        <marker id={`${id}-arrow-link`} markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={S.link} />
        </marker>
      </defs>
      {children}
    </svg>
  )
}

function nodeBox(x: number, y: number, w: number, h: number, label: string, sub?: string, variant: "default" | "focal" | "store" | "muted" = "default", tag?: string) {
  const fill = variant === "focal" ? S.accentTint : variant === "store" ? "color-mix(in srgb, var(--text) 4%, transparent)" : variant === "muted" ? "color-mix(in srgb, var(--muted) 6%, transparent)" : S.paper
  const stroke = variant === "focal" ? S.accent : variant === "store" ? S.muted : S.rule
  const sw = variant === "focal" ? 1.2 : 1
  return (
    <g key={`${x}-${y}-${label}`}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={S.paper} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />
      {tag && (
        <>
          <rect x={x + 8} y={y + 6} width={Math.max(24, tag.length * 5.2 + 10)} height={12} rx={2} fill="transparent" stroke={stroke} strokeWidth={0.8} opacity={0.55} />
          <text x={x + 8 + Math.max(24, tag.length * 5.2 + 10) / 2} y={y + 15} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.08em">{tag}</text>
        </>
      )}
      <text x={x + w / 2} y={y + h / 2 + (sub ? -4 : 4)} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="middle">{sub}</text>}
    </g>
  )
}

// Conector ortogonal redondeado r=8 — reservado para uso futuro (diagram-design §6)
function _elbowH(x1: number, y1: number, x2: number, y2: number, opts?: { color?: string; dashed?: boolean; label?: string; id?: string }) {
  const color = opts?.color ?? S.muted
  const dash = opts?.dashed ? "4,3" : undefined
  const mid = (x1 + x2) / 2
  const d = `M ${x1},${y1} H ${mid - 8} Q ${mid},${y1} ${mid},${y1 + 8} V ${y2 - 8} Q ${mid},${y2} ${mid + 8},${y2} H ${x2}`
  const marker = color === S.accent ? `url(#${opts?.id ?? "dg"}-arrow-accent)` : color === S.link ? `url(#${opts?.id ?? "dg"}-arrow-link)` : `url(#${opts?.id ?? "dg"}-arrow)`
  return (
    <g key={`${x1}-${y1}-${x2}-${y2}`}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray={dash} markerEnd={marker} />
      {opts?.label && (
        <>
          <rect x={mid - opts.label.length * 2.6 - 6} y={(y1 + y2) / 2 - 14} width={opts.label.length * 5.2 + 12} height={12} rx={2} fill={S.paper} />
          <text x={mid} y={(y1 + y2) / 2 - 5} fill={S.soft} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.06em">{opts.label}</text>
        </>
      )}
    </g>
  )
}
void _elbowH

// ── 00 · Fundamentos — Layer stack (modelo por capas) ──
export function DiagramFundamentosLayers() {
  const id = "dg-fund-layers"
  // Capas: Redes → Sistemas → Programación → Seguridad
  const layers = [
    { tag: "L3", name: "Seguridad", note: "CIA · criptografía · OWASP" },
    { tag: "L2", name: "Programación", note: "Python · bash · C · JS/SQL" },
    { tag: "L1", name: "Redes", note: "OSI · TCP/IP · HTTP/DNS" },
    { tag: "L0", name: "Sistemas operativos", note: "Linux · Windows · permisos · procesos" },
  ]
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Fundamentos por capas" desc="Cuatro capas apiladas: sistemas operativos en la base, luego redes, programación y seguridad en la cima; la flecha lateral indica que la abstracción crece hacia arriba." id={id}>
        {/* dirección */}
        <text x={16} y={24} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">ABSTRACCIÓN ↑</text>
        <line x1={14} y1={28} x2={14} y2={300} stroke={S.muted} strokeWidth={0.8} strokeDasharray="3,3" />
        <polygon points="14,20 10,28 18,28" fill={S.muted} />
        {/* stack */}
        {layers.map((l, i) => {
          const y = 36 + i * 64
          const isFocal = i === 0 // seguridad es focal
          return (
            <g key={l.tag}>
              <rect x={40} y={y} width={640} height={56} rx={6} fill={isFocal ? S.accentTint : S.paper2} stroke={isFocal ? S.accent : S.rule} strokeWidth={isFocal ? 1.2 : 1} />
              <text x={56} y={y + 24} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" letterSpacing="0.12em">{l.tag}</text>
              <text x={96} y={y + 26} fill={S.ink} fontSize={13} fontWeight={600} fontFamily="var(--font-family)">{l.name}</text>
              <text x={680 - 8} y={y + 26} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="end">{l.note}</text>
            </g>
          )
        })}
        {/* leyenda */}
        <line x1={40} y1={312} x2={680} y2={312} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={40} y={326} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={100} y={318} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={116} y={327} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — donde se integran los fundamentos</text>
      </SvgFrame>
    </div>
  )
}

// ── 01 · Herramientas — Flowchart (ciclo de pentest según OWASP/PTES) ──
export function DiagramHerramientasFlowchart() {
  const id = "dg-tools-flow"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 420" title="Ciclo de pentest" desc="Flujo de arriba a abajo: reconocimiento, escaneo con Nmap, explotación con Metasploit, post-explotación y reporte; el diamante decide si hay escalada o se documenta." id={id}>
        {/* nodos */}
        {/* Inicio */}
        <ellipse cx={360} cy={28} rx={64} ry={16} fill={S.paper} stroke={S.ink} strokeWidth={1} />
        <text x={360} y={32} fill={S.ink} fontSize={10} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Inicio · Scope</text>

        {/* Recon */}
        {nodeBox(260, 56, 200, 44, "Reconocimiento", "OSINT · DNS · Shodan", "default", "01")}
        <line x1={360} y1={44} x2={360} y2={56} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* Escaneo */}
        {nodeBox(260, 116, 200, 44, "Escaneo y enumeración", "nmap · NSE · fingerprint", "default", "02")}
        <line x1={360} y1={100} x2={360} y2={116} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* Explotación */}
        {nodeBox(260, 176, 200, 44, "Explotación", "Metasploit · payloads", "focal", "03")}
        <line x1={360} y1={160} x2={360} y2={176} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* Diamante: ¿éxito? */}
        <polygon points="360,228 410,256 360,284 310,256" fill={S.paper} stroke={S.ink} strokeWidth={1} />
        <text x={360} y={260} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">¿Acceso?</text>

        {/* No → Informe parcial */}
        <line x1={410} y1={256} x2={560} y2={256} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={420} y={246} width={22} height={10} rx={2} fill={S.paper} />
        <text x={431} y={254} fill={S.soft} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">NO</text>
        {nodeBox(520, 232, 140, 48, "Documentar", "evidencia · hallazgos", "muted")}

        {/* Sí → Post */}
        <line x1={360} y1={284} x2={360} y2={308} stroke={S.accent} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-accent)`} />
        <rect x={364} y={288} width={18} height={10} rx={2} fill={S.paper} />
        <text x={373} y={296} fill={S.accent} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">SÍ</text>
        {nodeBox(260, 308, 200, 44, "Post-explotación", "privesc · pivot · persist.", "default", "04")}
        {nodeBox(260, 368, 200, 28, "Reporte", "PTES · CVSS · remediación", "store")}
        <line x1={360} y1={352} x2={360} y2={368} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* merge dot */}
        <circle cx={360} cy={410} r={3} fill={S.ink} />
      </SvgFrame>
    </div>
  )
}

// ── 02 · Web y Apps — Sequence (ataque web canónico) ──
export function DiagramWebSequence() {
  const id = "dg-web-seq"
  const actors = [
    { x: 96, label: "Atacante" },
    { x: 252, label: "Navegador" },
    { x: 408, label: "App Web" },
    { x: 564, label: "BD / API" },
  ]
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 680 360" title="Flujo de ataque web" desc="Secuencia temporal de un ataque web: el atacante envía un payload, la app lo procesa y la base de datos lo ejecuta; la respuesta recorre el camino inverso." id={id}>
        {/* actores */}
        {actors.map((a) => (
          <g key={a.label}>
            <rect x={a.x - 48} y={16} width={96} height={28} rx={6} fill={S.paper2} stroke={S.rule} strokeWidth={1} />
            <text x={a.x} y={34} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{a.label}</text>
            <line x1={a.x} y1={44} x2={a.x} y2={330} stroke="color-mix(in srgb, var(--text) 14%, transparent)" strokeWidth={1} strokeDasharray="3,3" />
          </g>
        ))}
        {/* mensajes */}
        {/* 1: recon */}
        <line x1={96} y1={68} x2={408} y2={68} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={200} y={58} width={92} height={12} rx={2} fill={S.paper} />
        <text x={246} y={67} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">GET /?id=1'</text>
        {/* 2: error-based sqli */}
        <line x1={408} y1={96} x2={564} y2={96} stroke={S.link} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-link)`} />
        <rect x={442} y={86} width={100} height={12} rx={2} fill={S.paper} />
        <text x={492} y={95} fill={S.link} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">SELECT * WHERE 1'—</text>
        {/* 3: datos */}
        <line x1={564} y1={124} x2={408} y2={124} stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <rect x={436} y={114} width={112} height={12} rx={2} fill={S.paper} />
        <text x={492} y={123} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">rows · error 1064</text>
        {/* 4: XSS almacenado (focal) */}
        <line x1={96} y1={160} x2={252} y2={160} stroke={S.accent} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-accent)`} />
        <rect x={128} y={150} width={88} height={12} rx={2} fill={S.paper} />
        <text x={172} y={159} fill={S.accent} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">&lt;script&gt;…&lt;/&gt;</text>
        {/* 5: reflejo */}
        <line x1={252} y1={188} x2={408} y2={188} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={290} y={178} width={80} height={12} rx={2} fill={S.paper} />
        <text x={330} y={187} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">POST /comment</text>
        {/* 6: store + execute */}
        <line x1={408} y1={216} x2={564} y2={216} stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <rect x={446} y={206} width={92} height={12} rx={2} fill={S.paper} />
        <text x={492} y={215} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">INSERT comment</text>
        {/* 7: víctima carga */}
        <line x1={564} y1={252} x2={252} y2={252} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={350} y={242} width={108} height={12} rx={2} fill={S.paper} />
        <text x={404} y={251} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">GET /page → JS exec</text>
        {/* activation bars */}
        <rect x={404} y={68} width={8} height={56} rx={1} fill="color-mix(in srgb, var(--text) 6%, transparent)" stroke={S.muted} strokeWidth={0.8} />
        <rect x={560} y={96} width={8} height={28} rx={1} fill="color-mix(in srgb, var(--text) 6%, transparent)" stroke={S.muted} strokeWidth={0.8} />
        {/* leyenda */}
        <line x1={24} y1={300} x2={656} y2={300} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={314} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <line x1={80} y1={312} x2={100} y2={312} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <text x={106} y={315} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">sincrónico</text>
        <line x1={176} y1={312} x2={196} y2={312} stroke={S.accent} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-accent)`} />
        <text x={202} y={315} fill={S.accent} fontSize={7} fontFamily="var(--font-mono)">focal (XSS)</text>
        <line x1={268} y1={312} x2={288} y2={312} stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <text x={294} y={315} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">retorno</text>
      </SvgFrame>
    </div>
  )
}

// ── 03 · Sistemas — Layer stack privilegios + Deployment (zonas) ──
export function DiagramSistemasStack() {
  const id = "dg-sys-stack"
  const layers = [
    { tag: "R0", name: "Kernel", note: "ring 0 · syscall · driver · EPROCESS", focal: true },
    { tag: "R1–2", name: "Servicios privilegiados", note: "drivers firmados · LSA · CSRSS" },
    { tag: "R3", name: "Usuario", note: "procesos · token · handle table" },
    { tag: "APP", name: "Aplicación", note: "Win32 API · .NET · Electron" },
  ]
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Anillos de privilegio" desc="Cuatro capas desde la aplicación arriba hasta el kernel abajo; el kernel es focal porque allí reside la escalada." id={id}>
        <text x={16} y={24} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">PRIVILEGIO ↑</text>
        <line x1={14} y1={28} x2={14} y2={300} stroke={S.muted} strokeWidth={0.8} strokeDasharray="3,3" />
        <polygon points="14,20 10,28 18,28" fill={S.muted} />
        {layers.map((l, i) => {
          const y = 36 + i * 64
          return (
            <g key={l.tag}>
              <rect x={40} y={y} width={640} height={56} rx={6} fill={l.focal ? S.accentTint : S.paper2} stroke={l.focal ? S.accent : S.rule} strokeWidth={l.focal ? 1.2 : 1} />
              <text x={56} y={y + 24} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" letterSpacing="0.12em">{l.tag}</text>
              <text x={112} y={y + 26} fill={S.ink} fontSize={12} fontWeight={600} fontFamily="var(--font-family)">{l.name}</text>
              <text x={672} y={y + 26} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="end">{l.note}</text>
            </g>
          )
        })}
        <line x1={40} y1={312} x2={680} y2={312} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={40} y={326} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={100} y={318} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={116} y={327} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — objetivo de escalada</text>
      </SvgFrame>
    </div>
  )
}

// ── 04 · Post-Explotación — Loop (ciclo de persistencia) + Swimlane simplificado ──
export function DiagramPostLoop() {
  const id = "dg-post-loop"
  // 4 nodos en círculo + hub central
  const cx = 360, cy = 140, r = 84
  const nodes = [
    { angle: -90, label: "Acceso", sub: "exploit · token" },
    { angle: 0, label: "Persistencia", sub: "servicio · tarea" },
    { angle: 90, label: "Movimiento", sub: "WMI · DCOM", focal: true },
    { angle: 180, label: "Exfiltración", sub: "C2 · staging" },
  ]
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 360" title="Ciclo de post-explotación" desc="Anillo de cuatro fases — acceso, persistencia, movimiento y exfiltración — que giran alrededor de la telemetría compartida; el movimiento lateral es focal." id={id}>
        {/* círculo guía */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="color-mix(in srgb, var(--text) 8%, transparent)" strokeWidth={1} strokeDasharray="4,3" />
        {/* hub */}
        <circle cx={cx} cy={cy} r={36} fill={S.paper2} stroke={S.rule} strokeWidth={1} />
        <text x={cx} y={cy - 4} fill={S.ink} fontSize={8} fontWeight={700} fontFamily="var(--font-family)" textAnchor="middle">Telemetría</text>
        <text x={cx} y={cy + 10} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">EDR · Sysmon</text>
        {/* nodos */}
        {nodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180
          const x = cx + r * Math.cos(rad) - 56
          const y = cy + r * Math.sin(rad) - 20
          return (
            <g key={n.label}>
              <rect x={x} y={y} width={112} height={40} rx={6} fill={n.focal ? S.accentTint : S.paper} stroke={n.focal ? S.accent : S.ink} strokeWidth={n.focal ? 1.2 : 1} />
              <text x={x + 56} y={y + 16} fill={S.ink} fontSize={10} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{n.label}</text>
              <text x={x + 56} y={y + 28} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">{n.sub}</text>
            </g>
          )
        })}
        {/* flechas del anillo (4 arcos) */}
        <path d="M 360,56 A 84,84 0 0,1 444,140" fill="none" stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <path d="M 444,140 A 84,84 0 0,1 360,224" fill="none" stroke={S.accent} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-accent)`} />
        <path d="M 360,224 A 84,84 0 0,1 276,140" fill="none" stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <path d="M 276,140 A 84,84 0 0,1 360,56" fill="none" stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        {/* radios al hub */}
        {[0, 90, 180, 270].map((a) => {
          const rad = (a * Math.PI) / 180
          const x1 = cx + 36 * Math.cos(rad), y1 = cy + 36 * Math.sin(rad)
          const x2 = cx + (r - 18) * Math.cos(rad), y2 = cy + (r - 18) * Math.sin(rad)
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} strokeDasharray="3,3" />
        })}
        {/* leyenda */}
        <line x1={24} y1={300} x2={696} y2={300} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={314} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={306} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={315} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — donde actúa el operador</text>
        <line x1={220} y1={312} x2={240} y2={312} stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" />
        <text x={246} y={315} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">ciclo que se repite</text>
      </SvgFrame>
    </div>
  )
}

// ── 06 · Operaciones — Gantt (fases de una operación purple team) ──
export function DiagramOperacionesGantt() {
  const id = "dg-ops-gantt"
  const tasks = [
    { label: "Planificación", start: 40, len: 120, row: 0 },
    { label: "Infra C2", start: 80, len: 100, row: 1 },
    { label: "Ejecución", start: 160, len: 180, row: 2, focal: true },
    { label: "Detección (blue)", start: 180, len: 160, row: 3 },
    { label: "Reporte", start: 360, len: 120, row: 4 },
  ]
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 320" title="Fases de una operación" desc="Cinco tareas en el tiempo: planificación, infraestructura C2, ejecución, detección por el equipo azul y reporte; la ejecución es focal." id={id}>
        {/* eje tiempo */}
        <line x1={160} y1={28} x2={640} y2={28} stroke={S.muted} strokeWidth={0.8} />
        {[0, 1, 2, 3, 4].map((i) => (
          <text key={i} x={160 + i * 120} y={20} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">T+{i}</text>
        ))}
        {tasks.map((t) => (
          <g key={t.label}>
            <text x={12} y={60 + t.row * 40 + 14} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" letterSpacing="0.04em">{t.label}</text>
            <rect x={160 + t.start * 0.62} y={60 + t.row * 40} width={t.len * 0.62} height={20} rx={4} fill={t.focal ? S.accentTint : S.paper2} stroke={t.focal ? S.accent : S.rule} strokeWidth={t.focal ? 1.2 : 1} />
          </g>
        ))}
        {/* dependencia */}
        <line x1={160 + 160 * 0.62} y1={70} x2={160 + 160 * 0.62} y2={170} stroke={S.muted} strokeWidth={0.8} strokeDasharray="3,3" />
        <line x1={24} y1={272} x2={696} y2={272} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={286} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={278} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={287} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — ventana de explotación</text>
      </SvgFrame>
    </div>
  )
}

// ── 99 · Prompt Injection — Flowchart (pipeline de inyección) ──
export function DiagramPromptInjectionFlow() {
  const id = "dg-pi-flow"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 440" title="Pipeline de prompt injection" desc="El flujo bifurca en si el filtro detecta la inyección; si no la detecta, el modelo ejecuta la instrucción maliciosa." id={id}>
        <ellipse cx={360} cy={24} rx={72} ry={16} fill={S.paper} stroke={S.ink} strokeWidth={1} />
        <text x={360} y={28} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Prompt + payload</text>

        {nodeBox(260, 52, 200, 40, "Pre-procesado", "normalización · split", "default")}
        <line x1={360} y1={40} x2={360} y2={52} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* diamante filtro */}
        <polygon points="360,112 420,140 360,168 300,140" fill={S.paper} stroke={S.ink} strokeWidth={1} />
        <text x={360} y={144} fill={S.ink} fontSize={8} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">¿Filtro detecta?</text>
        <line x1={360} y1={92} x2={360} y2={112} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* Sí → bloqueado */}
        <line x1={420} y1={140} x2={540} y2={140} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={422} y={132} width={20} height={10} rx={2} fill={S.paper} />
        <text x={432} y={140} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">SÍ</text>
        {nodeBox(500, 120, 140, 40, "Bloqueado", "log · alerta · 403", "store")}
        {nodeBox(500, 176, 140, 28, "Fin seguro", "respuesta benigna", "store")}
        <line x1={570} y1={160} x2={570} y2={176} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />

        {/* No → LLM */}
        <line x1={360} y1={168} x2={360} y2={196} stroke={S.accent} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-accent)`} />
        <rect x={364} y={172} width={18} height={10} rx={2} fill={S.paper} />
        <text x={373} y={180} fill={S.accent} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">NO</text>
        {nodeBox(260, 196, 200, 44, "LLM ejecuta", "sigue la instrucción inyectada", "focal")}
        <line x1={360} y1={240} x2={360} y2={268} stroke={S.accent} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-accent)`} />
        {nodeBox(260, 268, 200, 44, "Tool / exfiltración", "forge_execute · datos", "focal")}
        <line x1={360} y1={312} x2={360} y2={340} stroke={S.danger} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        {nodeBox(260, 340, 200, 32, "Impacto", "pérdida de confidencialidad", "muted")}
        <ellipse cx={360} cy={396} rx={48} ry={14} fill={S.paper} stroke={S.ink} strokeWidth={1} />
        <text x={360} y={400} fill={S.ink} fontSize={9} fontFamily="var(--font-family)" textAnchor="middle">Fin</text>
        <line x1={360} y1={372} x2={360} y2={382} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
      </SvgFrame>
    </div>
  )
}

// ── 02-Alt · Web/API — Architecture (stack web moderno) ──
// Se expone como segundo diagrama para 02 cuando hace falta variedad.
export function DiagramWebArchitecture() {
  const id = "dg-web-arch"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Stack web bajo ataque" desc="Tres zonas: cliente, perímetro y origen; el WAF es el límite de confianza y la API es focal por ser la superficie más explotable." id={id}>
        {/* zonas */}
        <rect x={16} y={32} width={216} height={240} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={22} y={36} width={52} height={12} rx={2} fill={S.paper} />
        <text x={48} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">CLIENTE</text>

        <rect x={252} y={32} width={216} height={240} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={258} y={36} width={64} height={12} rx={2} fill={S.paper} />
        <text x={290} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">PERÍMETRO</text>

        <rect x={488} y={32} width={216} height={240} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={494} y={36} width={48} height={12} rx={2} fill={S.paper} />
        <text x={518} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">ORIGEN</text>

        {/* nodos */}
        <g>
          <rect x={48} y={64} width={152} height={44} rx={6} fill={S.paper} stroke={S.ink} strokeWidth={1} />
          <text x={124} y={84} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Navegador</text>
          <text x={124} y={98} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="middle">fetch · cookies</text>
        </g>
        <g>
          <rect x={48} y={128} width={152} height={36} rx={6} fill="color-mix(in srgb, var(--text) 4%, transparent)" stroke={S.muted} strokeWidth={1} />
          <text x={124} y={150} fill={S.ink} fontSize={10} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Atacante</text>
        </g>
        <g>
          <rect x={284} y={64} width={152} height={44} rx={6} fill={S.paper} stroke={S.ink} strokeWidth={1} />
          <text x={360} y={84} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">CDN / WAF</text>
          <text x={360} y={98} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="middle">rate-limit · firmas</text>
        </g>
        <g>
          <rect x={284} y={128} width={152} height={44} rx={6} fill={S.accentTint} stroke={S.accent} strokeWidth={1.2} />
          <text x={360} y={148} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">API Gateway</text>
          <text x={360} y={162} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="middle">REST · GraphQL · gRPC</text>
        </g>
        <g>
          <rect x={520} y={64} width={152} height={44} rx={6} fill={S.paper} stroke={S.ink} strokeWidth={1} />
          <text x={596} y={84} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">App Server</text>
          <text x={596} y={98} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="middle">Node · Django · Spring</text>
        </g>
        <g>
          <rect x={520} y={128} width={152} height={44} rx={6} fill="color-mix(in srgb, var(--text) 4%, transparent)" stroke={S.muted} strokeWidth={1} />
          <text x={596} y={148} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Base de datos</text>
          <text x={596} y={162} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)" textAnchor="middle">Postgres · Redis</text>
        </g>
        {/* flechas */}
        <line x1={200} y1={86} x2={284} y2={86} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={224} y={76} width={36} height={10} rx={2} fill={S.paper} />
        <text x={242} y={84} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">HTTPS</text>
        <line x1={436} y1={108} x2={520} y2={108} stroke={S.link} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-link)`} />
        <rect x={456} y={98} width={44} height={10} rx={2} fill={S.paper} />
        <text x={478} y={106} fill={S.link} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">API call</text>
        <line x1={200} y1={146} x2={284} y2={146} stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <rect x={220} y={136} width={44} height={10} rx={2} fill={S.paper} />
        <text x={242} y={144} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">bypass</text>

        <line x1={24} y1={300} x2={696} y2={300} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={314} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={306} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={315} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — superficie de ataque</text>
      </SvgFrame>
    </div>
  )
}

// ── Especialización: mapa por sub-categoría ──
// Cada sub-carpeta de 05 tiene su propio tipo recomendado.
// Se expone una función que elige el diagrama correcto.

export function DiagramEspecializacion({ subCategory }: { subCategory: string | null }) {
  const key = (subCategory ?? "").toLowerCase()
  if (key.includes("cloud") || key.includes("identity")) return <DiagramCloudIdentity />
  if (key.includes("mobile")) return <DiagramMobile />
  if (key.includes("ia") || key.includes("adversarial")) return <DiagramIAAdversarial />
  if (key.includes("vuln") || key.includes("research")) return <DiagramVulnResearch />
  if (key.includes("hardware") || key.includes("rf")) return <DiagramHardwareRF />
  if (key.includes("industrial")) return <DiagramIndustrial />
  if (key.includes("defensive") || key.includes("forense")) return <DiagramDefensive />
  if (key.includes("social") || key.includes("bug")) return <DiagramSocialWeb />
  if (key.includes("cloud-native") || key.includes("native")) return <DiagramCloudNative />
  // fallback: arquitectura genérica de especialización
  return <DiagramEspecializacionFallback />
}

function DiagramCloudIdentity() {
  const id = "dg-esp-cloud"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 320" title="Identidad híbrida y nube" desc="On-prem AD sincronizado a Entra ID mediante Connect Sync, con acceso condicional y PIM como controles focales." id={id}>
        <rect x={24} y={28} width={200} height={200} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={30} y={32} width={56} height={12} rx={2} fill={S.paper} />
        <text x={58} y={41} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">ON-PREM</text>
        {nodeBox(48, 56, 152, 40, "Active Directory", "DC · GPO · Kerberos", "default")}
        {nodeBox(48, 112, 152, 36, "AD FS / PHS", "federación", "muted")}
        <rect x={248} y={100} width={72} height={28} rx={14} fill={S.paper} stroke={S.ink} strokeWidth={1} />
        <text x={284} y={118} fill={S.ink} fontSize={8} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Connect Sync</text>
        <line x1={200} y1={76} x2={248} y2={114} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <line x1={320} y1={114} x2={380} y2={76} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={380} y={40} width={200} height={200} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={386} y={44} width={44} height={12} rx={2} fill={S.paper} />
        <text x={408} y={53} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">NUBE</text>
        {nodeBox(404, 64, 152, 40, "Microsoft Entra ID", "tenant · Conditional Access", "focal")}
        <line x1={480} y1={104} x2={480} y2={128} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        {nodeBox(404, 128, 152, 36, "PIM · MFA", "elevación just-in-time", "default")}
        <line x1={600} y1={84} x2={640} y2={84} stroke={S.link} strokeWidth={1.2} markerEnd={`url(#${id}-arrow-link)`} />
        <rect x={604} y={74} width={28} height={10} rx={2} fill={S.paper} />
        <text x={618} y={82} fill={S.link} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">SaaS</text>
        <line x1={24} y1={268} x2={696} y2={268} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={282} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={274} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={283} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — perímetro de identidad</text>
      </SvgFrame>
    </div>
  )
}

function DiagramMobile() {
  const id = "dg-esp-mobile"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 320" title="Cadena de análisis móvil" desc="Flujo desde la APK hasta el hallazgo: descompilación, análisis estático, instrumentación dinámica y explotación." id={id}>
        <line x1={40} y1={80} x2={680} y2={80} stroke="color-mix(in srgb, var(--text) 8%, transparent)" strokeWidth={0.8} />
        {[["APK / IPA", "bundle"], ["Descompilar", "jadx · apktool"], ["Estático", "manifest · smali"], ["Dinámico", "Frida · Objection"], ["Explotar", "deep link · intent"]].map((pair, i) => {
          const x = 80 + i * 136
          const focal = i === 3
          return (
            <g key={pair[0]}>
              <circle cx={x} cy={80} r={10} fill={focal ? S.accent : S.paper} stroke={focal ? S.accent : S.ink} strokeWidth={focal ? 1.2 : 1} />
              <text x={x} y={84} fill={focal ? "#fff" : S.ink} fontSize={9} fontWeight={700} fontFamily="var(--font-family)" textAnchor="middle">{i + 1}</text>
              <text x={x} y={110} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{pair[0]}</text>
              <text x={x} y={122} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">{pair[1]}</text>
              {i < 4 && <line x1={x + 18} y1={80} x2={x + 118} y2={80} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />}
            </g>
          )
        })}
        <rect x={24} y={150} width={672} height={72} rx={8} fill="color-mix(in srgb, var(--text) 3%, transparent)" stroke={S.rule} strokeWidth={1} />
        <text x={36} y={172} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">HERRAMIENTAS CLAVE</text>
        <text x={36} y={190} fill={S.ink} fontSize={9} fontFamily="var(--font-family)">adb · frida-trace · objection · Burp Mobile · MobSF</text>
        <text x={36} y={206} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)">Emulador · dispositivo rooteado · certificado CA instalado</text>
        <line x1={24} y1={268} x2={696} y2={268} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={282} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <circle cx={86} cy={280} r={5} fill={S.accent} stroke={S.accent} strokeWidth={1} />
        <text x={100} y={283} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — instrumentación dinámica</text>
      </SvgFrame>
    </div>
  )
}

function DiagramIAAdversarial() {
  const id = "dg-esp-ia"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 360" title="Superficie adversarial de IA" desc="Tres zonas: datos, modelo y despliegue; el modelo es focal y las flechas muestran envenenamiento, evasión y extracción." id={id}>
        <rect x={24} y={32} width={216} height={200} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={30} y={36} width={40} height={12} rx={2} fill={S.paper} />
        <text x={50} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">DATOS</text>
        {nodeBox(48, 56, 168, 36, "Dataset", "etiquetas · PII", "default")}
        {nodeBox(48, 108, 168, 36, "Pipeline", "augment · split", "muted")}
        <rect x={252} y={32} width={216} height={200} rx={8} fill={S.accentTint} stroke={S.accent} strokeWidth={1.2} />
        <rect x={258} y={36} width={52} height={12} rx={2} fill={S.paper} />
        <text x={284} y={45} fill={S.accent} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">MODELO ★</text>
        {nodeBox(276, 56, 168, 44, "LLM / Clasificador", "pesos · embeddings", "focal")}
        {nodeBox(276, 116, 168, 36, "Evaluación", "benchmark · red team", "default")}
        <rect x={488} y={32} width={208} height={200} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={494} y={36} width={56} height={12} rx={2} fill={S.paper} />
        <text x={522} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">DESPLIEGUE</text>
        {nodeBox(512, 56, 160, 36, "API / Prompt", "system · user", "default")}
        {nodeBox(512, 108, 160, 36, "Guardrails", "filtro · policy", "store")}
        {/* ataques */}
        <line x1={216} y1={74} x2={276} y2={78} stroke={S.danger} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={224} y={64} width={44} height={10} rx={2} fill={S.paper} />
        <text x={246} y={72} fill={S.danger} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">poison</text>
        <line x1={468} y1={74} x2={512} y2={74} stroke={S.danger} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <rect x={470} y={64} width={40} height={10} rx={2} fill={S.paper} />
        <text x={490} y={72} fill={S.danger} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">evasion</text>
        <line x1={24} y1={280} x2={696} y2={280} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={294} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={286} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={295} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — modelo bajo ataque</text>
      </SvgFrame>
    </div>
  )
}

function DiagramVulnResearch() {
  const id = "dg-esp-vuln"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 320" title="Pipeline de vulnerability research" desc="Fuzzing genera casos, el triage clasifica crashes y el exploit prueba el primitivo; el corpus es el activo que crece." id={id}>
        {nodeBox(24, 60, 140, 40, "Fuzzer", "AFL++ · libFuzzer", "default", "01")}
        <line x1={164} y1={80} x2={200} y2={80} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={168} y={70} width={28} height={10} rx={2} fill={S.paper} />
        <text x={182} y={78} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">cases</text>
        {nodeBox(200, 60, 140, 40, "Target", "binario · harness", "focal")}
        <line x1={340} y1={80} x2={380} y2={80} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <rect x={344} y={70} width={32} height={10} rx={2} fill={S.paper} />
        <text x={360} y={78} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">crash</text>
        {nodeBox(380, 60, 140, 40, "Triage", "ASan · GDB · !exploitable", "default", "02")}
        <line x1={520} y1={80} x2={560} y2={80} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        {nodeBox(560, 60, 136, 40, "Exploit PoC", "primitivo · control PC", "store")}
        {/* corpus loop */}
        <path d="M 270,100 V 148 H 80 V 108" fill="none" stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <rect x={96} y={140} width={64} height={18} rx={9} fill={S.paper2} stroke={S.rule} strokeWidth={1} />
        <text x={128} y={152} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">corpus +</text>
        <line x1={24} y1={220} x2={696} y2={220} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={234} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={226} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={235} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — el binario bajo prueba</text>
      </SvgFrame>
    </div>
  )
}

function DiagramHardwareRF() {
  const id = "dg-esp-hw"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Cadena RF / hardware" desc="Del espectro a la decodificación: antena, SDR, demodulación, protocolo y explotación." id={id}>
        {[
          { x: 48, label: "Antena", sub: "433MHz · 2.4GHz" },
          { x: 184, label: "SDR", sub: "HackRF · RTL-SDR", focal: true },
          { x: 320, label: "Demodular", sub: "ASK · FSK · QAM" },
          { x: 456, label: "Protocolo", sub: "BLE · Zigbee · NFC" },
          { x: 592, label: "Explotar", sub: "replay · jam" },
        ].map((n, i) => (
          <g key={n.label}>
            <rect x={n.x - 48} y={48} width={96} height={44} rx={6} fill={n.focal ? S.accentTint : S.paper} stroke={n.focal ? S.accent : S.ink} strokeWidth={n.focal ? 1.2 : 1} />
            <text x={n.x} y={70} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{n.label}</text>
            <text x={n.x} y={82} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">{n.sub}</text>
            {i < 4 && <line x1={n.x + 48} y1={70} x2={n.x + 88} y2={70} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />}
          </g>
        ))}
        {/* espectro */}
        <rect x={48} y={116} width={624} height={48} rx={6} fill="color-mix(in srgb, var(--text) 3%, transparent)" stroke={S.rule} strokeWidth={1} />
        <text x={60} y={136} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.12em">ESPECTRO</text>
        <rect x={80} y={144} width={80} height={10} rx={2} fill={S.accent} opacity={0.55} />
        <rect x={200} y={144} width={120} height={10} rx={2} fill={S.info as string} opacity={0.45} />
        <rect x={400} y={144} width={60} height={10} rx={2} fill={S.warning} opacity={0.5} />
        <text x={360} y={148} fill="#fff" fontSize={6} fontFamily="var(--font-mono)" textAnchor="middle">señal capturada</text>
        <line x1={24} y1={200} x2={696} y2={200} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={214} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={206} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={215} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — SDR es el instrumento central</text>
      </SvgFrame>
    </div>
  )
}

function DiagramIndustrial() {
  const id = "dg-esp-ind"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Pirámide OT / Purdue" desc="Cinco niveles desde el proceso físico hasta la nube corporativa; la DMZ es la zona de demarcación." id={id}>
        {[
          { y: 28, w: 200, label: "Nivel 5 · Enterprise", sub: "ERP · nube", fill: S.paper2 },
          { y: 68, w: 300, label: "Nivel 4 · Site", sub: "historiador · MES", fill: S.paper2 },
          { y: 108, w: 400, label: "Nivel 3 · Área", sub: "HMI · SCADA", fill: S.accentTint, stroke: S.accent, focal: true },
          { y: 148, w: 500, label: "Nivel 2 · Control", sub: "PLC · DCS", fill: S.paper2 },
          { y: 188, w: 600, label: "Nivel 1–0 · Proceso", sub: "sensores · actuadores · campo", fill: "color-mix(in srgb, var(--text) 4%, transparent)" },
        ].map((l) => {
          const x = 360 - l.w / 2
          return (
            <g key={l.label}>
              <rect x={x} y={l.y} width={l.w} height={36} rx={6} fill={l.fill as string} stroke={(l as unknown as { stroke: string }).stroke ?? S.rule} strokeWidth={l.focal ? 1.2 : 1} />
              <text x={360} y={l.y + 16} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{l.label}</text>
              <text x={360} y={l.y + 28} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">{l.sub}</text>
            </g>
          )
        })}
        <line x1={24} y1={260} x2={696} y2={260} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={274} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={266} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={275} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — SCADA/HMI es la superficie más atacada</text>
      </SvgFrame>
    </div>
  )
}

function DiagramDefensive() {
  const id = "dg-esp-def"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Ciclo defensivo" desc="Cuatro fases que se retroalimentan: telemetría, detección, respuesta y hardening; la detección es focal." id={id}>
        {[
          { x: 120, y: 60, label: "Telemetría", sub: "Sysmon · EDR · logs", focal: false },
          { x: 360, y: 40, label: "Detección", sub: "Sigma · hunting", focal: true },
          { x: 600, y: 60, label: "Respuesta", sub: "contención · IR" },
          { x: 360, y: 180, label: "Hardening", sub: "baseline · parcheo" },
        ].map((n) => (
          <g key={n.label}>
            <rect x={n.x - 72} y={n.y} width={144} height={44} rx={6} fill={n.focal ? S.accentTint : S.paper} stroke={n.focal ? S.accent : S.ink} strokeWidth={n.focal ? 1.2 : 1} />
            <text x={n.x} y={n.y + 18} fill={S.ink} fontSize={10} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{n.label}</text>
            <text x={n.x} y={n.y + 32} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">{n.sub as string}</text>
          </g>
        ))}
        <path d="M 192,82 H 286" fill="none" stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <path d="M 432,62 H 528" fill="none" stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <path d="M 600,104 V 158 H 432" fill="none" stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <path d="M 288,180 H 192 V 104" fill="none" stroke={S.muted} strokeWidth={1} strokeDasharray="4,3" markerEnd={`url(#${id}-arrow)`} />
        <line x1={24} y1={260} x2={696} y2={260} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={274} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={266} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={275} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — la detección es el cuello de botella</text>
      </SvgFrame>
    </div>
  )
}

function DiagramSocialWeb() {
  const id = "dg-esp-social"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 320" title="Embudo de bug bounty" desc="De miles de objetivos a pocos reportes válidos; el triage es el filtro focal." id={id}>
        {[
          { y: 28, w: 520, label: "Reconocimiento", sub: "subdominios · JS · endpoints", pct: "100%" },
          { y: 72, w: 400, label: "Fuzzing / pruebas", sub: "Burp · ffuf · nuclei", pct: "30%" },
          { y: 116, w: 300, label: "Triage", sub: "repro · impacto · duplicado", pct: "8%", focal: true },
          { y: 160, w: 200, label: "Reporte", sub: "PoC · CVSS · bounty", pct: "2%" },
        ].map((l) => {
          const x = 360 - l.w / 2
          return (
            <g key={l.label}>
              <rect x={x} y={l.y} width={l.w} height={40} rx={6} fill={l.focal ? S.accentTint : S.paper2} stroke={l.focal ? S.accent : S.rule} strokeWidth={l.focal ? 1.2 : 1} />
              <text x={360} y={l.y + 18} fill={S.ink} fontSize={11} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{l.label}</text>
              <text x={360} y={l.y + 31} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">{l.sub}</text>
              <text x={x + l.w + 10} y={l.y + 24} fill={S.muted} fontSize={8} fontFamily="var(--font-mono)">{l.pct}</text>
            </g>
          )
        })}
        <line x1={24} y1={244} x2={696} y2={244} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={258} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={250} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={259} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — el triage decide qué vale reportar</text>
      </SvgFrame>
    </div>
  )
}

function DiagramCloudNative() {
  const id = "dg-esp-cn"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 340" title="Plataforma cloud-native" desc="Del código al runtime: imagen, orquestación y malla; el runtime del contenedor es la frontera focal." id={id}>
        <rect x={24} y={32} width={200} height={180} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={30} y={36} width={48} height={12} rx={2} fill={S.paper} />
        <text x={54} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">BUILD</text>
        {nodeBox(48, 56, 152, 36, "Imagen", "Dockerfile · SLSA", "default")}
        {nodeBox(48, 108, 152, 36, "Registro", "GHCR · ECR · firma", "muted")}
        {nodeBox(48, 160, 152, 36, "Supply chain", "SBOM · Trivy", "muted")}

        <rect x={260} y={32} width={200} height={180} rx={8} fill={S.accentTint} stroke={S.accent} strokeWidth={1.2} />
        <rect x={266} y={36} width={64} height={12} rx={2} fill={S.paper} />
        <text x={298} y={45} fill={S.accent} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">RUNTIME ★</text>
        {nodeBox(284, 56, 152, 36, "K8s Pod", "namespace · seccomp", "focal")}
        {nodeBox(284, 108, 152, 36, "Service Mesh", "mTLS · policy", "default")}
        {nodeBox(284, 160, 152, 36, "Secret / Config", "Vault · SealedSecrets", "default")}

        <rect x={496} y={32} width={200} height={180} rx={8} fill="color-mix(in srgb, var(--text) 2%, transparent)" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <rect x={502} y={36} width={40} height={12} rx={2} fill={S.paper} />
        <text x={522} y={45} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.14em">APLICACIÓN</text>
        {nodeBox(520, 56, 152, 36, "Smart Contract", "Solidity · audit", "default")}
        {nodeBox(520, 108, 152, 36, "dApp / API", "wagmi · viem", "default")}

        <line x1={200} y1={74} x2={284} y2={74} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <line x1={436} y1={74} x2={520} y2={74} stroke={S.muted} strokeWidth={1.2} markerEnd={`url(#${id}-arrow)`} />
        <line x1={24} y1={260} x2={696} y2={260} stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={0.8} />
        <text x={24} y={274} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" letterSpacing="0.14em">LEYENDA</text>
        <rect x={80} y={266} width={10} height={10} rx={2} fill={S.accentTint} stroke={S.accent} strokeWidth={1} />
        <text x={96} y={275} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)">Focal — el runtime es donde vive el riesgo</text>
      </SvgFrame>
    </div>
  )
}

function DiagramEspecializacionFallback() {
  const id = "dg-esp-fallback"
  return (
    <div className="learning-diagram-wrap">
      <SvgFrame viewBox="0 0 720 280" title="Mapa de especialización" desc="Nueve ramas de especialización conectadas al tronco común de fundamentos y herramientas." id={id}>
        <rect x={280} y={16} width={160} height={36} rx={6} fill={S.accentTint} stroke={S.accent} strokeWidth={1.2} />
        <text x={360} y={34} fill={S.ink} fontSize={10} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">Tronco común</text>
        <text x={360} y={46} fill={S.muted} fontSize={7} fontFamily="var(--font-mono)" textAnchor="middle">00–04 completados</text>
        {[
          "Cloud & Identity", "Mobile", "IA Adversarial",
          "Vuln Research", "Hardware/RF", "Industrial",
          "Defensive", "Social/Web", "Cloud Native",
        ].map((label, i) => {
          const col = i % 3, row = Math.floor(i / 3)
          const x = 24 + col * 232, y = 72 + row * 52
          return (
            <g key={label}>
              <rect x={x} y={y} width={208} height={36} rx={6} fill={S.paper2} stroke={S.rule} strokeWidth={1} />
              <text x={x + 104} y={y + 22} fill={S.ink} fontSize={9} fontWeight={600} fontFamily="var(--font-family)" textAnchor="middle">{label}</text>
              <line x1={360} y1={52} x2={x + 104} y2={y} stroke={S.muted} strokeWidth={0.8} strokeDasharray="3,3" />
            </g>
          )
        })}
      </SvgFrame>
    </div>
  )
}

// ── Gate de complejidad: filtra diagramas innecesarios ──
export function shouldShowDiagram(lesson: { category: string; subCategory: string | null; id: string; originalPath: string }): boolean {
  const cat = lesson.category
  const sub = (lesson.subCategory ?? "").toLowerCase()
  const op = lesson.originalPath ?? ""

  // 99-Prompt-Injection: nunca
  if (cat === "99-Prompt-Injection") return false

  // 05-Especializacion/02-Mobile y 05-08 Social-Web: nunca
  if (cat === "05-Especializacion") {
    if (op.includes("02-Mobile") || sub.includes("mobile")) return false
    if (op.includes("08-Social") || sub.includes("social") || sub.includes("bug bounty")) return false
    return true
  }

  // 01-Herramientas: solo N2-4ss3mbly y N1-r3d3s-4v4nz4d4s
  if (cat === "01-Herramientas") {
    if (op.includes("N2-4ss3mbly") || op.includes("N1-r3d3s-4v4nz4d4s")) return true
    return false
  }

  // 02-Web-y-Apps: solo 04-20-4p1-s3cur1ty (API)
  if (cat === "02-Web-y-Apps") {
    if (op.includes("4p1-s3cur1ty")) return true
    return false
  }

  // Imprescindibles: mantener siempre
  if (cat === "00-Fundamentos" || cat === "03-Sistemas" || cat === "04-Post-Explotacion" || cat === "06-Operaciones") return true

  // Resto de 05 (01 Cloud-Identity, 03 IA-Adversarial, 04 Vuln-Research, 05 Hardware-RF, 06 Industrial, 07 Defensive, 09 Cloud-Native): mantener 1 diagrama focal
  return true
}

// ── Export central: selector por categoría (dashboard) ──
export function DiagramForCategory({ categoryId, subCategory, id, originalPath }: { categoryId: string; subCategory?: string | null; id?: string; originalPath?: string }) {
  const probe = { category: categoryId, subCategory: subCategory ?? null, id: id ?? "", originalPath: originalPath ?? "" }
  if (!shouldShowDiagram(probe)) return null
  switch (categoryId) {
    case "00-Fundamentos": return <DiagramFundamentosLayers />
    case "01-Herramientas": return <DiagramHerramientasFlowchart />
    case "02-Web-y-Apps": return <DiagramWebSequence />
    case "03-Sistemas": return <DiagramSistemasStack />
    case "04-Post-Explotacion": return <DiagramPostLoop />
    case "05-Especializacion": return <DiagramEspecializacion subCategory={subCategory ?? null} />
    case "06-Operaciones": return <DiagramOperacionesGantt />
    case "99-Prompt-Injection": return <DiagramPromptInjectionFlow />
    default: return null
  }
}

// Para LessonView: diagrama contextual del tema de la lección
export function DiagramForLesson({ lesson }: { lesson: { category: string; subCategory: string | null; id?: string; originalPath?: string } }) {
  const probe = { category: lesson.category, subCategory: lesson.subCategory, id: (lesson as { id?: string }).id ?? "", originalPath: (lesson as { originalPath?: string }).originalPath ?? "" }
  if (!shouldShowDiagram(probe)) return null
  // 02 tiene dos variantes útiles; para la lección API usamos la arquitectura
  if (lesson.category === "02-Web-y-Apps") return <DiagramWebArchitecture />
  return <DiagramForCategory categoryId={lesson.category} subCategory={lesson.subCategory} id={probe.id} originalPath={probe.originalPath} />
}
