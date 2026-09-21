import type { CommandInfo, ServerConfig } from "../types"
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { pickV2 } from "./versionDispatch"

const listCommands = (config: ServerConfig) =>
  request<CommandInfo[]>(config, "/command")

const loadRawConfig = (config: ServerConfig, directory?: string) =>
  request<unknown>(config, withDirectory("/config", directory))

const saveRawConfig = (config: ServerConfig, rawBody: Record<string, unknown>, directory?: string) =>
  request<unknown>(config, withDirectory("/config", directory), {
    method: "PATCH",
    body: rawBody,
  })

const setModelVariant = (config: ServerConfig, providerID: string, modelID: string, variantName: string, options: Record<string, unknown>, directory?: string) =>
  request<unknown>(config, withDirectory("/config", directory), {
    method: "PATCH",
    body: {
      provider: {
        [providerID]: {
          models: {
            [modelID]: {
              variants: { [variantName]: options },
            },
          },
        },
      },
    },
  })

const listSkills = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<{ id: string; name: string; description?: string }[]>(config, "/skill"),
    () => request<{ id: string; name: string; description?: string }[]>(config, withLocationDirectory("/skill", directory)),
  )

export const configApi = {
  listCommands,
  loadRawConfig,
  saveRawConfig,
  setModelVariant,
  listSkills,
}
