import cleanCoords from "@turf/clean-coords"
import rewind from "@turf/rewind"

// Shared geometry helpers used by worker and fallback to avoid duplicated logic.

export function normalizePolygonFeature<T extends { geometry?: { type?: string } }>(f: T): T {
  let out: any = f
  try {
    out = cleanCoords(out as any, { mutate: false })
  } catch {}
  try {
    const t = out?.geometry?.type || ""
    if (/Polygon/i.test(t) || /MultiPolygon/i.test(t)) {
      out = rewind(out as any, { reverse: false })
    }
  } catch {}
  return out
}

export function splitMultiPolygon<T extends { geometry?: { type?: string; coordinates?: any } }>(f: T): any[] {
  if (f?.geometry?.type !== "MultiPolygon") return [f]
  const coords: any[] = (f as any).geometry.coordinates || []
  return coords.map((c) => ({
    type: "Feature",
    properties: (f as any).properties || {},
    geometry: { type: "Polygon", coordinates: c },
  }))
}
