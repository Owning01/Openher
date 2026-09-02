import { lazyRetry } from "../../utils/lazyRetry"

export const LazyLearningPage = lazyRetry(() => import("./LearningPage").then((m) => ({ default: m.default })))
