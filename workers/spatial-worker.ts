/// <reference lib="webworker" />
import * as turf from "@turf/turf"
import booleanIntersects from "@turf/boolean-intersects"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import booleanWithin from "@turf/boolean-within"
import polygonToLine from "@turf/polygon-to-line"
import type { FeatureCollection } from "geojson"
import { expose } from "comlink"
import rbush from "geojson-rbush"
import { normalizePolygonFeature, splitMultiPolygon } from "@/lib/geom-utils"

type Units = "meters" | "kilometers" | "miles"

function makeEmitter(progress?: (p: number) => void) {
  let last = -1
  return (p: number) => {
    const pct = Math.max(0, Math.min(100, Math.round(p)))
    if (pct === 100 || pct - last >= 2) {
      last = pct
      try {
        progress?.(pct)
      } catch {}
    }
  }
}

function fc(features: any[] = []): FeatureCollection {
  return { type: "FeatureCollection", features } as any
}

async function yieldEvery(i: number, step = 25) {
  if (i % step === 0) {
    await new Promise((r) => setTimeout(r, 0))
  }
}

async function buildMaskUnion(b: FeatureCollection) {
  let acc: any = null
  for (let i = 0; i < (b.features?.length || 0); i++) {
    const f = normalizePolygonFeature(b.features[i] as any)
    acc = acc ? (turf.union(acc, f as any) as any) : f
    await yieldEvery(i, 5)
  }
  return acc
}

