// Central async loaders for non-React modules that were statically + dynamically imported.
// Single dynamic import point — consumers must import from here instead of `../shell` / `../goUsage` directly.
export const loadShell = () => import("../../shell")
export const loadGoUsage = () => import("../../goUsage")
export type { FsEntry, KanbanBoard, KanbanCard, ShellPanelKind, GitStatusSnapshot, GitChangedFile, GitPanelSnapshot, GitLogEntry, GitCommitFileChange, GitBranchEntry, ShellConfig } from "../../shell"
