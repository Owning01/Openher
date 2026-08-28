// Genera web/public/learning/manifest.json desde docs/raw del proyecto forense.
// Uso: node scripts/generate-learning-manifest.mjs [rutaDocsRaw]
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs"
import { join, relative, basename } from "node:path"

const DEFAULT_RAW = "G:/Proyectos/10)forense/docs/raw"
const RAW_DIR = process.argv[2] || DEFAULT_RAW
const OUT_DIR = join(process.cwd(), "public", "learning")
const DOCS_OUT = join(OUT_DIR, "docs")

if (!existsSync(RAW_DIR)) {
  console.error(`No existe ${RAW_DIR}`)
  process.exit(1)
}

/** Categorías con metadata pedagógica */
const CATEGORY_META = {
  "00-Fundamentos": { title: "Fundamentos", level: 0, description: "Bases absolutas: sistemas, redes, programación, criptografía." },
  "01-Herramientas": { title: "Herramientas", level: 1, description: "Dominio técnico: nmap, metasploit, python, assembly." },
  "02-Web-y-Apps": { title: "Web y Apps", level: 2, description: "Hacking web, APIs, credenciales, shells inversas." },
  "03-Sistemas": { title: "Sistemas", level: 2, description: "Linux/Windows internals, escalada de privilegios, kernel." },
  "04-Post-Explotacion": { title: "Post-Explotación", level: 3, description: "Persistencia, evasión EDR, movimiento lateral, dominio." },
  "05-Especializacion": { title: "Especialización", level: 3, description: "Ramas avanzadas por dominio (cloud, mobile, IA, hardware...)." },
  "06-Operaciones": { title: "Operaciones", level: 4, description: "Operación como equipo: purple team, infraestructura, reportes." },
  "07-Agentes-IA": { title: "Agentes IA", level: 2, description: "Hacking y defensa con agentes IA — sin escribir código, agentes especializados." },
  "99-Prompt-Injection": { title: "Prompt Injection", level: 4, description: "Técnicas de manipulación de LLMs — estudio defensivo." },
}

const SPECIALIZATION_META = {
  "01-Cloud-Identity": "Cloud & Identidad Híbrida",
  "02-Mobile": "Mobile Security",
  "03-IA-Adversarial": "IA Adversarial",
  "04-Vuln-Research": "Vulnerability Research",
  "05-Hardware-RF": "Hardware & RF",
  "06-Industrial": "Industrial / OT",
  "07-Defensive": "Defensivo & Forense",
  "08-Social-Web": "Social & Bug Bounty",
  "09-Cloud-Native": "Cloud Native & Web3",
}

/** Extrae título del primer heading # del markdown */
function extractTitle(content, fallback) {
  const m = content.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : fallback
}

/** Estima profundidad por longitud */
function estimateDepth(bytes) {
  if (bytes < 50_000) return "intro"
  if (bytes < 120_000) return "intermedio"
  return "avanzado"
}

/** Duración estimada en minutos (asumiendo ~200 palabras/min lectura técnica) */
function estimateMinutes(content) {
  const words = content.split(/\s+/).length
  return Math.max(10, Math.round(words / 180))
}

function scanMarkdown(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...scanMarkdown(full))
    } else if (entry.name.endsWith(".md")) {
      out.push(full)
    }
  }
  return out
}

console.log(`Escaneando ${RAW_DIR}...`)
const files = scanMarkdown(RAW_DIR)
console.log(`${files.length} archivos markdown encontrados.`)

mkdirSync(DOCS_OUT, { recursive: true })

// Agrupamos por categoría top-level
const grouped = new Map()
let copied = 0
for (const abs of files) {
  const rel = relative(RAW_DIR, abs).replace(/\\/g, "/")
  const parts = rel.split("/")
  // Ignorar assets
  if (parts.includes("assets")) continue

  const category = parts[0]
  const subCategory = parts.length > 2 ? parts[parts.length - 2] : null
  const fileName = basename(abs)

  // Genera nombre plano único para evitar conflictos
  const flatName = rel.replace(/\//g, "__")

  let content
  let stats
  try {
    content = readFileSync(abs, "utf8")
    stats = statSync(abs)
  } catch (err) {
    console.warn(`⚠ Skip (read error): ${rel} — ${err.code || err.message}`)
    continue
  }
  const meta = CATEGORY_META[category] || { title: category, level: 4, description: "" }
  let subMeta = null
  if (category === "05-Especializacion" && subCategory && SPECIALIZATION_META[subCategory]) {
    subMeta = SPECIALIZATION_META[subCategory]
  }

  const entry = {
    id: flatName.replace(/\.md$/, ""),
    file: `docs/${flatName}`,
    originalPath: rel,
    category,
    categoryTitle: meta.title,
    subCategory: subMeta,
    title: extractTitle(content, fileName.replace(/\.md$/, "").replace(/^\d+-/, "")),
    depth: estimateDepth(stats.size),
    minutes: estimateMinutes(content),
    bytes: stats.size,
  }

  if (!grouped.has(category)) grouped.set(category, [])
  grouped.get(category).push(entry)

  copyFileSync(abs, join(DOCS_OUT, flatName))
  copied++
}

// Orden dentro de cada categoría: por nombre de archivo original
for (const [, arr] of grouped) arr.sort((a, b) => a.originalPath.localeCompare(b.originalPath))

// Orden global de categorías
const order = ["00-Fundamentos", "01-Herramientas", "02-Web-y-Apps", "03-Sistemas", "04-Post-Explotacion", "05-Especializacion", "06-Operaciones", "07-Agentes-IA", "99-Prompt-Injection"]
const categories = order.filter((c) => grouped.has(c)).map((c) => ({
  id: c,
  ...CATEGORY_META[c],
  count: grouped.get(c).length,
  items: grouped.get(c),
}))

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  totalLessons: copied,
  categories,
}

writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2))
console.log(`✓ ${copied} lecciones copiadas a public/learning/docs/`)
console.log(`✓ manifest.json generado (${categories.length} categorías)`)
