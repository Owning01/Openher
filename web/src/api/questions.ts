import type { Question, QuestionOption, ServerConfig } from "../types"
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { getApiVersion } from "../shared/api/version"
import { recordQuestionSettled } from "../utils/questionStore"
import { errorStatus } from "../shared/errors/errorShape"
import { pickV2 } from "./versionDispatch"

// ---------------------------------------------------------------------------
// Formularios de pregunta (server v2)
// Contrato real: GET /form/request → Form.Info[] con id "frm_*",
// metadata.tool {messageID,id:<toolCallID>} y fields[{key,title,description}].
// El callID del tool NO es el formID: hay que resolverlo por metadata.tool.id.
// ---------------------------------------------------------------------------
type RawFormField = {
  key?: string
  title?: string
  description?: string
  type?: string
  options?: unknown
  custom?: boolean
}
type RawFormInfo = {
  id?: string
  sessionID?: string
  title?: string
  questions?: unknown
  metadata?: { kind?: string; tool?: { messageID?: string; id?: string; callID?: string } }
  tool?: { messageID?: string; id?: string; callID?: string }
  fields?: RawFormField[]
}
type ResolvedQuestionForm = {
  formID: string
  sessionID?: string
  fields?: RawFormField[]
  callID?: string
}

async function fetchQuestionForms(config: ServerConfig, directory?: string): Promise<RawFormInfo[]> {
  const raw = await request<unknown>(config, withLocationDirectory("/form/request", directory))
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
      ? ((raw as { data: unknown[] }).data)
      : []
  return items as RawFormInfo[]
}

function formToolCallID(form: RawFormInfo): string | undefined {
  const tool = form.metadata?.tool ?? form.tool
  return tool?.id ?? tool?.callID
}

function isFormID(id?: string): boolean {
  return typeof id === "string" && id.startsWith("frm_")
}

/**
 * Resuelve el formID real para un requestID que puede ser un callID de tool
 * (QuestionPrompt inline pasa el callID) o ya un formID (prompt flotante).
 * Devuelve también el callID para marcar settled ambas claves y que tanto el
 * prompt inline como el flotante se enteren del cierre.
 */
async function resolveQuestionForm(
  config: ServerConfig,
  requestID: string,
  directory?: string,
  sessionID?: string,
): Promise<ResolvedQuestionForm | null> {
  try {
    const forms = await fetchQuestionForms(config, directory)
    const match = forms.find((f) => f.id === requestID || formToolCallID(f) === requestID)
    if (match?.id) {
      return {
        formID: match.id,
        sessionID: match.sessionID ?? sessionID,
        fields: Array.isArray(match.fields) ? match.fields : undefined,
        callID: formToolCallID(match),
      }
    }
  } catch (err) {
    // Sin listado no se puede resolver un callID; un frm_ directo aún sirve.
    if (!isFormID(requestID)) throw err
  }
  return isFormID(requestID) ? { formID: requestID, sessionID } : null
}

function buildQuestionAnswer(arr: string[][], fields?: RawFormField[]): Record<string, unknown> {
  const answer: Record<string, unknown> = {}
  if (fields && fields.length > 0) {
    fields.forEach((f, i) => {
      const ans = arr[i] ?? []
      const key = f.key ?? String(i)
      answer[key] = f.type === "multiselect" ? ans : ans.length > 0 ? (ans.length === 1 ? ans[0] : ans) : ""
    })
    return answer
  }
  arr.forEach((ans, i) => {
    answer[String(i)] = ans.length === 1 ? ans[0] : ans
  })
  return answer
}

