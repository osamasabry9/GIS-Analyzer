export type AppSettings = {
  mapboxToken: string
  defaultTheme: "system" | "light" | "dark"
  uploadMaxMb: number
}

const KEY = "gis-settings"

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { mapboxToken: "", defaultTheme: "system", uploadMaxMb: 50 }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { mapboxToken: "", defaultTheme: "system", uploadMaxMb: 50 }
    return JSON.parse(raw)
  } catch {
    return { mapboxToken: "", defaultTheme: "system", uploadMaxMb: 50 }
  }
}

export function saveSettings(s: AppSettings) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(s))
}
