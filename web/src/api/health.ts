import type { HealthResponse, ServerConfig } from "../types"
import { requestWithHeaders } from "../shared/api/client"
import { rememberApiVersion } from "../shared/api/version"

const health = async (config: ServerConfig): Promise<HealthResponse> => {
  const forced = config.apiVersion
  if (forced === "v1") {
    return (await requestWithHeaders<HealthResponse>(config, "/global/health", { rawPath: true })).data
  }
  if (forced === "v2") {
    const data = (await requestWithHeaders<HealthResponse>(config, "/api/health", { rawPath: true })).data
    rememberApiVersion(config, "v2")
    return data
  }
  // auto: v2 primero porque v2 devuelve 200 text/html en /global/health (fallback SPA) en vez de 404,
  // lo que rompería la detección si probamos v1 primero y el parser JSON lanza "Unexpected token '<'".
  try {
    const data = (await requestWithHeaders<HealthResponse>(config, "/api/health", { rawPath: true })).data
    rememberApiVersion(config, "v2")
    return data
  } catch (err) {
    if (!(err instanceof Error) || !/404|not found|Unexpected token|<!doctype|is not valid JSON/i.test(err.message)) throw err
    const data = (await requestWithHeaders<HealthResponse>(config, "/global/health", { rawPath: true })).data
    rememberApiVersion(config, "v1")
    return data
  }
}

export const healthApi = { health }