async function fetchFormFields(
  config: ServerConfig,
  sessionID: string,
  formID: string,
  directory?: string,
): Promise<RawFormField[] | undefined> {
  try {
    const form = await request<{ fields?: RawFormField[] }>(
      config,
      withLocationDirectory(`/session/${encodeURIComponent(sessionID)}/form/${encodeURIComponent(formID)}`, directory),
    )
    if (Array.isArray(form?.fields)) return form.fields
  } catch { /* sigue el fallback global */ }
  if (sessionID !== "global") {
    try {
      const form = await request<{ fields?: RawFormField[] }>(
        config,
        withLocationDirectory(`/session/global/form/${encodeURIComponent(formID)}`, directory),
      )
      if (Array.isArray(form?.fields)) return form.fields
    } catch { /* ignore */ }
  }
  return undefined
}

/** Marca settled el requestID, el formID y el callID conocidos. */
function settleQuestion(
  target: ResolvedQuestionForm | null,
  requestID: string,
  status: "answered" | "rejected",
  answers?: string[][] | Record<string, unknown>,
): void {
  const ids = new Set<string>([requestID, target?.formID, target?.callID].filter((x): x is string => !!x))
  for (const id of ids) recordQuestionSettled(id, status, answers)
}

/** 404/409: el form ya no existe (respondido/cancelado) → cierre local válido. */
function isResolvedFormError(error: unknown): boolean {
  const status = errorStatus(error)
  return status === 404 || status === 409
}

const questionReply = async (
  config: ServerConfig,
  requestID: string,
  answers: string[][] | Record<string, unknown>,
  directory?: string,
  sessionID?: string,
) => {
  const version = await getApiVersion(config)
  if (version === "v2") {
    let form: ResolvedQuestionForm | null = null
    try {
      form = await resolveQuestionForm(config, requestID, directory, sessionID)
    } catch (err) {
      // Server v2 sin /form/request (híbrido viejo): probar endpoint legacy.
      if (!isResolvedFormError(err)) throw err
      form = null
    }

    if (form) {
      const sid = form.sessionID ?? sessionID ?? "global"
      let answerRecord: Record<string, unknown>
      if (!Array.isArray(answers) && typeof answers === "object" && answers !== null) {
        answerRecord = answers as Record<string, unknown>
      } else {
        const arr = Array.isArray(answers) ? answers : []
        const fields = form.fields && form.fields.length > 0
          ? form.fields
          : await fetchFormFields(config, sid, form.formID, directory)
        answerRecord = buildQuestionAnswer(arr, fields)
      }
      try {
        const res = await request<boolean>(
          config,
          withLocationDirectory(`/session/${encodeURIComponent(sid)}/form/${encodeURIComponent(form.formID)}/reply`, directory),
          {
            method: "POST",
            body: { answer: answerRecord },
            retryable: false,
          },
        )
        settleQuestion(form, requestID, "answered", answers)
        return res
      } catch (err) {
        if (isResolvedFormError(err)) {
          settleQuestion(form, requestID, "answered", answers)
          return true
        }
        // 400 (p. ej. Unknown form field): propaga el detalle para feedback.
        throw err
      }
    }

    // Sin form resoluble: compat con endpoint de sesión del shape viejo.
    const sid = sessionID ?? "global"
    try {
      const res = await request<boolean>(
        config,
        withDirectory(`/session/${encodeURIComponent(sid)}/question/${encodeURIComponent(requestID)}/reply`, directory),
        {
          method: "POST",
          body: { answers: Array.isArray(answers) ? answers : [] },
          retryable: false,
        },
      )
      settleQuestion(null, requestID, "answered", answers)
      return res
    } catch (err) {
      if (!isResolvedFormError(err) && !/404|not found/i.test(String(err))) throw err
      // La pregunta ya no existe: cerrar localmente en vez de botón muerto.
      settleQuestion(null, requestID, "answered", answers)
      return true
    }
  }

  // v1: endpoint global existente.
  const res = await request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reply`, directory), {
    method: "POST",
    body: { answers: Array.isArray(answers) ? answers : [] },
    retryable: false,
  })
  settleQuestion(null, requestID, "answered", answers)
  return res
}

const questionReject = async (config: ServerConfig, requestID: string, directory?: string, sessionID?: string) => {
  const version = await getApiVersion(config)
  if (version === "v2") {
    let form: ResolvedQuestionForm | null = null
    try {
      form = await resolveQuestionForm(config, requestID, directory, sessionID)
    } catch (err) {
      if (!isResolvedFormError(err)) throw err
      form = null
    }

    if (form) {
      const sid = form.sessionID ?? sessionID ?? "global"
      try {
        const res = await request<boolean>(
          config,
          withLocationDirectory(`/session/${encodeURIComponent(sid)}/form/${encodeURIComponent(form.formID)}/cancel`, directory),
          {
            method: "POST",
            body: {},
            retryable: false,
          },
        )
        settleQuestion(form, requestID, "rejected")
        return res
      } catch (err) {
        if (isResolvedFormError(err)) {
          settleQuestion(form, requestID, "rejected")
          return true
        }
        throw err
      }
    }

    const sid = sessionID ?? "global"
    try {
      const res = await request<boolean>(
        config,
        withDirectory(`/session/${encodeURIComponent(sid)}/question/${encodeURIComponent(requestID)}/reject`, directory),
        {
          method: "POST",
          body: {},
          retryable: false,
        },
      )
      settleQuestion(null, requestID, "rejected")
      return res
    } catch (err) {
      if (!isResolvedFormError(err) && !/404|not found/i.test(String(err))) throw err
      settleQuestion(null, requestID, "rejected")
      return true
    }
  }

  // v1: endpoint global existente.
  const res = await request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reject`, directory), {
    method: "POST",
    body: {},
    retryable: false,
  })
  settleQuestion(null, requestID, "rejected")
  return res
}

