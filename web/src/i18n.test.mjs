import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTranslator, languageOptions, normalizeLanguage, loadLanguage, getTranslations } from './i18n.ts'

// Los chunks por idioma se cargan bajo demanda: cargar antes de usar.
await loadLanguage('en')
await loadLanguage('es')
await loadLanguage('it')
await loadLanguage('zh-TW')

assert.equal(normalizeLanguage('es'), 'es')
assert.equal(normalizeLanguage('it'), 'it')
assert.equal(normalizeLanguage('zh-TW'), 'zh-TW')
assert.equal(normalizeLanguage('fr'), 'en')
assert.ok(languageOptions.some((language) => language.code === 'zh-TW'))
assert.ok(languageOptions.some((language) => language.code === 'es'))

const en = createTranslator('en')
const es = createTranslator('es')
const it = createTranslator('it')
const zh = createTranslator('zh-TW')

assert.equal(en('sessions.title'), 'Sessions')
assert.equal(es('sessions.title'), 'Sesiones')
assert.equal(it('sessions.title'), 'Sessioni')
assert.equal(zh('sessions.title'), '工作階段')

assert.equal(en('session.deleteTitle'), 'Delete session?')
assert.equal(es('session.deleteTitle'), '¿Eliminar sesión?')
assert.equal(it('session.deleteTitle'), 'Eliminare la sessione?')
assert.equal(zh('session.deleteTitle'), '刪除工作階段？')

// Unknown keys should remain visible during development instead of rendering blank UI.
assert.equal(en('missing.key'), 'missing.key')
assert.equal(en('detail.opencode'), 'OpenHer')
assert.equal(es('detail.changedFilesTitle'), 'Archivos modificados')
assert.equal(it('detail.changedFilesTitle'), 'File modificati')
assert.equal(zh('detail.changedFilesTitle'), '已變更檔案')
assert.equal(en('detail.linesAddedDeleted', { additions: 3, deletions: 1 }), '+3 lines · -1 lines')
assert.equal(es('detail.aheadBehind', { ahead: 1, behind: 2 }), '1 adelante · 2 atrás')
assert.equal(it('detail.aheadBehind', { ahead: 1, behind: 2 }), '1 avanti · 2 indietro')
assert.equal(zh('detail.fileStatusSource'), '來自 /file/status')
assert.equal(en('detail.fileStatusLabel'), 'Changed files')
assert.equal(es('detail.fileStatusLabel'), 'Archivos modificados')
assert.equal(it('detail.fileStatusLabel'), 'File modificati')
assert.equal(zh('detail.fileStatusLabel'), '已變更檔案')

assert.equal(en('settings.theme'), 'Theme')
assert.equal(es('settings.themeSystem'), 'Sistema')
assert.equal(it('settings.themeDark'), 'Scuro')
assert.equal(zh('settings.themeSystem'), '跟隨系統')
assert.equal(en('todo.title'), 'Todo Items')

