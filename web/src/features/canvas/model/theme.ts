// Motor de color adaptado de m3e-canvas (MIT, lnkiai): una semilla genera el
// scheme Material 3 por tonos CIE L*. Sin el modelo CAM16 completo, de sobra
// para un mockup. Los 7 presets son sus valores publicados.

export type SchemeContrast = "standard" | "medium" | "high"
export type ShapeScale = "square" | "rounded" | "full"

export type CanvasTheme = {
  seed: string
  dark: boolean
  contrast: SchemeContrast
  shape: ShapeScale
}

export const DEFAULT_THEME: CanvasTheme = { seed: "#6750A4", dark: false, contrast: "standard", shape: "rounded" }

export type Scheme = {
  primary: string; onPrimary: string; primaryContainer: string; onPrimaryContainer: string; inversePrimary: string
  secondaryContainer: string; onSecondaryContainer: string; tertiaryContainer: string; onTertiaryContainer: string
  surface: string; surfaceLow: string; surfaceContainer: string; surfaceHigh: string; surfaceHighest: string
  onSurface: string; onVariant: string; outline: string; outlineVariant: string
  inverseSurface: string; inverseOnSurface: string; error: string; onError: string
}

type SchemeSeed = Omit<Scheme, "surfaceLow" | "surfaceContainer" | "surfaceHigh" | "surfaceHighest" | "onVariant" | "outlineVariant" | "inverseOnSurface"> & {
  surfaceContainerLow: string; surfaceContainer: string; surfaceContainerHigh: string; surfaceContainerHighest: string
  onSurfaceVariant: string; outlineVariant: string; inverseOnSurface: string
}

const ERROR = { error: "#B3261E", onError: "#FFFFFF", errorContainer: "#F9DEDC", onErrorContainer: "#410E0B" }

