import type { DiffFile, FileStatusEntry, MessageEnvelope, ProjectCurrent, ServerConfig, Session, VcsStatus } from "../types"
type TodoItem = any
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { resolveApiVersion } from "../shared/api/version"
import { toMessageEnvelopeV1, toSessionV1 } from "../shared/api/mappers"
import type { V2Message, V2Session } from "../shared/api/mappers"
import { getOpencodeClient } from "../shared/api/opencodeClient"
import { withTimeout } from "../shared/lib/async"
import { pickV2 } from "./versionDispatch"

// Variante del SDK que resolvió message.list por host (ver loadMessages):
// evita re-probar variantes fallidas en cada apertura de sesión.
const messageVariantCache = new Map<string, number>()

/** Paginación oficial de mensajes (SDK MessageListInput{limit,order,cursor}):
 *  el server techo `limit` en200 por página e IGNORA `offset`; el `previous`
 *  de las páginas desc viene vacío (upstream) y `order`+`cursor` juntos dan400
 *  (medido: el order viaja DENTRO del token, por eso solo va en la página1).
 *  La única ruta completa medida en vivo: página nueva (desc) + caminar
 *  `order=asc` con `cursor.next` hasta solaparse con la reciente. Si una
 *  variante no soporta cursor, la unión degrada a "recientes + los200 más
 *  viejos" (nunca peor que antes) y se AVISA por consola (historia parcial).
 *  Huecos posibles = degradación por diseño avisada, NO pérdida silenciosa:
 *  (i) variante sin cursor ⇒ recientes+200 viejos con hueco medio; (ii) >5200
 *  msgs ⇒ el corte de25 páginas o el presupuesto de tiempo deja el medio sin
 *  cubrir. `deep=false` = solo la página del caller (verify de entrega:
 *  carrera de5s, sin walk — allí el walk secuencial causaría prompt duplicado). */
const PAGE_SIZE = 200
const MAX_HISTORY_PAGES = 25
// Presupuesto del walk: el readTimeout nativo es180s POR PÁGINA y
// `loadingSessionsRef` bloquea re-loads de la sesión mientras dura el fetch;
// sin deadline,25 páginas lentas =45 min de sesión bloqueada (#challenger).
const WALK_BUDGET_MS = 8_000

type SdkPage = { envelopes: MessageEnvelope[]; next?: string }

/** Relleno de sessionID en info/parts (comparte la vía SDK y el fallback HTTP). */
function fillEnvelopeIds(list: MessageEnvelope[], sid: string): MessageEnvelope[] {
  return list.map((mm) => ({
    ...mm,
    info: { ...mm.info, sessionID: mm.info?.sessionID || sid },
    parts: Array.isArray(mm.parts)
      ? (mm.parts as MessageEnvelope["parts"]).map((p) => ({ ...p, sessionID: (p as { sessionID?: string }).sessionID ?? mm.info?.sessionID ?? sid }))
      : [],
  }))
}

async function walkOlderHistory(
  fetchPage: (cursor?: string) => Promise<SdkPage | null>,
  recentIds: Set<string>,
): Promise<MessageEnvelope[]> {
  const out: MessageEnvelope[] = []
  const seen = new Set(recentIds)
  const seenCursors = new Set<string>()
  let overlap = false
  const deadline = Date.now() + WALK_BUDGET_MS
  const drain = (page: MessageEnvelope[]) => {
    for (const m of page) {
      if (!m?.info?.id) continue
      if (seen.has(m.info.id)) {
        overlap = true
        continue
      }
      seen.add(m.info.id)
      out.push(m)
    }
  }
  const first = Date.now() < deadline ? await fetchPage(undefined) : null
  if (!first) {
    console.warn("[loadMessages] walk sin tiempo: historia solo reciente")
    return out
  }
  if (first.envelopes.length === 0) {
    console.warn("[loadMessages] walk vacío: historia solo reciente")
    return out
  }
  drain(first.envelopes)
  let cursor = first.next
  let rounds = 1
  while (!overlap && cursor && rounds < MAX_HISTORY_PAGES && Date.now() < deadline) {
    if (seenCursors.has(cursor)) break // ciclo A→B→A
    seenCursors.add(cursor)
    const page = await fetchPage(cursor)
    if (!page || page.envelopes.length === 0) break
    drain(page.envelopes)
    if (!page.next || seenCursors.has(page.next)) break
    cursor = page.next
    rounds++
  }
  if (!overlap) {
    // Pérdida silenciosa imposible de esconder: tope de rondas, presupuesto de
    // tiempo o cursor agotado sin alcanzar la página reciente.
    console.warn(`[loadMessages] historia parcial: ${out.length} mensajes viejos unidos a los recientes sin solape`)
  }
  return out
}