// Toda clave literal t('...') usada en el código debe existir en en:
// si falta, la UI muestra la clave cruda (ej. detail.questionSkip).
{
  const root = join(dirname(fileURLToPath(import.meta.url)))
  const used = new Set()
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (!/\.(ts|tsx)$/.test(entry)) continue
      const src = readFileSync(full, 'utf8')
      for (const m of src.matchAll(/(?<![\w$.])t\(\s*['"]([A-Za-z0-9_.-]+)['"]/g)) used.add(m[1])
    }
  }
  walk(root)
  const enKeys = new Set(Object.keys(getTranslations('en')))
  const missing = [...used].filter((k) => !enKeys.has(k)).sort()
  assert.deepEqual(missing, [], `claves i18n usadas pero ausentes en en: ${missing.join(', ')}`)
}

// Q3 (F9): red de i18n ampliada. No purga claves: mide y reporta.
// - llamadas con traductor t()/tr()/translate() y plantillas `prefijo.${x}`
// - paridad es/en: toda clave de en debe existir en es (y no al revés)
// - reporte de claves sin uso (huérfanas reales)
// - it/zh-TW están incompletos: se reportan beta con el faltante medido
{
  const root = join(dirname(fileURLToPath(import.meta.url)))
  const dictFiles = new Set(['en.ts', 'es.ts', 'it.ts', 'zh.ts'])
  const calledKeys = new Set() // t('clave') / tr('clave') / translate('clave')
  const templatePrefixes = new Set() // t(`prefijo.${x}`)
  const anyLiteral = new Set() // 'clave' en cualquier lugar (uso data-driven: arrays, refs)
  const walkKeys = (dir, inI18n) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) { walkKeys(full, inI18n || entry === 'i18n'); continue }
      if (!/\.(ts|tsx)$/.test(entry)) continue
      if (inI18n && dictFiles.has(entry)) continue
      const src = readFileSync(full, 'utf8')
      for (const m of src.matchAll(/(?<![\w$.])(?:t|tr|translate)\(\s*['"]([A-Za-z0-9_.-]+)['"]/g)) calledKeys.add(m[1])
      for (const m of src.matchAll(/(?<![\w$.])(?:t|tr|translate)\(\s*`([^`]*?)\$\{/g)) {
        if (m[1]) templatePrefixes.add(m[1])
      }
      // El union `TranslationKey` de i18n.ts lista TODAS las claves: no es uso.
      if (entry === 'i18n.ts') continue
      for (const m of src.matchAll(/['"]([A-Za-z][A-Za-z0-9_.-]*)['"]/g)) anyLiteral.add(m[1])
    }
  }
  walkKeys(root, false)

  const enKeys = Object.keys(getTranslations('en'))
  const enSet = new Set(enKeys)
  const esKeys = Object.keys(getTranslations('es'))
  const esSet = new Set(esKeys)

  // Toda llamada al traductor (incluye tr/translate, que el scan viejo no veía) debe existir en en y en es.
  const calledMissingEn = [...calledKeys].filter((k) => !enSet.has(k)).sort()
  assert.deepEqual(calledMissingEn, [], `claves i18n llamadas pero ausentes en en: ${calledMissingEn.join(', ')}`)
  const calledMissingEs = [...calledKeys].filter((k) => enSet.has(k) && !esSet.has(k)).sort()
  assert.deepEqual(calledMissingEs, [], `claves i18n llamadas sin traducción es: ${calledMissingEs.join(', ')}`)

  // Cada plantilla t(`prefijo.${x}`) debe tener familia real en en.
  const emptyFamilies = [...templatePrefixes].filter((p) => !enKeys.some((k) => k.startsWith(p))).sort()
  assert.deepEqual(emptyFamilies, [], `plantillas i18n sin familia en en: ${emptyFamilies.join(', ')}`)

  // Paridad es/en completa.
  const missingEs = enKeys.filter((k) => !esSet.has(k)).sort()
  assert.deepEqual(missingEs, [], `es sin claves de en (${missingEs.length}): ${missingEs.slice(0, 20).join(', ')}`)
  const extraEs = esKeys.filter((k) => !enSet.has(k)).sort()
  assert.deepEqual(extraEs, [], `es con claves ausentes en en: ${extraEs.join(', ')}`)

  // Reporte de huérfanas (sin purgar): no llamada, no literal data-driven, no familia dinámica.
  const isDynamic = (k) => [...templatePrefixes].some((p) => k.startsWith(p))
  const unused = enKeys.filter((k) => !calledKeys.has(k) && !anyLiteral.has(k) && !isDynamic(k)).sort()
  const ns = new Map()
  for (const k of unused) ns.set(k.split('.')[0], (ns.get(k.split('.')[0]) ?? 0) + 1)
  const nsReport = [...ns.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}:${c}`).join(' ')
  console.log(`[i18n] en=${enKeys.length} es=${esKeys.length} (paridad es/en OK)`)
  console.log(`[i18n] familias dinamicas (${templatePrefixes.size}): ${[...templatePrefixes].sort().join(' ')}`)
  console.log(`[i18n] claves sin uso: ${unused.length}${nsReport ? ` -> ${nsReport}` : ''}`)

  // it/zh-TW incompletos: beta con faltante medido, sin fingir paridad.
  for (const [code, table] of [['it', getTranslations('it')], ['zh-TW', getTranslations('zh-TW')]]) {
    const count = Object.keys(table).length
    assert.ok(count > 0, `${code} no debe quedar vacío`)
    const extra = Object.keys(table).filter((k) => !enSet.has(k))
    assert.deepEqual(extra, [], `${code} tiene claves que no existen en en: ${extra.join(', ')}`)
    console.log(`[i18n] ${code}: ${count}/${enKeys.length} (beta, faltan ${enKeys.length - count})`)
  }
}

console.log('i18n tests passed')
