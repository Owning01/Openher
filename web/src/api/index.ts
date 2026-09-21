import { setHealthProbe } from "../shared/api/version"
import { healthApi } from "./health"
import { sessionsApi } from "./sessions"
import { messagesApi } from "./messages"
import { promptApi } from "./prompt"
import { providersApi } from "./providers"
import { configApi } from "./config"
import { fsApi } from "./fs"
import { mcpApi } from "./mcp"
import { questionsApi } from "./questions"
import { permissionsApi } from "./permissions"

export { toBase64, authHeader, baseUrl } from "../shared/api/client"
export type { ApiVersion } from "../shared/api/version"
export { resolveApiVersion, getApiVersion, rememberApiVersion, onApiVersionChange, apiPath, unwrapData, detectedVersionCache, detectionPromises, versionKey, versionListeners, ensureVersionDetected, setHealthProbe } from "../shared/api/version"
export type { ConfigProvidersResponse, AgentResponse, V2Session, V2Message } from "../shared/api/mappers"
export { mapProviderModels, toAgentOption, toModelBody, toCreateSessionModel, modelWireName, toSessionV1, toMessageEnvelopeV1 } from "../shared/api/mappers"
export { normalizeSlashes, toServerRelative, withDirectory, withLimit, withProject, withLocationDirectory, fetchFileBytes, arrayBufferToBase64, responseDetail, normalizeHeaders, serializedSize, requestWithHeaders, requestRaw, request } from "../shared/api/client"
export type { RequestOptions, ResponseWithHeaders } from "../shared/api/client"

export const api = {
  ...healthApi,
  ...sessionsApi,
  ...messagesApi,
  ...promptApi,
  ...providersApi,
  ...configApi,
  ...fsApi,
  ...mcpApi,
  ...questionsApi,
  ...permissionsApi,
}

// Wire health probe for version detection (evita ciclo client↔version)
setHealthProbe(api.health)
