import type { ServerConfig } from "../types"
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { pickV2 } from "./versionDispatch"

const listPermissions = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<{ requestID: string; permission: string; status: string; sessionID?: string }[]>(config, withDirectory("/permission", directory)),
    () =>
      request<unknown>(config, withLocationDirectory("/permission/request", directory)).then((raw) => {
        if (!Array.isArray(raw)) return []
        return raw.map((p) => {
          const item = p as { id: string; sessionID?: string; action: string }
          return { requestID: item.id, permission: item.action, status: "pending", sessionID: item.sessionID }
        })
      }),
  )

const permissionReply = (config: ServerConfig, requestID: string, approve: boolean, directory?: string, sessionID?: string) =>
  pickV2(
    config,
    () => request<boolean>(config, withDirectory(`/permission/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { approve },
      retryable: false,
    }),
    async () => {
      let sid = sessionID
      if (!sid) {
        try {
          const perms = await listPermissions(config, directory)
          const found = perms.find((p) => p.requestID === requestID)
          if (found?.sessionID) sid = found.sessionID
        } catch { /* ignore */ }
      }
      if (!sid) sid = "global"
      return request<boolean>(config, withDirectory(`/session/${encodeURIComponent(sid)}/permission/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { reply: approve ? "once" : "reject" },
        retryable: false,
      })
    },
  )

export const permissionsApi = {
  listPermissions,
  permissionReply,
}