// Techo para la vía SDK (medido en vivo, bug "no carga mensajes"): el dedupe
// de useMessages (loadingSessionsRef) silencia SIN fetch toda sesión cuyo
// loadSelectedInner no asiente nunca; el SDK sin timeout podía colgarse y la
// sesión quedaba muerta hasta recargar. Con estos techos la carga siempre
// asiente -> el set se limpia en el finally -> la sesión se auto-sana.
const SDK_CLIENT_TIMEOUT_MS = 4000
const SDK_CALL_TIMEOUT_MS = 5000
// Sentinela de timeout de la vía SDK: withTimeout rechaza con este mensaje,
// tryCall lo propaga y el loop de variantes corta al fallback HTTP.
const SDK_TIMEOUT_MSG = "sdk-timeout"

const loadMessages = async (
  config: ServerConfig,
  sessionID: string,
  directory?: string,
  limit = 100,
  // deep=false: solo la página pedida (sin walk). El verify de entrega de
  // useMessageSend corre dentro de una carrera de5s: un walk secuencial ahí
  // → raced=null → delivered=false → outbox reenvía = prompt duplicado (critic).
  deep = true,
) => {
  // Con walk usamos página completa aunque el caller pase35 (INITIAL_PAGE_LIMIT
  // legacy); sin walk respetamos el limit del caller (techo server=200).
  const pageLimit = deep
    ? Math.min(Math.max(limit, PAGE_SIZE), PAGE_SIZE)
    : Math.min(Math.max(limit, 1), PAGE_SIZE)
  try {
    // getClient colgado -> sentinela -> catch externo -> fallback HTTP de abajo.
    const client = await withTimeout(getOpencodeClient(config), SDK_CLIENT_TIMEOUT_MS, SDK_TIMEOUT_MSG)
    // Probar múltiples variantes del client — el nombre exacto varía entre betas v2.
    // Caché por host de la variante que funcionó: la primera apertura prueba
    // en orden, las siguientes van directo (evita N llamadas fallidas por open).
    const variantKey = `${config.host}:${config.port}`
    const startAt = messageVariantCache.get(variantKey) ?? 0
    const tryCall = async (fn: unknown, args: unknown) => {
      if (typeof fn !== "function") return undefined
      try {
        return await withTimeout(Promise.resolve((fn as any)(args)), SDK_CALL_TIMEOUT_MS, SDK_TIMEOUT_MSG)
      } catch (e) {
        // Timeout = el entorno SDK está colgado (no es "nombre equivocado"):
        // se propaga como sentinela para cortar variantes y ir al fallback YA.
        if (e instanceof Error && e.message === SDK_TIMEOUT_MSG) return SDK_TIMEOUT_MSG
        return undefined
      }
    }
    // En v2, client.message.list({ sessionID }) consulta /api/session/:id/message (historial persistente real)
    // NUNCA consultar session.context primero: /context devuelve solo el prompt context activo para inferencia,
    // que tras un abort o entre turnos omite mensajes de usuario no completados o devuelve solo metadata sin texto.
    const variants = [
      (client as any).message?.list,
      (client as any).session?.messages,
      (client as any).session?.getMessages,
      (client as any).message?.listMessages,
      (client as any).session?.context,
    ]
    // Normaliza UNA respuesta del SDK a envelopes + cursor.next (si vino).
    const normalizeSdk = (body: unknown): SdkPage | null => {
      const rawList: unknown = Array.isArray(body) ? body : (body as { data?: unknown })?.data ?? body
      if (!Array.isArray(rawList)) return null
      // Sin Boolean() los items null generaban un "assistant fantasma" con id
      // aleatorio por cada fetch que lo tocaba (#challenger #9).
      const items = (rawList as unknown[]).filter(Boolean)
      const mapped = items.map((m: any) => {
        if (m && typeof m === "object" && "info" in m && "parts" in m) return m as MessageEnvelope
        // Sin id determinista no hay forma de deduplicar contra otras páginas
        // (el id aleatorio por fetch duplicaba el item): se descarta el junk.
        if (!m?.id) return null
        try {
          return toMessageEnvelopeV1(m as V2Message)
        } catch {
          // naive mapping for SessionMessageInfo (id real garantizado arriba)
          const text = m?.text ?? m?.content ?? ""
          return {
            info: {
              id: m.id,
              role: m?.type ?? "assistant",
              sessionID: m?.sessionID ?? sessionID,
              time: { created: m?.time?.created ?? Date.now() },
              agent: m?.agent,
              modelID: m?.model?.id,
              providerID: m?.model?.providerID,
            },
            parts: [{ id: `${m.id}_0`, sessionID, type: "text", text: typeof text === "string" ? text : "" }],
          } as MessageEnvelope
        }
      }).filter(Boolean) as MessageEnvelope[]
      const envelopes = fillEnvelopeIds(mapped, sessionID)
      const next = Array.isArray(body) ? undefined : (body as { cursor?: { next?: string } })?.cursor?.next
      return { envelopes, next }
    }
    //1) Página RECIENTE (desc implícito): garantiza lo último aunque la
    // paginación profunda falle — nunca quedarse sin los mensajes nuevos.
    let recentPage: SdkPage | null = null
    let hitIndex = -1
    for (let i = 0; i < variants.length && !recentPage; i++) {
      const idx = (startAt + i) % variants.length
      const res = await tryCall(variants[idx], { sessionID, limit: pageLimit })
      if (res === SDK_TIMEOUT_MSG) break // SDK colgado: no probar más variantes, al fallback
      const page = res ? normalizeSdk(res) : null
      if (page && page.envelopes.length > 0) {
        recentPage = page
        hitIndex = idx
      }
    }
    if (hitIndex >= 0) messageVariantCache.set(variantKey, hitIndex)
    if (recentPage) {
      // Fetch liviano pedido por el caller (verify de entrega, etc.): la página
      // reciente basta — el walk secuencial no puede entrar en su carrera de5s.
      if (!deep) return recentPage.envelopes
      //2) Historial profundo con la MISMA variante (oficial message.list si es
      // la que respondió). `order` SOLO va en la página1: mandarlo junto al
      // cursor da400 (medido) — el order viaja dentro del token del cursor.
      const chosen = variants[hitIndex]
      if (!chosen) return recentPage.envelopes
      const recentIds = new Set(recentPage.envelopes.map((m) => m?.info?.id).filter(Boolean) as string[])
      let older: MessageEnvelope[] = []
      try {
        older = await walkOlderHistory(async (cursor) => {
          const args: Record<string, unknown> = cursor
            ? { sessionID, limit: pageLimit, cursor }
            : { sessionID, limit: pageLimit, order: "asc" }
          const res = await tryCall(chosen, args)
          if (!res) return null
          try {
            return normalizeSdk(res)
          } catch {
            // Una página corrupta (p.ej. parts no-array) no debe tirar abajo la
            // página reciente ya garantizada (#challenger #5): se corta el walk.
            return null
          }
        }, recentIds)
      } catch {
        // Un throw dentro del walk no debe mandar la unión al fallback:
        // conservamos lo reciente ya garantizado (#critic MINOR1).
        console.warn("[loadMessages] walk falló: historia solo reciente")
      }
      // Orden irrelevante: useMessages re-ordena por time.created.
      return [...recentPage.envelopes, ...older]
    }
    // Variante devolvió vacío/no-array → HTTP fallback de abajo.
  } catch {}
  // HTTP fallback: probar v1 path primero, luego v2 alternativo si 404
  // (sin walk: dialecto incierto; la paginación vive en la vía SDK de arriba).
  let raw: MessageEnvelope[] | V2Message[] | null = null
  try {
    raw = await request<MessageEnvelope[] | V2Message[]>(config, withDirectory(`/session/${sessionID}/message?limit=${pageLimit}`, directory), {
      readTimeout: 12_000,
    })
  } catch (e) {
    const msg = String((e as Error).message || "")
    if (/404|not found/i.test(msg)) {
      try {
        raw = await request<MessageEnvelope[] | V2Message[]>(config, withLocationDirectory(`/session/${sessionID}/message?limit=${pageLimit}`, directory), {
          readTimeout: 12_000,
        })
      } catch {}
    }
    if (!raw) throw e
  }
  const list = resolveApiVersion(config) === "v2" ? (raw as V2Message[]).map(toMessageEnvelopeV1) : (raw as MessageEnvelope[])
  return fillEnvelopeIds((list ?? []) as MessageEnvelope[], sessionID)
}