const PRESETS: Array<{ key: string; label: string; seed: string; light: SchemeSeed }> = [
  { key: "purple", label: "Violeta", seed: "#6750A4", light: {
    primary: "#6750A4", onPrimary: "#FFFFFF", primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D", inversePrimary: "#D0BCFF",
    secondaryContainer: "#E8DEF8", onSecondaryContainer: "#1D192B", tertiaryContainer: "#FFD8E4", onTertiaryContainer: "#31111D",
    surface: "#FEF7FF", surfaceContainerLow: "#F7F2FA", surfaceContainer: "#F3EDF7", surfaceContainerHigh: "#ECE6F0", surfaceContainerHighest: "#E6E0E9",
    onSurface: "#1D1B20", onSurfaceVariant: "#49454F", outline: "#79747E", outlineVariant: "#CAC4D0",
    inverseSurface: "#322F35", inverseOnSurface: "#F5EFF7", ...ERROR } },
  { key: "blue", label: "Azul", seed: "#0B57D0", light: {
    primary: "#0B57D0", onPrimary: "#FFFFFF", primaryContainer: "#D3E3FD", onPrimaryContainer: "#041E49", inversePrimary: "#A8C7FA",
    secondaryContainer: "#DCE2F9", onSecondaryContainer: "#131C2B", tertiaryContainer: "#FFD8EE", onTertiaryContainer: "#2E1125",
    surface: "#FAF9FD", surfaceContainerLow: "#F3F3FA", surfaceContainer: "#EEEDF3", surfaceContainerHigh: "#E9E8EF", surfaceContainerHighest: "#E3E2E6",
    onSurface: "#1B1B1F", onSurfaceVariant: "#44474E", outline: "#74777F", outlineVariant: "#C4C6D0",
    inverseSurface: "#303034", inverseOnSurface: "#F2F0F4", ...ERROR } },
  { key: "green", label: "Verde", seed: "#2E6A45", light: {
    primary: "#2E6A45", onPrimary: "#FFFFFF", primaryContainer: "#B0F1C2", onPrimaryContainer: "#00210F", inversePrimary: "#95D5A7",
    secondaryContainer: "#D3E8D8", onSecondaryContainer: "#102016", tertiaryContainer: "#C2E8FF", onTertiaryContainer: "#001E2C",
    surface: "#F6FBF4", surfaceContainerLow: "#F0F5EE", surfaceContainer: "#EAF0E8", surfaceContainerHigh: "#E4EAE2", surfaceContainerHighest: "#DEE4DC",
    onSurface: "#181D18", onSurfaceVariant: "#414941", outline: "#707972", outlineVariant: "#BFC9C0",
    inverseSurface: "#2D322D", inverseOnSurface: "#EEF2EB", ...ERROR } },
  { key: "coral", label: "Coral", seed: "#984061", light: {
    primary: "#984061", onPrimary: "#FFFFFF", primaryContainer: "#FFD9E2", onPrimaryContainer: "#3E001D", inversePrimary: "#FFB0C8",
    secondaryContainer: "#F6DDE4", onSecondaryContainer: "#31101D", tertiaryContainer: "#FFDBCA", onTertiaryContainer: "#2C1600",
    surface: "#FFF8F8", surfaceContainerLow: "#FCF0F2", surfaceContainer: "#F6EBED", surfaceContainerHigh: "#F3E5E9", surfaceContainerHighest: "#EEE0E3",
    onSurface: "#201A1B", onSurfaceVariant: "#524346", outline: "#847377", outlineVariant: "#D5C2C6",
    inverseSurface: "#352F30", inverseOnSurface: "#FAEEEF", ...ERROR } },
  { key: "amber", label: "Ambar", seed: "#8B5000", light: {
    primary: "#8B5000", onPrimary: "#FFFFFF", primaryContainer: "#FFDCC2", onPrimaryContainer: "#2C1600", inversePrimary: "#FFB77C",
    secondaryContainer: "#F6DFC8", onSecondaryContainer: "#271905", tertiaryContainer: "#D5EDC0", onTertiaryContainer: "#0E2004",
    surface: "#FFF8F5", surfaceContainerLow: "#FCF1EA", surfaceContainer: "#F7ECE4", surfaceContainerHigh: "#F3E6DE", surfaceContainerHighest: "#EDE0D8",
    onSurface: "#211A14", onSurfaceVariant: "#51443B", outline: "#83746A", outlineVariant: "#D6C3B6",
    inverseSurface: "#362F28", inverseOnSurface: "#FBEEE5", ...ERROR } },
  { key: "teal", label: "Petroleo", seed: "#00696E", light: {
    primary: "#00696E", onPrimary: "#FFFFFF", primaryContainer: "#9CF1F6", onPrimaryContainer: "#002022", inversePrimary: "#80D5DA",
    secondaryContainer: "#CCE8E9", onSecondaryContainer: "#051F20", tertiaryContainer: "#D2E4FF", onTertiaryContainer: "#001C3B",
    surface: "#F4FBFB", surfaceContainerLow: "#EEF5F5", surfaceContainer: "#E8EFEF", surfaceContainerHigh: "#E2EAEA", surfaceContainerHighest: "#DDE4E4",
    onSurface: "#161D1D", onSurfaceVariant: "#3F4948", outline: "#6F7979", outlineVariant: "#BEC8C8",
    inverseSurface: "#2B3232", inverseOnSurface: "#ECF2F2", ...ERROR } },
  { key: "mono", label: "Mono", seed: "#4A4459", light: {
    primary: "#4A4459", onPrimary: "#FFFFFF", primaryContainer: "#E6E0F0", onPrimaryContainer: "#1A1626", inversePrimary: "#CFC3E0",
    secondaryContainer: "#E6E1E6", onSecondaryContainer: "#1B1B1F", tertiaryContainer: "#E9E0EA", onTertiaryContainer: "#1E1A22",
    surface: "#FCF8FD", surfaceContainerLow: "#F5F1F6", surfaceContainer: "#EFEBF0", surfaceContainerHigh: "#E9E5EA", surfaceContainerHighest: "#E4E0E5",
    onSurface: "#1C1B1F", onSurfaceVariant: "#48454E", outline: "#79747E", outlineVariant: "#CAC4D0",
    inverseSurface: "#313033", inverseOnSurface: "#F4EFF4", ...ERROR } },
]