const api = {
  async ping() {
    return "ok"
  },

  async buffer(a: FeatureCollection, distance: number, units: Units, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    const res = turf.buffer(a as any, distance, { units }) as any
    emit(100)
    return Array.isArray(res.features) ? res : fc([res])
  },

  async simplify(a: FeatureCollection, tolerance = 0.001, highQuality = false, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    const out = []
    for (let i = 0; i < a.features.length; i++) {
      out.push(turf.simplify(a.features[i] as any, { tolerance, highQuality, mutate: false }))
      emit((i / Math.max(1, a.features.length - 1)) * 100)
      await yieldEvery(i)
    }
    emit(100)
    return fc(out as any)
  },

  async pointInPolygon(points: FeatureCollection, mask: FeatureCollection, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    const out: any[] = []
    for (let i = 0; i < points.features.length; i++) {
      const f = points.features[i] as any
      if (booleanPointInPolygon(f as any, mask as any)) out.push(f)
      emit((i / Math.max(1, points.features.length - 1)) * 100)
      await yieldEvery(i)
    }
    emit(100)
    return fc(out)
  },

  async measure(a: FeatureCollection) {
    let lengthKm = 0
    let areaSqKm = 0
    a.features.forEach((f: any) => {
      if (f.geometry.type === "LineString") lengthKm += turf.length(f, { units: "kilometers" })
      if (f.geometry.type === "Polygon") areaSqKm += turf.area(f) / 1e6
    })
    return { lengthKm, areaSqKm }
  },

  async union(a: FeatureCollection, b: FeatureCollection, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    if (!a?.features?.length || !b?.features?.length) {
      emit(100)
      return fc([])
    }
    const polys = fc([...a.features, ...b.features].filter((f: any) => /Polygon/.test(f.geometry?.type)))
    if (!polys.features.length) {
      emit(100)
      return fc([])
    }
    let acc: any = polys.features[0]
    for (let i = 1; i < polys.features.length; i++) {
      try {
        acc = turf.union(acc, polys.features[i] as any)
      } catch {}
      emit((i / Math.max(1, polys.features.length - 1)) * 100)
    }
    emit(100)
    return fc(Array.isArray(acc.features) ? acc.features : [acc])
  },

  async intersection(a: FeatureCollection, b: FeatureCollection, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    if (!a?.features?.length || !b?.features?.length) {
      emit(100)
      return fc([])
    }
    const tree = rbush()
    tree.load(b as any)
    const out: any[] = []
    const total = a.features.length
    for (let i = 0; i < total; i++) {
      const fa: any = a.features[i]
      const cands = tree.search(fa as any) as any[]
      for (const fb of (cands.length ? cands : b.features) as any[]) {
        try {
          if (booleanIntersects(fa as any, fb as any)) {
            const inter = turf.intersect(fa as any, fb as any)
            if (inter) out.push(inter)
          }
        } catch {}
      }
      emit(((i + 1) / total) * 100)
      await yieldEvery(i)
    }
    emit(100)
    return fc(out)
  },

  async clip(a: FeatureCollection, b: FeatureCollection, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    if (!a?.features?.length || !b?.features?.length) {
      emit(100)
      return fc([])
    }

    const out: any[] = []
    const total = a.features.length
    let maskUnion: any = null
    try {
      maskUnion = await buildMaskUnion(b)
      if (maskUnion) maskUnion = normalizePolygonFeature(maskUnion)
    } catch {
      maskUnion = null
    }

    for (let i = 0; i < total; i++) {
      const faRaw: any = a.features[i]
      const faNorm = normalizePolygonFeature(faRaw)

      try {
        if (/Polygon/.test(faNorm.geometry.type)) {
          const parts = splitMultiPolygon(faNorm)
          for (const part of parts) {
            let inter: any = null
            if (maskUnion) {
              try {
                inter = turf.intersect(part as any, maskUnion as any)
              } catch {}
            }
            if (!inter) {
              for (const mRaw of b.features as any[]) {
                const m = normalizePolygonFeature(mRaw)
                try {
                  const piece = turf.intersect(part as any, m as any)
                  if (piece) {
                    inter = inter ? (turf.union(inter as any, piece as any) as any) : piece
                  }
                } catch {}
              }
            }
            if (!inter) {
              try {
                if (maskUnion && booleanWithin(part as any, maskUnion as any)) {
                  inter = part
                } else {
                  for (const mRaw of b.features as any[]) {
                    const m = normalizePolygonFeature(mRaw)
                    if (booleanWithin(part as any, m as any)) {
                      inter = part
                      break
                    }
                  }
                }
              } catch {}
            }
            if (inter) out.push(normalizePolygonFeature(inter))
          }
        } else if (/LineString/.test(faNorm.geometry.type)) {
          for (const mRaw of b.features as any[]) {
            const m = normalizePolygonFeature(mRaw)
            try {
              const split = turf.lineSplit(faNorm as any, m as any) as any
              ;(split?.features || []).forEach((seg: any) => {
                try {
                  if (turf.booleanWithin(seg as any, m as any)) out.push(seg)
                } catch {}
              })
            } catch {}
          }
        } else if (/Point/.test(faNorm.geometry.type)) {
          for (const mRaw of b.features as any[]) {
            const m = normalizePolygonFeature(mRaw)
            try {
              if (booleanPointInPolygon(faNorm as any, m as any)) {
                out.push(faNorm)
                break
              }
            } catch {}
          }
        }
      } catch {}
      emit(((i + 1) / total) * 100)
      await yieldEvery(i)
    }

    emit(100)
    return fc(out)
  },

  async difference(a: FeatureCollection, b: FeatureCollection, progress?: (p: number) => void) {
    const emit = makeEmitter(progress)
    if (!a?.features?.length) {
      emit(100)
      return fc([])
    }

    let mask: any = null
    try {
      mask = await buildMaskUnion(b)
      if (mask) mask = normalizePolygonFeature(mask)
    } catch {
      mask = null
    }

    const out: any[] = []
    const total = a.features.length

    for (let i = 0; i < total; i++) {
      const faRaw: any = a.features[i]
      const faNorm = normalizePolygonFeature(faRaw)

      try {
        if (/Polygon/.test(faNorm.geometry.type)) {
          let diff: any = null
          if (mask) {
            try {
              diff = turf.difference(faNorm as any, mask as any)
            } catch {}
          } else {
            diff = faNorm
          }
          if (!diff) {
            try {
              if (!mask || !booleanWithin(faNorm as any, mask as any)) diff = faNorm
            } catch {}
          }
          if (diff) {
            if (diff.type === "FeatureCollection") out.push(...(diff.features || []))
            else out.push(diff)
          }
        } else if (/LineString/.test(faNorm.geometry.type)) {
          if (!mask) {
            out.push(faNorm)
          } else {
            try {
              const boundary = polygonToLine(mask as any)
              const split = turf.lineSplit(faNorm as any, boundary as any) as any
              ;(split?.features || [faNorm]).forEach((seg: any) => {
                try {
                  if (!booleanWithin(seg as any, mask as any)) out.push(seg)
                } catch {
                  out.push(seg)
                }
              })
            } catch {
              out.push(faNorm)
            }
          }
        } else if (/Point/.test(faNorm.geometry.type)) {
          let inside = false
          if (mask) {
            try {
              inside = booleanPointInPolygon(faNorm as any, mask as any)
            } catch {}
          }
          if (!inside) out.push(faNorm)
        }
      } catch {}
      emit(((i + 1) / total) * 100)
      await yieldEvery(i, 5)
    }

    emit(100)
    return fc(out)
  },
}

export type SpatialAPI = typeof api

expose(api)
