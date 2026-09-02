import { lazyRetry } from "../../utils/lazyRetry"

export const LazyPCFilesPanel = lazyRetry(() => import("./PCFilesPanel").then((m) => ({ default: m.PCFilesPanel })))