export function presetOf(seed: string): { key: string; label: string; seed: string; light: SchemeSeed } | null {
  const s = seed.trim().toUpperCase()
  return PRESETS.find((p) => p.seed.toUpperCase() === s) ?? null
}

export function presetList(): Array<{ key: string; label: string; seed: string }> {
  return PRESETS.map((p) => ({ key: p.key, label: p.label, seed: p.seed }))
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()
}

const lin = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const gam = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)
const WHITE = [0.95047, 1, 1.08883]
const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
const fInv = (t: number) => (t > 0.2069 ? t * t * t : (t - 16 / 116) / 7.787)

function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const R = lin(r), G = lin(g), B = lin(b)
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / WHITE[0]
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / WHITE[1]
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / WHITE[2]
  const fx = f(x), fy = f(y), fz = f(z)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

function labToRgb(L: number, a: number, b: number): [number, number, number] | null {
  const fy = (L + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200
  const x = fInv(fx) * WHITE[0]
  const y = fInv(fy) * WHITE[1]
  const z = fInv(fz) * WHITE[2]
  const R = x * 3.2406 + y * -1.5372 + z * -0.4986
  const G = x * -0.9689 + y * 1.8758 + z * 0.0415
  const B = x * 0.0557 + y * -0.204 + z * 1.057
  const out = [R, G, B].map(gam)
  if (out.some((v) => v < -0.002 || v > 1.002)) return null
  return out.map((v) => clamp01(v) * 255) as [number, number, number]
}

function toLch(r: number, g: number, b: number): { L: number; C: number; h: number } {
  const lab = rgbToLab(r, g, b)
  const C = Math.hypot(lab.a, lab.b)
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (h < 0) h += 360
  return { L: lab.L, C, h }
}

function tone(L: number, C: number, h: number): string {
  const rad = (h * Math.PI) / 180
  let c = C
  for (let i = 0; i < 40; i++) {
    const rgb = labToRgb(L, c * Math.cos(rad), c * Math.sin(rad))
    if (rgb) return rgbToHex(rgb[0], rgb[1], rgb[2])
    c *= 0.88
  }
  const rgb = labToRgb(L, 0, 0) ?? [128, 128, 128]
  return rgbToHex(rgb[0], rgb[1], rgb[2])
}

type ToneTable = Record<string, number>

const LIGHT_TONES: ToneTable = {
  primary: 40, onPrimary: 100, primaryContainer: 90, onPrimaryContainer: 10,
  secondaryContainer: 90, onSecondaryContainer: 10, tertiaryContainer: 90, onTertiaryContainer: 10,
  surface: 98, surfaceLow: 96, surfaceContainer: 94, surfaceHigh: 92, surfaceHighest: 90,
  onSurface: 10, onVariant: 30, outline: 50, outlineVariant: 80, inverseSurface: 20, inverseOnSurface: 95,
}
const DARK_TONES: ToneTable = {
  primary: 80, onPrimary: 20, primaryContainer: 30, onPrimaryContainer: 90,
  secondaryContainer: 30, onSecondaryContainer: 90, tertiaryContainer: 30, onTertiaryContainer: 90,
  surface: 6, surfaceLow: 10, surfaceContainer: 12, surfaceHigh: 17, surfaceHighest: 22,
  onSurface: 90, onVariant: 80, outline: 60, outlineVariant: 30, inverseSurface: 90, inverseOnSurface: 20,
}

function schemeFromSeed(seedHex: string, dark: boolean, keepChroma: boolean): Scheme {
  const rgb = hexToRgb(seedHex) ?? [103, 80, 164]
  const lch = toLch(rgb[0], rgb[1], rgb[2])
  const h = lch.h
  const primaryC = keepChroma ? Math.min(lch.C, 60) : Math.max(36, Math.min(lch.C, 60))
  const secondaryC = primaryC / 3
  const tertiaryH = (h + 60) % 360
  const tertiaryC = primaryC / 2
  const P = (L: number) => tone(L, primaryC, h)
  const S = (L: number) => tone(L, secondaryC, h)
  const T = (L: number) => tone(L, tertiaryC, tertiaryH)
  const N = (L: number) => tone(L, 3, h)
  const NV = (L: number) => tone(L, 7, h)
  const k = dark ? DARK_TONES : LIGHT_TONES
  return {
    primary: P(k.primary), onPrimary: P(k.onPrimary),
    primaryContainer: P(k.primaryContainer), onPrimaryContainer: P(k.onPrimaryContainer),
    inversePrimary: P(k.primary),
    secondaryContainer: S(k.secondaryContainer), onSecondaryContainer: S(k.onSecondaryContainer),
    tertiaryContainer: T(k.tertiaryContainer), onTertiaryContainer: T(k.onTertiaryContainer),
    surface: N(k.surface), surfaceLow: N(k.surfaceLow), surfaceContainer: N(k.surfaceContainer),
    surfaceHigh: N(k.surfaceHigh), surfaceHighest: N(k.surfaceHighest),
    onSurface: N(k.onSurface), onVariant: NV(k.onVariant),
    outline: NV(k.outline), outlineVariant: NV(k.outlineVariant),
    inverseSurface: N(k.inverseSurface), inverseOnSurface: N(k.inverseOnSurface),
    error: dark ? "#F2B8B5" : "#B3261E", onError: dark ? "#601410" : "#FFFFFF",
  }
}

function seedToScheme(s: SchemeSeed): Scheme {
  return {
    primary: s.primary, onPrimary: s.onPrimary,
    primaryContainer: s.primaryContainer, onPrimaryContainer: s.onPrimaryContainer,
    inversePrimary: s.inversePrimary,
    secondaryContainer: s.secondaryContainer, onSecondaryContainer: s.onSecondaryContainer,
    tertiaryContainer: s.tertiaryContainer, onTertiaryContainer: s.onTertiaryContainer,
    surface: s.surface, surfaceLow: s.surfaceContainerLow, surfaceContainer: s.surfaceContainer,
    surfaceHigh: s.surfaceContainerHigh, surfaceHighest: s.surfaceContainerHighest,
    onSurface: s.onSurface, onVariant: s.onSurfaceVariant,
    outline: s.outline, outlineVariant: s.outlineVariant,
    inverseSurface: s.inverseSurface, inverseOnSurface: s.inverseOnSurface,
    error: "#B3261E", onError: "#FFFFFF",
  }
}

/** Scheme resuelto: preset tal cual en claro/standard; resto generado de la semilla. */
export function resolveScheme(theme: CanvasTheme): Scheme {
  const t = normalizeTheme(theme)
  const preset = presetOf(t.seed)
  if (preset && !t.dark && t.contrast === "standard") return seedToScheme(preset.light)
  return schemeFromSeed(t.seed, t.dark, !!preset && preset.key !== "custom")
}

export function normalizeTheme(t: Partial<CanvasTheme> | undefined): CanvasTheme {
  return {
    seed: typeof t?.seed === "string" && hexToRgb(t.seed) ? t.seed.toUpperCase() : DEFAULT_THEME.seed,
    dark: t?.dark === true,
    contrast: t?.contrast === "medium" || t?.contrast === "high" ? t.contrast : "standard",
    shape: t?.shape === "square" || t?.shape === "full" ? t.shape : "rounded",
  }
}

/** Multiplicador de radios de la escala de esquinas. */
export function shapeFactor(shape: ShapeScale): number {
  return shape === "square" ? 0.35 : shape === "full" ? 1.6 : 1
}

export const isHexColor = (v: string) => /^#[0-9a-f]{6}$/i.test(v.trim())
