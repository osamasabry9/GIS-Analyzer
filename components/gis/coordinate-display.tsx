"use client"

import { useGIS } from "./gis-provider"
import { Copy } from 'lucide-react'

export default function CoordinateDisplay() {
  const { state } = useGIS()
  const coords = state.hoverLngLat
    ? `${state.hoverLngLat.lng.toFixed(5)}, ${state.hoverLngLat.lat.toFixed(5)}`
    : ""

  return (
    <div className="absolute left-3 bottom-3 z-[5]">
      <button
        className="px-2 py-1 rounded bg-black/70 text-emerald-300 text-xs font-mono hover:bg-black/80 inline-flex items-center gap-2"
        onClick={() => {
          if (coords) navigator.clipboard.writeText(coords)
        }}
        aria-label="Copy coordinates"
      >
        {coords || "—"}
        <Copy className="h-3 w-3" />
      </button>
    </div>
  )
}
