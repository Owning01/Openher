// Resuelve los @import de styles.css en orden (cascada) para los tests que
// verifican reglas CSS sin pasar por el bundler de Vite.
import { readFileSync } from 'node:fs'

const indexURL = new URL('./styles.css', import.meta.url)

export function cssBundle() {
  const index = readFileSync(indexURL, 'utf8')
  return index.replace(/@import\s+"([^"]+)";/g, (_, path) => {
    if (!path.startsWith('.')) return ''
    return readFileSync(new URL(path, indexURL), 'utf8')
  })
}
