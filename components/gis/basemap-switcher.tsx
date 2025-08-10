"use client"

import Image from "next/image"
import { useGIS } from "./gis-provider"
import { basemaps } from "@/lib/basemaps"
import { cn } from "@/lib/utils"

export default function BasemapSwitcher() {
  const { state, dispatch } = useGIS()

  return (
    <div className="rounded-xl border p-3 bg-background/60 backdrop-blur">
      <div className="text-xs text-muted-foreground mb-2">Basemap</div>
      <div className="grid grid-cols-2 gap-3">
        {basemaps.map((bm) => (
          <button
            key={bm.id}
            className={cn(
              "group relative overflow-hidden rounded-lg border hover:shadow-[0_0_0_1px_rgba(16,185,129,.25),0_0_30px_rgba(168,85,247,.15)]",
              state.basemapId === bm.id ? "ring-2 ring-emerald-400" : "ring-0"
            )}
            onClick={() => dispatch({ type: "SET_BASEMAP", id: bm.id })}
            aria-label={`Switch to ${bm.name}`}
          >
            <Image
              src={bm.thumbnail || "/placeholder.svg"}
              alt={bm.name}
              width={400}
              height={240}
              className="h-20 w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] px-2 py-1">{bm.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
