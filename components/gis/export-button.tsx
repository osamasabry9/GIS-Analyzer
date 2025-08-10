"use client"

import { useMemo, useState } from "react"
import { useGIS } from "./gis-provider"
import { Button } from "@/components/ui/button"
import { Save } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ExportButton() {
  const { state } = useGIS()
  const [id, setId] = useState<string>("")
  const options = useMemo(() => [...state.analysisResults, ...state.layers], [state.analysisResults, state.layers])

  function exportGeoJSON() {
    const layer = options.find((l) => l.id === id) || options[0]
    if (!layer) return
    const blob = new Blob([JSON.stringify(layer.data)], { type: "application/geo+json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${layer.name || layer.id}.geojson`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="rounded-xl border p-3 bg-background/60 backdrop-blur">
      <div className="text-xs text-muted-foreground mb-2">Export</div>
      <div className="grid gap-2">
        <Select value={id} onValueChange={setId}>
          <SelectTrigger><SelectValue placeholder="Choose layer" /></SelectTrigger>
          <SelectContent>
            {options.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button onClick={exportGeoJSON} className="bg-emerald-500 hover:bg-emerald-400 text-black">
          <Save className="mr-2 h-4 w-4" />
          Download GeoJSON
        </Button>
      </div>
    </div>
  )
}
