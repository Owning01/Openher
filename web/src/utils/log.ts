// log.ts - Unico lugar para errores y avisos. Usar esto en vez de console.log suelto.
const isDev = import.meta.env.DEV;

export const log = {
  info(...args: unknown[]): void {
    if (isDev) console.log("[app]", ...args);
  },
  err(...args: unknown[]): void {
    console.error("[app]", ...args);
  },
};