const listPendingQuestions = (config: ServerConfig, directory?: string): Promise<Question[]> =>
  pickV2(
    config,
    () =>
      request<unknown>(config, withDirectory("/question", directory)).then((raw) => {
        if (!Array.isArray(raw)) return []
        return raw.map((q) => {
          const item = q as {
            id: string
            question?: string
            status?: string
            sessionID?: string
            questions?: unknown[]
            tool?: { messageID: string; callID: string }
          }
          if (Array.isArray(item.questions)) {
            return {
              id: item.id,
              sessionID: item.sessionID,
              questions: item.questions as { question: string; header?: string; options: QuestionOption[]; multiple?: boolean; custom?: boolean }[],
              tool: item.tool,
            }
          }
          return {
            id: item.id,
            question: item.question,
            status: item.status,
            questions: item.question ? [{ question: item.question, header: "", options: [] }] : [],
          }
        })
      }),
    async () => {
      try {
        return (await fetchQuestionForms(config, directory)).map((q) => {
          const tool = q.metadata?.tool ?? q.tool
          let questions: { question: string; header?: string; options: QuestionOption[]; multiple?: boolean; custom?: boolean; key?: string }[] = []
          if (Array.isArray(q.questions)) {
            questions = q.questions as typeof questions
          } else if (Array.isArray(q.fields)) {
            questions = q.fields.map((f) => ({
              // Contrato real: description = pregunta completa, title = header corto.
              question: f.description || f.title || f.key || "",
              header: f.title || f.key || "",
              options: Array.isArray(f.options)
                ? f.options.map((opt: any) => ({
                    label: opt.label || opt.value || "",
                    description: opt.description,
                  }))
                : [],
              multiple: f.type === "multiselect",
              custom: f.custom !== false,
              key: f.key,
            }))
          }
          return {
            id: q.id ?? "",
            sessionID: q.sessionID,
            questions,
            tool: tool
              ? { messageID: tool.messageID ?? "", callID: tool.id ?? tool.callID ?? "" }
              : undefined,
          }
        })
      } catch {
        return []
      }
    },
  )

export const questionsApi = {
  questionReply,
  questionReject,
  listPendingQuestions,
}
