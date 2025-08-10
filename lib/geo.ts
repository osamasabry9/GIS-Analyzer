import type { Feature, FeatureCollection, Geometry } from "geojson"
import cleanCoords from "@turf/clean-coords"
import rewind from "@turf/rewind"

// Drop overly large string properties
export function sanitizeGeoJSON(fc: FeatureCollection) {
  fc.features.forEach((f) => {
    if (f.properties) {
      for (const k of Object.keys(f.properties)) {
        const v = (f.properties as any)[k]
        if (typeof v === "string" && v.length > 10_000) {
          delete (f.properties as any)[k]
        }
      }
    }
  })
  return fc
}

// Ensure polygons have correct winding and remove invalid/empty geometries
export function cleanFeatureCollection(input: FeatureCollection): FeatureCollection {
  const out: Feature[] = []
  for (const f of input.features as Feature[]) {
    if (!f || !f.geometry) continue
    const g = f.geometry as Geometry
    const hasCoords =
      Array.isArray((g as any).coordinates) &&
      (g as any).coordinates.length > 0 &&
      (g as any).coordinates.flat(3).length > 0
    if (!hasCoords) continue

    let fixed: Feature = { ...f }
    try {
      fixed = cleanCoords(fixed as any, { mutate: false }) as any
    } catch {}
    try {
      if (/Polygon/i.test(g.type) || /MultiPolygon/i.test(g.type)) {
        fixed = rewind(fixed as any, { reverse: false }) as any
      }
    } catch {}
    out.push(fixed)
  }
  return { type: "FeatureCollection", features: out } as FeatureCollection
}
