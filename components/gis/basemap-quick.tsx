"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useGIS } from "./gis-provider"
import { basemaps } from "@/lib/basemaps"
import BasemapSwitcher from "./basemap-switcher"

export default function BasemapQuick() {
  const { state, dispatch } = useGIS()
  const [open, setOpen] = useState(false)

  const idx = useMemo(() => {
    const i = basemaps.findIndex((b) => b.id === state.basemapId)
    return i >= 0 ? i : 0
  }, [state.basemapId])

  const cycle = (dir: 1 | -1) => {
    const next = (idx + dir + basemaps.length) % basemaps.length
    dispatch({ type: "SET_BASEMAP", id: basemaps[next].id })
  }

  return (
    <div className="absolute left-3 top-3 z-[5] flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        aria-label="Previous basemap"
        onClick={() => cycle(-1)}
        className="bg-background/80 backdrop-blur"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="px-2 py-1 rounded border bg-background/80 backdrop-blur text-xs">
        {basemaps[idx]?.name || "Basemap"}
      </div>
      <Button
        size="icon"
        variant="outline"
        aria-label="Next basemap"
        onClick={() => cycle(1)}
        className="bg-background/80 backdrop-blur"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            aria-label="Open basemap styles"
            className="ml-2 bg-background/80 backdrop-blur"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Styles
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[65vh] sm:h-[50vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Select Basemap</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <BasemapSwitcher />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
