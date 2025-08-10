"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { useGIS } from "./gis-provider"
import { Input } from "@/components/ui/input"
import shp from "shpjs"
import type { FeatureCollection, Feature } from "geojson"
import { nanoid } from "nanoid"
import { Upload, FileJson, FileArchive } from "lucide-react"
import { gsap } from "gsap"
import * as turf from "@turf/turf"
import { loadSettings } from "@/lib/settings"
import { cleanFeatureCollection, sanitizeGeoJSON } from "@/lib/geo"

function ensureTimestamps(fc: FeatureCollection, prop = "date") {
  for (const f of fc.features as Feature[]) {
    const p: any = f.properties || {}
    if (p.timestamp == null && p[prop]) {
      const t = Date.parse(p[prop])
      if (Number.isFinite(t)) {
        p.timestamp = t
        f.properties = p
      }
    }
  }
}

export default function UploadPanel() {
  const { dispatch } = useGIS()
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progBar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => gsap.from(".upload-card", { y: 16, opacity: 0, duration: 0.4, ease: "power2.out" }))
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = progBar.current
    if (!el) return
    gsap.to(el, { width: `${progress}%`, duration: 0.25, ease: "power1.out" })
  }, [progress])

  const toFeatureCollection = (g: any): FeatureCollection => {
    if (!g) throw new Error("Empty data")
    if (g.type === "FeatureCollection") return g as FeatureCollection
    if (g.type && (g.type === "Feature" || g.geometry)) return turf.featureCollection([g as any]) as any
    if (typeof g === "object") {
      const feats: any[] = []
      Object.values(g).forEach((v: any) => {
        if (v?.type === "FeatureCollection") feats.push(...(v.features || []))
      })
      if (feats.length) return turf.featureCollection(feats) as any
    }
    throw new Error("Unsupported GeoJSON structure")
  }

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const settings = loadSettings()
      setProgress(5)
      for (const file of Array.from(files)) {
        if (settings.uploadMaxMb > 0 && file.size > settings.uploadMaxMb * 1024 * 1024) {
          alert(`File ${file.name} exceeds limit of ${settings.uploadMaxMb} MB`)
          continue
        }
        try {
          let fc: FeatureCollection | null = null
          if (file.name.toLowerCase().endsWith(".geojson") || file.name.toLowerCase().endsWith(".json")) {
            const text = await file.text()
            const raw = JSON.parse(text)
            fc = toFeatureCollection(raw)
          } else if (file.name.toLowerCase().endsWith(".zip")) {
            const buf = await file.arrayBuffer()
            const raw = await shp(buf)
            fc = toFeatureCollection(raw)
          } else {
            alert(`Unsupported file: ${file.name}`)
            continue
          }
          if (!fc || !fc.features) throw new Error("Invalid GeoJSON")

          // Clean + sanitize incoming data to stabilize Turf ops
          fc = cleanFeatureCollection(fc)
          fc = sanitizeGeoJSON(fc)

          // Enrich with timestamp property for time filtering
          ensureTimestamps(fc)

          const layerId = `layer-${nanoid(6)}`
          dispatch({
            type: "ADD_LAYER",
            layer: {
              id: layerId,
              name: file.name,
              data: fc,
              visible: true,
              opacity: 1,
              clustered: false,
              heatmap: false,
              timeProperty: "timestamp",
            },
          })

          // Fit to uploaded data
          try {
            const b = turf.bbox(fc) as [number, number, number, number]
            document.dispatchEvent(new CustomEvent("gis:fit", { detail: { bbox: b } }))
          } catch {}
        } catch (e: any) {
          console.error(e)
          alert(`Failed to parse ${file.name}: ${e?.message || e}`)
        } finally {
          setProgress((p) => Math.min(100, p + Math.max(15, Math.round(90 / files.length))))
          setTimeout(() => setProgress(0), 800)
        }
      }
    },
    [dispatch],
  )

  return (
    <div className="upload-card rounded-xl border p-3 bg-background/60 backdrop-blur">
      <div className="text-xs text-muted-foreground mb-2">Upload Data</div>
      <div className="relative mb-2 h-1 bg-muted rounded overflow-hidden">
        <div ref={progBar} className="h-full w-0 bg-emerald-400"></div>
      </div>
      <div
        className={
          "group flex items-center justify-center border-2 border-dashed rounded-lg p-6 text-center transition " +
          (dragOver ? "border-emerald-500 bg-emerald-500/5" : "border-muted hover:bg-muted/30")
        }
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          onFiles(e.dataTransfer.files)
        }}
      >
        <div>
          <Upload className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
          <p className="text-sm">Drag & drop GeoJSON or zipped Shapefile</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1">
              <FileJson className="h-3 w-3" /> .geojson
            </span>
            <span className="inline-flex items-center gap-1">
              <FileArchive className="h-3 w-3" /> .zip
            </span>
          </p>
          <div className="mt-3">
            <Input ref={fileInputRef} type="file" multiple onChange={(e) => onFiles(e.target.files)} />
          </div>
        </div>
      </div>
    </div>
  )
}