const loadTodo = (config: ServerConfig, sessionID: string, directory?: string) =>
  pickV2(
    config,
    () => request<TodoItem[]>(config, withDirectory(`/session/${sessionID}/todo`, directory)),
    () => [] as TodoItem[],
  )

const loadDiff = (config: ServerConfig, sessionID: string, directory?: string) =>
  pickV2(
    config,
    () => request<DiffFile[]>(config, withDirectory(`/session/${sessionID}/diff`, directory)),
    async () => {
      // mode es OBLIGATORIO en el spec (medido: sin él -> 400 Missing key ["mode"]).
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/diff?mode=working", directory))
      if (!Array.isArray(raw)) return []
      return raw.map((d) => {
        const item = d as { file?: string; additions?: number; deletions?: number }
        return { file: item.file ?? "", additions: item.additions ?? 0, deletions: item.deletions ?? 0 }
      })
    },
  )

// v2 no tiene /project/current (medido: 404); el equivalente es /location
// (directory + project.canonical) que alimenta el dashboard con los mismos
// campos que consumen extractPath/extractName.
const loadProjectCurrent = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<ProjectCurrent>(config, withDirectory("/project/current", directory)),
    async () => {
      const loc = await request<{ directory?: string; project?: { directory?: string; canonical?: string } }>(
        config,
        withLocationDirectory("/location", directory),
      )
      const dir = loc.directory ?? loc.project?.directory ?? ""
      const root = loc.project?.canonical ?? dir
      return { directory: dir, path: dir, root } satisfies ProjectCurrent
    },
  )

