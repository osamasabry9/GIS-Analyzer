"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useGIS } from "./gis-provider"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { gsap } from "gsap"

function collectTimeRange(layers: ReturnType<typeof useGIS>["state"]["layers"], results: any[]) {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  const scan = (fc: any) => {
    for (const f of fc?.features || []) {
      const ts = f?.properties?.timestamp
      if (typeof ts === "number" && Number.isFinite(ts)) {
        if (ts < min) min = ts
        if (ts > max) max = ts
      }
    }
  }
  ;[...layers, ...results].forEach((l) => scan(l.data))
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return { min, max }
}

export default function TimeSlider() {
  const { state, dispatch } = useGIS()
  const [playing, setPlaying] = useState(false)
  const [value, setValue] = useState<number | undefined>(state.timeFilter)
  const cardRef = useRef<HTMLDivElement>(null)

  const range = useMemo(
    () => collectTimeRange(state.layers, state.analysisResults),
    [state.layers, state.analysisResults],
  )

  useEffect(() => {
    // Fade-in overlay
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    setValue(state.timeFilter ?? range?.min)
  }, [state.timeFilter, range?.min])

  useEffect(() => {
    if (value !== undefined) {
      dispatch({ type: "SET_TIMEFILTER", time: value })
    }
  }, [value, dispatch])

  function tick() {
    if (!range) return
    setValue((prev) => {
      const next = typeof prev === "number" ? prev + Math.max(1, Math.floor((range.max - range.min) / 50)) : range.min
      return next > range.max ? range.min : next
    })
  }

  if (!range) {
    return null
  }

  const asDate = (ts?: number) => (ts ? new Date(ts).toISOString().slice(0, 10) : "—")

  return (
    <div
      ref={cardRef}
      className="absolute left-1/2 -translate-x-1/2 bottom-4 z-[6] rounded-xl border bg-background/80 backdrop-blur p-3 w-[min(92vw,680px)] shadow"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <Label className="text-xs">Time Filter</Label>
        <div className="text-[11px] text-muted-foreground">
          {asDate(range.min)} – {asDate(range.max)} | Current: {asDate(value)}
        </div>
      </div>
      <Slider
        value={[value ?? range.min]}
        min={range.min}
        max={range.max}
        step={24 * 60 * 60 * 1000}
        onValueChange={(v) => setValue(v[0])}
      />
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!playing) {
              setPlaying(true)
              const id = setInterval(tick, 600)
              const clear = () => {
                clearInterval(id)
                setPlaying(false)
                document.removeEventListener("visibilitychange", onVis)
              }
              const onVis = () => document.hidden && clear()
              document.addEventListener("visibilitychange", onVis)
              ;(window as any).__ts_cancel = clear
            } else {
              ;(window as any).__ts_cancel?.()
            }
          }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="ml-2">{playing ? "Pause" : "Play"}</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            dispatch({ type: "SET_TIMEFILTER", time: undefined })
            setValue(undefined)
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
