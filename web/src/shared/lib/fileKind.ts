// Clasificación de archivos por extensión, compartida por toda la app.
// Un solo lugar decide qué se ejecuta como script/programa (antes duplicado
// entre PCFilesPanel y FileBrowser).

export function isExecScript(path?: string | null): boolean {
  if (!path) return false
  const v = path.toLowerCase()
  return (
    v.endsWith(".bat") ||
    v.endsWith(".cmd") ||
    v.endsWith(".vbs") ||
    v.endsWith(".ps1") ||
    v.endsWith(".exe") ||
    v.endsWith(".sh")
  )
}