const loadVcs = (config: ServerConfig, directory?: string) =>
  request<VcsStatus>(config, withDirectory("/vcs", directory))

const loadFileStatus = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<FileStatusEntry[] | Record<string, FileStatusEntry>>(config, withDirectory("/file/status", directory)),
    async () => {
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/status", directory))
      return (Array.isArray(raw) ? raw : []) as FileStatusEntry[]
    },
  )

const revert = (config: ServerConfig, sessionID: string, messageID: string, directory?: string) =>
  pickV2(
    config,
    () => request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
      method: "POST",
      body: { messageID },
      retryable: false,
    }),
    async () => {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.revert.stage({ sessionID, messageID })
      try {
        return toSessionV1(res as V2Session)
      } catch {
        return res as unknown as Session
      }
    },
  )

const unrevert = (config: ServerConfig, sessionID: string, directory?: string) =>
  pickV2(
    config,
    () => request<Session>(config, withDirectory(`/session/${sessionID}/unrevert`, directory), {
      method: "POST",
      body: {},
      retryable: false,
    }),
    async () => {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.revert.clear({ sessionID })
      try {
        return toSessionV1(res as V2Session)
      } catch {
        return res as unknown as Session
      }
    },
  )

const summarize = (config: ServerConfig, sessionID: string, providerID: string, modelID: string, directory?: string, auto = false, readTimeout = 300_000) =>
  pickV2(
    config,
    () => request<boolean>(config, withDirectory(`/session/${sessionID}/summarize`, directory), {
      method: "POST",
      body: { providerID, modelID, auto },
      readTimeout,
      retryable: false,
    }),
    async () => {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.compact({ sessionID })
      return (res ?? true) as boolean
    },
  )

// v2 no expone el diff crudo de un archivo (medido: /vcs/diff/raw -> 404 y el
// spec solo trae GET /vcs/diff, cuya respuesta FileDiff.Info SÍ incluye el
// `patch` por archivo): se pide el diff del working tree y se extrae el archivo.
const fetchDiffContent = (config: ServerConfig, sessionID: string, file: string, directory?: string) =>
  pickV2(
    config,
    () => request<{ content: string }>(config, withDirectory(`/session/${sessionID}/diff/${encodeURIComponent(file)}`, directory)),
    async () => {
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/diff?mode=working", directory)).catch(() => null)
      const list = Array.isArray(raw) ? (raw as Array<{ file?: string; patch?: string }>) : []
      const entry = list.find((d) => d.file === file)
      return { content: entry?.patch ?? "" }
    },
  )

export const messagesApi = {
  loadMessages,
  loadTodo,
  loadDiff,
  loadProjectCurrent,
  loadVcs,
  loadFileStatus,
  revert,
  unrevert,
  summarize,
  fetchDiffContent,
}
