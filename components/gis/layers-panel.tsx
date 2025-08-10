"use client"

import { useGIS } from "./gis-provider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

export default function LayersPanel() {
  const { state, dispatch } = useGIS()
  const items = [...state.analysisResults, ...state.layers]

  return (
    <div className="rounded-xl border p-3 bg-background/60 backdrop-blur">
      <div className="text-xs text-muted-foreground mb-2">Layers</div>
      <div className="space-y-3">
        {items.length === 0 ? <p className="text-xs text-muted-foreground">No layers yet.</p> : null}
        {items.map((l) => (
          <div key={l.id} className="border rounded-md p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium truncate">{l.name}</div>
              <div className="flex items-center gap-2">
                <Label className="text-[11px]">Visible</Label>
                <Switch
                  checked={l.visible}
                  onCheckedChange={(v) => dispatch({ type: "UPDATE_LAYER", id: l.id, patch: { visible: v } })}
                />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-[11px]">Opacity</Label>
                <Slider
                  value={[Math.round((l.opacity ?? 1) * 100)]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(v) => dispatch({ type: "UPDATE_LAYER", id: l.id, patch: { opacity: v[0] / 100 } })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[11px]">Mode</Label>
                <Select
                  value={l.heatmap ? "heatmap" : l.clustered ? "cluster" : "normal"}
                  onValueChange={(mode) =>
                    dispatch({
                      type: "UPDATE_LAYER",
                      id: l.id,
                      patch: { heatmap: mode === "heatmap", clustered: mode === "cluster" },
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="heatmap">Heatmap</SelectItem>
                    <SelectItem value="cluster">Cluster</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
