import { describe, it, expect } from "vitest"
import * as turf from "@turf/turf"

describe("geo utils", () => {
  it("buffer produces polygons", () => {
    const pt = turf.point([0, 0])
    const out = turf.buffer(pt, 1, { units: "kilometers" })
    const g = Array.isArray((out as any).features) ? (out as any).features[0].geometry : (out as any).geometry
    expect(g.type).toMatch(/Polygon/i)
  })

  it("intersection returns empty when disjoint", () => {
    const a = turf.buffer(turf.point([0, 0]), 1)
    const b = turf.buffer(turf.point([10, 10]), 1)
    const inter = turf.intersect(a as any, b as any)
    expect(inter).toBeFalsy()
  })
})
